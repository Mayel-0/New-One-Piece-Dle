import { useEffect, useState } from 'react';

const Header = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingArc, setLoadingArc] = useState(true);
  const [errorArc, setErrorArc] = useState(null);
  const [CharactersByArc, setCharactersByArc] = useState({});

  const [openArcId, setOpenArcId] = useState(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleArc = (id) => {
    setOpenArcId(openArcId === id ? null : id);
  };

  useEffect(() => {
    fetchCharactersByArc();
  }, []);

  const fetchCharactersByArc = async () => {
    try {
      setLoadingArc(true);
      setErrorArc(null);

      for (let arcId = 1; arcId <= 29; arcId++) {
        const response = await fetch(`http://localhost:3001/api/characters?arc_id=${arcId}`)

        if (!response.ok) {
          throw new Error("Erreur api ...")
        }

        const data = await response.json()
        setCharactersByArc(prev => ({
          ...prev,
          [arcId]: data
        }));
      }

    } catch (err) {
      setErrorArc(err);
    } finally {
      setLoadingArc(false);
    }
  };

  return (
    <header>
      <button onClick={toggleMenu}>
        <p>{isOpen ? "Fermer" : "Menu"}</p>
      </button>

      <div className={`menu ${isOpen ? "active" : ""}`}>
        {Object.keys(CharactersByArc).map((arcId) => {
          const charactersInArc = CharactersByArc[arcId];
          const arcName = charactersInArc.length > 0 ? charactersInArc[0].arc : `Arc ${arcId}`;
          const isThisArcOpen = openArcId === arcId;

          return (
            <div key={arcId}>
              <button onClick={() => toggleArc(arcId)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <h3 style={{ color: 'gold', padding: '10px 20px', margin: 0 }}>
                  {arcId} - {arcName}  {isThisArcOpen ? '▼' : '▶'}
                </h3>
              </button>
              {isThisArcOpen && (
              <ul>
                {charactersInArc.map((character, index) => (
                  <li key={character.id} style={{ listStyle: 'none', paddingLeft: '20px', color: 'white' }}>
                    <img
                      src={`http://localhost:3001/images/${character.image}`}
                      alt={character.nom}
                      style={{ width: '40px', borderRadius: '50%' }}
                    />
                      #{index + 1} - {character.nom}
                  </li>
                ))}
              </ul>
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
}

export default Header
