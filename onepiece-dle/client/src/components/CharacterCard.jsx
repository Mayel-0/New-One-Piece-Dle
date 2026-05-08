import ArrowUp from "../assets/svg/ArcTop.svg";
import ArrowDown from "../assets/svg/ArcBottom.svg";

const CharacterCard = (props) => {
  const green = "correct";
  const red = "wrong";
  const gold = "partial";

  const arcCompareValue = Number(props.arcCompare);
  const hakiCompareValue = Number(props.hakiCompare);
  const primeCompareValue = Number(props.primeCompare);
  const tailleCompareValue = Number(props.tailleCompare);

  // Arc arrow
  let arcArrow = null;
  if (arcCompareValue === 1)       arcArrow = ArrowUp;
  else if (arcCompareValue === -1) arcArrow = ArrowDown;

  // Taille arrow
  let tailleArrow = null;
  if (tailleCompareValue === 1)       tailleArrow = ArrowUp;
  else if (tailleCompareValue === -1) tailleArrow = ArrowDown;

  // Prime Arow
  let PrimeArrow = null;
  if (primeCompareValue === 1)       PrimeArrow = ArrowUp;
  else if (primeCompareValue === -1) PrimeArrow = ArrowDown;

  // Haki
  let hakiBgColor = props.sameHaki ? green : red;
  let hakiPartial = "";
  if (hakiCompareValue === 1) {
    hakiPartial = "partial";
    hakiBgColor = gold;
  }

  // Prime
  let resultPrime = "";
  if (primeCompareValue === 1)       resultPrime = "plus";
  else if (primeCompareValue === -1) resultPrime = "moins";

  return (
    <section className={`guess-card ${ props.sameName ? "win" : ""}`}>
      <div className="char-header">
        <img className="char-avatar" src={props.image} alt={props.nom} />
        <h2 className="char-name" style={{ color: props.sameName ? green : "white" }}>
          {props.nom}
        </h2>
      </div>

      <div className="clue-grid">
        <div className={`clue-cell ${props.sameGenre ? green : red}`}>
          <label className="clue-label">Genre</label>
          <p>{props.genre}</p>
        </div>
        <div className={`clue-cell ${props.sameCrew ? green : red}`}>
          <label className="clue-label">Affiliation</label>
          <p>{props.affiliation}</p>
        </div>
        <div className={`clue-cell ${props.sameFruit ? green : red}`}>
          <label className="clue-label">Fruit du Demon</label>
          <p>{props.fruittype}</p>
        </div>
        <div className={`clue-cell ${hakiPartial} ${hakiBgColor}`}>
          <label className="clue-label">Haki</label>
          <p>{props.haki}</p>
        </div>
        <div className={`clue-cell ${resultPrime} ${props.samePrime ? green : red}`}>
          <label className="clue-label">Prime</label>
          <p className="otherFont">{props.prime}</p>
          {PrimeArrow && (
            <img src={PrimeArrow} className="clue-arrow" alt="direction prime" />
          )}
        </div>

        {/* Taille avec flèche conditionnelle */}
        <div className={`clue-cell ${props.sameTaille ? green : red}`}>
          <label className="clue-label">Taille</label>
          <p className="otherFont">{props.taille}</p>
          {tailleArrow && (
            <img src={tailleArrow} className="clue-arrow" alt="direction taille" />
          )}
        </div>

        <div className={`clue-cell ${props.sameOrigine ? green : red}`}>
          <label className="clue-label">Origine</label>
          <p>{props.origine}</p>
        </div>

        {/* Arc avec flèche conditionnelle */}
        <div className={`clue-cell ${props.sameArc ? green : red}`}>
          <label className="clue-label">Arc</label>
          <p>{props.arc}</p>
          {arcArrow && (
            <img src={arcArrow} className="clue-arrow" alt="direction arc" />
          )}
        </div>
      </div>
    </section>
  );
};

export default CharacterCard;
