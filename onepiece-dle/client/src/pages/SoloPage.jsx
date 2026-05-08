import { cache, useEffect, useState } from 'react'
import Header from '../components/Header';
import Card from '../components/CharacterCard';
import confetti from 'canvas-confetti';

const SoloPage = () => {

  const [ListeName, setListeName] = useState([])
  const [Characters, setCharacters] = useState([])
  const [InputName, setInputName] = useState("")
  const [GuessCharacter, setGuessCharacter] = useState(null)
  const [LoadingListe, setLoadingListe] = useState(true)
  const [error, setError] = useState(null)
  const [LoadingGuessCH, setLoadingGuessCH] = useState(true)

  useEffect( () => {
    fetchListeName()
    fetchGuessCH()
  }, [])

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

  const fetchGuessCH = async () => {
    try {
      setLoadingGuessCH(true)
      setError(null)
      setCharacters([])

      const response = await fetch("http://localhost:3001/api/characters/random")

      if (!response.ok) {
        throw new Error("Erreur api...")
      }

      const data = await response.json()
      console.log(data)
      setGuessCharacter(data)
    } catch(err) {
      setError(err)
    }finally {
      setLoadingGuessCH(false)
    }
  }

  const fetchCharacterByName = async () => {
    try {
      setError(null)
      setLoadingGuessCH(true)
      const response = await fetch("http://localhost:3001/api/characters?nom="+ InputName)

      if (!response.ok) {
        throw new Error("Erreur api ...")
      }

      const data = await response.json()
      if (data.length > 0) {
        setCharacters(prev => [data[0], ...prev]);
      }
      setInputName("")
      const character = Array.isArray(data) ? data[0] : data;

      if (character.id === GuessCharacter.id) {
        confetti({
          particleCount: 350,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#ff0000', '#00c8ff', '#1eff00', '#ff00e5', '#fffb00']
        });
      }
    } catch (err) {
      setError(err)
    }finally {
      setLoadingGuessCH(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (InputName.trim() !== "") {
      fetchCharacterByName();
    }
  };

  return (
    <main>
      <Header />
      {LoadingListe && LoadingGuessCH && <p>Chargement...</p>}
      {error && <p>Erreur : {error.message}</p>}
      <h1>Guess one piece dle</h1>

      <button onClick={fetchGuessCH}>
        🎲 Guess Personnage
      </button>

      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div>
          <input
            list="ListName"
            value={InputName}
            placeholder="Tape un nom..."
            onChange={(e) => setInputName(e.target.value)}
          />
          <datalist id="ListName">
            {ListeName.map((name, index) => (
              <option key={index} value={name} />
            ))}
          </datalist>

          <button type="submit">Valider</button>
        </div>
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
    </main>
  )

}

export default SoloPage


