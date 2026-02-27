// Minimal working core app (Home/Stats/Study/Settings) + flashcards + Quizzes + Bonus Exams + Final Exams

let statsManager;

// Study state
let currentLevel = null;
let currentQueue = [];
let currentIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let isFlipped = false;

// Quiz/Final state
let quizSelectedLevel = null;
let activeMode = null; // "quiz" | "final" | "bonus" | null
let activeQuizType = null; // "translation" | "character" | "final_translation" | "final_character" | "final_pinyin"
let questionPool = []; // array of vocab items
let questionOrder = []; // indices into questionPool
let qIndex = 0;
let qCorrect = 0;
let qIncorrect = 0;
let qAnswered = false;
let qCurrentOptions = [];
let qCorrectOptionIndex = -1;

// Bonus state
let bonusDifficulty = null; // "easy" | "medium" | "advanced"
let bonusPool = []; // array of templates
let bonusOrder = [];
let bIndex = 0;
let bCorrect = 0;
let bIncorrect = 0;
let bAnswered = false;

function $(id) {
  return document.getElementById(id);
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function showOnlyScreen(screenId) {
  document.querySelectorAll("#appContainer .screen").forEach((s) => s.classList.remove("active"));
  $(screenId).classList.add("active");
}

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
  if (screenId) $(screenId).classList.add("active");

  const tab = document.querySelector(`.nav-tab[data-section="${section}"]`);
  if (tab) tab.classList.add("active");
}

function getAllVocabFlat() {
  const out = [];
  for (let i = 1; i <= 10; i++) {
    const lvl = `level${i}`;
    const arr = hsk1Vocabulary[lvl] || [];
    out.push(...arr);
  }
  return out;
}

function updateHomeScreen() {
  const wod = getWordOfTheDay();
  $("wordOfDayChinese").textContent = wod.chinese;
  $("wordOfDayPinyin").textContent = wod.pinyin;
  $("wordOfDayTranslation").textContent = wod.translation;

  const stats = statsManager.stats;
  $("totalWordsLearned").textContent = stats.wordsLearned.length;
  $("currentStreak").textContent = stats.studyStreak;
  $("overallAccuracy").textContent = statsManager.getOverallAccuracy() + "%";

  const ach = $("achievementsGrid");
  ach.innerHTML = "";
  ["🏅", "🥈", "🏆", "🔥", "⚡"].forEach((ic) => {
    const div = document.createElement("div");
    div.className = "achievement-badge";
    div.textContent = ic;
    ach.appendChild(div);
  });
}

function updateStatsScreen() {
  $("statsWordsLearned").textContent = statsManager.stats.wordsLearned.length;
  $("statsOverallAccuracy").textContent = statsManager.getOverallAccuracy() + "%";
  $("statsStreak").textContent = statsManager.stats.studyStreak;

  const container = $("levelProgressContainer");
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

/* =========================
   STUDY MODE (FLASHCARDS)
   ========================= */
function setStudyStats() {
  const total = correctCount + incorrectCount;
  const acc = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  $("correctCount").textContent = correctCount;
  $("incorrectCount").textContent = incorrectCount;
  $("accuracyPercent").textContent = acc + "%";
}

function displayCard() {
  if (!currentLevel) return;

  const levelVocab = hsk1Vocabulary[currentLevel];
  const vocabIndex = currentQueue[currentIndex];
  const vocab = levelVocab[vocabIndex];

  $("frontWord").textContent = vocab.chinese;
  $("frontPinyin").textContent = vocab.pinyin;
  $("translation").textContent = vocab.translation;
  $("exampleSentence").textContent = vocab.exampleSentence;
  $("examplePinyin").textContent = vocab.exampleSentencePinyin;
  $("exampleTranslation").textContent = vocab.exampleTranslation;

  $("currentCard").textContent = String(currentIndex + 1);
  $("totalCards").textContent = String(currentQueue.length);

  const progress = ((currentIndex + 1) / currentQueue.length) * 100;
  $("progressFill").style.width = progress + "%";

  isFlipped = false;
  $("flashcard").classList.remove("flipped");
}

function flipCard() {
  isFlipped = !isFlipped;
  $("flashcard").classList.toggle("flipped", isFlipped);
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

function toggleShuffle() {
  shuffleInPlace(currentQueue);
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
  $("levelTitle").textContent = `Level ${levelNum}`;

  const levelVocab = hsk1Vocabulary[levelKey];
  currentQueue = Array.from({ length: levelVocab.length }, (_, i) => i);
  currentIndex = 0;
  correctCount = 0;
  incorrectCount = 0;
  setStudyStats();

  showOnlyScreen("studyScreen");
  displayCard();
}

/* =========================
   QUIZ / FINAL EXAMS
   ========================= */
function buildLevelButtons(containerEl, onPick) {
  containerEl.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement("button");
    btn.className = "level-btn";
    btn.setAttribute("data-level", `level${i}`);
    btn.innerHTML = `<span class="level-number">${i}</span><span class="level-words">15 Words</span>`;
    btn.addEventListener("click", () => onPick(`level${i}`));
    containerEl.appendChild(btn);
  }
}

function setSelectedLevelButton(containerEl, selectedLevel) {
  containerEl.querySelectorAll(".level-btn").forEach((b) => {
    b.classList.toggle("selected", b.getAttribute("data-level") === selectedLevel);
  });
}

function startQuizFlow(levelKey, quizType) {
  activeMode = "quiz";
  activeQuizType = quizType;
  quizSelectedLevel = levelKey;

  questionPool = (hsk1Vocabulary[levelKey] || []).slice(); // 15
  questionOrder = Array.from({ length: questionPool.length }, (_, i) => i);
  shuffleInPlace(questionOrder);

  qIndex = 0;
  qCorrect = 0;
  qIncorrect = 0;

  const levelNum = levelKey.replace("level", "");
  $("quizTitle").textContent = quizType === "translation"
    ? `Level ${levelNum} — Translation Quiz`
    : `Level ${levelNum} — Character Quiz`;

  showOnlyScreen("quizScreen");
  renderQuestion();
}

function startFinalExam(examType) {
  activeMode = "final";
  activeQuizType = examType;

  questionPool = getAllVocabFlat(); // 150
  questionOrder = Array.from({ length: questionPool.length }, (_, i) => i);
  shuffleInPlace(questionOrder);

  qIndex = 0;
  qCorrect = 0;
  qIncorrect = 0;

  if (examType === "final_translation") $("finalTitle").textContent = "Final Exam 1 — Translation (150)";
  if (examType === "final_character") $("finalTitle").textContent = "Final Exam 2 — Character (150)";
  if (examType === "final_pinyin") $("finalTitle").textContent = "Final Exam 3 — Pinyin Typing (150)";

  showOnlyScreen("finalExamScreen");
  renderQuestion();
}

function getCurrentVocab() {
  const idx = questionOrder[qIndex];
  return questionPool[idx];
}

function computeProgress(current, total) {
  if (total <= 0) return 0;
  return Math.max(1, Math.round(((current + 1) / total) * 100));
}

function setProgressUI(prefix, current, total) {
  $(`${prefix}Current`).textContent = String(current + 1);
  $(`${prefix}Total`).textContent = String(total);
  $(`${prefix}ProgressFill`).style.width = computeProgress(current, total) + "%";
}

function buildOptionsForTranslation(vocab) {
  const correct = vocab.translation;
  const all = questionPool.map((v) => v.translation);

  const choices = new Set([correct]);
  while (choices.size < 4) {
    const pick = all[Math.floor(Math.random() * all.length)];
    if (pick) choices.add(pick);
  }

  const arr = Array.from(choices).map((t) => ({ main: t, sub: "" }));
  shuffleInPlace(arr);
  const correctIndex = arr.findIndex((x) => x.main === correct);
  return { options: arr, correctIndex };
}

function buildOptionsForCharacter(vocab) {
  const correct = vocab.chinese;
  const all = questionPool.map((v) => v.chinese);

  const choices = new Set([correct]);
  while (choices.size < 4) {
    const pick = all[Math.floor(Math.random() * all.length)];
    if (pick) choices.add(pick);
  }

  const arr = Array.from(choices).map((c) => ({ main: c, sub: "" }));
  shuffleInPlace(arr);
  const correctIndex = arr.findIndex((x) => x.main === correct);
  return { options: arr, correctIndex };
}

function disableOptionButtons(containerEl, disabled) {
  containerEl.querySelectorAll("button").forEach((b) => (b.disabled = disabled));
}

function renderOptions(prefix, options) {
  const container = $(`${prefix}Options`);
  container.innerHTML = "";

  options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.innerHTML = `
      <div class="quiz-option-left">
        <div class="quiz-option-main">${opt.main}</div>
        <div class="quiz-option-sub">${opt.sub || ""}</div>
      </div>
      <div class="quiz-option-key">${idx + 1}</div>
    `;
    btn.addEventListener("click", () => answerMCQ(idx));
    container.appendChild(btn);
  });
}

function setFeedback(prefix, html, kind) {
  const el = $(`${prefix}Feedback`);
  el.classList.remove("ok", "bad");
  if (kind) el.classList.add(kind);
  el.innerHTML = html;
}

function showCorrectAnswerWithPinyin(vocab, includeAllOptionsPinyin = false) {
  const correctLine = `<strong>Correct:</strong> ${vocab.chinese} <em>(${vocab.pinyin})</em> — ${vocab.translation}`;

  if (!includeAllOptionsPinyin) return correctLine;

  const optionLines = qCurrentOptions
    .map((o, i) => {
      const v = questionPool.find((x) => x.chinese === o.main) || null;
      const p = v?.pinyin ? ` <em>(${v.pinyin})</em>` : "";
      return `${i + 1}. ${o.main}${p}`;
    })
    .join("<br/>");

  return `${correctLine}<hr style="border:none;border-top:1px solid #ddd;margin:10px 0;" />${optionLines}`;
}

function answerMCQ(chosenIdx) {
  if (qAnswered) return;
  qAnswered = true;

  const vocab = getCurrentVocab();
  const isCorrect = chosenIdx === qCorrectOptionIndex;

  if (isCorrect) qCorrect++;
  else qIncorrect++;

  const prefix = activeMode === "quiz" ? "quiz" : "final";
  const container = $(`${prefix}Options`);
  disableOptionButtons(container, true);

  const showAllPinyin = activeQuizType.includes("character");
  if (isCorrect) {
    setFeedback(prefix, `✅ Correct!<br/>${showCorrectAnswerWithPinyin(vocab, showAllPinyin)}`, "ok");
  } else {
    setFeedback(prefix, `❌ Incorrect.<br/>${showCorrectAnswerWithPinyin(vocab, showAllPinyin)}`, "bad");
  }

  $(`${prefix}NextBtn`).disabled = false;
}

function normalizeAnswer(s) {
  return (s || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function answerFinalTyping() {
  if (qAnswered) return;
  qAnswered = true;

  const vocab = getCurrentVocab();
  const input = normalizeAnswer($("finalPinyinInput").value);

  // NOTE: We can't reliably generate numbered tones from accented pinyin without a mapping,
  // so we accept accented pinyin and a letters-only equivalent.
  const expected = normalizeAnswer(vocab.pinyin);

  const lettersOnlyInput = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9:\s]/g, "");

  const lettersOnlyExpected = expected
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9:\s]/g, "");

  const ok = input === expected || lettersOnlyInput === lettersOnlyExpected;

  if (ok) qCorrect++;
  else qIncorrect++;

  if (ok) {
    setFeedback("final", `✅ Correct!<br/><strong>${vocab.translation}</strong> → ${vocab.chinese} <em>(${vocab.pinyin})</em>`, "ok");
  } else {
    setFeedback("final", `❌ Incorrect.<br/>Correct pinyin: <strong>${vocab.pinyin}</strong><br/>Word: ${vocab.chinese} — ${vocab.translation}`, "bad");
  }

  $("finalSubmitTypingBtn").disabled = true;
  $("finalNextBtn").disabled = false;
}

function finishRun(label, correct, incorrect, returnScreenId) {
  const total = correct + incorrect;
  const acc = total ? Math.round((correct / total) * 100) : 0;
  alert(`${label} complete!\n\nScore: ${correct}/${total} (${acc}%)`);
  showOnlyScreen(returnScreenId);
}

function renderQuestion() {
  qAnswered = false;
  qCurrentOptions = [];
  qCorrectOptionIndex = -1;

  const vocab = getCurrentVocab();

  if (activeMode === "quiz") {
    setProgressUI("quiz", qIndex, questionOrder.length);

    if (activeQuizType === "translation") {
      $("quizPromptMain").textContent = vocab.chinese;
      $("quizPromptSub").textContent = vocab.pinyin;
      $("quizInstructions").textContent = "Choose the correct English meaning. (Press 1–4)";

      const built = buildOptionsForTranslation(vocab);
      qCurrentOptions = built.options;
      qCorrectOptionIndex = built.correctIndex;

      renderOptions("quiz", qCurrentOptions);
      setFeedback("quiz", "Answer to see feedback.", null);
      $("quizNextBtn").disabled = true;
      disableOptionButtons($("quizOptions"), false);
    }

    if (activeQuizType === "character") {
      $("quizPromptMain").textContent = vocab.translation;
      $("quizPromptSub").textContent = "";
      $("quizInstructions").textContent = "Choose the correct Chinese character. (Press 1–4)";

      const built = buildOptionsForCharacter(vocab);
      qCurrentOptions = built.options;
      qCorrectOptionIndex = built.correctIndex;

      renderOptions("quiz", qCurrentOptions);
      setFeedback("quiz", "Answer to see feedback (pinyin will be shown after).", null);
      $("quizNextBtn").disabled = true;
      disableOptionButtons($("quizOptions"), false);
    }
  }

  if (activeMode === "final") {
    setProgressUI("final", qIndex, questionOrder.length);

    $("finalOptions").style.display = "none";
    $("finalTypingArea").style.display = "none";
    $("finalSubmitTypingBtn").disabled = false;
    $("finalNextBtn").disabled = true;

    if (activeQuizType === "final_translation") {
      $("finalPromptMain").textContent = vocab.chinese;
      $("finalPromptSub").textContent = vocab.pinyin;
      $("finalInstructions").textContent = "Choose the correct English meaning. (Press 1–4)";

      const built = buildOptionsForTranslation(vocab);
      qCurrentOptions = built.options;
      qCorrectOptionIndex = built.correctIndex;

      $("finalOptions").style.display = "grid";
      renderOptions("final", qCurrentOptions);
      setFeedback("final", "Answer to see feedback.", null);
      disableOptionButtons($("finalOptions"), false);
    }

    if (activeQuizType === "final_character") {
      $("finalPromptMain").textContent = vocab.translation;
      $("finalPromptSub").textContent = "";
      $("finalInstructions").textContent = "Choose the correct Chinese character. (Press 1–4)";

      const built = buildOptionsForCharacter(vocab);
      qCurrentOptions = built.options;
      qCorrectOptionIndex = built.correctIndex;

      $("finalOptions").style.display = "grid";
      renderOptions("final", qCurrentOptions);
      setFeedback("final", "Answer to see feedback (pinyin will be shown after).", null);
      disableOptionButtons($("finalOptions"), false);
    }

    if (activeQuizType === "final_pinyin") {
      $("finalPromptMain").textContent = vocab.translation;
      $("finalPromptSub").textContent = "";
      $("finalInstructions").textContent = "Type the pinyin. (Enter to submit)";

      $("finalTypingArea").style.display = "block";
      $("finalPinyinInput").value = "";
      setFeedback("final", "Submit to see feedback.", null);
      $("finalPinyinInput").focus();
    }
  }
}

function nextQuestion() {
  const total = questionOrder.length;
  if (qIndex >= total - 1) {
    if (activeMode === "quiz") finishRun("Quiz", qCorrect, qIncorrect, "quizSelectionScreen");
    else finishRun("Final Exam", qCorrect, qIncorrect, "finalExamSelectionScreen");
    return;
  }
  qIndex++;
  renderQuestion();
}

function handleKeydownForChoices(e) {
  const tag = (document.activeElement?.tagName || "").toLowerCase();
  const isTyping = tag === "input" || tag === "textarea";
  if (isTyping) return;
  if (!activeMode) return;

  if (activeMode === "quiz" || activeMode === "final") {
    const n = Number(e.key);
    if (n >= 1 && n <= 4) {
      e.preventDefault();
      answerMCQ(n - 1);
    }
  }
}

/* =========================
   BONUS EXAMS (Sentence typing)
   ========================= */
function startBonus(difficulty) {
  activeMode = "bonus";
  bonusDifficulty = difficulty;

  const templates = bonusSentenceTemplates?.[difficulty] || [];
  bonusPool = templates.slice();
  bonusOrder = Array.from({ length: bonusPool.length }, (_, i) => i);
  shuffleInPlace(bonusOrder);

  bIndex = 0;
  bCorrect = 0;
  bIncorrect = 0;
  bAnswered = false;

  const title = difficulty === "easy" ? "Bonus Exam — Easy"
    : difficulty === "medium" ? "Bonus Exam — Medium"
    : "Bonus Exam — Advanced";
  $("bonusTitle").textContent = title;

  showOnlyScreen("bonusExamScreen");
  renderBonusQuestion();
}

function getBonusItem() {
  const idx = bonusOrder[bIndex];
  return bonusPool[idx];
}

function setBonusProgress() {
  $("bonusCurrent").textContent = String(bIndex + 1);
  $("bonusTotal").textContent = String(bonusOrder.length);
  $("bonusProgressFill").style.width = computeProgress(bIndex, bonusOrder.length) + "%";
}

function bonusPromptText(item) {
  if (item.translation) return `Build a sentence using: "${item.translation}"`;
  if (Array.isArray(item.translations)) {
    return `Build a sentence using: ${item.translations.map((t) => `"${t}"`).join(", ")}`;
  }
  return "Build the sentence";
}

function bonusSubText(item) {
  if (item.word) return `${item.word} (${item.pinyin})`;
  if (Array.isArray(item.words)) return item.words.map((w, i) => `${w} (${item.pinyins?.[i] || ""})`).join("  ·  ");
  return "";
}

function renderBonusQuestion() {
  bAnswered = false;
  const item = getBonusItem();

  setBonusProgress();
  $("bonusPromptMain").textContent = bonusPromptText(item);
  $("bonusPromptSub").textContent = bonusSubText(item);
  $("bonusInstructions").textContent = "Type the sentence. (Chinese or pinyin if accepted)";

  $("bonusInput").value = "";
  $("bonusSubmitBtn").disabled = false;
  $("bonusNextBtn").disabled = true;

  setFeedback("bonus", "Submit to see feedback.", null);
  $("bonusInput").focus();
}

function isAcceptedBonusAnswer(input, acceptedAnswers) {
  const norm = normalizeAnswer(input);
  if (!norm) return false;
  const accepted = (acceptedAnswers || []).map(normalizeAnswer);
  return accepted.includes(norm);
}

function answerBonusTyping() {
  if (bAnswered) return;
  bAnswered = true;

  const item = getBonusItem();
  const input = $("bonusInput").value;

  const ok = isAcceptedBonusAnswer(input, item.acceptedAnswers);

  if (ok) bCorrect++;
  else bIncorrect++;

  const acceptedList = (item.acceptedAnswers || []).slice(0, 8).map((a) => `<li><code>${a}</code></li>`).join("");
  const correctBlock = `
    <div><strong>Target:</strong> ${item.example} <em>(${item.examplePinyin})</em></div>
    <div style="margin-top:6px;"><strong>Accepted answers:</strong><ul style="margin:6px 0 0 18px;">${acceptedList}</ul></div>
  `;

  if (ok) setFeedback("bonus", `✅ Correct!<br/>${correctBlock}`, "ok");
  else setFeedback("bonus", `❌ Incorrect.<br/>${correctBlock}`, "bad");

  $("bonusSubmitBtn").disabled = true;
  $("bonusNextBtn").disabled = false;
}

function nextBonus() {
  if (bIndex >= bonusOrder.length - 1) {
    finishRun("Bonus Exam", bCorrect, bIncorrect, "bonusSelectionScreen");
    return;
  }
  bIndex++;
  renderBonusQuestion();
}

/* =========================
   SETTINGS / SW
   ========================= */
function applyUserSettings() {
  const user = authManager.getCurrentUser();
  if (!user?.settings) return;

  document.body.classList.toggle("dark-mode", !!user.settings.darkMode);
  $("darkModeToggle").checked = !!user.settings.darkMode;

  const fontSize = user.settings.fontSize ?? 16;
  document.body.style.fontSize = fontSize + "px";
  $("fontSizeSlider").value = String(fontSize);
  $("fontSizeDisplay").textContent = fontSize + "px";

  const speed = user.settings.audioSpeed ?? 1;
  $("audioSpeedSelect").value = String(speed);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

/* =========================
   UI WIRING
   ========================= */
function wireUpUI() {
  // Nav
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const section = e.currentTarget.getAttribute("data-section");
      activeMode = null;
      showSection(section);
      if (section === "home") updateHomeScreen();
      if (section === "stats") updateStatsScreen();
    });
  });

  // Home buttons
  $("studyModeBtn").addEventListener("click", () => showSection("study"));

  $("quizModeBtn").addEventListener("click", () => {
    activeMode = null;
    showOnlyScreen("quizSelectionScreen");
  });

  $("bonusModeBtn").addEventListener("click", () => {
    activeMode = null;
    showOnlyScreen("bonusSelectionScreen");
  });

  $("finalModeBtn").addEventListener("click", () => {
    activeMode = null;
    showOnlyScreen("finalExamSelectionScreen");
  });

  // Study selection back
  $("backFromStudySelection").addEventListener("click", () => showSection("home"));

  // Level buttons (study)
  document.querySelectorAll(".study-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => startLevel(e.currentTarget.getAttribute("data-level")));
  });

  // Study screen back
  $("studyBackBtn").addEventListener("click", () => showSection("study"));

  // Flashcard controls
  $("flashcard").addEventListener("click", flipCard);
  $("nextBtn").addEventListener("click", nextCard);
  $("prevBtn").addEventListener("click", previousCard);
  $("shuffleBtn").addEventListener("click", toggleShuffle);
  $("correctBtn").addEventListener("click", markCorrect);
  $("incorrectBtn").addEventListener("click", markIncorrect);

  $("frontAudio").addEventListener("click", (e) => {
    e.stopPropagation();
    speakWord();
  });
  $("backAudio").addEventListener("click", (e) => {
    e.stopPropagation();
    speakSentence();
  });

  // Quiz selection
  buildLevelButtons($("quizLevelGrid"), (levelKey) => {
    quizSelectedLevel = levelKey;
    setSelectedLevelButton($("quizLevelGrid"), quizSelectedLevel);
  });

  $("backFromQuizSelection").addEventListener("click", () => showSection("home"));

  $("quizTypeTranslationBtn").addEventListener("click", () => {
    if (!quizSelectedLevel) return alert("Select a level first.");
    startQuizFlow(quizSelectedLevel, "translation");
  });

  $("quizTypeCharacterBtn").addEventListener("click", () => {
    if (!quizSelectedLevel) return alert("Select a level first.");
    startQuizFlow(quizSelectedLevel, "character");
  });

  $("quizBackBtn").addEventListener("click", () => showOnlyScreen("quizSelectionScreen"));
  $("quizNextBtn").addEventListener("click", () => nextQuestion());

  // Bonus selection
  $("backFromBonusSelection").addEventListener("click", () => showSection("home"));
  $("bonusEasyBtn").addEventListener("click", () => startBonus("easy"));
  $("bonusMediumBtn").addEventListener("click", () => startBonus("medium"));
  $("bonusAdvancedBtn").addEventListener("click", () => startBonus("advanced"));

  // Bonus screen
  $("bonusBackBtn").addEventListener("click", () => showOnlyScreen("bonusSelectionScreen"));
  $("bonusSubmitBtn").addEventListener("click", () => answerBonusTyping());
  $("bonusNextBtn").addEventListener("click", () => nextBonus());
  $("bonusInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      answerBonusTyping();
    }
  });

  // Final exam selection
  $("backFromFinalSelection").addEventListener("click", () => showSection("home"));
  $("finalTranslationBtn").addEventListener("click", () => startFinalExam("final_translation"));
  $("finalCharacterBtn").addEventListener("click", () => startFinalExam("final_character"));
  $("finalPinyinBtn").addEventListener("click", () => startFinalExam("final_pinyin"));

  // Final exam screen
  $("finalBackBtn").addEventListener("click", () => showOnlyScreen("finalExamSelectionScreen"));
  $("finalNextBtn").addEventListener("click", () => nextQuestion());
  $("finalSubmitTypingBtn").addEventListener("click", () => answerFinalTyping());
  $("finalPinyinInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      answerFinalTyping();
    }
  });

  // Settings
  $("darkModeToggle").addEventListener("change", (e) => {
    document.body.classList.toggle("dark-mode", e.target.checked);
    authManager.updateUserSettings({ darkMode: e.target.checked });
  });

  $("fontSizeSlider").addEventListener("input", (e) => {
    const size = Number(e.target.value);
    document.body.style.fontSize = size + "px";
    $("fontSizeDisplay").textContent = size + "px";
    authManager.updateUserSettings({ fontSize: size });
  });

  $("audioSpeedSelect").addEventListener("change", (e) => {
    const speed = Number(e.target.value);
    authManager.updateUserSettings({ audioSpeed: speed });
  });

  $("resetDataBtn").addEventListener("click", () => {
    if (!confirm("Reset your progress?")) return;
    removeUserData("stats");
    statsManager = new StatisticsManager();
    updateHomeScreen();
    updateStatsScreen();
    alert("Reset done.");
  });

  document.addEventListener("keydown", handleKeydownForChoices);
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
