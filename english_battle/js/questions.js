/**
 * English Battle - Question Bank Loader
 */
const QuestionBank = {
    cachedQuestions: null,
    cachedCategories: null,
    async loadCategories() {
        if (this.cachedCategories) return this.cachedCategories;
        if (window.ENGLISH_BATTLE_CATEGORIES) {
            this.cachedCategories = window.ENGLISH_BATTLE_CATEGORIES;
            return this.cachedCategories;
        }
        try {
            const res = await fetch('data/categories.json');
            if (res.ok) {
                this.cachedCategories = await res.json();
                return this.cachedCategories;
            }
        } catch (e) {}
        return [];
    },
    async loadQuestions() {
        if (this.cachedQuestions) return this.cachedQuestions;
        if (window.ENGLISH_BATTLE_QUESTIONS) {
            this.cachedQuestions = window.ENGLISH_BATTLE_QUESTIONS;
            return this.cachedQuestions;
        }
        try {
            const res = await fetch('data/questions.json');
            if (res.ok) {
                this.cachedQuestions = await res.json();
                return this.cachedQuestions;
            }
        } catch (e) {}
        return [];
    },
    shuffle(array) {
        const copy = [...array];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    },
    async getMatchQuestions(settings) {
        const allQuestions = await this.loadQuestions();
        if (!allQuestions || allQuestions.length === 0) return { error: 'لا توجد أسئلة متاحة.' };
        const stage = settings.stage || 'all';
        const difficulty = settings.difficulty || 'all';
        const selectedCategories = settings.categories || [];
        const count = settings.questionCount || 10;

        let filtered = allQuestions.filter(q => {
            if (!q.id || !q.question || !q.correct_answer) return false;
            if (stage !== 'all' && q.stage && q.stage !== stage) return false;
            if (difficulty !== 'all' && q.difficulty && q.difficulty !== difficulty) return false;
            if (selectedCategories.length > 0 && !selectedCategories.includes(q.type)) return false;
            return true;
        });

        if (filtered.length < count) {
            filtered = allQuestions.filter(q => {
                if (selectedCategories.length > 0 && !selectedCategories.includes(q.type)) return false;
                return true;
            });
        }
        if (filtered.length === 0) filtered = [...allQuestions];

        const shuffled = this.shuffle(filtered);
        const uniqueSet = new Set();
        const finalQuestions = [];
        for (const q of shuffled) {
            if (!uniqueSet.has(q.id)) {
                uniqueSet.add(q.id);
                const prepared = { ...q };
                if (prepared.options && Array.isArray(prepared.options) && prepared.type !== 'true_false') {
                    prepared.options = this.shuffle(prepared.options);
                }
                finalQuestions.push(prepared);
            }
            if (finalQuestions.length >= count) break;
        }
        return { questions: finalQuestions, totalAvailable: filtered.length };
    }
};
window.QuestionBank = QuestionBank;
