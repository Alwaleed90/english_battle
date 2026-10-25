/**
 * English Battle - Home Page Logic (app.js)
 */
document.addEventListener('DOMContentLoaded', () => {
    const soundBtn = document.getElementById('btn-sound-toggle');
    const updateSoundIcon = () => {
        if (!soundBtn) return;
        const muted = window.Storage ? window.Storage.isMuted() : false;
        soundBtn.innerHTML = muted 
            ? '<i class="fa-solid fa-volume-xmark" style="color: var(--danger-red);"></i>'
            : '<i class="fa-solid fa-volume-high"></i>';
    };
    updateSoundIcon();

    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            if (window.SoundManager) {
                window.SoundManager.toggleMute();
                updateSoundIcon();
            }
        });
    }

    const setupModal = (btnId, modalId) => {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        if (btn && modal) btn.addEventListener('click', () => modal.classList.add('active'));
    };

    setupModal('btn-how-to-play', 'modal-how-to-play');
    setupModal('btn-quick-rules', 'modal-how-to-play');
    setupModal('btn-view-history', 'modal-history');

    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close');
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.remove('active');
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });

    const lastResultContainer = document.getElementById('last-result-container');
    if (lastResultContainer && window.Storage) {
        const lastResult = window.Storage.getLastResult();
        if (lastResult) {
            const winner = lastResult.winner || (lastResult.tiedWinners && lastResult.tiedWinners[0]);
            const isTie = lastResult.isTie;
            lastResultContainer.style.display = 'block';
            lastResultContainer.innerHTML = `
                <div class="last-match-card">
                    <div class="last-match-header">
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                            <i class="fa-solid fa-clock-rotate-left text-gold" style="font-size: 1.3rem;"></i>
                            <h3 style="font-size: 1.15rem; font-weight: 800;">آخر مسابقة تم تسجيلها</h3>
                        </div>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">${lastResult.formattedDate || ''}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.2rem;">الفريق الفائز:</div>
                            <div style="font-size: 1.35rem; font-weight: 800; color: ${winner ? winner.color : '#00f5d4'};">
                                ${isTie ? '🤝 تعادل: ' + lastResult.tiedWinners.map(t => t.name).join(' و ') : '🏆 ' + (winner ? winner.name : 'فريق')}
                            </div>
                        </div>
                        <div style="display: flex; gap: 1.2rem; align-items: center;">
                            <div>
                                <span style="font-size: 0.85rem; color: var(--text-muted); display: block;">النقاط</span>
                                <span style="font-size: 1.5rem; font-weight: 900; font-family: var(--font-en); color: var(--accent-gold);">${winner ? winner.score : 0}</span>
                            </div>
                            <a href="results.html" class="btn btn-secondary btn-sm">
                                <i class="fa-solid fa-square-poll-vertical"></i> تفاصيل النتيجة
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    const renderHistory = () => {
        const historyContainer = document.getElementById('history-list-container');
        if (!historyContainer || !window.Storage) return;
        const history = window.Storage.getHistory();
        if (history.length === 0) {
            historyContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">لا توجد مسابقات مسجلة حتى الآن.</div>';
            return;
        }
        historyContainer.innerHTML = history.map(item => {
            const winner = item.winner || (item.tiedWinners ? item.tiedWinners[0] : null);
            return `
                <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem 1.25rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 800; font-size: 1.05rem; color: ${winner ? winner.color : '#1e293b'};">
                            ${item.isTie ? '🤝 تعادل' : '🏆 الفائز: ' + (winner ? winner.name : 'فريق')}
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${item.formattedDate} | أسئلة: ${item.totalQuestions || 0}</div>
                    </div>
                    <div style="font-family: var(--font-en); font-size: 1.25rem; font-weight: 900; color: var(--accent-gold);">
                        ${winner ? winner.score : 0} pts
                    </div>
                </div>
            `;
        }).join('');
    };

    const historyBtn = document.getElementById('btn-view-history');
    if (historyBtn) historyBtn.addEventListener('click', renderHistory);

    const clearHistoryBtn = document.getElementById('btn-clear-history');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (window.Storage) {
                window.Storage.clearHistory();
                renderHistory();
                if (lastResultContainer) lastResultContainer.style.display = 'none';
            }
        });
    }
});
