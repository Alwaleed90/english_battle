/**
 * English Battle - Kids Edition Storage Module
 */
const Storage = {
    KEYS: {
        SETTINGS: 'eb_kids_settings',
        TEAMS: 'eb_kids_teams',
        ACTIVE_MATCH: 'eb_kids_active_match',
        HISTORY: 'eb_kids_history',
        SOUND_MUTED: 'eb_kids_sound_muted'
    },
    DEFAULT_SETTINGS: {
        stage: 'primary',
        difficulty: 'all',
        questionCount: 10,
        timePerQuestion: 30,
        points: { easy: 100, medium: 150, hard: 200 },
        speedBonus: true,
        categories: ['word_meaning', 'sentence_meaning', 'grammar', 'fill_blank', 'word_scramble', 'sentence_builder', 'true_false', 'guess_word']
    },
    DEFAULT_TEAMS: [
        { id: 1, name: '🦁 الأسود الشجاعة', color: '#FF6B6B', score: 0, correct: 0, wrong: 0 },
        { id: 2, name: '🚀 صواريخ الفضاء', color: '#0EA5E9', score: 0, correct: 0, wrong: 0 }
    ],
    isSupported() {
        try {
            const testKey = '__eb_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    },
    memoryStore: {},
    setItem(key, value) {
        const json = JSON.stringify(value);
        if (this.isSupported()) {
            try { localStorage.setItem(key, json); } catch (e) { this.memoryStore[key] = json; }
        } else {
            this.memoryStore[key] = json;
        }
    },
    getItem(key, defaultValue = null) {
        if (this.isSupported()) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) { return defaultValue; }
        } else {
            const item = this.memoryStore[key];
            return item ? JSON.parse(item) : defaultValue;
        }
    },
    removeItem(key) {
        if (this.isSupported()) {
            try { localStorage.removeItem(key); } catch (e) {}
        }
        delete this.memoryStore[key];
    },
    getSettings() { return this.getItem(this.KEYS.SETTINGS, this.DEFAULT_SETTINGS); },
    saveSettings(settings) { this.setItem(this.KEYS.SETTINGS, { ...this.DEFAULT_SETTINGS, ...settings }); },
    getTeams() { return this.getItem(this.KEYS.TEAMS, this.DEFAULT_TEAMS); },
    saveTeams(teams) { this.setItem(this.KEYS.TEAMS, teams); },
    getActiveMatch() { return this.getItem(this.KEYS.ACTIVE_MATCH, null); },
    saveActiveMatch(state) { this.setItem(this.KEYS.ACTIVE_MATCH, state); },
    clearActiveMatch() { this.removeItem(this.KEYS.ACTIVE_MATCH); },
    getHistory() { return this.getItem(this.KEYS.HISTORY, []); },
    saveMatchResult(result) {
        const history = this.getHistory();
        const record = {
            id: 'match_' + Date.now(),
            date: new Date().toISOString(),
            formattedDate: new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            ...result
        };
        history.unshift(record);
        if (history.length > 20) history.pop();
        this.setItem(this.KEYS.HISTORY, history);
        return record;
    },
    getLastResult() {
        const history = this.getHistory();
        return history.length > 0 ? history[0] : null;
    },
    clearHistory() { this.removeItem(this.KEYS.HISTORY); },
    isMuted() { return this.getItem(this.KEYS.SOUND_MUTED, false); },
    setMuted(muted) { this.setItem(this.KEYS.SOUND_MUTED, !!muted); }
};
window.Storage = Storage;
