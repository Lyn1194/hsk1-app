let statsManager;
let currentMode = 'study';
let currentLevel = null;
let currentQueue = [];
let currentIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let isFlipped = false;
let audioSpeed = 1;

function initializeApp() {
    if (!authManager.checkLoggedIn()) {
        return;
    }

    statsManager = new StatisticsManager();
    setupStudyMode();
    updateHomeScreen();

    const user = authManager.getCurrentUser();
    if (user.settings) {
        if (user.settings.darkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkModeToggle').checked = true;
        }
        document.body.style.fontSize = user.settings.fontSize + 'px';
        document.getElementById('fontSizeSlider').value = user.settings.fontSize;
        document.getElementById('audioSpeedSelect').value = user.settings.audioSpeed;
    }
}

function setupStudyMode() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const section = e.currentTarget.getAttribute('data-section');
            showSection(section);
        });
    });

    document.querySelectorAll('.study-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const level = e.currentTarget.getAttribute('data-level');
            startLevel(level);
        });
    });

    document.getElementById('backFromStudySelection').addEventListener('click', () => {
        showSection('home');
    });

    document.getElementById('studyBackBtn').addEventListener('click', () => {
        showSection('study');
    });

    document.getElementById('nextBtn').addEventListener('click', nextCard);
    document.getElementById('prevBtn').addEventListener('click', previousCard);
    document.getElementById('shuffleBtn').addEventListener('click', toggleShuffle);
    document.getElementById('correctBtn').addEventListener('click', markCorrect);
    document.getElementById('incorrectBtn').addEventListener('click', markIncorrect);

    document.getElementById('flashcard').addEventListener('click', flipCard);

    document.getElementById('frontAudio').addEventListener('click', (e) => {
        e.stopPropagation();
        speakWord();
    });

    document.getElementById('backAudio').addEventListener('click', (e) => {
        e.stopPropagation();
        speakSentence();
    });

    document.getElementById('darkModeToggle
