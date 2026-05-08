// src/hooks/useGame.js
import { useState, useEffect } from "react";
import {
  getAllCharacters,
  getRandomCharacter,
  getCharacterByName,
} from "../services/characterService";

export const useGame = () => {
  const [listeName, setListeName] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [inputName, setInputName] = useState("");
  const [guessCharacter, setGuessCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      const [liste, random] = await Promise.all([
        getAllCharacters(),
        getRandomCharacter(),
      ]);
      setListeName(liste.map((c) => c.nom));
      setGuessCharacter(random);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const submitGuess = async () => {
    if (!inputName.trim()) return;
    try {
      const data = await getCharacterByName(inputName);
      if (data.length > 0) setCharacters((prev) => [data[0], ...prev]);
      setInputName("");
      // ta logique confetti ici aussi
    } catch (err) {
      setError(err);
    }
  };

  return {
    listeName,
    characters,
    inputName,
    setInputName,
    guessCharacter,
    loading,
    error,
    submitGuess,
    resetGame: init,
  };
};
