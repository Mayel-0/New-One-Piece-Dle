import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import ChatList from '../components/ChatList.jsx';
import Card from '../components/CharacterCard.jsx';
import PowerUpModal from '../components/PowerUpModal';
import avatarDefaut from "../assets/image/personnage.png";

const socket = io('http://localhost:3001');
const API_BASE_URL = 'http://localhost:3001';

const formatTaille = (taille) => {
  const tailleInMeters = (taille * 0.01).toFixed(2);
  return tailleInMeters.replace('.', 'm');
};

const getCharacterByName = async (characterName) => {
  const response = await fetch(`${API_BASE_URL}/api/characters?nom=${characterName}`);
  if (!response.ok) {
    throw new Error('Erreur api ...');
  }

  const data = await response.json();
  return data.length > 0 ? data[0] : null;
};

const getAllCharacterNames = async () => {
  const response = await fetch(`${API_BASE_URL}/api/characters`);
  if (!response.ok) {
    throw new Error('Erreur api ...');
  }

  const data = await response.json();
  return data.map((character) => character.nom);
};

const DuelPage = () => {
  const [room, setRoom] = useState("");
  const [chatIsOpen, setChatIsOpen] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [guessCharacter, setGuessCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);

  const [opponentGuesses, setOpponentGuesses] = useState([]);
  const [inputName, setInputName] = useState("");
  const [listeName, setListeName] = useState([]);

  const [hasRequestedRematch, setHasRequestedRematch] = useState(false);
  const [opponentHasRequestedRematch, setOpponentHasRequestedRematch] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [error, setError] = useState(null);
  const [loadingListe, setLoadingListe] = useState(true);
  const [loadingGuess, setLoadingGuess] = useState(true);

  const [isMyTurn, setIsMyTurn] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [powerupOptions, setPowerupOptions] = useState([]);
  const [isPowerupPhase, setIsPowerupPhase] = useState(false);
  const [playerEffects, setPlayerEffects] = useState({});
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    const loadNameList = async () => {
      try {
        setError(null);
        setLoadingListe(true);
        const names = await getAllCharacterNames();
        setListeName(names);
      } catch (err) {
        setError(err);
      } finally {
        setLoadingListe(false);
      }
    };

    loadNameList();

    const onOpponentGuessed = async (data) => {
      try {
        setError(null);
        setLoadingGuess(true);
        const character = await getCharacterByName(data.characterName);
        if (character) {
          setOpponentGuesses((prev) => [character, ...prev]);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoadingGuess(false);
      }
    };

    const onRematchOffered = () => {
      setOpponentHasRequestedRematch(true);
      console.log("L'adversaire veut rejouer !");
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
      const isMyTurnNow = data.currentTurn === data.myId;
      console.log(`[GAME_READY] Mon ID: ${data.myId}, Current Turn: ${data.currentTurn}, Is My Turn: ${isMyTurnNow}`);
      setIsMyTurn(isMyTurnNow);
      console.log(data.message);
    };

    const onVictory = () => {
      setGameEnded(true);
    };

    const onReceiveMessage = (data) => {
      const { senderId, text } = data;
      setChatMessages((prevMessages) => [...prevMessages, { senderId, text }]);
    };

    const onTurnChanged = (data) => {
      const isNowMyTurn = data.nextPlayer === socket.id;
      console.log(`[TURN_CHANGED] Next Player: ${data.nextPlayer}, My Socket ID: ${socket.id}, Is My Turn: ${isNowMyTurn}`);
      setIsMyTurn(isNowMyTurn);
      setTurnCount(data.turnCount);
    };

    const onShowPowerupOptions = (payload) => {
      const options = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.options)
          ? payload.options
          : [];

      if (typeof payload?.turnCount === 'number') {
        setTurnCount(payload.turnCount);
      }

      setPowerupOptions(options);
      setIsPowerupPhase(options.length > 0);
      setInfoMessage('Phase Power-Up: choisis une carte.');
    };

    const onPowerupPhaseStarted = (payload) => {
      setIsPowerupPhase(true);
      if (typeof payload?.turnCount === 'number') {
        setTurnCount(payload.turnCount);
      }
    };

    const onPowerupPhaseEnded = () => {
      setIsPowerupPhase(false);
      setPowerupOptions([]);
    };

    const onEffectsUpdated = (data) => {
      setPlayerEffects(data?.effects || {});
    };

    const onPowerupApplied = (data) => {
      if (!data) return;
      if (data.targetPlayerId === socket.id) {
        setInfoMessage(`Tu subis ${data.code} (${data.remainingTurns} tour(s)).`);
      } else if (data.casterId === socket.id) {
        setInfoMessage(`Power-Up ${data.code} appliqué.`);
      }
    };

    const onEffectExpired = (data) => {
      if (!data?.code) return;
      setInfoMessage(`Effet ${data.code} terminé.`);
    };

    const onPhoneCallHint = (data) => {
      if (!data?.hint) {
        setInfoMessage(data?.message || "Aucun indice révélé.");
        return;
      }
      setInfoMessage(`Indice Phone Call : ${data.hint.key} = ${data.hint.value}`);
    };

    const onOpponentLastGuess = (data) => {
      const guess = data?.lastGuess || "(aucune tentative)";
      setInfoMessage(`Dernier essai adverse : ${guess}`);
    };

    const onTurnSkipped = (data) => {
      if (data?.playerId === socket.id) {
        setInfoMessage("Ton tour est gelé par FREEZE_TURN.");
      }
    };

    const onBusterCallReset = (data) => {
      setCharacters([]);
      setOpponentGuesses([]);
      setTurnCount(0);
      setInfoMessage(data?.message || "Buster Call déclenché.");
    };

    const onNotYourTurn = (data) => {
      setInfoMessage(data?.message || "Ce n'est pas ton tour.");
    };

    const onOpponentLeft = (data) => {
      setGameEnded(true);
      setIsMyTurn(false);
      setInfoMessage(data?.message || "Ton adversaire a quitté la salle.");
    };

    const onRoomFull = (data) => {
      setIsJoined(false);
      setInfoMessage(data?.message || "Salle pleine.");
    };

    const onPowerupError = (data) => {
      setInfoMessage(data?.message || "Power-Up invalide.");
    };

    const onGamePaused = (data) => {
      setInfoMessage(data?.message || 'Partie temporairement en pause.');
    };

    const onSpecialEvent = (data) => {
      console.log("Événement spécial !", data.message);

      if (data.type === "SHUFFLE") {
        alert(data.message);
      }
    };

    socket.on('opponent_guessed', onOpponentGuessed);
    socket.on('rematch_offered', onRematchOffered);
    socket.on('game_ready', onGameReady);
    socket.on('victory', onVictory);
    socket.on('receive_message', onReceiveMessage);
    socket.on("turn_changed", onTurnChanged);
    socket.on("show_powerup_options", onShowPowerupOptions);
    socket.on("effects_updated", onEffectsUpdated);
    socket.on("powerup_applied", onPowerupApplied);
    socket.on("powerup_phase_started", onPowerupPhaseStarted);
    socket.on("powerup_phase_ended", onPowerupPhaseEnded);
    socket.on("effect_expired", onEffectExpired);
    socket.on("phone_call_hint", onPhoneCallHint);
    socket.on("opponent_last_guess", onOpponentLastGuess);
    socket.on("turn_skipped", onTurnSkipped);
    socket.on("buster_call_reset", onBusterCallReset);
    socket.on("not_your_turn", onNotYourTurn);
    socket.on("opponent_left", onOpponentLeft);
    socket.on("room_full", onRoomFull);
    socket.on("powerup_error", onPowerupError);
    socket.on("game_paused", onGamePaused);
    socket.on("special_event", onSpecialEvent);

    return () => {
      socket.off('opponent_guessed', onOpponentGuessed);
      socket.off('rematch_offered', onRematchOffered);
      socket.off('game_ready', onGameReady);
      socket.off('victory', onVictory);
      socket.off('receive_message', onReceiveMessage);
      socket.off('turn_changed', onTurnChanged);
      socket.off('show_powerup_options', onShowPowerupOptions);
      socket.off('effects_updated', onEffectsUpdated);
      socket.off('powerup_applied', onPowerupApplied);
      socket.off('powerup_phase_started', onPowerupPhaseStarted);
      socket.off('powerup_phase_ended', onPowerupPhaseEnded);
      socket.off('effect_expired', onEffectExpired);
      socket.off('phone_call_hint', onPhoneCallHint);
      socket.off('opponent_last_guess', onOpponentLastGuess);
      socket.off('turn_skipped', onTurnSkipped);
      socket.off('buster_call_reset', onBusterCallReset);
      socket.off('not_your_turn', onNotYourTurn);
      socket.off('opponent_left', onOpponentLeft);
      socket.off('room_full', onRoomFull);
      socket.off('powerup_error', onPowerupError);
      socket.off('game_paused', onGamePaused);
      socket.off('special_event', onSpecialEvent);
    };
  }, []);

  const addGuessedCharacterToMyList = async (characterName) => {
    try {
      setError(null);
      setLoadingGuess(true);
      const character = await getCharacterByName(characterName);
      if (character) {
        setCharacters((prev) => [character, ...prev]);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoadingGuess(false);
    }
  };

  const handleJoin = () => {
    if (room.trim() !== "") {
      socket.emit('join_duel', room);
      setIsJoined(true);
    }
  };

  const sendMyGuess = (e) => {
    e.preventDefault();
    if (inputName.trim() === "") return;
    if (!guessCharacter) return;

    const characterName = inputName.trim();
    addGuessedCharacterToMyList(characterName);

    socket.emit('send_guess', {
      duelId: room,
      characterName,
    });

    setInputName("");
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (messageText.trim() !== "") {
      socket.emit("send_message", {
        room: room,
        text: messageText,
      });
      setMessageText("");
    }
  };

  const handleRematchRequest = () => {
    socket.emit("request_rematch", { duelId: room });
    setHasRequestedRematch(true);
  };

  const handleUsePowerup = (powerup) => {
    const code = String(powerup?.code_effet || powerup?.code || "").toUpperCase();
    const id = Number(powerup?.id);
    if (!code && Number.isNaN(id)) return;

    socket.emit("use_powerup", {
      duelId: room,
      powerupCode: code,
      powerupId: Number.isNaN(id) ? undefined : id,
    });
  };

  const togglechat = () => {
    setChatIsOpen(!chatIsOpen);
  };

  const isBlurred = Boolean(
    (playerEffects?.SMOKE_SCREEN?.remainingTurns || 0) > 0 ||
    (playerEffects?.BLUR_SCREEN?.remainingTurns || 0) > 0,
  );

  const buildCardState = (character) => {
    const sameName  = guessCharacter && character.nom === guessCharacter.nom;
    const sameGenre = guessCharacter && character.genre === guessCharacter.genre;
    const sameFruit = guessCharacter && character.fruit === guessCharacter.fruit;
    const sameArc   = guessCharacter && character.arc === guessCharacter.arc;
    const samePrime = guessCharacter && character.prime === guessCharacter.prime;
    const sameCrew = guessCharacter && character.affiliation === guessCharacter.affiliation;
    const sameOrigine = guessCharacter && character.origine === guessCharacter.origine;
    const sameTaille = guessCharacter && character.taille === guessCharacter.taille;
    const sameHaki = guessCharacter && character.haki === guessCharacter.haki;

    const guessedArcId = Number(guessCharacter?.arc_id);
    const currentArcId = Number(character.arc_id);

    const guessedHakiId = Number(guessCharacter?.haki_id);
    const currentHakiId = Number(character.haki_id);

    let arcCompare = 0;
    if (!Number.isNaN(guessedArcId) && !Number.isNaN(currentArcId)) {
      if (currentArcId < guessedArcId) arcCompare = 1;
      else if (currentArcId > guessedArcId) arcCompare = -1;
    }

    let hakiCompare = 0;
    if (!Number.isNaN(guessedHakiId) && !Number.isNaN(currentHakiId)) {
      if (currentHakiId < guessedHakiId && currentHakiId == 0) hakiCompare = 0
      if (currentHakiId < guessedHakiId && currentHakiId !== 0) hakiCompare = 1;
      if (currentHakiId < guessedHakiId && guessedHakiId == 2) hakiCompare = 0;
    }

    let primeCompare = 0;
    if (!Number.isNaN(guessCharacter?.prime) && !Number.isNaN(character.prime)) {
      if (character.prime < guessCharacter.prime) primeCompare = 1;
      else if (character.prime > guessCharacter.prime) primeCompare = -1;
    }

    let taillecompare = 0;
    if (!Number.isNaN(guessCharacter?.taille) && !Number.isNaN(character.taille)) {
      if (character.taille < guessCharacter.taille) taillecompare = 1;
      else if (character.taille > guessCharacter.taille) taillecompare = -1;
    }

    return {
      sameName,
      sameGenre,
      sameFruit,
      sameArc,
      samePrime,
      sameCrew,
      sameOrigine,
      sameTaille,
      sameHaki,
      arcCompare,
      hakiCompare,
      primeCompare,
      taillecompare,
    };
  };

  const renderCharacterCard = (character, hideUnknownData = false) => {
    const state = buildCardState(character);
    const hideData = hideUnknownData && !state.sameName;

    return (
      <Card
      key={character.id}
      nom={hideData ? "???" : character.nom}
      genre={hideData ? "genre ?" : character.genre}
      affiliation={hideData ? "affiliation ?" : character.affiliation}
      fruittype={hideData ? "fruit ?" : character.fruit}
      haki={hideData ? "haki ?" : character.haki}
      prime={hideData ? "prime ?" : character.prime + " ฿"}
      taille={hideData ? "taille ?" : formatTaille(character.taille)}
      origine={hideData ? "origine ?" : character.origine}
      arc={hideData ? "arc ?" : character.arc}

      image={hideData ? avatarDefaut : `http://localhost:3001/images/${character.image}`}

      arcCompare={state.arcCompare}
      hakiCompare={state.hakiCompare}
      primeCompare={state.primeCompare}
      tailleCompare={state.taillecompare}

      sameName={state.sameName}
      sameFruit={state.sameFruit}
      sameGenre={state.sameGenre}
      sameArc={state.sameArc}
      samePrime={state.samePrime}
      sameCrew={state.sameCrew}
      sameOrigine={state.sameOrigine}
      sameTaille={state.sameTaille}
      sameHaki={state.sameHaki}
      />
    );
  };

  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <h1>⚓ Mode Duel Pirate</h1>
      {(loadingListe || loadingGuess) && <p>Chargement...</p>}
      {error && <p>Erreur : {error.message}</p>}
      {infoMessage && <p>{infoMessage}</p>}

      {!isJoined ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <input
            type="text"
            placeholder="Nom de la salle (ex: Luffy123)"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
          />
          <button onClick={handleJoin} style={{ marginLeft: '10px', padding: '10px 20px', cursor: 'pointer', background: 'gold', border: 'none', fontWeight: 'bold' }}>
            Rejoindre le combat
          </button>
        </div>
      ) : (

        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '30px' }}>
          <p>Tours joués : {turnCount} </p>
          <span>{isMyTurn ? "C'est ton tour !" : "Attends ton tour..."}</span>
          <div style={{ width: '45%', border: '2px solid gold', padding: '20px', borderRadius: '10px' }}>
            <h2>Tes Tentatives</h2>
            <form onSubmit={sendMyGuess}>
                <fieldset disabled={!isMyTurn || isPowerupPhase} style={{ border: 'none', padding: 0 }}>
                    <input
                        list="ListName"
                      value={inputName}
                        placeholder={isMyTurn ? "Tape un nom..." : "Attends ton tour..."}
                        onChange={(e) => setInputName(e.target.value)}
                    />
                    <datalist id="ListName">
                      {listeName.map((name, index) => (
                            <option key={index} value={name} />
                        ))}
                    </datalist>
                    <button type="submit" style={{ padding: '10px', cursor: isMyTurn ? 'pointer' : 'not-allowed' }}>
                        {isMyTurn ? "OK" : "⌛"}
                    </button>
                </fieldset>
            </form>
              <div>
              {characters.map((character) => renderCharacterCard(character))}
            </div>
          </div>

          <div style={{ width: '45%', border: '2px solid #555', padding: '20px', borderRadius: '10px', backgroundColor: '#222', filter: isBlurred ? 'blur(10px)' : 'none' }}>
            <h2 style={{ color: '#aaa' }}>Adversaire</h2>
            <div style={{ marginTop: '20px' }}>
              {opponentGuesses.map((character) => renderCharacterCard(character, true))}
            </div>
          </div>

        </div>
      )}

      {/* Si la partie est finie et qu'on n'a pas encore cliqué sur Revanche */}
      {gameEnded && !hasRequestedRematch && (
        <button onClick={handleRematchRequest}>Proposer une revanche ⚔️</button>
      )}

      {/* Si on a cliqué, on affiche un message d'attente */}
      {hasRequestedRematch && <p>En attente du second pirate... ⏳</p>}
      {opponentHasRequestedRematch && !hasRequestedRematch && <p>L'adversaire te propose une revanche ⚔️</p>}

      <button onClick={togglechat}>Chat</button>

      <div className={`Chat-Containeur ${chatIsOpen ? "ChatActive" : ""}`}>
        <ChatList items={chatMessages} myId={socket.id}/>
        <form onSubmit={handleSendMessage}>
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          <button type="submit">Envoyer</button>
        </form>
      </div>

      <PowerUpModal
        isOpen={isPowerupPhase && powerupOptions.length > 0}
        options={powerupOptions}
        turnCount={turnCount}
        onSelect={handleUsePowerup}
      />
    </div>
  );
};

export default DuelPage;
