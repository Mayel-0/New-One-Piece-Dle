

const CharacterCard = (props) => {
  const green = "#00ff88";
  const red = "#ff5555";
  const gold = "gold";
  const arcCompareValue = Number(props.arcCompare);
  const hakiCompareValue = Number(props.hakiCompare);;
  const primeCompareValue = Number(props.primeCompare);
  const tailleCompareValue = Number(props.tailleCompare);

  let directionClass = "";
  if (arcCompareValue === 1) {
    directionClass = "plus";
  } else if (arcCompareValue === -1) {
    directionClass = "moins";
  }

  let resultHaki = "";
  let hakiBgColor = props.sameHaki ? green : red;

  if (hakiCompareValue === 1) {
    resultHaki = "incomplet";
    hakiBgColor = gold;
  }
  if (hakiCompareValue === 0) {
    resultHaki = "";
  }

  let resultPrime = "";
  if (primeCompareValue === 1) {
    resultPrime = "plus";
  } else if (primeCompareValue === -1) {
    resultPrime = "moins";
  }

  let tailleDirectionClass = "";
  if (tailleCompareValue === 1) {
    tailleDirectionClass = "plus";
  } else if (tailleCompareValue === -1) {
    tailleDirectionClass = "moins";
  }

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "15px",
        margin: "10px 0",
        borderRadius: "8px",
      }}
    >
      <img
        src={`http://localhost:3001/images/${props.image}`}
        alt={props.nom}
        style={{ width: '80px', borderRadius: '50%' }}
      />
      <h2 style={{ color: props.sameName ? green : "white" }}>
        {props.nom}
      </h2>

      <p style={{ background: props.sameGenre ? green : red }}>
        {props.genre}
      </p>

      <p style={{ background: props.sameCrew ? green : red}}>
        {props.affiliation}
      </p>

      <p style={{ background: props.sameFruit ? green : red }}>
        {props.fruittype}
      </p>

      <p
        className={resultHaki}
        style={{
          backgroundColor: hakiBgColor,
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {props.haki}
      </p>


      <p
        className={`Arrows ${resultPrime}`}
        style={{
          backgroundColor: props.samePrime ? green : red,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '40px',
          margin: 0
        }}
      >
        <span>{props.prime}</span>
      </p>

      <p
        className={`Arrows ${tailleDirectionClass}`}
        style={{
          backgroundColor: props.sameTaille ? green : red,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '40px',
          margin: 0
        }}
      >
        <span>{props.taille}</span>
      </p>

      <p style={{ background: props.sameOrigine ? green : red}}>
        {props.origine}
      </p>

      <p
        className={`Arrows ${directionClass}`}
        style={{
          backgroundColor: props.sameArc ? green : red,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '40px',
          margin: 0
        }}
      >
        <span>{props.arc}</span>
      </p>
    </div>
  );
};

export default CharacterCard;
