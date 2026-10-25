/**
 * English Battle - Results & Celebration Logic (results.js)
 */
document.addEventListener('DOMContentLoaded', async () => {
    let result = window.Storage ? window.Storage.getLastResult() : null;
    if (!result) {
        const defaultTeams = [
            { id: 1, name: 'الصقور الخضر', color: '#06D6A0', score: 650, correct: 5, wrong: 1 },
            { id: 2, name: 'فرسان طويق', color: '#3A86FF', score: 450, correct: 3, wrong: 2 }
        ];
        const standingsData = ScoringEngine.calculateStandings(defaultTeams);
        result = {
            settings: { stage: 'intermediate', difficulty: 'all', questionCount: 10 },
            teams: defaultTeams, standings: standingsData.standings,
            winner: standingsData.winner, isTie: standingsData.isTie,
            tiedWinners: standingsData.tiedWinners, categoryLeaders: {}, totalQuestions: 10,
            completedAt: new Date().toISOString()
        };
    }

    if (window.SoundManager) window.SoundManager.playVictory();

    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    const updateSoundIcon = () => {
        if (!btnSoundToggle) return;
        const muted = window.Storage ? window.Storage.isMuted() : false;
        btnSoundToggle.innerHTML = muted 
            ? '<i class="fa-solid fa-volume-xmark" style="color: var(--danger-red);"></i>'
            : '<i class="fa-solid fa-volume-high"></i>';
    };
    updateSoundIcon();
    if (btnSoundToggle) {
        btnSoundToggle.onclick = () => {
            if (window.SoundManager) { window.SoundManager.toggleMute(); updateSoundIcon(); }
        };
    }

    // Confetti
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        window.onresize = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; };
        const colors = ['#00F5D4', '#3A86FF', '#FFBE0B', '#FF006E', '#06D6A0', '#8338EC'];
        const particles = [];
        for (let i = 0; i < 120; i++) {
            particles.push({
                x: Math.random() * width, y: Math.random() * height - height,
                size: Math.random() * 9 + 5, color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 3 + 2, speedX: Math.random() * 2 - 1,
                rotation: Math.random() * 360, rotationSpeed: Math.random() * 4 - 2
            });
        }
        let elapsed = 0;
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            elapsed++;
            particles.forEach(p => {
                p.y += p.speedY; p.x += p.speedX; p.rotation += p.rotationSpeed;
                if (p.y > height && elapsed < 300) { p.y = -20; p.x = Math.random() * width; }
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            });
            if (elapsed < 450) requestAnimationFrame(animate); else ctx.clearRect(0, 0, width, height);
        };
        animate();
    }

    const winnerAnnouncement = document.getElementById('winner-announcement');
    const winnerSubtitle = document.getElementById('winner-subtitle');
    if (result.isTie && result.tiedWinners) {
        const tiedNames = result.tiedWinners.map(t => `<span style="color: ${t.color};">${t.name}</span>`).join(' و ');
        winnerAnnouncement.innerHTML = `🤝 تعادل مشرف بين: ${tiedNames}!`;
        winnerSubtitle.textContent = `قدمت الفرق أداءً متكافئاً وتنافساً استثنائياً برصيد ${result.tiedWinners[0].score} نقطة!`;
    } else if (result.winner) {
        winnerAnnouncement.innerHTML = `🏆 مبارك الفوز لفريق <span style="color: ${result.winner.color};">${result.winner.name}</span>!`;
        winnerSubtitle.textContent = `حصد المركز الأول برصيد ${result.winner.score} نقطة!`;
    }

    const podiumSection = document.getElementById('podium-section');
    if (podiumSection && result.standings) {
        const medals = ['🥇 المركز الأول', '🥈 المركز الثاني', '🥉 المركز الثالث', '🎖️ المركز الرابع'];
        const rankClasses = ['first-place', 'second-place', 'third-place', 'fourth-place'];
        podiumSection.innerHTML = result.standings.slice(0, 4).map((team, idx) => `
            <div class="podium-place ${rankClasses[team.rank - 1] || ''}">
                <div style="font-weight: 800; font-size: 1.15rem; color: var(--accent-gold);">${medals[team.rank - 1] || ''}</div>
                <div style="width: 20px; height: 6px; background: ${team.color}; border-radius: 3px;"></div>
                <div style="font-size: 1.35rem; font-weight: 900; color: #1e293b;">${team.name}</div>
                <div class="podium-score">${team.score} <span style="font-size: 1rem; color: var(--text-muted);">pts</span></div>
                <div style="font-size: 0.9rem; color: var(--text-secondary);">صحيح: <strong style="color: var(--success-green);">${team.correct}</strong> | خطأ: <strong style="color: var(--danger-red);">${team.wrong}</strong></div>
            </div>
        `).join('');
    }

    const tableBody = document.getElementById('stats-table-body');
    if (tableBody && result.standings) {
        tableBody.innerHTML = result.standings.map(team => {
            const total = (team.correct || 0) + (team.wrong || 0);
            const accuracy = total > 0 ? Math.round((team.correct / total) * 100) : 0;
            return `
                <tr>
                    <td style="font-weight: 800; color: var(--accent-gold);">#${team.rank}</td>
                    <td style="font-weight: 700;"><span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${team.color}; margin-left: 0.4rem;"></span>${team.name}</td>
                    <td style="font-family: var(--font-en); font-weight: 900; color: var(--accent-gold);">${team.score}</td>
                    <td style="color: var(--success-green); font-weight: 800;">${team.correct}</td>
                    <td style="color: var(--danger-red); font-weight: 800;">${team.wrong}</td>
                    <td style="font-family: var(--font-en); font-weight: 700;">${accuracy}%</td>
                </tr>
            `;
        }).join('');
    }

    const categoryLeadersCard = document.getElementById('category-leaders-card');
    const categoryLeadersGrid = document.getElementById('category-leaders-grid');
    if (result.categoryLeaders && Object.keys(result.categoryLeaders).length > 0) {
        const catMeta = {
            word_meaning: { title: 'أبطال معاني الكلمات', icon: 'fa-book-open', color: '#3A86FF' },
            sentence_meaning: { title: 'فرسان معاني الجمل', icon: 'fa-comment-dots', color: '#8338EC' },
            grammar: { title: 'عباقرة القواعد النحوية', icon: 'fa-spell-check', color: '#FF006E' },
            fill_blank: { title: 'متصدرو إكمال الفراغ', icon: 'fa-pen-to-square', color: '#FB5607' },
            word_scramble: { title: 'سادة ترتيب الحروف', icon: 'fa-cubes-stacked', color: '#FFBE0B' },
            sentence_builder: { title: 'مهندسو بناء الجمل', icon: 'fa-puzzle-piece', color: '#06D6A0' },
            true_false: { title: 'أسرع بديهة (صح وخطأ)', icon: 'fa-check-double', color: '#118AB2' },
            guess_word: { title: 'محققو خمن الكلمة', icon: 'fa-magnifying-glass', color: '#00F5D4' }
        };
        const items = [];
        Object.keys(result.categoryLeaders).forEach(type => {
            const item = result.categoryLeaders[type];
            const meta = catMeta[type] || { title: type, icon: 'fa-award', color: '#00F5D4' };
            if (item && item.team) {
                items.push(`
                    <div style="background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; text-align: center;">
                        <div style="font-size: 1.5rem; color: ${meta.color}; margin-bottom: 0.4rem;"><i class="fa-solid ${meta.icon}"></i></div>
                        <div style="font-weight: 800; font-size: 0.95rem;">${meta.title}</div>
                        <div style="font-weight: 800; color: ${item.team.color};">${item.team.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-en);">${item.points} pts</div>
                    </div>
                `);
            }
        });
        if (items.length > 0) {
            categoryLeadersCard.style.display = 'block';
            categoryLeadersGrid.innerHTML = items.join('');
        }
    }

    const replayBtn = document.getElementById('btn-replay-same');
    if (replayBtn) {
        replayBtn.onclick = async () => {
            replayBtn.disabled = true;
            const settings = result.settings || (window.Storage ? window.Storage.getSettings() : {});
            const resetTeams = (result.teams || []).map(t => ({ id: t.id, name: t.name, color: t.color, score: 0, correct: 0, wrong: 0 }));
            const matchData = await QuestionBank.getMatchQuestions(settings);
            if (window.Storage) {
                window.Storage.saveActiveMatch({
                    settings, teams: resetTeams, questions: matchData.questions || [],
                    currentIndex: 0, answeredLog: [], isFinished: false, startedAt: new Date().toISOString()
                });
                window.Storage.saveTeams(resetTeams);
            }
            window.location.href = 'game.html';
        };
    }
});
