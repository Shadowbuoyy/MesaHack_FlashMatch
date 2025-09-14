// Landing page logic: categories -> options modal -> proceed to game.html
// Also includes a stub "create your own" flow you can later replace with a real API call.

const createBtn = document.querySelector("#createBtn");
const promptModal = document.querySelector("#promptModal");
const optionsModal = document.querySelector("#optionsModal");
const promptInput = document.querySelector("#promptInput");
const apiKeyInput = document.querySelector("#apiKeyInput");
const promptNextBtn = document.querySelector("#promptNextBtn");
const pairCountEl = document.querySelector("#pairCount");
const difficultyEl = document.querySelector("#difficulty");
const cardCountEl = document.querySelector("#cardCount");
const gameModeEl = document.querySelector("#gameMode");
const proceedBtn = document.querySelector("#proceedBtn");
const toastEl = document.querySelector("#toast");

let pendingConfig = {
  mode: null,          // 'preset' | 'custom'
  deckId: null,        // preset id OR generated id
  cardCount: 4,        // number of pairs to use
  gameMode: 'static',  // 'static' | 'moving'
  deckData: null       // normalized deck JSON we store for game.html
};

// --- helpers ---
function openModal(node){ node.classList.remove("hidden"); }
function closeModal(node){ node.classList.add("hidden"); }
function toast(msg, ms=1600){
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  setTimeout(()=> toastEl.classList.add("hidden"), ms);
}

// Close buttons with data-close attr
document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-close");
    const node = document.querySelector(target);
    if (node) closeModal(node);
  });
});

// Handle preset category selection
document.querySelectorAll(".tile[data-type='preset']").forEach(btn => {
  btn.addEventListener("click", async () => {
    const deckId = btn.getAttribute("data-deck-id");
    pendingConfig = { 
      mode: "preset", 
      deckId, 
      cardCount: 4, 
      gameMode: 'static', 
      deckData: null 
    };
    // Load preset deck data (minimal) — you can expand these later
    const deck = getPresetDeck(deckId);
    pendingConfig.deckData = normalizeDeck(deck);
    openModal(optionsModal);
  });
});

// Create-your-own flow
createBtn.addEventListener("click", () => {
  pendingConfig = { 
    mode: "custom", 
    deckId: null, 
    cardCount: 4, 
    gameMode: 'static', 
    deckData: null 
  };
  promptInput.value = "";
  pairCountEl.value = "8";
  difficultyEl.value = "easy";
  
  // Load saved API key
  const savedApiKey = localStorage.getItem('flashmatch.apiKey');
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
  }
  
  openModal(promptModal);
});

promptNextBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const pairCount = clamp(parseInt(pairCountEl.value, 10) || 8, 4, 24);
  const difficulty = difficultyEl.value;

  if (!prompt) {
    toast("Please describe your topic.");
    return;
  }

  if (!apiKey) {
    toast("Please enter your OpenAI API key.");
    return;
  }

  // Save API key for future use
  localStorage.setItem('flashmatch.apiKey', apiKey);

  // Show loading state
  const originalText = promptNextBtn.textContent;
  promptNextBtn.textContent = "Generating...";
  promptNextBtn.disabled = true;

  try {
    const genDeck = await generateDeckFromPrompt({ prompt, pairCount, difficulty, apiKey });
    pendingConfig.deckId = genDeck.id;
    pendingConfig.deckData = normalizeDeck(genDeck);
    closeModal(promptModal);
    openModal(optionsModal);
  } catch (e) {
    console.error(e);
    toast(`Failed to generate deck: ${e.message}`);
  } finally {
    // Reset button state
    promptNextBtn.textContent = originalText;
    promptNextBtn.disabled = false;
  }
});

// Proceed to game page
proceedBtn.addEventListener("click", () => {
  if (!pendingConfig.deckData) {
    toast("No deck selected.");
    return;
  }

  // Get user selections
  const cardCount = parseInt(cardCountEl.value) || 4;
  const gameMode = gameModeEl.value || 'static';

  // Update pending config
  pendingConfig.cardCount = cardCount;
  pendingConfig.gameMode = gameMode;

  // Limit deck data to selected number of pairs
  const limitedDeckData = {
    ...pendingConfig.deckData,
    pairs: pendingConfig.deckData.pairs.slice(0, cardCount)
  };

  // Save deck & config for the game page
  localStorage.setItem("flashmatch.pendingDeck", JSON.stringify(limitedDeckData));
  localStorage.setItem("flashmatch.pendingOptions", JSON.stringify({ 
    cardCount: pendingConfig.cardCount,
    gameMode: pendingConfig.gameMode 
  }));

  // Navigate to appropriate game page
  if (gameMode === 'moving') {
    window.location.href = `./moving-flashcards.html`;
  } else {
    window.location.href = `./game.html`;
  }
});

// --- data + stubs ---

// Minimal preset decks (you or your teammate managing "lists" can expand these)
function getPresetDeck(deckId){
  if (deckId === "bio101") {
    return {
      id: "bio101",
      topic: "C++ Programming Terms",
      pairs: [
        { term: "Pointer", def: "Variable storing a memory address" },
        { term: "Reference", def: "Alias for another variable" },
        { term: "Header", def: "File containing declarations (.h/.hpp)" },
        { term: "Template", def: "Generic programming mechanism" },
        { term: "RAII", def: "Resource Acquisition Is Initialization" },
        { term: "Stack", def: "Automatic storage duration" },
        { term: "Heap", def: "Dynamic storage via new/delete" },
        { term: "Namespace", def: "Logical scope grouping names" }
      ]
    };
  }
  if (deckId === "cpp-basics") {
    return {
      id: "cpp-basics",
      topic: "Data Structures & Algorithms",
      pairs: [
        { term: "Stack", def: "LIFO data structure where elements are added/removed from the top" },
        { term: "Queue", def: "FIFO data structure where elements enter at rear and exit at front" },
        { term: "Hash Table", def: "data structure that maps keys to values using a hash function" },
        { term: "Graph", def: "collection of nodes (vertices) connected by edges" },
        { term: "Tree", def: "hierarchical data structure with root node and child nodes" },
        { term: "Binary Search", def: "efficient search algorithm for sorted arrays" },
        { term: "Bubble Sort", def: "simple sorting algorithm that repeatedly steps through the list" },
        { term: "Linked List", def: "linear data structure where elements are stored in nodes" }
      ]
    };
  }
  // us-history
  return {
    id: "us-history", //change to STEM subject
    topic: "US History",
    pairs: [
      { term: "Bill of Rights", def: "First ten amendments to the Constitution" },
      { term: "Civil War", def: "1861–1865 conflict over secession & slavery" },
      { term: "New Deal", def: "FDR programs addressing Great Depression" },
      { term: "Louisiana Purchase", def: "1803 US acquisition from France" },
      { term: "Emancipation Proclamation", def: "1863 Lincoln order freeing enslaved persons in rebelling states" },
      { term: "Marshall Plan", def: "Post-WWII European aid program" },
      { term: "Cold War", def: "US–USSR geopolitical tension" },
      { term: "Brown v. Board", def: "1954 desegregation Supreme Court case" }
    ]
  };
}

// Normalize a deck to what the game page expects (simple term/def records)
function normalizeDeck(deck){
  // Give each pair an id if missing
  const pairs = deck.pairs.map((p, idx) => ({
    id: `p${idx+1}`,
    term: String(p.term),
    def: String(p.def)
  }));
  return {
    id: deck.id || `deck-${Math.random().toString(36).slice(2,8)}`,
    topic: deck.topic || "Custom Deck",
    pairs
  };
}

// Simple clamp
function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

// --- OpenAI Integration ---
async function generateDeckFromPrompt({ prompt, pairCount, difficulty, apiKey }){
  const systemPrompt = `You are a helpful assistant that creates educational flashcard decks. 
Generate exactly ${pairCount} term-definition pairs for the topic: "${prompt}".
Difficulty level: ${difficulty}.

Return ONLY a JSON array in this exact format:
[
  {"term": "Term 1", "def": "Definition 1"},
  {"term": "Term 2", "def": "Definition 2"},
  ...
]

Make sure:
- Terms are concise (1-3 words)
- Definitions are clear and educational
- Appropriate for ${difficulty} level
- Cover the topic comprehensively
- Return ONLY the JSON array, no other text`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a flashcard deck about: ${prompt}` }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Parse the JSON response
    let pairs;
    try {
      pairs = JSON.parse(content);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        pairs = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid response format from OpenAI');
      }
    }

    // Validate the response
    if (!Array.isArray(pairs) || pairs.length === 0) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Ensure we have the right number of pairs
    const finalPairs = pairs.slice(0, pairCount).map(pair => ({
      term: String(pair.term || pair.term),
      def: String(pair.def || pair.definition)
    }));

    return { 
      id: `ai-${Date.now()}`, 
      topic: prompt, 
      pairs: finalPairs 
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to generate deck: ${error.message}`);
  }
}
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function titleCase(s){ return s.replace(/\w\S*/g, w=>w[0].toUpperCase()+w.slice(1)); }
