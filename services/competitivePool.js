const competitivePool = (() => {
    const STATE_ORDER = {
        ready: 0,
        needsMoreData: 1,
        developing: 2,
        unrated: 3
    };

    const STATE_LABELS = {
        ready: 'Recommended',
        needsMoreData: 'Needs evidence',
        developing: 'Developing',
        unrated: 'Not evaluated'
    };

    function getState(resolution, evaluation) {
        if (resolution?.status !== 'resolved' || !evaluation) return 'unrated';
        if (evaluation.evaluationState === 'unknown') return 'needsMoreData';
        if (evaluation.evaluationState === 'weak') return 'developing';
        return 'ready';
    }

    function getRecencyScore(daysSincePlayed) {
        if (daysSincePlayed === null || !Number.isFinite(daysSincePlayed)) return 0;
        return Math.max(0, 100 - (daysSincePlayed * 4));
    }

    function getRecommendationScore(evaluation, priority) {
        if (!evaluation || !Number.isFinite(evaluation.skillScore)) return 0;
        const confidence = Number(evaluation.confidence?.score) || 0;
        const recency = getRecencyScore(priority?.daysSincePlayed ?? null);
        return Math.round((
            (evaluation.skillScore * 0.7)
            + (confidence * 0.25)
            + (recency * 0.05)
        ) * 10) / 10;
    }

    function getUnratedReason(reason) {
        const reasons = {
            noPlayerData: 'No saved player data for this hero.',
            missingSeason: 'Select a current season before evaluating this hero.',
            noCompetitiveData: 'No Competitive snapshot is saved for the current context.',
            missingCompetitiveRank: 'Add your exact rank for the current season.',
            noCompatibleBenchmark: 'No exact hero, season, and rank benchmark is available.'
        };
        return reasons[reason] || 'Compatible Competitive evidence is not available yet.';
    }

    function createEntry({ hero, resolution, evaluation = null, priority, isBanned = false }) {
        const state = getState(resolution, evaluation);
        const source = resolution?.source || null;
        const confidence = evaluation?.confidence || null;
        const skillScore = Number.isFinite(evaluation?.skillScore)
            ? evaluation.skillScore
            : null;

        return {
            heroId: hero.id,
            heroName: hero.name,
            role: hero.role,
            staticImg: hero.staticImg,
            isBanned,
            state,
            stateLabel: STATE_LABELS[state],
            recommendationScore: getRecommendationScore(evaluation, priority),
            skillScore,
            proficiencyLabel: evaluation?.proficiency?.label || null,
            confidenceLabel: confidence?.label || 'Unavailable',
            confidenceScore: confidence?.score || 0,
            competitiveMatches: confidence?.playerMatches || 0,
            rankTier: source?.rankTier || null,
            seasonId: source?.seasonId || null,
            daysSinceTrained: priority?.daysSincePlayed ?? null,
            summary: evaluation?.summary || getUnratedReason(resolution?.reason),
            explanation: evaluation?.explanation || null
        };
    }

    function rank(entries, { role = 'All', includeUnrated = true } = {}) {
        return entries
            .filter(entry => role === 'All' || entry.role === role)
            .filter(entry => includeUnrated || entry.state !== 'unrated')
            .sort((left, right) => (
                STATE_ORDER[left.state] - STATE_ORDER[right.state]
                || Number(left.isBanned) - Number(right.isBanned)
                || right.recommendationScore - left.recommendationScore
                || right.confidenceScore - left.confidenceScore
                || left.heroName.localeCompare(right.heroName)
            ));
    }

    function getRecommended(entries, limit = 6) {
        return rank(entries, { includeUnrated: false })
            .filter(entry => entry.state === 'ready' && !entry.isBanned)
            .slice(0, Math.max(0, Math.floor(limit)));
    }

    function summarize(entries) {
        return entries.reduce((summary, entry) => {
            summary[entry.state] += 1;
            return summary;
        }, { ready: 0, needsMoreData: 0, developing: 0, unrated: 0 });
    }

    return { createEntry, getRecommended, rank, summarize };
})();
