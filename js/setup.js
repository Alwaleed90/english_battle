/**
 * English Battle - Kids Edition Setup Logic (setup.js)
 */
document.addEventListener('DOMContentLoaded', async () => {
    function showToast(msg) {
        let el = document.getElementById('setup-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'setup-toast';
            el.className = 'toast';
            el.style.position = 'fixed'; el.style.bottom = '2rem'; el.style.left = '2rem'; el.style.zIndex = '9999';
            document.body.appendChild(el);
        }
        el.innerHTML = '<i class="fa-solid fa-star" style="color:#f59e0b;"></i> <span>' + msg + '</span>';
        el.style.opacity = '1';
        setTimeout(() => { el.style.opacity = '0'; }, 3500);
    }

    const form = document.getElementById('setup-form');
    const teamCountSelect = document.getElementById('team-count-select');
    const teamsContainer = document.getElementById('teams-container');

    const defaultTeamPresets = [
        { name: '🦁 الأسود الشجاعة', color: '#FF6B6B' },
        { name: '🚀 صواريخ الفضاء', color: '#0EA5E9' },
        { name: '🦖 الأبطال الخارقون', color: '#10B981' },
        { name: '🌟 نجوم المستقبل', color: '#F59E0B' }
    ];

    const savedSettings = window.Storage ? window.Storage.getSettings() : {};
    const savedTeams = window.Storage ? window.Storage.getTeams() : [];

    if (savedSettings.stage) {
        const stageInput = document.querySelector(`input[name="stage"][value="${savedSettings.stage}"]`);
        if (stageInput) stageInput.checked = true;
    }
    if (savedSettings.difficulty) {
        const diffInput = document.querySelector(`input[name="difficulty"][value="${savedSettings.difficulty}"]`);
        if (diffInput) diffInput.checked = true;
    }
    if (savedSettings.questionCount) {
        const qCountSelect = document.getElementById('question-count-select');
        if (qCountSelect) qCountSelect.value = String(savedSettings.questionCount);
    }
    if (savedSettings.timePerQuestion !== undefined) {
        const timeSelect = document.getElementById('time-duration-select');
        if (timeSelect) timeSelect.value = String(savedSettings.timePerQuestion);
    }
    if (savedSettings.speedBonus !== undefined) {
        const speedToggle = document.getElementById('speed-bonus-toggle');
        if (speedToggle) speedToggle.checked = !!savedSettings.speedBonus;
    }

    const renderTeamInputs = (count) => {
        if (!teamsContainer) return;
        teamsContainer.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const preset = defaultTeamPresets[i] || { name: `الفريق ${i + 1}`, color: '#0EA5E9' };
            const existing = (savedTeams && savedTeams[i]) ? savedTeams[i] : preset;
            const card = document.createElement('div');
            card.className = 'team-config-card';
            card.style.setProperty('--team-border-color', existing.color || preset.color);
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 900; font-size: 1.1rem; color: #1e293b;">
                        🎨 الفريق ${i + 1}
                    </span>
                    <input type="color" class="team-color-picker" data-index="${i}" value="${existing.color || preset.color}" style="cursor: pointer; border: none; width: 36px; height: 36px; border-radius: 50%; background: none;">
                </div>
                <div class="form-group" style="margin-top: 0.5rem;">
                    <label class="form-label">اسم الفريق البطل:</label>
                    <input type="text" class="form-input team-name-input" data-index="${i}" value="${existing.name || preset.name}" required maxlength="30">
                </div>
            `;
            teamsContainer.appendChild(card);
        }
    };

    const initialTeamCount = savedTeams && savedTeams.length >= 2 ? savedTeams.length : 2;
    if (teamCountSelect) {
        teamCountSelect.value = String(initialTeamCount);
        renderTeamInputs(initialTeamCount);
        teamCountSelect.addEventListener('change', (e) => {
            renderTeamInputs(parseInt(e.target.value, 10));
        });
    }

    const selectAllBtn = document.getElementById('btn-select-all-cats');
    const deselectAllBtn = document.getElementById('btn-deselect-all-cats');
    if (selectAllBtn) selectAllBtn.onclick = () => document.querySelectorAll('input[name="categories"]').forEach(cb => cb.checked = true);
    if (deselectAllBtn) deselectAllBtn.onclick = () => document.querySelectorAll('input[name="categories"]').forEach(cb => cb.checked = false);

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const stage = document.querySelector('input[name="stage"]:checked')?.value || 'primary';
            const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'all';
            const selectedCategories = Array.from(document.querySelectorAll('input[name="categories"]:checked')).map(cb => cb.value);
            if (selectedCategories.length === 0) {
                showToast('يا بطل! اختر تحدياً واحداً على الأقل لنبدأ اللعب 🌟');
                return;
            }
            const questionCount = parseInt(document.getElementById('question-count-select')?.value || '10', 10);
            const timePerQuestion = parseInt(document.getElementById('time-duration-select')?.value || '30', 10);
            const speedBonus = !!document.getElementById('speed-bonus-toggle')?.checked;

            const teamCards = document.querySelectorAll('.team-config-card');
            const teams = [];
            teamCards.forEach((card, idx) => {
                const name = card.querySelector('.team-name-input')?.value.trim() || `الفريق ${idx + 1}`;
                const color = card.querySelector('.team-color-picker')?.value || defaultTeamPresets[idx].color;
                teams.push({ id: idx + 1, name, color, score: 0, correct: 0, wrong: 0 });
            });

            const settings = {
                stage, difficulty, categories: selectedCategories, questionCount, timePerQuestion, speedBonus,
                points: {
                    easy: parseInt(document.getElementById('pts-easy')?.value || '100', 10),
                    medium: parseInt(document.getElementById('pts-medium')?.value || '150', 10),
                    hard: parseInt(document.getElementById('pts-hard')?.value || '200', 10)
                }
            };

            const matchData = await QuestionBank.getMatchQuestions(settings);
            if (!matchData.questions || matchData.questions.length === 0) {
                showToast('عذراً! جرب اختيار تحديات إضافية لنبدأ اللعب.');
                return;
            }

            if (window.Storage) {
                window.Storage.saveSettings(settings);
                window.Storage.saveTeams(teams);
                window.Storage.saveActiveMatch({
                    settings, teams, questions: matchData.questions,
                    currentIndex: 0, answeredLog: [], isFinished: false, startedAt: new Date().toISOString()
                });
            }
            window.location.href = 'game.html';
        });
    }
});
