// Minimal working core app (Home/Stats/Study/Settings) + flashcards

let statsManager;

let currentLevel = null;
let currentQueue = [];
let currentIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let isFlipped = false;

function showSection(section) {
  const map = {
    home: "homeScreen",
    stats: "statsScreen",
    study: "studySelectionScreen",
    settings: "settingsScreen",
  };

  document.querySelectorAll("#appContainer .screen").forEach((s) => s.classList.remove("active"));
  document.querySelectorAll(".nav-tab").forEach((t) => t.classList.remove("active"));

  const screenId = map[section];
  if (screenId) document.getElementById(screenId).classList.add("active");

  const tab = document.querySelector(`.nav-tab[data-section="${section}"]`);
  if (tab) tab.classList.add("active");
}

function updateHomeScreen() {
  const wod = getWordOfTheDay();
  document.getElementById("wordOfDayChinese").textContent = wod.chinese;
  document.getElementById("wordOfDayPinyin").textContent = wod.pinyin;
  document.getElementById("wordOfDayTranslation").textContent = wod.translation;

  const stats = statsManager.stats;
  document.getElementById("totalWordsLearned").textContent = stats.wordsLearned.length;
  document.getElementById("currentStreak").textContent = stats.studyStreak;
  document.getElementById("overallAccuracy").textContent = statsManager.getOverallAccuracy() + "%";

  // Simple placeholder achievements
  const ach = document.getElementById("achievementsGrid");
  ach.innerHTML = "";
  ["🏅", "🥈", "🏆", "🔥", "⚡"].forEach((ic) => {
    const div = document.createElement("div");
    div.className = "achievement-badge";
    div.textContent = ic;
    ach.appendChild(div);
  });
}

function updateStatsScreen() {
  document.getElementById("statsWordsLearned").textContent = statsManager.stats.wordsLearned.length;
  document.getElementById("statsOverallAccuracy").textContent = statsManager.getOverallAccuracy() + "%";
  document.getElementById("statsStreak").textContent = statsManager.stats.studyStreak;

  const container = document.getElementById("levelProgressContainer");
  container.innerHTML = "";

  for (let i = 1; i <= 10; i++) {
    const key = `level${i}`;
    const lvl = statsManager.stats.levelStats[key];
    const acc = Number(lvl?.accuracy || 0);

    const item = document.createElement("div");
    item.className = "level-progress-item";
    item.innerHTML = `
      <div class="level-progress-label">
        <span>Level ${i}</span>
        <span>${acc}%</span>
      </div>
      <div class="level-progress-bar">
        <div class="level-progress-fill" style="width:${Math.max(1, Math.min(100, acc))}%"></div>
      </div>
    `;
    container.appendChild(item);
  }
}

function setStudyStats() {
  const total = correctCount + incorrectCount;
  const acc = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  document.getElementById("correctCount").textContent = correctCount;
  document.getElementById("incorrectCount").textContent = incorrectCount;
  document.getElementById("accuracyPercent").textContent = acc + "%";
}

function displayCard() {
  if (!currentLevel) return;

  const levelVocab = hsk1Vocabulary[currentLevel];
  const vocabIndex = currentQueue[currentIndex];
  const vocab = levelVocab[vocabIndex];

  document.getElementById("frontWord").textContent = vocab.chinese;
  document.getElementById("frontPinyin").textContent = vocab.pinyin;
  document.getElementById("translation").textContent = vocab.translation;
  document.getElementById("exampleSentence").textContent = vocab.exampleSentence;
  document.getElementById("examplePinyin").textContent = vocab.exampleSentencePinyin;
  document.getElementById("exampleTranslation").textContent = vocab.exampleTranslation;

  document.getElementById("currentCard").textContent = String(currentIndex + 1);
  document.getElementById("totalCards").textContent = String(currentQueue.length);

  const progress = ((currentIndex + 1) / currentQueue.length) * 100;
  document.getElementById("progressFill").style.width = progress + "%";

  // reset flip
  isFlipped = false;
  document.getElementById("flashcard").classList.remove("flipped");
}

function flipCard() {
  isFlipped = !isFlipped;
  document.getElementById("flashcard").classList.toggle("flipped", isFlipped);
}

function nextCard() {
  if (currentIndex < currentQueue.length - 1) {
    currentIndex++;
    displayCard();
  }
}

function previousCard() {
  if (currentIndex > 0) {
    currentIndex--;
    displayCard();
  }
}

function shuffleQueue() {
  for (let i = currentQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [currentQueue[i], currentQueue[j]] = [currentQueue[j], currentQueue[i]];
  }
}

function toggleShuffle() {
  shuffleQueue();
  currentIndex = 0;
  displayCard();
}

function markCorrect() {
  correctCount++;
  setStudyStats();
  nextCard();
}

function markIncorrect() {
  incorrectCount++;
  setStudyStats();
  nextCard();
}

function speak(text, lang = "zh-CN") {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

function speakWord() {
  if (!currentLevel) return;
  const levelVocab = hsk1Vocabulary[currentLevel];
  const vocab = levelVocab[currentQueue[currentIndex]];
  speak(vocab.chinese, "zh-CN");
}

function speakSentence() {
  if (!currentLevel) return;
  const levelVocab = hsk1Vocabulary[currentLevel];
  const vocab = levelVocab[currentQueue[currentIndex]];
  speak(vocab.exampleSentence, "zh-CN");
}

function startLevel(levelKey) {
  currentLevel = levelKey;

  const levelNum = levelKey.replace("level", "");
  document.getElementById("levelTitle").textContent = `Level ${levelNum}`;

  const levelVocab = hsk1Vocabulary[levelKey];
  currentQueue = Array.from({ length: levelVocab.length }, (_, i) => i);
  currentIndex = 0;
  correctCount = 0;
  incorrectCount = 0;
  setStudyStats();

  // switch screens
  document.querySelectorAll("#appContainer .screen").forEach((s) => s.classList.remove("active"));
  document.getElementById("studyScreen").classList.add("active");

  displayCard();
}

function wireUpUI() {
  // Nav
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const section = e.currentTarget.getAttribute("data-section");
      showSection(section);
      if (section === "home") updateHomeScreen();
      if (section === "stats") updateStatsScreen();
    });
  });

  // Home buttons
  document.getElementById("studyModeBtn").addEventListener("click", () => showSection("study"));
  document.getElementById("quizModeBtn").addEventListener("click", () => alert("Quiz Mode not enabled in this build yet."));
  document.getElementById("bonusModeBtn").addEventListener("click", () => alert("Bonus Exams not enabled in this build yet."));
  document.getElementById("finalModeBtn").addEventListener("click", () => alert("Final Exams not enabled in this build yet."));

  // Study selection back
  document.getElementById("backFromStudySelection").addEventListener("click", () => showSection("home"));

  // Level buttons
  document.querySelectorAll(".study-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => startLevel(e.currentTarget.getAttribute("data-level")));
  });

  // Study screen back
  document.getElementById("studyBackBtn").addEventListener("click", () => showSection("study"));

  // Flashcard controls
  document.getElementById("flashcard").addEventListener("click", flipCard);
  document.getElementById("nextBtn").addEventListener("click", nextCard);
  document.getElementById("prevBtn").addEventListener("click", previousCard);
  document.getElementById("shuffleBtn").addEventListener("click", toggleShuffle);
  document.getElementById("correctBtn").addEventListener("click", markCorrect);
  document.getElementById("incorrectBtn").addEventListener("click", markIncorrect);

  document.getElementById("frontAudio").addEventListener("click", (e) => {
    e.stopPropagation();
    speakWord();
  });
  document.getElementById("backAudio").addEventListener("click", (e) => {
    e.stopPropagation();
    speakSentence();
  });

  // Settings
  document.getElementById("darkModeToggle").addEventListener("change", (e) => {
    document.body.classList.toggle("dark-mode", e.target.checked);
    authManager.updateUserSettings({ darkMode: e.target.checked });
  });

  document.getElementById("fontSizeSlider").addEventListener("input", (e) => {
    const size = Number(e.target.value);
    document.body.style.fontSize = size + "px";
    document.getElementById("fontSizeDisplay").textContent = size + "px";
    authManager.updateUserSettings({ fontSize: size });
  });

  document.getElementById("audioSpeedSelect").addEventListener("change", (e) => {
    const speed = Number(e.target.value);
    authManager.updateUserSettings({ audioSpeed: speed });
  });

  document.getElementById("resetDataBtn").addEventListener("click", () => {
    if (!confirm("Reset your progress?")) return;
    removeUserData("stats");
    statsManager = new StatisticsManager();
    updateHomeScreen();
    updateStatsScreen();
    alert("Reset done.");
  });
}

function applyUserSettings() {
  const user = authManager.getCurrentUser();
  if (!user?.settings) return;

  document.body.classList.toggle("dark-mode", !!user.settings.darkMode);
  document.getElementById("darkModeToggle").checked = !!user.settings.darkMode;

  const fontSize = user.settings.fontSize ?? 16;
  document.body.style.fontSize = fontSize + "px";
  document.getElementById("fontSizeSlider").value = String(fontSize);
  document.getElementById("fontSizeDisplay").textContent = fontSize + "px";

  const speed = user.settings.audioSpeed ?? 1;
  document.getElementById("audioSpeedSelect").value = String(speed);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // Important for GitHub Pages: relative path
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

function initializeApp() {
  if (!authManager.checkLoggedIn()) return;

  statsManager = new StatisticsManager();
  applyUserSettings();
  wireUpUI();
  updateHomeScreen();
  updateStatsScreen();
  showSection("home");
  registerServiceWorker();
}

document.addEventListener("DOMContentLoaded", () => {
  if (authManager.checkLoggedIn()) {
    initializeApp();
  }
});
