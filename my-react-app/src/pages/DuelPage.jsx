import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ChatList from '../components/ChatList'
import Card from '../components/CharacterCard';
import avatarDefaut from "../assets/personnage.png";


const socket = io('http://localhost:3001');

const DuelPage = () => {
  const [room, setRoom] = useState("");
  const [ChatIsOpen, setChatIsOpen] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [GuessCharacter, setGuessCharacter] = useState(null)
  const [Characters, setCharacters] = useState([])

  const [OpponentGuess, setOpponentGuess] = useState([])
  const [InputName, setInputName] = useState("")
  const [ListeName, setListeName] = useState([])

  const [hasRequestedRematch, setHasRequestedRematch] = useState(false);
  const [opponentHasRequestRematch, setopponentHasRequestRematch] = useState(false)
  const [gameEnded, setGameEnded] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState("")

  const [error, setError] = useState(null)
  const [LoadingListe, setLoadingListe] = useState(true)
  const [LoadingGuessCH, setLoadingGuessCH] = useState(true)

  const [isMyTurn, setIsMyTurn] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [myPlayerId, setMyPlayerId] = useState(null);

  useEffect(() => {
    fetchListeName()

    socket.on('opponent_guessed', (data) => {
      GuessCharacterOponents(data.characterName);
    });

    socket.on('rematch_offered', (data) => {
      setopponentHasRequestRematch(true)
      console.log("L'adversaire veut rejouer !")
    })

    socket.on('game_ready', (data) => {
      setHasRequestedRematch(false);
      setopponentHasRequestRematch(false);
      setGameEnded(false);
      setGuessCharacter(data.target || null);
      setCharacters([]);
      setInputName("");
      setOpponentGuess([]);
      setMyPlayerId(data.myId);
      const isMyTurnNow = data.currentTurn === data.myId;
      console.log(`[GAME_READY] Mon ID: ${data.myId}, Current Turn: ${data.currentTurn}, Is My Turn: ${isMyTurnNow}`);
      setIsMyTurn(isMyTurnNow);
      console.log(data.message);
    });

    socket.on('victory', (data) => {
      setGameEnded(true);
    });

    socket.on('receive_message', (data) => {
      const { senderId, text } = data;
      setChatMessages((prevMessages) => [...prevMessages, { senderId, text }]);
    });

    socket.on("turn_changed", (data) => {
      const isNowMyTurn = data.nextPlayer === socket.id;
      console.log(`[TURN_CHANGED] Next Player: ${data.nextPlayer}, My Socket ID: ${socket.id}, Is My Turn: ${isNowMyTurn}`);
      setIsMyTurn(isNowMyTurn);
      setTurnCount(data.turnCount);
    });

    socket.on("special_event", (data) => {
      console.log("Événement spécial !", data.message);

      if (data.type === "SHUFFLE") {
        alert(data.message);
      }
    });

    socket.on("select_powerup", (data) => {
      const selected = data.powerup;
      const logic = EffectLogic[selected.code_effet]; 

      if (selected.type === "malus") {
          // On envoie l'effet à l'adversaire
          socket.to(data.duelId).emit("apply_effect", { ...selected, ...logic });
      } else {
          // On l'applique à soi-même
          socket.emit("apply_effect", { ...selected, ...logic });
      }
    });

    return () => {
      socket.off('rematch_offered');
      socket.off('opponent_guessed');
      socket.off('game_ready');
      socket.off('victory');
      socket.off('receive_message');
      socket.off('turn_changed');
      socket.off('special_event');
      socket.off('select_powerup');
    };
  }, []);

  const GuessCharacterOponents = async (nameGuess) => {
    try {
      setError(null)
      setLoadingGuessCH(true)
      const response = await fetch("http://localhost:3001/api/characters?nom="+ nameGuess)

      if (!response.ok) {
        throw new Error("Erreur api ...")
      }

      const data = await response.json()
      if (data.length > 0) {
        setOpponentGuess(prev => [data[0], ...prev]);
      }
    } catch (err) {
      setError(err)
    }finally {
      setLoadingGuessCH(false)
    }
  }

  function TradTailleM(ch) {
    let chM = (ch * 0.01).toFixed(2);
    return chM.replace('.', 'm');
  }

  const fetchListeName = async () => {
    try {
      setError(null)
      setLoadingListe(true)

      const response = await fetch("http://localhost:3001/api/characters")

      if (!response.ok) {
        throw new Error("Erreur api ...")
      }
      const data = await response.json()
      const justName = await data.map((c) => c.nom)
      setListeName(justName)
    } catch (err) {
      setError(err)
    } finally {
      setLoadingListe(false)
    }
  }

  const fetchCharacterByName = async (characterName) => {
    try {
      setError(null)
      setLoadingGuessCH(true)

      const response = await fetch("http://localhost:3001/api/characters?nom=" + characterName)

      if (!response.ok) {
        throw new Error("Erreur api ...")
      }

      const data = await response.json()
      if (data.length > 0) {
        setCharacters(prev => [data[0], ...prev]);
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoadingGuessCH(false)
    }
  }

  const handleJoin = () => {
    if (room.trim() !== "") {
      socket.emit('join_duel', room);
      setIsJoined(true);
    }
  };

  const sendMyGuess = (e) => {
    e.preventDefault();
    if (InputName.trim() === "") return;
    if (!GuessCharacter) return;

    const characterName = InputName.trim();
    fetchCharacterByName(characterName)

    socket.emit('send_guess', {
      duelId: room,
      characterName: characterName
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

  const togglechat = () => {
    setChatIsOpen(!ChatIsOpen)
  }

  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <h1>⚓ Mode Duel Pirate</h1>
      {LoadingListe && LoadingGuessCH && <p>Chargement...</p>}
      {error && <p>Erreur : {error.message}</p>}

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
                <fieldset disabled={!isMyTurn} style={{ border: 'none', padding: 0 }}>
                    <input
                        list="ListName"
                        value={InputName}
                        placeholder={isMyTurn ? "Tape un nom..." : "Attends ton tour..."}
                        onChange={(e) => setInputName(e.target.value)}
                    />
                    <datalist id="ListName">
                        {ListeName.map((name, index) => (
                            <option key={index} value={name} />
                        ))}
                    </datalist>
                    <button type="submit" style={{ padding: '10px', cursor: isMyTurn ? 'pointer' : 'not-allowed' }}>
                        {isMyTurn ? "OK" : "⌛"}
                    </button>
                </fieldset>
            </form>
              <div>
              {Characters.map((Characters) => {

                const sameName  = GuessCharacter && Characters.nom   === GuessCharacter.nom;
                const sameGenre = GuessCharacter && Characters.genre === GuessCharacter.genre;
                const sameFruit = GuessCharacter && Characters.fruit === GuessCharacter.fruit;
                const sameArc   = GuessCharacter && Characters.arc   === GuessCharacter.arc;
                const samePrime = GuessCharacter && Characters.prime === GuessCharacter.prime;
                const sameCrew =  GuessCharacter && Characters.affiliation === GuessCharacter.affiliation;
                const sameOrigine = GuessCharacter && Characters.origine === GuessCharacter.origine
                const sameTaille = GuessCharacter && Characters.taille === GuessCharacter.taille
                const sameHaki = GuessCharacter && Characters.haki === GuessCharacter.haki

                const guessedArcId = Number(GuessCharacter?.arc_id);
                const currentArcId = Number(Characters.arc_id);

                const guessedHakiId = Number(GuessCharacter?.haki_id);
                const currentHakiId = Number(Characters.haki_id);

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
                if (!Number.isNaN(GuessCharacter?.prime) && !Number.isNaN(Characters.prime)) {
                  if (Characters.prime < GuessCharacter.prime) primeCompare = 1;
                  else if (Characters.prime > GuessCharacter.prime) primeCompare = -1;
                }

                let taillecompare = 0;
                if (!Number.isNaN(GuessCharacter?.taille) && !Number.isNaN(Characters.taille)) {
                  if (Characters.taille < GuessCharacter.taille) taillecompare = 1;
                  else if (Characters.taille > GuessCharacter.taille) taillecompare = -1;
                }

                return (
                  <Card
                  key={Characters.id}
                  nom={Characters.nom}
                  genre={Characters.genre}
                  affiliation={Characters.affiliation}
                  fruittype={Characters.fruit}
                  haki={Characters.haki}
                  prime={Characters.prime + ' ฿'}
                  taille={TradTailleM(Characters.taille)}
                  origine={Characters.origine}
                  arc={Characters.arc}

                  image={`http://localhost:3001/images/${Characters.image}`}

                  arcCompare={arcCompare}
                  hakiCompare={hakiCompare}
                  primeCompare={primeCompare}
                  tailleCompare={taillecompare}

                  sameName={sameName}
                  sameFruit={sameFruit}
                  sameGenre={sameGenre}
                  sameArc={sameArc}
                  samePrime={samePrime}
                  sameCrew={sameCrew}
                  sameOrigine={sameOrigine}
                  sameTaille={sameTaille}
                  sameHaki={sameHaki}
                  />
                )
              })}
            </div>
          </div>

          <div style={{ width: '45%', border: '2px solid #555', padding: '20px', borderRadius: '10px', backgroundColor: '#222' }}>
            <h2 style={{ color: '#aaa' }}>Adversaire</h2>
            <div style={{ marginTop: '20px' }}>
              {OpponentGuess.map((Characters) => {

                const sameName  = GuessCharacter && Characters.nom   === GuessCharacter.nom;
                const sameGenre = GuessCharacter && Characters.genre === GuessCharacter.genre;
                const sameFruit = GuessCharacter && Characters.fruit === GuessCharacter.fruit;
                const sameArc   = GuessCharacter && Characters.arc   === GuessCharacter.arc;
                const samePrime = GuessCharacter && Characters.prime === GuessCharacter.prime;
                const sameCrew =  GuessCharacter && Characters.affiliation === GuessCharacter.affiliation;
                const sameOrigine = GuessCharacter && Characters.origine === GuessCharacter.origine
                const sameTaille = GuessCharacter && Characters.taille === GuessCharacter.taille
                const sameHaki = GuessCharacter && Characters.haki === GuessCharacter.haki

                const guessedArcId = Number(GuessCharacter?.arc_id);
                const currentArcId = Number(Characters.arc_id);

                const guessedHakiId = Number(GuessCharacter?.haki_id);
                const currentHakiId = Number(Characters.haki_id);

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
                if (!Number.isNaN(GuessCharacter?.prime) && !Number.isNaN(Characters.prime)) {
                  if (Characters.prime < GuessCharacter.prime) primeCompare = 1;
                  else if (Characters.prime > GuessCharacter.prime) primeCompare = -1;
                }

                let taillecompare = 0;
                if (!Number.isNaN(GuessCharacter?.taille) && !Number.isNaN(Characters.taille)) {
                  if (Characters.taille < GuessCharacter.taille) taillecompare = 1;
                  else if (Characters.taille > GuessCharacter.taille) taillecompare = -1;
                }

                return (
                  <Card
                  key={Characters.id}
                  nom={sameName ? Characters.nom : "???"}
                  genre={sameName ? Characters.genre : "genre ?"}
                  affiliation={sameName ? Characters.affiliation : "affiliation ?"}
                  fruittype={sameName ? Characters.fruit : "fruit ?"}
                  haki={sameName ? Characters.haki : "haki ?"}
                  prime={sameName ? Characters.prime + " ฿" : "prime ?"}
                  taille={sameName ? TradTailleM(Characters.taille) : "taille ?"}
                  origine={sameName ? Characters.origine : "origine ?"}
                  arc={sameName ? Characters.arc : "arc ?"}

                  image={sameName ? `http://localhost:3001/images/${Characters.image}` : avatarDefaut}

                  arcCompare={arcCompare}
                  hakiCompare={hakiCompare}
                  primeCompare={primeCompare}
                  tailleCompare={taillecompare}

                  sameName={sameName}
                  sameFruit={sameFruit}
                  sameGenre={sameGenre}
                  sameArc={sameArc}
                  samePrime={samePrime}
                  sameCrew={sameCrew}
                  sameOrigine={sameOrigine}
                  sameTaille={sameTaille}
                  sameHaki={sameHaki}
                  />
                )
              })}
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

      <button onClick={togglechat}>Chat</button>

      <div className={`Chat-Containeur ${ChatIsOpen ? "ChatActive" : ""}`}>
        <ChatList items={chatMessages} myId={socket.id}/>
        <form onSubmit={handleSendMessage}>
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          <button type="submit">Envoyer</button>
        </form>
      </div>
    </div>
  );
};

export default DuelPage;
