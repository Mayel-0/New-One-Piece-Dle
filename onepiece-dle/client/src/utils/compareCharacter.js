// src/utils/compareCharacter.js
export const buildCardState = (character, guessCharacter) => {
  const sameName = guessCharacter && character.nom === guessCharacter.nom;
  const sameGenre = guessCharacter && character.genre === guessCharacter.genre;
  const sameFruit = guessCharacter && character.fruit === guessCharacter.fruit;
  const sameArc = guessCharacter && character.arc === guessCharacter.arc;
  const samePrime = guessCharacter && character.prime === guessCharacter.prime;
  const sameCrew =
    guessCharacter && character.affiliation === guessCharacter.affiliation;
  const sameOrigine =
    guessCharacter && character.origine === guessCharacter.origine;
  const sameTaille =
    guessCharacter && character.taille === guessCharacter.taille;
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
    if (currentHakiId < guessedHakiId && currentHakiId === 0) hakiCompare = 0;
    if (currentHakiId < guessedHakiId && currentHakiId !== 0) hakiCompare = 1;
    if (currentHakiId < guessedHakiId && guessedHakiId === 2) hakiCompare = 0;
  }

  let primeCompare = 0;
  if (!Number.isNaN(guessCharacter?.prime) && !Number.isNaN(character.prime)) {
    if (character.prime < guessCharacter.prime) primeCompare = 1;
    else if (character.prime > guessCharacter.prime) primeCompare = -1;
  }

  let taillecompare = 0;
  if (
    !Number.isNaN(guessCharacter?.taille) &&
    !Number.isNaN(character.taille)
  ) {
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
