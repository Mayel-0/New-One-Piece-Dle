export const useGameMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingArc, setLoadingArc] = useState(true);
  const [errorArc, setErrorArc] = useState(null);
  const [CharactersByArc, setCharactersByArc] = useState({});

  const [openArcId, setOpenArcId] = useState(null);
};
