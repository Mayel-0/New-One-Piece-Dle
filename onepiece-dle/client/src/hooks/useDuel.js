// src/hooks/useDuel.js
import { useState, useEffect } from "react";
import socket from "../services/socketService.js";
import {
  getCharacterByName,
  getAllCharacters,
} from "../services/characterService.js";

export const useDuel = () => {
  const [room, setRoom] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [guessCharacter, setGuessCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [opponentGuesses, setOpponentGuesses] = useState([]);
  const [inputName, setInputName] = useState("");
  const [listeName, setListeName] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [powerupOptions, setPowerupOptions] = useState([]);
  const [isPowerupPhase, setIsPowerupPhase] = useState(false);
  const [playerEffects, setPlayerEffects] = useState({});
  const [gameEnded, setGameEnded] = useState(false);
  const [hasRequestedRematch, setHasRequestedRematch] = useState(false);
  const [opponentHasRequestedRematch, setOpponentHasRequestedRematch] =
    useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [error, setError] = useState(null);
  const [loadingListe, setLoadingListe] = useState(true);
  const [loadingGuess, setLoadingGuess] = useState(true);

  // Chargement liste noms
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingListe(true);
        const names = await getAllCharacters();
        setListeName(names.map((c) => c.nom));
      } catch (err) {
        setError(err);
      } finally {
        setLoadingListe(false);
      }
    };
    load();
  }, []);

  // Tous les listeners socket
  useEffect(() => {
    const onOpponentGuessed = async ({ characterName }) => {
      try {
        setLoadingGuess(true);
        const data = await getCharacterByName(characterName);
        // ✅ Même fix
        const character = Array.isArray(data) ? data[0] : data;
        if (character) setOpponentGuesses((prev) => [character, ...prev]);
      } catch (err) {
        setError(err);
      } finally {
        setLoadingGuess(false);
      }
    };

    const onGameReady = (data) => {
      setHasRequestedRematch(false);
      setOpponentHasRequestedRematch(false);
      setGameEnded(false);
      setGuessCharacter(data.target || null);
      setCharacters([]);
      setInputName("");
      setOpponentGuesses([]);
      setPowerupOptions([]);
      setIsPowerupPhase(false);
      setPlayerEffects({});
      setTurnCount(0);
      setIsMyTurn(data.currentTurn === data.myId);
    };

    const onTurnChanged = (data) => {
      setIsMyTurn(data.nextPlayer === socket.id);
      setTurnCount(data.turnCount);
    };

    const onShowPowerupOptions = (payload) => {
      const options = Array.isArray(payload)
        ? payload
        : (payload?.options ?? []);
      if (typeof payload?.turnCount === "number")
        setTurnCount(payload.turnCount);
      setPowerupOptions(options);
      setIsPowerupPhase(options.length > 0);
      setInfoMessage("Phase Power-Up: choisis une carte.");
    };

    const onPowerupApplied = (data) => {
      if (!data) return;
      if (data.targetPlayerId === socket.id)
        setInfoMessage(
          `Tu subis ${data.code} (${data.remainingTurns} tour(s)).`,
        );
      else if (data.casterId === socket.id)
        setInfoMessage(`Power-Up ${data.code} appliqué.`);
    };

    const onBusterCallReset = (data) => {
      setCharacters([]);
      setOpponentGuesses([]);
      setTurnCount(0);
      setInfoMessage(data?.message || "Buster Call déclenché.");
    };

    socket.on("opponent_guessed", onOpponentGuessed);
    socket.on("game_ready", onGameReady);
    socket.on("victory", () => setGameEnded(true));
    socket.on("rematch_offered", () => setOpponentHasRequestedRematch(true));
    socket.on("receive_message", ({ senderId, text }) =>
      setChatMessages((p) => [...p, { senderId, text }]),
    );
    socket.on("turn_changed", onTurnChanged);
    socket.on("show_powerup_options", onShowPowerupOptions);
    socket.on("powerup_phase_started", (p) => {
      setIsPowerupPhase(true);
      if (p?.turnCount) setTurnCount(p.turnCount);
    });
    socket.on("powerup_phase_ended", () => {
      setIsPowerupPhase(false);
      setPowerupOptions([]);
    });
    socket.on("effects_updated", (d) => setPlayerEffects(d?.effects || {}));
    socket.on("powerup_applied", onPowerupApplied);
    socket.on("effect_expired", (d) =>
      setInfoMessage(`Effet ${d.code} terminé.`),
    );
    socket.on("phone_call_hint", (d) =>
      setInfoMessage(d?.hint ? `${d.hint.key} = ${d.hint.value}` : d?.message),
    );
    socket.on("opponent_last_guess", (d) =>
      setInfoMessage(`Dernier essai adverse : ${d?.lastGuess}`),
    );
    socket.on("turn_skipped", (d) => {
      if (d?.playerId === socket.id)
        setInfoMessage("Tour gelé par FREEZE_TURN.");
    });
    socket.on("buster_call_reset", onBusterCallReset);
    socket.on("not_your_turn", (d) =>
      setInfoMessage(d?.message || "Ce n'est pas ton tour."),
    );
    socket.on("opponent_left", (d) => {
      setGameEnded(true);
      setIsMyTurn(false);
      setInfoMessage(d?.message);
    });
    socket.on("room_full", (d) => {
      setIsJoined(false);
      setInfoMessage(d?.message);
    });
    socket.on("powerup_error", (d) => setInfoMessage(d?.message));
    socket.on("game_paused", (d) => setInfoMessage(d?.message));

    return () => {
      socket.off("opponent_guessed");
      socket.off("game_ready");
      socket.off("victory");
      socket.off("rematch_offered");
      socket.off("receive_message");
      socket.off("turn_changed");
      socket.off("show_powerup_options");
      socket.off("powerup_phase_started");
      socket.off("powerup_phase_ended");
      socket.off("effects_updated");
      socket.off("powerup_applied");
      socket.off("effect_expired");
      socket.off("phone_call_hint");
      socket.off("opponent_last_guess");
      socket.off("turn_skipped");
      socket.off("buster_call_reset");
      socket.off("not_your_turn");
      socket.off("opponent_left");
      socket.off("room_full");
      socket.off("powerup_error");
      socket.off("game_paused");
    };
  }, []);

  // Actions
  const handleJoin = () => {
    if (room.trim()) {
      socket.emit("join_duel", room);
      setIsJoined(true);
    }
  };

  const sendMyGuess = async (e) => {
    e.preventDefault();
    if (!inputName.trim() || !guessCharacter) return;
    const name = inputName.trim();
    try {
      const data = await getCharacterByName(name);
      // ✅ Assure-toi d'extraire l'objet, pas le tableau
      const character = Array.isArray(data) ? data[0] : data;
      if (character) setCharacters((prev) => [character, ...prev]);
    } catch (err) {
      setError(err);
    }
    socket.emit("send_guess", { duelId: room, characterName: name });
    setInputName("");
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    socket.emit("send_message", { room, text: messageText });
    setMessageText("");
  };

  const handleRematchRequest = () => {
    socket.emit("request_rematch", { duelId: room });
    setHasRequestedRematch(true);
  };

  const handleUsePowerup = (powerup) => {
    const code = String(
      powerup?.code_effet || powerup?.code || "",
    ).toUpperCase();
    const id = Number(powerup?.id);
    if (!code && Number.isNaN(id)) return;
    socket.emit("use_powerup", {
      duelId: room,
      powerupCode: code,
      powerupId: Number.isNaN(id) ? undefined : id,
    });
  };

  const isBlurred = Boolean(
    (playerEffects?.SMOKE_SCREEN?.remainingTurns || 0) > 0 ||
    (playerEffects?.BLUR_SCREEN?.remainingTurns || 0) > 0,
  );

  return {
    // State
    room,
    setRoom,
    isJoined,
    guessCharacter,
    characters,
    opponentGuesses,
    inputName,
    setInputName,
    listeName,
    isMyTurn,
    turnCount,
    powerupOptions,
    isPowerupPhase,
    gameEnded,
    hasRequestedRematch,
    opponentHasRequestedRematch,
    chatMessages,
    messageText,
    setMessageText,
    infoMessage,
    error,
    loadingListe,
    loadingGuess,
    isBlurred,
    // Actions
    handleJoin,
    sendMyGuess,
    handleSendMessage,
    handleRematchRequest,
    handleUsePowerup,
    socketId: socket.id,
  };
};
