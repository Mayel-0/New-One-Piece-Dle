import { useState } from 'react'
import { useDuel } from '../hooks/useDuel'
import { buildCardState } from '../utils/compareCharacter.js'
import { formatTaille } from '../utils/formatters.js'
import Card from '../components/CharacterCard'
import ChatList from '../components/ChatList'
import PowerUpModal from '../components/PowerUpModal'
import avatarDefaut from '../assets/image/personnage.png'

const DuelPage = () => {
  const duel = useDuel()
  const [chatIsOpen, setChatIsOpen] = useState(false)

  // ✅ Fonction DANS le composant — accès direct à duel.guessCharacter
  const renderCharacterCard = (character, hideUnknownData = false) => {
    // ✅ Guard — si guessCharacter pas encore chargé, on attend
    if (!duel.guessCharacter) return null

    const state    = buildCardState(character, duel.guessCharacter)
    const hideData = hideUnknownData && !state.sameName

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
        sameGenre={state.sameGenre}
        sameFruit={state.sameFruit}
        sameArc={state.sameArc}
        samePrime={state.samePrime}
        sameCrew={state.sameCrew}
        sameOrigine={state.sameOrigine}
        sameTaille={state.sameTaille}
        sameHaki={state.sameHaki}
      />
    )
  }

  console.log("guessCharacter →", duel.guessCharacter)
  console.log("characters[0] →", duel.characters[0])
  return (
    <div>
      <h1>⚓ Mode Duel Pirate</h1>

      {/* Messages d'état */}
      {(duel.loadingListe || duel.loadingGuess) && <p>Chargement...</p>}
      {duel.error      && <p>Erreur : {duel.error.message}</p>}
      {duel.infoMessage && <p>{duel.infoMessage}</p>}

      {/* ── LOBBY ── */}
      {!duel.isJoined ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <input
            type="text"
            placeholder="Nom de la salle (ex: Luffy123)"
            value={duel.room}
            onChange={e => duel.setRoom(e.target.value)}
            style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
          />
          <button
            onClick={duel.handleJoin}
            style={{ marginLeft: '10px', padding: '10px 20px', cursor: 'pointer', background: 'gold', border: 'none', fontWeight: 'bold' }}
          >
            Rejoindre le combat
          </button>
        </div>

      ) : (

        /* ── JEU ── */
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '30px' }}>

          <p>Tours joués : {duel.turnCount}</p>
          <span>{duel.isMyTurn ? "C'est ton tour !" : "Attends ton tour..."}</span>

          {/* Panel joueur */}
          <div style={{ width: '45%', border: '2px solid gold', padding: '20px', borderRadius: '10px' }}>
            <h2>Tes Tentatives</h2>

            <form onSubmit={duel.sendMyGuess}>
              <fieldset disabled={!duel.isMyTurn || duel.isPowerupPhase} style={{ border: 'none', padding: 0 }}>
                <input
                  list="ListName"
                  value={duel.inputName}
                  placeholder={duel.isMyTurn ? "Tape un nom..." : "Attends ton tour..."}
                  onChange={e => duel.setInputName(e.target.value)}
                />
                <datalist id="ListName">
                  {duel.listeName.map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>
                <button
                  type="submit"
                  style={{ padding: '10px', cursor: duel.isMyTurn ? 'pointer' : 'not-allowed' }}
                >
                  {duel.isMyTurn ? "OK" : "⌛"}
                </button>
              </fieldset>
            </form>
          {duel.characters.map(c => (
            <div key={c.id}>
              {renderCharacterCard(c)}
            </div>
          ))}
          </div>

          {/* Panel adversaire */}
          <div style={{
            width: '45%',
            border: '2px solid #555',
            padding: '20px',
            borderRadius: '10px',
            backgroundColor: '#222',
            filter: duel.isBlurred ? 'blur(10px)' : 'none'
          }}>
            <h2 style={{ color: '#aaa' }}>Adversaire</h2>
            <div style={{ marginTop: '20px' }}>
              {duel.opponentGuesses.map(c => (
                <div key={c.id}>
                  {renderCharacterCard(c, true)}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── FIN DE PARTIE ── */}
      {duel.gameEnded && !duel.hasRequestedRematch && (
        <button onClick={duel.handleRematchRequest}>
          Proposer une revanche ⚔️
        </button>
      )}
      {duel.hasRequestedRematch && (
        <p>En attente du second pirate... ⏳</p>
      )}
      {duel.opponentHasRequestedRematch && !duel.hasRequestedRematch && (
        <p>L'adversaire te propose une revanche ⚔️</p>
      )}

      {/* ── CHAT ── */}
      <button onClick={() => setChatIsOpen(o => !o)}>Chat</button>

      <div className={`Chat-Containeur ${chatIsOpen ? "ChatActive" : ""}`}>
        <ChatList items={duel.chatMessages} myId={duel.socketId} />
        <form onSubmit={duel.handleSendMessage}>
          <input
            value={duel.messageText}
            onChange={e => duel.setMessageText(e.target.value)}
          />
          <button type="submit">Envoyer</button>
        </form>
      </div>

      {/* ── POWER-UPS ── */}
      <PowerUpModal
        isOpen={duel.isPowerupPhase && duel.powerupOptions.length > 0}
        options={duel.powerupOptions}
        turnCount={duel.turnCount}
        onSelect={duel.handleUsePowerup}
      />

    </div>
  )
}

export default DuelPage
