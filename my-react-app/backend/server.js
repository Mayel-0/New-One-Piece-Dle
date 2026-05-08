const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");
const cors = require("cors");
const { checkGuess } = require("./gameLogic");
const { POWERUP_EFFECTS } = require("./powersup");

const app = express();
const activeGames = {};

app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const dbConfig = {
  host: "localhost",
  port: 8889,
  user: "root",
  password: "root",
  database: "One_piece_dle",
};
const POWERUPS_DATABASE = process.env.POWERUPS_DATABASE || dbConfig.database;

const executeQuery = async (sql, params = []) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    await connection.end();
  }
};

app.get("/api/characters", async (req, res) => {
  console.log("filter :", req.query);
  try {
    let whereClause = [];
    let params = [];

    if (req.query.genre) {
      whereClause.push("c.genre = ?");
      params.push(req.query.genre);
    }
    if (req.query.id) {
      whereClause.push("c.id = ?");
      params.push(req.query.id);
    }
    if (req.query.haki_id) {
      whereClause.push("c.haki_id = ?");
      params.push(req.query.haki_id);
    }
    if (req.query.arc_id) {
      whereClause.push("c.arc_id = ?");
      params.push(req.query.arc_id);
    }
    if (req.query.fruit) {
      whereClause.push("c.fruit = ?");
      params.push(req.query.fruit);
    }

    if (req.query.nom) {
      whereClause.push("c.nom = ?");
      params.push(req.query.nom);
    }

    const whereSql =
      whereClause.length > 0 ? `WHERE ${whereClause.join(" AND ")}` : "";

    const rows = await executeQuery(
      `
      SELECT
        c.id,
        c.nom,
        c.genre,
        c.affiliation,
        c.fruit,
        c.prime,
        c.origine,
        c.taille,
        c.arc_id,
        c.haki_id,
        c.image,
        a.name AS arc,
        h.type AS haki
      FROM characters c
      LEFT JOIN arcs a ON c.arc_id = a.id
      LEFT JOIN haki h ON c.haki_id = h.id
      ${whereSql}
      ORDER BY c.id`,
      params,
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/characters/random", async (req, res) => {
  try {
    const rows = await executeQuery(`
        SELECT
        c.id, c.nom, c.genre, c.affiliation, c.fruit, c.prime, c.taille,
        c.arc_id,
        c.haki_id,
        c.origine,
        c.image,
        a.name AS arc,
        h.type AS haki
      FROM characters c
      LEFT JOIN arcs a ON c.arc_id = a.id
      LEFT JOIN haki h ON c.haki_id = h.id
      ORDER BY RAND()
      LIMIT 1;`);

    const result = rows && rows.length > 0 ? rows[0] : null;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const getRandomCharacterFromDB = async () => {
  try {
    const rows = await executeQuery(`
        SELECT
        c.id, c.nom, c.genre, c.affiliation, c.fruit, c.prime, c.taille,
        c.arc_id,
        c.haki_id,
        c.origine,
        c.image,
        a.name AS arc,
        h.type AS haki
      FROM characters c
      LEFT JOIN arcs a ON c.arc_id = a.id
      LEFT JOIN haki h ON c.haki_id = h.id
      ORDER BY RAND()
      LIMIT 1;`);

    const result = rows[0];
    return result;
  } catch (err) {
    console.log(err);
  }
};

const getPowerUpChoices = async () => {
  const candidateDatabases = Array.from(
    new Set([POWERUPS_DATABASE, dbConfig.database, "Yboost_Cuisine"]),
  ).filter(Boolean);

  for (const databaseName of candidateDatabases) {
    try {
      const rows = await executeQuery(
        `SELECT id, nom, description, type, code_effet FROM \`${databaseName}\`.powerups ORDER BY RAND() LIMIT 3`,
      );
      if (rows.length > 0) {
        return rows;
      }
    } catch (error) {
      if (error.code !== "ER_NO_SUCH_TABLE") {
        console.error("Erreur getPowerUpChoices:", error.message);
      }
    }
  }

  console.error("Erreur getPowerUpChoices: table powerups introuvable");
  return [];
};

const MAX_DUEL_PLAYERS = 2;

const getOpponentId = (game, playerId) => {
  return game.players.find((id) => id !== playerId) || null;
};

const isValidDuelId = (duelId) => {
  return typeof duelId === "string" && duelId.trim().length > 0;
};

const emitEffects = (duelId, playerId, effects) => {
  io.to(playerId).emit("effects_updated", {
    effects,
    duelId,
  });
};

const buildGameReadyPayload = (game, playerId, message) => ({
  message,
  target: game.target,
  currentTurn: game.currentTurn,
  players: game.players,
  myId: playerId,
});

const emitGameReadyForAllPlayers = (duelId, game, message) => {
  for (const playerId of game.players) {
    io.to(playerId).emit(
      "game_ready",
      buildGameReadyPayload(game, playerId, message),
    );
    emitEffects(duelId, playerId, ensurePlayerState(game, playerId).effects);
  }
};

const resetGameForNewTarget = (game, newTarget) => {
  game.target = newTarget;
  game.turnCount = 0;
  game.status = "playing";
  game.pendingPowerup = null;
  game.lastGuessByPlayer = {};
  game.guessesByPlayer = game.players.reduce((acc, playerId) => {
    acc[playerId] = 0;
    return acc;
  }, {});
  game.playerStates = game.players.reduce((acc, playerId) => {
    acc[playerId] = { effects: {} };
    return acc;
  }, {});
};

const applyTimedEffect = (game, targetPlayerId, effectCode, duration) => {
  const targetState = ensurePlayerState(game, targetPlayerId);
  targetState.effects[effectCode] = {
    remainingTurns: duration,
  };
  return targetState.effects;
};

const maybeStartPowerupPhase = async (duelId, game) => {
  if (game.status !== "playing") return false;
  if (!game.currentTurn) return false;
  if (game.pendingPowerup) return true;

  const currentPlayerGuessCount = Number(
    game.guessesByPlayer?.[game.currentTurn] || 0,
  );

  const shouldTriggerBeforeGuess =
    currentPlayerGuessCount > 0 && currentPlayerGuessCount % 2 === 1;

  if (!shouldTriggerBeforeGuess) return false;

  const choices = await getPowerUpChoices();
  if (choices.length === 0) return false;

  game.status = "powerup_phase";
  game.pendingPowerup = {
    chooserId: game.currentTurn,
    options: choices,
    turnCount: game.turnCount,
  };

  io.to(duelId).emit("powerup_phase_started", {
    chooserId: game.currentTurn,
    turnCount: game.turnCount,
  });

  io.to(game.currentTurn).emit("show_powerup_options", {
    options: choices,
    turnCount: game.turnCount,
  });

  return true;
};

const finalizeTurnChange = async (duelId, game, nextPlayer, lastGuess) => {
  game.currentTurn = nextPlayer;

  io.to(duelId).emit("turn_changed", {
    nextPlayer,
    lastGuess,
    turnCount: game.turnCount,
  });

  await maybeStartPowerupPhase(duelId, game);
};

const ensurePlayerState = (game, playerId) => {
  if (!game.playerStates[playerId]) {
    game.playerStates[playerId] = { effects: {} };
  }
  if (!game.playerStates[playerId].effects) {
    game.playerStates[playerId].effects = {};
  }
  return game.playerStates[playerId];
};

const consumeEndTurnEffects = (game, playerId, duelId) => {
  const playerState = ensurePlayerState(game, playerId);
  const smoke =
    playerState.effects.SMOKE_SCREEN || playerState.effects.BLUR_SCREEN;
  const smokeCode = playerState.effects.SMOKE_SCREEN
    ? "SMOKE_SCREEN"
    : "BLUR_SCREEN";
  if (!smoke || smoke.remainingTurns <= 0) return;

  smoke.remainingTurns -= 1;
  if (smoke.remainingTurns <= 0) {
    delete playerState.effects.SMOKE_SCREEN;
    delete playerState.effects.BLUR_SCREEN;
    io.to(playerId).emit("effect_expired", { code: smokeCode });
  }

  io.to(playerId).emit("effects_updated", {
    effects: playerState.effects,
    duelId,
  });
};

const resolveNextPlayablePlayer = (game, duelId, candidatePlayerId) => {
  let nextPlayerId = candidatePlayerId;
  let safety = 0;

  while (nextPlayerId && safety < game.players.length + 2) {
    const playerState = ensurePlayerState(game, nextPlayerId);
    const freeze = playerState.effects.FREEZE_TURN;

    if (!freeze || freeze.remainingTurns <= 0) {
      return nextPlayerId;
    }

    freeze.remainingTurns -= 1;
    io.to(duelId).emit("turn_skipped", {
      playerId: nextPlayerId,
      reason: "FREEZE_TURN",
    });

    if (freeze.remainingTurns <= 0) {
      delete playerState.effects.FREEZE_TURN;
      io.to(nextPlayerId).emit("effect_expired", { code: "FREEZE_TURN" });
    }

    io.to(nextPlayerId).emit("effects_updated", {
      effects: playerState.effects,
      duelId,
    });

    consumeEndTurnEffects(game, nextPlayerId, duelId);
    nextPlayerId = getOpponentId(game, nextPlayerId);
    safety += 1;
  }

  return nextPlayerId;
};

const getRandomPhoneHint = (targetCharacter) => {
  if (!targetCharacter) return null;

  const allowedFields = [
    "genre",
    "affiliation",
    "fruit",
    "prime",
    "origine",
    "taille",
    "arc",
    "haki",
  ];

  const availableHints = allowedFields
    .map((key) => ({ key, value: targetCharacter[key] }))
    .filter((hint) => hint.value !== null && hint.value !== undefined);

  if (availableHints.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * availableHints.length);
  return availableHints[randomIndex];
};

io.on("connection", (socket) => {
  console.log(`Un pirate s'est connecté : ${socket.id}`);

  socket.on("join_duel", async (duelId) => {
    if (!isValidDuelId(duelId)) return;

    const existingGame = activeGames[duelId];
    if (
      existingGame &&
      !existingGame.players.includes(socket.id) &&
      existingGame.players.length >= MAX_DUEL_PLAYERS
    ) {
      socket.emit("room_full", {
        message: "La salle est déjà pleine.",
      });
      return;
    }

    socket.join(duelId);

    if (!activeGames[duelId]) {
      console.log(`Création de la salle : ${duelId}`);
      const character = await getRandomCharacterFromDB();

      activeGames[duelId] = {
        target: character,
        players: [socket.id],
        currentTurn: socket.id, // Le créateur commence
        turnCount: 0,
        status: "playing",
        pendingPowerup: null,
        rematchVotes: [],
        guessesByPlayer: {
          [socket.id]: 0,
        },
        playerStates: {
          [socket.id]: { effects: {} },
        },
        lastGuessByPlayer: {},
      };
    } else {
      if (!activeGames[duelId].players.includes(socket.id)) {
        activeGames[duelId].players.push(socket.id);
      }

      if (!activeGames[duelId].guessesByPlayer) {
        activeGames[duelId].guessesByPlayer = {};
      }
      if (activeGames[duelId].guessesByPlayer[socket.id] === undefined) {
        activeGames[duelId].guessesByPlayer[socket.id] = 0;
      }

      ensurePlayerState(activeGames[duelId], socket.id);
    }

    emitGameReadyForAllPlayers(
      duelId,
      activeGames[duelId],
      "Le duel commence !",
    );

    console.log(
      `Perso à deviner dans ${duelId} : ${activeGames[duelId].target.nom}`,
    );
  });

  socket.on("disconnect", () => {
    console.log(`Le pirate ${socket.id} a sombré...`);

    for (const duelId in activeGames) {
      const game = activeGames[duelId];

      if (game.players.includes(socket.id)) {
        game.players = game.players.filter((id) => id !== socket.id);
        if (game.playerStates) {
          delete game.playerStates[socket.id];
        }
        if (game.lastGuessByPlayer) {
          delete game.lastGuessByPlayer[socket.id];
        }
        if (game.guessesByPlayer) {
          delete game.guessesByPlayer[socket.id];
        }
        game.rematchVotes = (game.rematchVotes || []).filter(
          (id) => id !== socket.id,
        );

        console.log(
          `Joueur retiré de la salle ${duelId}. Restants : ${game.players.length}`,
        );

        if (game.players.length === 0) {
          delete activeGames[duelId];
          console.log(`Salle ${duelId} supprimée car elle est vide.`);
        } else {
          const survivorId = game.players[0];
          if (game.currentTurn === socket.id) {
            game.currentTurn = survivorId;
          }

          socket.to(duelId).emit("opponent_left", {
            message: "Ton adversaire a fui le combat !",
          });

          io.to(duelId).emit("turn_changed", {
            nextPlayer: game.currentTurn,
            lastGuess: null,
            turnCount: game.turnCount,
          });

          maybeStartPowerupPhase(duelId, game);
        }

        break;
      }
    }
  });

  socket.on("send_guess", async (data) => {
    const duelId = data?.duelId;
    if (!isValidDuelId(duelId)) return;

    const game = activeGames[duelId];
    if (!game) return;
    if (game.status !== "playing") {
      return socket.emit("game_paused", {
        message: "Phase Power-Up en cours.",
      });
    }
    if (!game.players.includes(socket.id)) return;

    if (socket.id !== game.currentTurn) {
      return socket.emit("not_your_turn", {
        message: "Ce n'est pas ton tour !",
      });
    }

    const characterName = (data.characterName || "").trim();
    if (!characterName) return;

    ++game.turnCount;
    if (!game.guessesByPlayer) {
      game.guessesByPlayer = {};
    }
    game.guessesByPlayer[socket.id] =
      Number(game.guessesByPlayer[socket.id] || 0) + 1;

    game.lastGuessByPlayer[socket.id] = characterName;

    socket.to(duelId).emit("opponent_guessed", {
      characterName,
    });

    const secretChar = game.target;

    const result = checkGuess(characterName, secretChar);

    if (result.status === "WIN") {
      game.status = "finished";
      io.to(duelId).emit("victory", { winner: socket.id });
      console.log(`Le duel ${duelId} est terminé ! Gagnant : ${socket.id}`);
      return;
    } else {
      socket.emit("guess_result", result.hints);
    }

    consumeEndTurnEffects(game, socket.id, duelId);

    const opponentId = game.players.find((id) => id !== socket.id);
    if (!opponentId) return;

    const nextPlayer = resolveNextPlayablePlayer(game, duelId, opponentId);

    await finalizeTurnChange(duelId, game, nextPlayer, characterName);
  });

  socket.on("use_powerup", async (data) => {
    const duelId = data?.duelId;
    if (!isValidDuelId(duelId)) return;

    const game = activeGames[duelId];

    if (!game || game.status !== "powerup_phase") return;
    if (!game.players.includes(socket.id)) return;

    const pending = game.pendingPowerup;
    if (!pending || pending.chooserId !== socket.id) {
      return socket.emit("powerup_error", {
        message: "Tu ne peux pas choisir ce Power-Up maintenant.",
      });
    }

    const selectedId = Number(data?.powerupId);
    const selectedCode = String(data?.powerupCode || "").toUpperCase();
    const selectedPowerup = pending.options.find((option) => {
      if (!Number.isNaN(selectedId) && selectedId > 0) {
        return Number(option.id) === selectedId;
      }
      return String(option.code_effet || "").toUpperCase() === selectedCode;
    });

    if (!selectedPowerup) {
      return socket.emit("powerup_error", {
        message: "Power-Up invalide.",
      });
    }

    const powerupCode = String(selectedPowerup.code_effet || "").toUpperCase();
    const effect = POWERUP_EFFECTS[powerupCode];

    if (!effect) {
      return socket.emit("powerup_error", {
        message: `Effet ${powerupCode} non configuré côté serveur.`,
      });
    }

    const opponentId = getOpponentId(game, socket.id);
    const targetPlayerId =
      selectedPowerup.type === "malus" ? opponentId : socket.id;

    if (powerupCode === "SMOKE_SCREEN" || powerupCode === "BLUR_SCREEN") {
      if (!targetPlayerId) return;

      const targetEffects = applyTimedEffect(
        game,
        targetPlayerId,
        "SMOKE_SCREEN",
        effect.duration,
      );

      io.to(duelId).emit("powerup_applied", {
        casterId: socket.id,
        targetPlayerId,
        code: "SMOKE_SCREEN",
        type: selectedPowerup.type,
        name: selectedPowerup.nom,
        remainingTurns: effect.duration,
      });

      emitEffects(duelId, targetPlayerId, targetEffects);
    }

    if (powerupCode === "FREEZE_TURN") {
      if (!targetPlayerId) return;

      const targetEffects = applyTimedEffect(
        game,
        targetPlayerId,
        "FREEZE_TURN",
        effect.duration,
      );

      io.to(duelId).emit("powerup_applied", {
        casterId: socket.id,
        targetPlayerId,
        code: powerupCode,
        type: selectedPowerup.type,
        name: selectedPowerup.nom,
        remainingTurns: effect.duration,
      });

      emitEffects(duelId, targetPlayerId, targetEffects);
    }

    if (powerupCode === "BUSTER_CALL") {
      const newTarget = await getRandomCharacterFromDB();
      resetGameForNewTarget(game, newTarget);

      io.to(duelId).emit("buster_call_reset", {
        message: "Buster Call ! Tous les indices sont réinitialisés.",
      });

      emitGameReadyForAllPlayers(
        duelId,
        game,
        "Nouvelle cible après Buster Call !",
      );
    }

    if (powerupCode === "PHONE_CALL") {
      const hint = getRandomPhoneHint(game.target);
      socket.emit("phone_call_hint", {
        hint,
        message: hint
          ? `Indice révélé : ${hint.key}`
          : "Aucun indice disponible.",
      });
    }

    if (powerupCode === "SEE_OPPONENT_GUESS") {
      const lastGuess = opponentId ? game.lastGuessByPlayer[opponentId] : null;
      socket.emit("opponent_last_guess", {
        opponentId,
        lastGuess: lastGuess || null,
      });
    }

    game.status = "playing";
    game.pendingPowerup = null;

    io.to(duelId).emit("powerup_phase_ended", {
      chooserId: socket.id,
      turnCount: game.turnCount,
    });

    io.to(duelId).emit("turn_changed", {
      nextPlayer: game.currentTurn,
      lastGuess: null,
      turnCount: game.turnCount,
    });
  });

  socket.on("send_message", (data) => {
    const { room, text } = data;

    io.to(room).emit("receive_message", {
      senderId: socket.id,
      text: text,
    });
  });

  socket.on("request_rematch", async (data) => {
    const duelId = data.duelId;
    if (!isValidDuelId(duelId)) return;

    const game = activeGames[duelId];

    if (game) {
      if (!game.rematchVotes.includes(socket.id)) {
        game.rematchVotes.push(socket.id);
      }

      if (game.rematchVotes.length === 1) {
        socket.to(duelId).emit("rematch_offered");
      } else if (game.rematchVotes.length === 2) {
        const newChar = await getRandomCharacterFromDB();
        console.log(`Nouveau perso pour ${duelId} : ${newChar.nom}`);
        game.rematchVotes = [];
        game.currentTurn = game.players[0];

        resetGameForNewTarget(game, newChar);
        emitGameReadyForAllPlayers(
          duelId,
          game,
          "L'adversaire est prêt ! À l'abordage !",
        );
      }
    }
  });
});

app.use("/images", express.static("public/images"));

server.listen(3001, () => {
  console.log("🚀 API One Piece sur http://localhost:3001");
  console.log("😁 Personnage : http://localhost:3001/api/characters");
  console.log("🎲 random     : http://localhost:3001/api/characters/random");
});
