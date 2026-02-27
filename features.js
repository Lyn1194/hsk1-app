class StatisticsManager {
    constructor() {
        this.loadStats();
    }

    loadStats() {
        const saved = getUserData('stats');
        this.stats = saved ? JSON.parse(saved) : {
            wordsLearned: [],
            totalQuizzes: 0,
            totalCorrect: 0,
            totalIncorrect: 0,
            levelStats: {},
            dailyStats: {},
            studyStreak: 0,
            lastStudyDate: null,
            achievements: [],
            totalTimeSpent: 0
        };
        this.initializeLevelStats();
    }

    initializeLevelStats() {
        for (let i = 1; i <= 10; i++) {
            const levelKey = `level${i}`;
            if (!this.stats.levelStats[levelKey]) {
                this.stats.levelStats[levelKey] = {
                    correct: 0,
                    incorrect: 0,
                    accuracy: 0,
                    completed: false
                };
            }
        }
    }

    saveStats() {
        setUserData('stats', JSON.stringify(this.stats));
    }

    recordQuizResult(level, correct, incorrect) {
        const total = correct + incorrect;
        const accuracy = (correct / total) * 100;

        this.stats.totalQuizzes++;
        this.stats.totalCorrect += correct;
        this.stats.totalIncorrect += incorrect;

        if (this.stats.levelStats[level]) {
            this.stats.levelStats[level].correct += correct;
            this.stats.levelStats[level].incorrect += incorrect;
            this.stats.levelStats[level].accuracy = 
                ((this.stats.levelStats[level].correct / 
                (this.stats.levelStats[level].correct + this.stats.levelStats[level].incorrect)) * 100).toFixed(1);
        }

        this.updateDailyStats();
        this.updateStudyStreak();
        this.saveStats();
    }

    updateDailyStats() {
        const today = new Date().toISOString().split('T')[0];
        if (!this.stats.dailyStats[today]) {
            this.stats.dailyStats[today] = { quizzes: 0, accuracy: 0 };
        }
        this.stats.dailyStats[today].quizzes++;
    }

    updateStudyStreak() {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = this.stats.lastStudyDate;

        if (lastDate === today) {
            return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yesterdayStr) {
            this.stats.studyStreak++;
        } else if (lastDate !== today) {
            this.stats.studyStreak = 1;
        }

        this.stats.lastStudyDate = today;
    }

    getOverallAccuracy() {
        const total = this.stats.totalCorrect + this.stats.totalIncorrect;
        if (total === 0) return 0;
        return ((this.stats.totalCorrect / total) * 100).toFixed(1);
    }
}

function getWordOfTheDay() {
    const allVocab = [];
    for (let level in hsk1Vocabulary) {
        for (let word of hsk1Vocabulary[level]) {
            allVocab.push(word);
        }
    }

    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const index = dayOfYear % allVocab.length;

    return allVocab[index];
}
