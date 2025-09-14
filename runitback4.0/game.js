// Game page logic - receives deck data from landing page and runs the matching game
document.addEventListener('DOMContentLoaded', function() {
  // Get the deck data from localStorage (sent by landing page)
  const deckData = JSON.parse(localStorage.getItem('flashmatch.pendingDeck') || 'null');
  const options = JSON.parse(localStorage.getItem('flashmatch.pendingOptions') || '{"cardCount": 4, "gameMode": "static"}');
  
  // Clear the stored data after retrieving it
  localStorage.removeItem('flashmatch.pendingDeck');
  localStorage.removeItem('flashmatch.pendingOptions');

  // If no deck data, redirect back to landing page
  if (!deckData) {
    alert('No deck selected. Redirecting to main page.');
    window.location.href = 'index.html';
    return;
  }

  // Adaptive Learning System
  class AdaptiveLearning {
    constructor() {
      this.playerProfile = JSON.parse(localStorage.getItem('flashmatch.playerProfile') || '{}');
      this.initializeProfile();
    }

    initializeProfile() {
      if (!this.playerProfile.conceptMastery) {
        this.playerProfile.conceptMastery = {};
        this.playerProfile.learningRate = 1.0;
        this.playerProfile.optimalReviewTime = {};
        this.playerProfile.sessionData = [];
      }
    }

    updateMastery(concept, wasCorrect, responseTime) {
      if (!this.playerProfile.conceptMastery[concept]) {
        this.playerProfile.conceptMastery[concept] = { 
          level: 0, 
          attempts: 0, 
          successes: 0,
          avgResponseTime: 0,
          lastSeen: Date.now(),
          difficulty: 0.5
        };
      }

      const mastery = this.playerProfile.conceptMastery[concept];
      mastery.attempts++;
      
      if (wasCorrect) {
        mastery.successes++;
        mastery.level = Math.min(5, mastery.level + 0.2);
      } else {
        mastery.level = Math.max(0, mastery.level - 0.5);
      }

      // Update response time
      mastery.avgResponseTime = mastery.avgResponseTime === 0 ? responseTime : 
        (mastery.avgResponseTime + responseTime) / 2;
      mastery.lastSeen = Date.now();

      this.saveProfile();
    }

    getNextConcepts(availableConcepts, count = 8) {
      // Prioritize concepts that need review using spaced repetition
      const sortedConcepts = availableConcepts.sort((a, b) => {
        const masteryA = this.playerProfile.conceptMastery[a.term] || { level: 0, lastSeen: 0 };
        const masteryB = this.playerProfile.conceptMastery[b.term] || { level: 0, lastSeen: 0 };
        
        // Lower mastery and older concepts get priority
        const scoreA = masteryA.level + (Date.now() - masteryA.lastSeen) / (1000 * 60 * 60 * 24);
        const scoreB = masteryB.level + (Date.now() - masteryB.lastSeen) / (1000 * 60 * 60 * 24);
        
        return scoreA - scoreB;
      });

      return sortedConcepts.slice(0, count);
    }

    recordSessionData(sessionData) {
      this.playerProfile.sessionData.push({
        ...sessionData,
        timestamp: Date.now()
      });
      
      // Keep only last 50 sessions
      if (this.playerProfile.sessionData.length > 50) {
        this.playerProfile.sessionData = this.playerProfile.sessionData.slice(-50);
      }
      
      this.saveProfile();
    }

    saveProfile() {
      localStorage.setItem('flashmatch.playerProfile', JSON.stringify(this.playerProfile));
    }
  }

  // Initialize adaptive learning
  const adaptiveLearning = new AdaptiveLearning();

  // Game variables
  let numPairs = options.cardCount || 4;
  let cards = [];
  let selectedCards = [];
  let score = 0;
  let mistakes = 0;
  let timer = 0;
  let intervalId;
  let lockBoard = false;
  let startTime;
  let cardSelectionTime = {}; // Track when each card was selected

  // DOM elements
  const board = document.getElementById("game-board");
  const scoreDisplay = document.getElementById("score");
  const timerDisplay = document.getElementById("timer");
  const restartBtn = document.getElementById("restart");
  const backToMenuBtn = document.getElementById("backToMenu");
  const progressBar = document.getElementById("progressBar");

  // Update page title to show selected deck
  document.title = `FlashMatch - ${deckData.topic}`;

  // Enhanced Leaderboard functions
  function getLeaderboard() {
    return JSON.parse(localStorage.getItem('flashmatch.leaderboard') || '[]');
  }

  function calculateDifficulty(topic) {
    const difficultyMap = {
      'C++ Programming Terms': 'Hard',
      'Data Structures & Algorithms': 'Expert', 
      'US History': 'Medium',
      'Biology': 'Medium',
      'Chemistry': 'Hard',
      'Physics': 'Hard'
    };
    return difficultyMap[topic] || 'Medium';
  }

  function saveToLeaderboard(score, time, mistakes, mode, topic) {
    const leaderboard = getLeaderboard();
    const conceptsMasteredCount = Object.keys(adaptiveLearning.playerProfile.conceptMastery || {}).length;
    
    const newEntry = {
      score,
      time,
      mistakes,
      mode,
      topic,
      date: new Date().toISOString(),
      accuracy: Math.round((score / (score + mistakes)) * 100) || 0,
      // Enhanced metrics
      avgResponseTime: calculateAverageResponseTime(),
      conceptsMastered: conceptsMasteredCount,
      difficultyLevel: calculateDifficulty(topic),
      learningEfficiency: Math.round((score / time) * 100)
    };
    
    leaderboard.push(newEntry);
    leaderboard.sort((a, b) => {
      // Sort by score (desc), then by time (asc), then by mistakes (asc)
      if (a.score !== b.score) return b.score - a.score;
      if (a.time !== b.time) return a.time - b.time;
      return a.mistakes - b.mistakes;
    });
    // Keep only top 10
    leaderboard.splice(10);
    localStorage.setItem('flashmatch.leaderboard', JSON.stringify(leaderboard));

    // Record session data for analytics
    adaptiveLearning.recordSessionData({
      score,
      time,
      mistakes,
      topic,
      accuracy: newEntry.accuracy,
      conceptsMastered: conceptsMasteredCount
    });
  }

  function calculateAverageResponseTime() {
    const responseTimes = Object.values(cardSelectionTime);
    if (responseTimes.length === 0) return 0;
    return Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
  }

  function showEndGamePopup() {
    const totalTime = timer;
    const topic = deckData?.topic || 'Default Topic';
    const mode = 'Static Grid';
    
    // Save to leaderboard
    saveToLeaderboard(score, totalTime, mistakes, mode, topic);
    
    // Create enhanced popup with analytics button
    const popup = document.createElement('div');
    popup.className = 'end-game-popup';
    popup.innerHTML = `
      <div class="popup-content">
        <h2>🎉 Game Complete!</h2>
        <div class="stats">
          <div class="stat">
            <div class="stat-label">Score</div>
            <div class="stat-value">${score}/${score + mistakes}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Time</div>
            <div class="stat-value">${totalTime}s</div>
          </div>
          <div class="stat">
            <div class="stat-label">Accuracy</div>
            <div class="stat-value">${Math.round((score / (score + mistakes)) * 100) || 0}%</div>
            <div class="accuracy-bar-container">
              <div class="accuracy-bar" style="width: ${Math.round((score / (score + mistakes)) * 100) || 0}%"></div>
            </div>
          </div>
          <div class="stat">
            <div class="stat-label">Mistakes</div>
            <div class="stat-value">${mistakes}</div>
          </div>
        </div>
        <div class="leaderboard">
          <h3>🏆 Leaderboard</h3>
          <div class="leaderboard-list" id="leaderboardList">
            ${generateLeaderboardHTML()}
          </div>
        </div>
        <div class="popup-actions">
          <button class="btn" onclick="location.reload()">Play Again</button>
          <button class="btn secondary" onclick="window.location.href='index.html'">Main Menu</button>
          <button class="btn" onclick="window.location.href='analytics.html'" style="background: #6b8afd;">View Analytics</button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
  }

  function generateLeaderboardHTML() {
    const leaderboard = getLeaderboard();
    return leaderboard.map((entry, index) => `
      <div class="leaderboard-entry ${index < 3 ? 'top-three' : ''}">
        <span class="rank">${index + 1}</span>
        <span class="entry-info">
          <span class="entry-score">${entry.score}/${entry.score + entry.mistakes}</span>
          <span class="entry-time">${entry.time}s</span>
          <span class="entry-topic">${entry.topic}</span>
        </span>
      </div>
    `).join('');
  }

  function updateProgressBar() {
    const matchedPairs = score;
    const totalPairs = numPairs;
    const percent = Math.round((matchedPairs / totalPairs) * 100);
    progressBar.style.width = percent + "%";
  }

  function setupGame() {
    // Reset state
    cards = [];
    selectedCards = [];
    score = 0;
    mistakes = 0;
    timer = 0;
    cardSelectionTime = {};
    clearInterval(intervalId);

    // Use the deck data from landing page
    const pairs = deckData.pairs;
    
    // Use the specified number of pairs
    numPairs = Math.min(pairs.length, numPairs);

    // Use adaptive learning to select optimal concepts
    const availablePairs = [...pairs];
    const chosenPairs = adaptiveLearning.getNextConcepts(availablePairs, numPairs);
    
    // If not enough concepts from adaptive selection, fill with random
    while (chosenPairs.length < numPairs && availablePairs.length > chosenPairs.length) {
      const remainingPairs = availablePairs.filter(p => !chosenPairs.includes(p));
      if (remainingPairs.length > 0) {
        chosenPairs.push(remainingPairs[Math.floor(Math.random() * remainingPairs.length)]);
      } else {
        break;
      }
    }

    // Create cards for chosen pairs
    chosenPairs.forEach(pair => {
      cards.push({ text: pair.term, match: pair.def, type: "term" });
      cards.push({ text: pair.def, match: pair.term, type: "definition" });
    });

    // Shuffle cards on the board
    cards.sort(() => Math.random() - 0.5);

    // Calculate grid dimensions and apply appropriate CSS class
    const totalCards = cards.length;
    const gridSize = Math.ceil(Math.sqrt(totalCards));
    const gridClass = `grid-${gridSize}x${gridSize}`;
    
    // Remove any existing grid classes and add the new one
    board.className = `game-board ${gridClass}`;

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
    updateProgressBar(); // Reset progress bar at start

    // Start timer
    intervalId = setInterval(() => {
      timer++;
      timerDisplay.innerText = `Time: ${timer}s`;
    }, 1000);
  }

  function selectCard(div, card) {
    if (lockBoard) return;
    if (div.classList.contains("correct") || div.classList.contains("selected")) return;

    // Record when card was selected for response time tracking
    cardSelectionTime[card.text] = Date.now();

    div.classList.add("selected");
    selectedCards.push({ div, card });

    if (selectedCards.length === 2) {
      lockBoard = true;
      checkMatch();
    }
  }

  function checkMatch() {
    const [first, second] = selectedCards;
    
    // Calculate response time
    const firstSelectionTime = cardSelectionTime[first.card.text] || Date.now();
    const secondSelectionTime = cardSelectionTime[second.card.text] || Date.now();
    const responseTime = Math.abs(secondSelectionTime - firstSelectionTime);

    if (first.card.match === second.card.text && second.card.match === first.card.text) {
      // Match - update adaptive learning with success
      adaptiveLearning.updateMastery(first.card.text, true, responseTime);
      adaptiveLearning.updateMastery(second.card.text, true, responseTime);
      
      first.div.classList.remove("selected");
      second.div.classList.remove("selected");
      first.div.classList.add("correct");
      second.div.classList.add("correct");
      
      // Add celebration animation
      first.div.classList.add("matched-card");
      second.div.classList.add("matched-card");
      
      // Remove animation class after it completes
      setTimeout(() => {
        first.div.classList.remove("matched-card");
        second.div.classList.remove("matched-card");
      }, 600);
      
      score++;
      scoreDisplay.innerText = "Score: " + score;
      updateProgressBar();

      // Make matched cards disappear after a short delay
      setTimeout(() => {
        first.div.style.opacity = '0';
        second.div.style.opacity = '0';
        setTimeout(() => {
          first.div.style.display = 'none';
          second.div.style.display = 'none';
        }, 300);
      }, 500);

      // Check win condition
      if (score === numPairs) {
        clearInterval(intervalId);
        setTimeout(() => {
          showEndGamePopup();
        }, 1000);
      }

      selectedCards = [];
      lockBoard = false;
    } else {
      // Wrong - update adaptive learning with failure
      adaptiveLearning.updateMastery(first.card.text, false, responseTime);
      adaptiveLearning.updateMastery(second.card.text, false, responseTime);
      
      // Wrong - increment mistakes
      mistakes++;
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

  // Event listeners
  restartBtn.addEventListener("click", setupGame);
  
  if (backToMenuBtn) {
    backToMenuBtn.addEventListener("click", function() {
      window.location.href = 'index.html';
    });
  }

  // Start the game
  setupGame();
});