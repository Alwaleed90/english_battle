/**
 * English Battle - Kids Edition Self-Running Game Engine (game.js)
 * Automatic turn rotation, instant answer verification, automatic scoring, fun animations
 */
document.addEventListener('DOMContentLoaded', async () => {
    let matchState = window.Storage ? window.Storage.getActiveMatch() : null;
    if (!matchState || !matchState.questions || matchState.questions.length === 0) {
        const defSettings = window.Storage ? window.Storage.getSettings() : { stage: 'primary', difficulty: 'all', questionCount: 10, timePerQuestion: 30, speedBonus: true };
        const defTeams = [
            { id: 1, name: '🦁 الأسود الشجاعة', color: '#FF6B6B', score: 0, correct: 0, wrong: 0 },
            { id: 2, name: '🚀 صواريخ الفضاء', color: '#0EA5E9', score: 0, correct: 0, wrong: 0 }
        ];
        const matchData = await QuestionBank.getMatchQuestions(defSettings);
        matchState = {
            settings: defSettings, teams: defTeams, questions: matchData.questions || [],
            currentIndex: 0, answeredLog: [], isFinished: false, startedAt: new Date().toISOString()
        };
        if (window.Storage) window.Storage.saveActiveMatch(matchState);
    }

    let currentQ = matchState.questions[matchState.currentIndex];
    let activeTeamId = matchState.teams[matchState.currentIndex % matchState.teams.length].id;
    let isQuestionDone = false;
    let questionElapsedSeconds = 0;

    const scoreboardBar = document.getElementById('scoreboard-bar');
    const turnBannerText = document.getElementById('turn-banner-text');
    const qCounter = document.getElementById('q-counter');
    const qCategory = document.getElementById('q-category');
    const qDifficulty = document.getElementById('q-difficulty');
    const qPoints = document.getElementById('q-points');
    const speedBonusBadge = document.getElementById('speed-bonus-badge');
    const timerCircle = document.getElementById('timer-circle');
    const timerDisplay = document.getElementById('timer-display');
    const timerProgress = document.getElementById('timer-progress');
    const questionText = document.getElementById('question-text');
    const questionSubhint = document.getElementById('question-subhint');
    const challengeArena = document.getElementById('challenge-arena');
    const explanationBox = document.getElementById('explanation-box');
    const explanationTitle = document.getElementById('explanation-title');
    const explanationText = document.getElementById('explanation-text');
    const btnNextQuestion = document.getElementById('btn-next-question');
    const btnSkipQuestion = document.getElementById('btn-skip-question');
    const btnPauseTimer = document.getElementById('btn-pause-timer');
    const pauseBtnText = document.getElementById('pause-btn-text');
    const btnEndMatch = document.getElementById('btn-end-match');
    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    const toastContainer = document.getElementById('toast-container');

    const updateSoundIcon = () => {
        if (!btnSoundToggle) return;
        const muted = window.Storage ? window.Storage.isMuted() : false;
        btnSoundToggle.innerHTML = muted 
            ? '<i class="fa-solid fa-volume-xmark" style="color: var(--danger-red);"></i>'
            : '<i class="fa-solid fa-volume-high"></i>';
    };
    updateSoundIcon();
    if (btnSoundToggle) {
        btnSoundToggle.addEventListener('click', () => {
            if (window.SoundManager) { window.SoundManager.toggleMute(); updateSoundIcon(); }
        });
    }

    const showToast = (message, icon = 'fa-star', color = '#f59e0b') => {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fa-solid ${icon}" style="color: ${color}; font-size: 1.4rem;"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
    };

    const timer = new QuizTimer(matchState.settings.timePerQuestion, {
        onTick: (remaining, percentage) => {
            if (remaining === Infinity) {
                timerDisplay.textContent = '∞';
                timerProgress.style.strokeDashoffset = '0';
            } else {
                timerDisplay.textContent = remaining;
                timerProgress.style.strokeDashoffset = 263.89 - (percentage / 100) * 263.89;
                questionElapsedSeconds = matchState.settings.timePerQuestion - remaining;
                if (matchState.settings.speedBonus && matchState.settings.timePerQuestion > 0) {
                    if (questionElapsedSeconds <= matchState.settings.timePerQuestion * 0.3) {
                        speedBonusBadge.style.display = 'inline-flex';
                    } else {
                        speedBonusBadge.style.display = 'none';
                    }
                }
            }
        },
        onWarning: () => timerCircle.classList.add('warning'),
        onExpire: () => {
            timerCircle.classList.remove('warning');
            handleAnswerSubmitted(null, true);
        },
        onStateChange: (state) => {
            if (pauseBtnText) pauseBtnText.textContent = state.isPaused ? 'أكمل اللعب' : 'استراحة';
            if (btnPauseTimer) btnPauseTimer.innerHTML = state.isPaused ? '<i class="fa-solid fa-play"></i> أكمل اللعب' : '<i class="fa-solid fa-pause"></i> استراحة';
        }
    });

    const renderScoreboard = () => {
        if (!scoreboardBar) return;
        scoreboardBar.innerHTML = matchState.teams.map(team => `
            <div class="team-score-card ${team.id === activeTeamId ? 'active-answering' : ''}" data-team-id="${team.id}" style="--team-color: ${team.color};">
                <div class="team-info">
                    <div class="team-name" style="color: ${team.color};">${team.name}</div>
                    <div class="team-stats">🌟 صح: ${team.correct} | ❌ خطأ: ${team.wrong}</div>
                </div>
                <div class="team-score-val">${team.score}</div>
            </div>
        `).join('');

        const activeTeam = matchState.teams.find(t => t.id === activeTeamId);
        if (turnBannerText && activeTeam) {
            turnBannerText.innerHTML = `🎯 دور فريق: <span style="color: ${activeTeam.color}; text-decoration: underline;">${activeTeam.name}</span> — اختر الإجابة الصحيحة!`;
        }

        document.querySelectorAll('[data-team-id]').forEach(el => {
            el.addEventListener('click', () => {
                if (isQuestionDone) return;
                activeTeamId = parseInt(el.getAttribute('data-team-id'), 10);
                renderScoreboard();
            });
        });
    };

    const handleAnswerSubmitted = (submittedValue, isTimeout = false) => {
        if (isQuestionDone) return;
        isQuestionDone = true;
        timer.stop();

        const activeTeam = matchState.teams.find(t => t.id === activeTeamId);
        const normSubmitted = (submittedValue || '').trim().toLowerCase();
        const normCorrect = (currentQ.correct_answer || currentQ.target_word || '').trim().toLowerCase();
        const isCorrect = !isTimeout && (normSubmitted === normCorrect);

        // Highlight options if MCQ or TF
        document.querySelectorAll('.option-btn, .tf-btn').forEach(btn => {
            const val = (btn.getAttribute('data-value') || btn.textContent || '').trim();
            if (val.toLowerCase() === normCorrect) {
                btn.classList.add('correct-highlight');
            } else if (submittedValue && val.toLowerCase() === normSubmitted && !isCorrect) {
                btn.classList.add('wrong-highlight');
            }
            btn.disabled = true;
        });

        const masked = document.getElementById('masked-word');
        if (masked) {
            masked.textContent = currentQ.correct_answer || currentQ.target_word;
            masked.style.color = isCorrect ? '#10b981' : '#e11d48';
        }

        if (isCorrect && activeTeam) {
            const ptsInfo = ScoringEngine.calculatePoints(currentQ, matchState.settings, questionElapsedSeconds);
            activeTeam.score += ptsInfo.totalPoints;
            activeTeam.correct += 1;

            if (window.SoundManager) window.SoundManager.playCorrect();
            const bonusTxt = ptsInfo.hasBonus ? ` (مع مكافأة السرعة البرقية ⚡ +${ptsInfo.bonus}!)` : '';
            showToast(`🎉 رائع يا ${activeTeam.name}! +${ptsInfo.totalPoints} نقطة!`, 'fa-trophy', '#10b981');

            explanationBox.style.borderColor = '#10b981';
            explanationTitle.style.color = '#047857';
            explanationTitle.innerHTML = `<i class="fa-solid fa-face-laugh-beam"></i> إجابة عبقرية وصحيحة! +${ptsInfo.totalPoints} نقطة ${bonusTxt}`;

            matchState.answeredLog.push({
                questionId: currentQ.id, type: currentQ.type,
                awardedToTeamId: activeTeam.id, pointsAwarded: ptsInfo.totalPoints,
                hadSpeedBonus: ptsInfo.hasBonus, isCorrect: true
            });
        } else {
            if (activeTeam) activeTeam.wrong += 1;
            if (window.SoundManager) window.SoundManager.playWrong();

            const reason = isTimeout ? '⏰ انتهى الوقت!' : '💡 محاولة جيدة! حظاً أوفر في الدور القادم!';
            showToast(`${reason} الإجابة الصحيحة: ${currentQ.correct_answer}`, 'fa-circle-info', '#ff6b6b');

            explanationBox.style.borderColor = '#ff6b6b';
            explanationTitle.style.color = '#e11d48';
            explanationTitle.innerHTML = `<i class="fa-solid fa-lightbulb"></i> ${reason} الإجابة الصحيحة هي: <span dir="ltr" class="font-en">${currentQ.correct_answer}</span>`;

            matchState.answeredLog.push({
                questionId: currentQ.id, type: currentQ.type,
                awardedToTeamId: null, pointsAwarded: 0, isCorrect: false
            });
        }

        explanationText.textContent = currentQ.explanation || '';
        explanationBox.classList.add('active');
        renderScoreboard();
        if (window.Storage) window.Storage.saveActiveMatch(matchState);
    };

    const renderCurrentQuestion = () => {
        currentQ = matchState.questions[matchState.currentIndex];
        activeTeamId = matchState.teams[matchState.currentIndex % matchState.teams.length].id;
        isQuestionDone = false;
        questionElapsedSeconds = 0;

        explanationBox.classList.remove('active');
        speedBonusBadge.style.display = 'none';
        timerCircle.classList.remove('warning');

        qCounter.textContent = `السؤال ${matchState.currentIndex + 1} من ${matchState.questions.length} 🌟`;

        const catMap = {
            word_meaning: { ar: '📖 معاني الكلمات', color: '#3A86FF' },
            sentence_meaning: { ar: '💬 معاني الجمل', color: '#8338EC' },
            grammar: { ar: '✨ تحدي القواعد', color: '#FF006E' },
            fill_blank: { ar: '✏️ أكمل الفراغ', color: '#FB5607' },
            word_scramble: { ar: '🔤 رتب الحروف', color: '#F59E0B' },
            sentence_builder: { ar: '🧩 رتب الجملة', color: '#10B981' },
            true_false: { ar: '✅ صح أم خطأ', color: '#0EA5E9' },
            guess_word: { ar: '🕵️ خمن الكلمة', color: '#8B5CF6' }
        };
        const cMeta = catMap[currentQ.type] || { ar: '🌟 تحدي ممتع', color: '#0EA5E9' };
        qCategory.textContent = cMeta.ar;

        const diff = (currentQ.difficulty || 'medium').toLowerCase();
        qDifficulty.className = `q-diff-badge q-diff-${diff}`;
        const diffLabels = { easy: 'سهل 😊', medium: 'متوسط 🚀', hard: 'بطل خارق 🔥' };
        qDifficulty.textContent = diffLabels[diff] || diff;

        const ptsInfo = ScoringEngine.calculatePoints(currentQ, matchState.settings, 0);
        qPoints.textContent = `⭐ ${ptsInfo.basePoints} نقطة`;
        questionText.textContent = currentQ.question;

        if (currentQ.hint) {
            questionSubhint.style.display = 'inline-block';
            questionSubhint.innerHTML = `💡 مساعدة: ${currentQ.hint}`;
        } else {
            questionSubhint.style.display = 'none';
        }

        renderScoreboard();
        renderChallengeInteraction(currentQ);

        timer.start(matchState.settings.timePerQuestion);

        if (matchState.currentIndex === matchState.questions.length - 1) {
            btnNextQuestion.innerHTML = `<span>احتفالية الفائزين! 🏆</span> <i class="fa-solid fa-crown"></i>`;
        } else {
            btnNextQuestion.innerHTML = `<span>السؤال التالي ⏭️</span>`;
        }
    };

    const renderChallengeInteraction = (q) => {
        challengeArena.innerHTML = '';
        if (q.type === 'word_scramble') {
            const container = document.createElement('div');
            container.className = 'scramble-arena';
            const slotRack = document.createElement('div');
            slotRack.className = 'slot-container';
            const lettersRack = document.createElement('div');
            lettersRack.className = 'letters-rack';
            const targetLen = q.correct_answer.length;
            const chars = QuestionBank.shuffle(q.correct_answer.split(''));

            const checkAssembled = () => {
                const word = Array.from(slotRack.children).map(c => c.textContent).join('');
                if (word.length === targetLen) {
                    handleAnswerSubmitted(word);
                }
            };

            chars.forEach(ch => {
                const block = document.createElement('div');
                block.className = 'letter-block';
                block.textContent = ch;
                block.onclick = () => {
                    if (isQuestionDone) return;
                    block.classList.add('used');
                    const slotItem = document.createElement('div');
                    slotItem.className = 'letter-block';
                    slotItem.textContent = ch;
                    slotItem.style.background = '#fef3c7';
                    slotItem.style.borderColor = '#f59e0b';
                    slotItem.style.color = '#d97706';
                    slotItem.onclick = () => {
                        if (isQuestionDone) return;
                        slotItem.remove();
                        block.classList.remove('used');
                    };
                    slotRack.appendChild(slotItem);
                    checkAssembled();
                };
                lettersRack.appendChild(block);
            });

            const btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.gap = '1rem';

            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'btn btn-secondary btn-sm';
            clearBtn.innerHTML = '🔄 ترتيب من جديد';
            clearBtn.onclick = () => {
                if (isQuestionDone) return;
                slotRack.innerHTML = '';
                lettersRack.querySelectorAll('.letter-block').forEach(b => b.classList.remove('used'));
            };

            const submitBtn = document.createElement('button');
            submitBtn.type = 'button';
            submitBtn.className = 'btn btn-success btn-sm';
            submitBtn.innerHTML = '✅ تحقق من الكلمة';
            submitBtn.onclick = () => {
                const word = Array.from(slotRack.children).map(c => c.textContent).join('');
                if (word.length > 0) handleAnswerSubmitted(word);
            };

            btnRow.appendChild(submitBtn);
            btnRow.appendChild(clearBtn);
            container.appendChild(slotRack);
            container.appendChild(lettersRack);
            container.appendChild(btnRow);
            challengeArena.appendChild(container);

        } else if (q.type === 'sentence_builder') {
            const container = document.createElement('div');
            container.className = 'scramble-arena';
            const slotRack = document.createElement('div');
            slotRack.className = 'slot-container';
            const chipsRack = document.createElement('div');
            chipsRack.className = 'letters-rack';
            const origWords = q.correct_answer.split(' ');
            const words = QuestionBank.shuffle(origWords);

            const checkSentence = () => {
                if (slotRack.children.length === origWords.length) {
                    const built = Array.from(slotRack.children).map(c => c.textContent).join(' ');
                    handleAnswerSubmitted(built);
                }
            };

            words.forEach(w => {
                const chip = document.createElement('div');
                chip.className = 'word-chip';
                chip.textContent = w;
                chip.onclick = () => {
                    if (isQuestionDone) return;
                    chip.classList.add('used');
                    const targetChip = document.createElement('div');
                    targetChip.className = 'word-chip';
                    targetChip.textContent = w;
                    targetChip.style.background = '#e0f2fe';
                    targetChip.style.borderColor = '#0ea5e9';
                    targetChip.style.color = '#0284c7';
                    targetChip.onclick = () => {
                        if (isQuestionDone) return;
                        targetChip.remove();
                        chip.classList.remove('used');
                    };
                    slotRack.appendChild(targetChip);
                    checkSentence();
                };
                chipsRack.appendChild(chip);
            });

            const btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.gap = '1rem';

            const resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = 'btn btn-secondary btn-sm';
            resetBtn.innerHTML = '🔄 إعادة ترتيب الكلمات';
            resetBtn.onclick = () => {
                if (isQuestionDone) return;
                slotRack.innerHTML = '';
                chipsRack.querySelectorAll('.word-chip').forEach(c => c.classList.remove('used'));
            };

            const submitBtn = document.createElement('button');
            submitBtn.type = 'button';
            submitBtn.className = 'btn btn-success btn-sm';
            submitBtn.innerHTML = '✅ تحقق من الجملة';
            submitBtn.onclick = () => {
                const built = Array.from(slotRack.children).map(c => c.textContent).join(' ');
                if (built.length > 0) handleAnswerSubmitted(built);
            };

            btnRow.appendChild(submitBtn);
            btnRow.appendChild(resetBtn);
            container.appendChild(slotRack);
            container.appendChild(chipsRack);
            container.appendChild(btnRow);
            challengeArena.appendChild(container);

        } else if (q.type === 'true_false') {
            const grid = document.createElement('div');
            grid.className = 'tf-grid';
            grid.innerHTML = `
                <button type="button" class="tf-btn tf-true" data-value="True (صح)">
                    <span style="font-size: 3rem;">✅</span>
                    <span>TRUE (صح)</span>
                </button>
                <button type="button" class="tf-btn tf-false" data-value="False (خطأ)">
                    <span style="font-size: 3rem;">❌</span>
                    <span>FALSE (خطأ)</span>
                </button>
            `;
            grid.querySelectorAll('.tf-btn').forEach(btn => {
                btn.onclick = () => handleAnswerSubmitted(btn.getAttribute('data-value'));
            });
            challengeArena.appendChild(grid);

        } else if (q.type === 'guess_word') {
            const container = document.createElement('div');
            container.className = 'guess-word-arena';
            const maskBox = document.createElement('div');
            maskBox.className = 'masked-word-display';
            maskBox.id = 'masked-word';
            maskBox.textContent = (q.correct_answer || q.target_word || '').split('').map(() => '_').join(' ');

            const hints = q.hints || ['تلميح 1: فكر في المعنى.', 'تلميح 2: اقتربت من الحل!', 'تلميح 3: اختر الإجابة من البطاقات!'];
            const stepper = document.createElement('div');
            stepper.className = 'hints-stepper';
            hints.forEach((h, idx) => {
                const card = document.createElement('div');
                card.className = 'hint-card' + (idx === 0 ? ' revealed' : '');
                card.id = `hint-card-${idx}`;
                card.innerHTML = `<div class="hint-title">💡 التلميح ${idx + 1}:</div><div class="hint-text">${idx === 0 ? h : 'اضغط زر المساعدة لكشف هذا التلميح'}</div>`;
                stepper.appendChild(card);
            });
            let rIdx = 0;
            const revBtn = document.createElement('button');
            revBtn.type = 'button';
            revBtn.className = 'btn btn-gold btn-sm';
            revBtn.style.alignSelf = 'center';
            revBtn.innerHTML = '💡 اكشف تلميحاً إضافياً للمساعدة!';
            revBtn.onclick = () => {
                rIdx++;
                if (rIdx < hints.length) {
                    const c = document.getElementById(`hint-card-${rIdx}`);
                    if (c) { c.classList.add('revealed'); c.querySelector('.hint-text').textContent = hints[rIdx]; }
                    if (window.SoundManager) window.SoundManager.playReveal();
                } else {
                    revBtn.disabled = true;
                    revBtn.textContent = '✨ تم كشف جميع التلميحات!';
                }
            };
            container.appendChild(maskBox);
            container.appendChild(stepper);
            container.appendChild(revBtn);

            const optGrid = document.createElement('div');
            optGrid.className = 'options-grid';
            optGrid.style.marginTop = '0.8rem';
            const letters = ['A', 'B', 'C', 'D'];
            (q.options || [q.correct_answer]).forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'option-btn';
                btn.setAttribute('data-value', opt);
                btn.innerHTML = `<div class="option-letter">${letters[idx] || (idx + 1)}</div><div class="option-content font-en">${opt}</div>`;
                btn.onclick = () => handleAnswerSubmitted(opt);
                optGrid.appendChild(btn);
            });
            container.appendChild(optGrid);
            challengeArena.appendChild(container);

        } else {
            const grid = document.createElement('div');
            grid.className = 'options-grid';
            const letters = ['A', 'B', 'C', 'D'];
            (q.options || []).forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'option-btn';
                btn.setAttribute('data-value', opt);
                btn.innerHTML = `<div class="option-letter">${letters[idx] || (idx + 1)}</div><div class="option-content">${opt}</div>`;
                btn.onclick = () => handleAnswerSubmitted(opt);
                grid.appendChild(btn);
            });
            challengeArena.appendChild(grid);
        }
    };

    const nextQuestion = () => {
        timer.stop();
        if (matchState.currentIndex >= matchState.questions.length - 1) {
            finishMatch();
        } else {
            matchState.currentIndex++;
            if (window.Storage) window.Storage.saveActiveMatch(matchState);
            renderCurrentQuestion();
        }
    };

    const finishMatch = () => {
        timer.stop();
        const standingsData = ScoringEngine.calculateStandings(matchState.teams);
        const leaders = ScoringEngine.calculateCategoryLeaders(matchState.teams, matchState.answeredLog);
        const finalResult = {
            settings: matchState.settings, teams: matchState.teams,
            standings: standingsData.standings, winner: standingsData.winner,
            tiedWinners: standingsData.tiedWinners, isTie: standingsData.isTie,
            categoryLeaders: leaders, totalQuestions: matchState.questions.length,
            completedAt: new Date().toISOString()
        };
        if (window.Storage) {
            window.Storage.saveMatchResult(finalResult);
            window.Storage.clearActiveMatch();
        }
        window.location.href = 'results.html';
    };

    if (btnNextQuestion) btnNextQuestion.addEventListener('click', nextQuestion);
    if (btnSkipQuestion) btnSkipQuestion.addEventListener('click', nextQuestion);
    if (btnPauseTimer) btnPauseTimer.addEventListener('click', () => timer.togglePause());

    const modalConfirmEnd = document.getElementById('modal-confirm-end');
    if (btnEndMatch && modalConfirmEnd) {
        btnEndMatch.addEventListener('click', () => { timer.pause(); modalConfirmEnd.classList.add('active'); });
        document.getElementById('btn-confirm-end-yes').onclick = () => finishMatch();
        document.getElementById('btn-confirm-end-no').onclick = () => { modalConfirmEnd.classList.remove('active'); timer.resume(); };
    }

    renderScoreboard();
    renderCurrentQuestion();
});
