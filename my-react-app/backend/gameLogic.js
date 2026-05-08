const checkGuess = (userGuess, secretCharacter) => {
  const normalizedGuess = String(userGuess || "")
    .trim()
    .toLowerCase();
  const normalizedSecret = String(secretCharacter?.nom || "")
    .trim()
    .toLowerCase();

  if (!normalizedGuess || !normalizedSecret) {
    return { status: "WRONG", hints: {} };
  }

  if (normalizedGuess === normalizedSecret) {
    return { status: "WIN", message: "Trouvé !" };
  }

  return { status: "WRONG", hints: {} };
};

module.exports = { checkGuess };
