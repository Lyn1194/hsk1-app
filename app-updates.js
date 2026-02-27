// Add to your FlashcardApp constructor
constructor() {
    // ... existing code ...
    this.statsManager = new StatisticsManager();
    this.spacedRepetition = new SpacedRepetition();
    this.strokePractice = null;
    this.timedChallenge = null;
    
    this.setupNewFeatures();
}

setupNewFeatures() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const section = e.currentTarget.getAttribute('data-section');
            this.showSection(section);
        });
    });

    // Home screen buttons
    document.getElementById('studyWODBtn').addEventListener('click', () => {
        const wod = getWordOfTheDay();
        // Study this specific word
    });

    document.getElementById('studyModeBtn').addEventListener('click', () => {
        this.showSection('study');
    });

    document.getElementById('quizModeBtn').addEventListener('click', () => {
        this.showSection('quiz');
    });

    document.getElementById('bonusModeBtn').addEventListener('click', () => {
        this.showSection('bonus');
    });

    document.getElementById('finalModeBtn').addEventListener('click', () => {
        this.showSection('final');
    });

    document.getElementById('timedChallengeBtn').addEventListener('click', () => {
        this.startTimedChallenge();
    });

    document.getElementById('strokePracticeBtn').addEventListener('click', () => {
        this.showSection('strokes');
        this.strokePractice = new StrokePractice();
    });

    // Settings
    document.getElementById('darkModeToggle').addEventListener('change', (e) => {
        document.body.classList.toggle('dark-mode', e.target.checked);
        localStorage.setItem('darkMode', e.target.checked);
    });

    document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
        const size = e.target.value;
        document.body.style.fontSize = size + 'px';
        document.getElementById('fontSizeDisplay').textContent = size + 'px';
        localStorage.setItem('fontSize', size);
    });

    document.getElementById('audioSpeedSelect').addEventListener('change', (e) => {
        this.audioSpeed = parseFloat(e.target.value);
        localStorage.setItem('audioSpeed', this.audioSpeed);
    });

    document.getElementById('exportDataBtn').addEventListener('click', exportProgress);
    document.getElementById('importDataBtn').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => importProgress(e.target.files[0]);
        input.click();
    });

    document.getElementById('resetDataBtn').addEventListener('click', resetAllData);

    this.loadSettings();
    this.updateHomeScreen();
}

showSection(section) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

    const sectionMap = {
        'home': 'homeScreen',
        'stats': 'statsScreen',
        'study': 'studySelectionScreen',
        'strokes': 'strokePracticeScreen',
        'settings': 'settingsScreen'
    };

    if (sectionMap[section]) {
        document.getElementById(sectionMap[section]).classList.add('active');
    }

    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
}

updateHomeScreen() {
    const wod = getWordOfTheDay();
    document.getElementById('wordOfDayChinese').textContent = wod.chinese;
    document.getElementById('wordOfDayPinyin').textContent = wod.pinyin;
    document.getElementById('wordOfDayTranslation').textContent = wod.translation;

    // Update stats
    const stats = this.statsManager.stats;
    document.getElementById('totalWordsLearned').textContent = stats.wordsLearned.length;
    document.getElementById('currentStreak').textContent = stats.studyStreak;
    document.getElementById('overallAccuracy').textContent = this.statsManager.getOverallAccuracy() + '%';

    // Update achievements
    this.renderAchievements();
}

renderAchievements() {
    const achievementsList = [
        { id: 'beginner', name: 'Beginner', icon: '🏅' },
        { id: 'intermediate', name: 'Intermediate', icon: '🥈' },
        { id: 'master', name: 'Master', icon: '🏆' },
        { id: 'dedicated', name: 'Dedicated Learner', icon: '🔥' },
        { id: 'speed_demon', name: 'Speed Demon', icon: '⚡' }
    ];

    const container = document.getElementById('achievementsGrid');
    container.innerHTML = achievementsList.map(achievement => `
        <div class="achievement-badge ${this.statsManager.stats.achievements.includes(achievement.id) ? 'unlocked' : ''}">
            <span class="achievement-icon">${achievement.icon}</span>
            <span class="achievement-name">${achievement.name}</span>
        </div>
    `).join('');
}

loadSettings() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    }

    const fontSize = localStorage.getItem('fontSize') || '16';
    document.body.style.fontSize = fontSize + 'px';
    document.getElementById('fontSizeSlider').value = fontSize;
    document.getElementById('fontSizeDisplay').textContent = fontSize + 'px';

    const audioSpeed = localStorage.getItem('audioSpeed') || '1';
    this.audioSpeed = parseFloat(audioSpeed);
    document.getElementById('audioSpeedSelect').value = audioSpeed;
}

startTimedChallenge() {
    this.timedChallenge = new TimedChallenge();
    this.showSection('timed');
    this.timedChallenge.startChallenge();
}
