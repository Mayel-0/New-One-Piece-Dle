// src/pages/SoloPage.jsx
import { useGame } from '../hooks/useGame.js'
import { formatTaille } from '../utils/formatters.js'
import Header from '../components/Header.jsx'
import Card from '../components/CharacterCard.jsx'

const SoloPage = () => {
  const {
    listeName, characters, inputName, setInputName,
    guessCharacter, loading, error,
    submitGuess, resetGame
  } = useGame()

  console.log(guessCharacter)
  const handleSubmit = (e) => {
    e.preventDefault()
    submitGuess()
  }

  if (loading) return <p>Chargement...</p>
  if (error)   return <p>Erreur : {error.message}</p>

  return (
    <main>
      <Header />
      <h1>Guess One Piece DLE</h1>
      <button onClick={resetGame}>🎲 Nouveau personnage</button>

      <form onSubmit={handleSubmit}>
        <input
          list="ListName"
          value={inputName}
          placeholder="Tape un nom..."
          onChange={(e) => setInputName(e.target.value)}
        />
        <datalist id="ListName">
          {listeName.map((name, i) => <option key={i} value={name} />)}
        </datalist>
        <button type="submit">Valider</button>
      </form>

      <div>
        {characters.map((Characters) => {

          const sameName  = guessCharacter && Characters.nom   === guessCharacter.nom;
          const sameGenre = guessCharacter && Characters.genre === guessCharacter.genre;
          const sameFruit = guessCharacter && Characters.fruit === guessCharacter.fruit;
          const sameArc   = guessCharacter && Characters.arc   === guessCharacter.arc;
          const samePrime = guessCharacter && Characters.prime === guessCharacter.prime;
          const sameCrew =  guessCharacter && Characters.affiliation === guessCharacter.affiliation;
          const sameOrigine = guessCharacter && Characters.origine === guessCharacter.origine
          const sameTaille = guessCharacter && Characters.taille === guessCharacter.taille
          const sameHaki = guessCharacter && Characters.haki === guessCharacter.haki

          const guessedArcId = Number(guessCharacter?.arc_id);
          const currentArcId = Number(Characters.arc_id);

          const guessedHakiId = Number(guessCharacter?.haki_id);
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
          if (!Number.isNaN(guessCharacter?.prime) && !Number.isNaN(Characters.prime)) {
            if (Characters.prime < guessCharacter.prime) primeCompare = 1;
            else if (Characters.prime > guessCharacter.prime) primeCompare = -1;
          }

          let taillecompare = 0;
          if (!Number.isNaN(guessCharacter?.taille) && !Number.isNaN(Characters.taille)) {
            if (Characters.taille < guessCharacter.taille) taillecompare = 1;
            else if (Characters.taille > guessCharacter.taille) taillecompare = -1;
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
            taille={formatTaille(Characters.taille)}
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
    </main>
  )
}

export default SoloPage
