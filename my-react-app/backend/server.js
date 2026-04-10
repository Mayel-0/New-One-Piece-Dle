const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");
const cors = require("cors");
const { checkGuess } = require("./gameLogic");

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

app.get("/api/characters", async (req, res) => {
  console.log("filter :", req.query);
  try {
    console.log("📡 Connexion DB...");
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ DB connectée !");

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

    const [rows] = await connection.execute(
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

    await connection.end();

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/characters/random", async (req, res) => {
  try {
    console.log("📡 Connexion DB...");
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ DB connectée !");

    const [rows] = await connection.execute(`
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

    await connection.end();

    const result = rows && rows.length > 0 ? rows[0] : null;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const getRandomCharacterFromDB = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(`
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

    await connection.end();

    const result = rows[0];
    return result;
  } catch (err) {
    console.log(err);
  }
};

const getPowerUpChoices = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM powerups ORDER BY RAND() LIMIT 3",
    );
    await connection.end();
    return rows;
  } catch (error) {
    console.error("Erreur getPowerUpChoices:", error.message);
    return [];
  }
};

io.on("connection", (socket) => {
  console.log(`Un pirate s'est connecté : ${socket.id}`);

  socket.on("join_duel", async (duelId) => {
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
        rematchVotes: [],
      };
    } else {
      if (!activeGames[duelId].players.includes(socket.id)) {
        activeGames[duelId].players.push(socket.id);
      }
    }

    // Envoyer à chaque joueur avec son propre ID
    for (const playerId of activeGames[duelId].players) {
      io.to(playerId).emit("game_ready", {
        message: "Le duel commence !",
        target: activeGames[duelId].target,
        currentTurn: activeGames[duelId].currentTurn,
        players: activeGames[duelId].players,
        myId: playerId,
      });
    }
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
        console.log(
          `Joueur retiré de la salle ${duelId}. Restants : ${game.players.length}`,
        );

        if (game.players.length === 0) {
          delete activeGames[duelId];
          console.log(`Salle ${duelId} supprimée car elle est vide.`);
        } else {
          socket.to(duelId).emit("opponent_left", {
            message: "Ton adversaire a fui le combat !",
          });
        }

        break;
      }
    }
  });

  socket.on("send_guess", async (data) => {
    const game = activeGames[data.duelId];
    if (!game) return;

    if (socket.id !== game.currentTurn) {
      return socket.emit("not_your_turn", {
        message: "Ce n'est pas ton tour !",
      });
    }

    ++game.turnCount;

    if (game.turnCount > 0 && game.turnCount % 4 === 0) {
      const choices = await getPowerUpChoices();
      socket.emit("show_powerup_options", choices);
    }

    const characterName = (data.characterName || "").trim();
    if (!characterName) return;

    socket.to(data.duelId).emit("opponent_guessed", {
      characterName,
    });

    const secretChar = game.target;

    const result = checkGuess(characterName, secretChar);

    if (result.status === "WIN") {
      io.to(data.duelId).emit("victory", { winner: socket.id });
      console.log(
        `Le duel ${data.duelId} est terminé ! Gagnant : ${socket.id}`,
      );
    } else {
      socket.emit("guess_result", result.hints);
    }

    const opponentId = game.players.find((id) => id !== socket.id);

    if (opponentId) {
      game.currentTurn = opponentId; // On donne la main à l'autre
    }

    io.to(data.duelId).emit("turn_changed", {
      nextPlayer: opponentId,
      lastGuess: data.characterName,
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
        game.target = newChar;
        game.rematchVotes = [];
        game.currentTurn = game.players[0];
        game.turnCount = 0;

        io.to(duelId).emit("game_ready", {
          message: "L'adversaire est prêt ! À l'abordage !",
          target: newChar,
          currentTurn: game.currentTurn,
        });
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
