/**
 * English Battle - Scoring & Ranking Engine
 */
const ScoringEngine = {
    calculatePoints(question, settings, elapsedSeconds = null) {
        let basePoints = question.points || 100;
        if (settings && settings.points) {
            const diff = (question.difficulty || 'easy').toLowerCase();
            if (settings.points[diff]) basePoints = Number(settings.points[diff]);
        }
        let bonus = 0;
        let hasBonus = false;
        if (settings && settings.speedBonus && settings.timePerQuestion > 0 && elapsedSeconds !== null) {
            const speedThreshold = settings.timePerQuestion * 0.30;
            if (elapsedSeconds <= speedThreshold) {
                bonus = Math.round(basePoints * 0.20);
                hasBonus = true;
            }
        }
        return { basePoints, bonus, totalPoints: basePoints + bonus, hasBonus };
    },
    calculateStandings(teams) {
        if (!teams || teams.length === 0) return { standings: [], winner: null, isTie: false };
        const sorted = [...teams].sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.correct !== a.correct) return b.correct - a.correct;
            return a.wrong - b.wrong;
        });
        let currentRank = 1;
        const rankedTeams = [];
        for (let i = 0; i < sorted.length; i++) {
            if (i > 0) {
                const prev = sorted[i - 1];
                const curr = sorted[i];
                if (curr.score === prev.score && curr.correct === prev.correct && curr.wrong === prev.wrong) {
                    rankedTeams.push({ ...curr, rank: rankedTeams[i - 1].rank, isTie: true });
                    rankedTeams[i - 1].isTie = true;
                    continue;
                } else {
                    currentRank = i + 1;
                }
            }
            rankedTeams.push({ ...sorted[i], rank: currentRank, isTie: false });
        }
        const topTeams = rankedTeams.filter(t => t.rank === 1);
        const isOverallTie = topTeams.length > 1;
        return {
            standings: rankedTeams,
            winner: isOverallTie ? null : rankedTeams[0],
            tiedWinners: isOverallTie ? topTeams : null,
            isTie: isOverallTie
        };
    },
    calculateCategoryLeaders(teams, historyLog = []) {
        const leaders = {};
        if (!historyLog || historyLog.length === 0) return leaders;
        const categoryScores = {};
        historyLog.forEach(entry => {
            if (entry.awardedToTeamId && entry.type) {
                if (!categoryScores[entry.type]) categoryScores[entry.type] = {};
                const current = categoryScores[entry.type][entry.awardedToTeamId] || 0;
                categoryScores[entry.type][entry.awardedToTeamId] = current + (entry.pointsAwarded || 0);
            }
        });
        Object.keys(categoryScores).forEach(type => {
            const teamMap = categoryScores[type];
            let bestTeamId = null;
            let highestPts = 0;
            Object.keys(teamMap).forEach(teamId => {
                if (teamMap[teamId] > highestPts) {
                    highestPts = teamMap[teamId];
                    bestTeamId = teamId;
                }
            });
            if (bestTeamId && highestPts > 0) {
                const foundTeam = teams.find(t => String(t.id) === String(bestTeamId));
                if (foundTeam) leaders[type] = { team: foundTeam, points: highestPts };
            }
        });
        return leaders;
    }
};
window.ScoringEngine = ScoringEngine;
