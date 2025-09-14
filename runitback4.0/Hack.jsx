import React, { useState, useEffect } from 'react';

// Categories data (same as in Hack.js)
const categories = {
  DataStructures: [
    { term: "Stack", definition: "LIFO data structure where elements are added/removed from the top" },
    { term: "Queue", definition: "FIFO data structure where elements enter at rear and exit at front" },
    { term: "Hash Table", definition: "data structure that maps keys to values using a hash function" },
    { term: "Graph", definition: "collection of nodes (vertices) connected by edges" },
    { term: "Tree", definition: "hierarchical data structure with root node and child nodes" },
  ],
  Systems: [
    { term: "Process", definition: "a running instance of a program" },
    { term: "Thread", definition: "a lightweight unit of execution inside a process" },
    { term: "Scheduler", definition: "decides which process runs at what time" },
    { term: "Deadlock", definition: "when processes block each other and none can continue" },
    { term: "Kernel", definition: "the core part of an OS managing resources" },
    { term: "Context Switch", definition: "when the CPU switches from one process/thread to another" },
  ],
  Physics: [
    { term: "Entropy", definition: "measure of disorder or randomness in a system" },
    { term: "Quantum", definition: "smallest discrete unit of energy or matter" },
    { term: "Momentum", definition: "product of mass and velocity (p = mv)" },
    { term: "Capacitance", definition: "ability to store electrical charge (C = Q/V)" },
    { term: "Inductance", definition: "property of conductor opposing change in current flow" },
    { term: "Photon", definition: "particle of light carrying electromagnetic energy" },
    { term: "Superconductor", definition: "material with zero electrical resistance at low temperatures" },
    { term: "Wavelength", definition: "distance between successive wave crests" },
    { term: "Torque", definition: "rotational force causing angular acceleration" },
    { term: "Thermodynamics", definition: "study of heat, energy, and work relationships" },
  ],
  Chemistry: [
    { term: "Catalyst", definition: "substance that speeds up reactions without being consumed" },
    { term: "Molarity", definition: "concentration measured in moles per liter" },
    { term: "Oxidation", definition: "loss of electrons or increase in oxidation state" },
    { term: "Reduction", definition: "gain of electrons or decrease in oxidation state" },
    { term: "Isotope", definition: "atoms with same protons but different neutrons" },
    { term: "Covalent Bond", definition: "chemical bond formed by sharing electron pairs" },
    { term: "pH", definition: "measure of hydrogen ion concentration (acidity/basicity)" },
    { term: "Electronegativity", definition: "atom's ability to attract electrons in a bond" },
    { term: "Equilibrium", definition: "state where forward and reverse reaction rates are equal" },
    { term: "Stoichiometry", definition: "calculation of reactants and products in chemical reactions" },
  ],
  Biology: [
    { term: "Mitosis", definition: "cell division producing two identical daughter cells" },
    { term: "Meiosis", definition: "cell division producing four haploid gametes" },
    { term: "Photosynthesis", definition: "process converting light energy to chemical energy in plants" },
    { term: "ATP", definition: "adenosine triphosphate - cellular energy currency" },
    { term: "DNA Replication", definition: "process of copying DNA before cell division" },
    { term: "Transcription", definition: "synthesis of RNA from DNA template" },
    { term: "Translation", definition: "synthesis of proteins from mRNA" },
    { term: "Enzyme", definition: "biological catalyst speeding up biochemical reactions" },
    { term: "Homeostasis", definition: "maintaining stable internal conditions in organisms" },
    { term: "Osmosis", definition: "water movement across semipermeable membrane" },
  ]
};

const MovingFlashcards = () => {
  const [positions, setPositions] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [score, setScore] = useState(0);
  const [gameCards, setGameCards] = useState([]);
  const [lockBoard, setLockBoard] = useState(false);

  const selectedCategory = 'DataStructures';
  const termsList = categories[selectedCategory];

  // Create game cards (terms and definitions)
  useEffect(() => {
    const pairs = termsList.slice(0, 4); // Use first 4 pairs
    const cards = [];
    
    pairs.forEach(pair => {
      cards.push({ text: pair.term, match: pair.definition, type: "term" });
      cards.push({ text: pair.definition, match: pair.term, type: "definition" });
    });
    
    // Shuffle cards
    const shuffledCards = cards.sort(() => Math.random() - 0.5);
    setGameCards(shuffledCards);
  }, []);

  // Initialize positions and start movement
  useEffect(() => {
    if (gameCards.length === 0) return;

    const width = window.innerWidth - 200; // Account for card width
    const height = window.innerHeight - 200; // Account for card height

    const initialPositions = gameCards.map(() => ({
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height),
      vx: (Math.random() - 0.5) * 2, // Random velocity x
      vy: (Math.random() - 0.5) * 2, // Random velocity y
    }));

    setPositions(initialPositions);

    // Start movement animation
    const moveInterval = setInterval(() => {
      setPositions(prevPositions => 
        prevPositions.map(pos => {
          let newX = pos.x + pos.vx;
          let newY = pos.y + pos.vy;
          let newVx = pos.vx;
          let newVy = pos.vy;

          // Bounce off walls
          if (newX <= 0 || newX >= width) {
            newVx = -newVx;
            newX = Math.max(0, Math.min(width, newX));
          }
          if (newY <= 0 || newY >= height) {
            newVy = -newVy;
            newY = Math.max(0, Math.min(height, newY));
          }

          return {
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy
          };
        })
      );
    }, 50); // Move every 50ms

    return () => clearInterval(moveInterval);
  }, [gameCards.length]);

  const handleCardClick = (index, card) => {
    if (lockBoard) return;
    if (selectedCards.find(sc => sc.index === index)) return;

    const newSelected = [...selectedCards, { index, card }];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setLockBoard(true);
      checkMatch(newSelected);
    }
  };

  const checkMatch = (selected) => {
    const [first, second] = selected;

    if (first.card.match === second.card.text && second.card.match === first.card.text) {
      // Match found
      setScore(prev => prev + 1);
      setSelectedCards([]);
      setLockBoard(false);
    } else {
      // No match
      setTimeout(() => {
        setSelectedCards([]);
        setLockBoard(false);
      }, 1000);
    }
  };

  const isCardSelected = (index) => {
    return selectedCards.some(sc => sc.index === index);
  };

  const isCardMatched = (index) => {
    // This would need more complex logic to track matched cards
    return false;
  };

  return (
    <div className="moving-flashcards-container">
      <div className="game-info">
        <h1>Moving Flashcards Game</h1>
        <div className="score">Score: {score}</div>
      </div>
      <div className="cards-container">
        {gameCards.map((card, index) => (
          <div
            key={index}
            className={`moving-card ${isCardSelected(index) ? 'selected' : ''} ${isCardMatched(index) ? 'matched' : ''}`}
            style={{
              left: `${positions[index]?.x || 0}px`,
              top: `${positions[index]?.y || 0}px`,
            }}
            onClick={() => handleCardClick(index, card)}
          >
            {card.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovingFlashcards;