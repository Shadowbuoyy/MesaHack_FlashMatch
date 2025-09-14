// ✅ Organize terms into categories
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
    

  // ✅ Add more categories as needed...
};

// ✅ Add dropdown to HTML:
// <select id="categorySelect">
//   <option value="Biology">Biology</option>
//   <option value="Physics">Physics</option>
//   <option value="Chemistry">Chemistry</option>
//   <option value="ComputerScience">Computer Science</option>
// </select>

// ✅ Easily adjustable number of pairs in each round
let numPairs = 4;  // change this number to control difficulty

let cards = [];
let selectedCards = [];
let score = 0;
let timer = 0;
let intervalId;
let lockBoard = false;

const board = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const restartBtn = document.getElementById("restart");

function setupGame() {
  // Reset state
  cards = [];
  selectedCards = [];
  score = 0;
  timer = 0;
  clearInterval(intervalId);

  // Get selected category
  const category = document.getElementById("categorySelect").value;
  const termList = categories[category];

  // Shuffle terms and pick only numPairs
  const chosenPairs = termList
    .sort(() => Math.random() - 0.5)
    .slice(0, numPairs);

  // Create cards for chosen pairs
  chosenPairs.forEach(pair => {
    cards.push({ text: pair.term, match: pair.definition, type: "term" });
    cards.push({ text: pair.definition, match: pair.term, type: "definition" });
  });

  // Shuffle cards on the board
  cards.sort(() => Math.random() - 0.5);

  // Render
  board.innerHTML = "";
  cards.forEach((card, index) => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.dataset.index = index;
    div.innerText = card.text;
    div.addEventListener("click", () => selectCard(div, card));
    board.appendChild(div);
  });

  // Update UI
  scoreDisplay.innerText = "Score: 0";
  timerDisplay.innerText = "Time: 0s";

  // Start timer
  intervalId = setInterval(() => {
    timer++;
    timerDisplay.innerText = `Time: ${timer}s`;
  }, 1000);
}

function selectCard(div, card) {
  if (lockBoard) return;
  if (div.classList.contains("correct") || div.classList.contains("selected")) return;

  div.classList.add("selected");
  selectedCards.push({ div, card });

  if (selectedCards.length === 2) {
    lockBoard = true;
    checkMatch();
  }
}

function checkMatch() {
  const [first, second] = selectedCards;

  if (first.card.match === second.card.text && second.card.match === first.card.text) {
    // ✅ Match
    first.div.classList.remove("selected");
    second.div.classList.remove("selected");
    first.div.classList.add("correct");
    second.div.classList.add("correct");
    score++;
    scoreDisplay.innerText = "Score: " + score;

    // Check win condition
    if (score === numPairs) {  // ✅ use numPairs, not full length
      clearInterval(intervalId);
      setTimeout(() => {
        alert(`🎉 You matched all ${numPairs} pairs in ${timer} seconds!`);
      }, 300);
    }

    selectedCards = [];
    lockBoard = false;
  } else {
    // ❌ Wrong
    first.div.classList.add("wrong");
    second.div.classList.add("wrong");

    setTimeout(() => {
      first.div.classList.remove("selected", "wrong");
      second.div.classList.remove("selected", "wrong");
      selectedCards = [];
      lockBoard = false;
    }, 1000);
  }
}

restartBtn.addEventListener("click", setupGame);
document.getElementById("categorySelect").addEventListener("change", setupGame);

// Start first game
setupGame();

