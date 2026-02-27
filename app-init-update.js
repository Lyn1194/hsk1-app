// At the top of app.js, modify the initialization

let statsManager;
let spacedRepetition;
let strokePractice = null;
let timedChallenge = null;

function initializeApp() {
    // Only initialize if user is logged in
    if (!authManager.checkLoggedIn()) {
        return;
    }

    // Initialize managers with user-specific data
    statsManager = new StatisticsManager();
    spacedRepetition = new SpacedRepetition();

    setupNewFeatures();
    updateHomeScreen();

    // Load user settings
    const user = authManager.getCurrentUser();
    if (user.settings) {
        if (user.settings.darkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkModeToggle').checked = true;
        }
        document.body.style.fontSize = user.settings.fontSize + 'px';
        document.getElementById('fontSizeSlider').value = user.settings.fontSize;
        document.getElementById('audioSpeedSelect').value = user.settings.audioSpeed;
        document.getElementById('autoplayAudio').checked = user.settings.autoplayAudio;
    }
}

function setupNewFeatures() {
    // ... existing setup code ...
    
    // Update settings change handlers to save to auth manager
    document.getElementById('darkModeToggle').addEventListener('change', (e) => {
        document.body.classList.toggle('dark-mode', e.target.checked);
        authManager.updateUserSettings({ darkMode: e.target.checked });
    });

    document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
        const size = e.target.value;
        document.body.style.fontSize = size + 'px';
        document.getElementById('fontSizeDisplay').textContent = size + 'px';
        authManager.updateUserSettings({ fontSize: parseInt(size) });
    });

    document.getElementById('audioSpeedSelect').addEventListener('change', (e) => {
        audioSpeed = parseFloat(e.target.value);
        authManager.updateUserSettings({ audioSpeed: audioSpeed });
    });

    document.getElementById('autoplayAudio').addEventListener('change', (e) => {
        authManager.updateUserSettings({ autoplayAudio: e.target.checked });
    });
}
