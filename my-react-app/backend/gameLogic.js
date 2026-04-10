const checkGuess = (userGuess, secretCharacter) => {
  if (userGuess.toLowerCase() === secretCharacter.nom.toLowerCase()) {
    return { status: "WIN", message: "Trouvé !" };
  }

  const hints = {
    sameArc: userGuess.arc_id === secretCharacter.arc_id,
    sameFruit: userGuess.fruit === secretCharacter.fruit,
  };

  return { status: "WRONG", hints: hints };
};

module.exports = { checkGuess };
