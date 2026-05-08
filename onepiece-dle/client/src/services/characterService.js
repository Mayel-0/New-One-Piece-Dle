// src/services/characterService.js

const BASE_URL = "http://localhost:3001/api";

export const getAllCharacters = async () => {
  const res = await fetch(`${BASE_URL}/characters`);
  if (!res.ok) throw new Error("Erreur api ...");
  return res.json();
};

export const getRandomCharacter = async () => {
  const res = await fetch(`${BASE_URL}/characters/random`);
  if (!res.ok) throw new Error("Erreur api ...");
  return res.json();
};

export const getCharacterByName = async (nom) => {
  const res = await fetch(`${BASE_URL}/characters?nom=${nom}`);
  if (!res.ok) throw new Error("Erreur api ...");
  return res.json();
};

export const getCharactersByAllArc = async () => {
  const data = [];
  for (let arcId = 1; arcId <= 29; arcId++) {
    const res = await fetch(`${BASE_URL}/characters?arc_id=${arcId}`);
    if (!res.ok) throw new Error("Erreur api ...");
    data[arcId] = await res.json();
  }
  return data;
};


