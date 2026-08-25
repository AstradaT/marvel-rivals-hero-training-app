const trainingPriority = (() => {
    const DAY_MS = 24 * 60 * 60 * 1000;

    function clamp(value, minimum, maximum) {
        return Math.min(maximum, Math.max(minimum, value));
    }

    function sumPeriodMatches(period) {
        return ['quickPlay', 'competitive'].reduce(
            (total, mode) => total + Math.max(0, Number(period?.[mode]?.matchesPlayed) || 0),
            0
        );
    }

    function getExperienceMatches(heroStats) {
        if (!heroStats) return 0;

        const overallMatches = sumPeriodMatches(heroStats.overall);
        const seasonalMatches = Object.values(heroStats.seasons || {})
            .reduce((total, period) => total + sumPeriodMatches(period), 0);
        return Math.max(overallMatches, seasonalMatches);
    }

    function getRecency(heroId, sessions, nowTimestamp) {
        const timestamps = sessions
            .filter(session => session.heroId === heroId)
            .map(session => new Date(session.playedAt).getTime())
            .filter(Number.isFinite);
        if (timestamps.length === 0) return { lastPlayedAt: null, daysSincePlayed: null };

        const lastPlayedTimestamp = Math.max(...timestamps);
        return {
            lastPlayedAt: new Date(lastPlayedTimestamp).toISOString(),
            daysSincePlayed: Math.max(0, (nowTimestamp - lastPlayedTimestamp) / DAY_MS)
        };
    }

    function buildReason({ evaluation, hasStats, daysSincePlayed }) {
        if (evaluation?.evaluationState === 'weak') {
            return 'Prioritized because your compatible Competitive results are below the benchmark.';
        }
        if (!hasStats) {
            return 'Prioritized for exploration because you have no saved performance snapshot for this hero.';
        }
        if (daysSincePlayed === null) {
            return 'Prioritized because this hero has no recorded training sessions yet.';
        }
        if (daysSincePlayed >= 7) {
            return `Prioritized for recency because you last trained this hero ${Math.floor(daysSincePlayed)} days ago.`;
        }
        if (evaluation?.evaluationState === 'unknown') {
            return 'Prioritized to collect more evidence before judging your performance.';
        }
        return 'Selected to balance practice variety with your current hero history.';
    }

    function score({ heroId, heroStats, trainingSessions = [], evaluation = null, now = Date.now() }) {
        const nowTimestamp = new Date(now).getTime();
        const safeNow = Number.isFinite(nowTimestamp) ? nowTimestamp : Date.now();
        const experienceMatches = getExperienceMatches(heroStats);
        const hasStats = Boolean(heroStats);
        const recency = getRecency(heroId, trainingSessions, safeNow);
        const explorationBonus = hasStats ? 0 : 1.25;
        const experienceBonus = clamp(1 - (experienceMatches / 30), 0, 1);
        const recencyBonus = recency.daysSincePlayed === null
            ? 1
            : clamp(recency.daysSincePlayed / 30, 0, 1);
        const performanceBonus = evaluation?.evaluationState === 'weak'
            ? 2
            : evaluation?.evaluationState === 'unknown'
                ? 0.5
                : 0;
        const recentPenalty = recency.daysSincePlayed !== null && recency.daysSincePlayed < 1
            ? 0.75
            : 0;
        const weight = Math.round(clamp(
            1 + explorationBonus + experienceBonus + recencyBonus + performanceBonus - recentPenalty,
            0.25,
            5
        ) * 100) / 100;

        return {
            heroId,
            weight,
            experienceMatches,
            ...recency,
            evaluationState: evaluation?.evaluationState || 'unrated',
            reason: buildReason({ evaluation, hasStats, daysSincePlayed: recency.daysSincePlayed }),
            signals: {
                exploration: explorationBonus,
                experience: experienceBonus,
                recency: recencyBonus,
                performance: performanceBonus,
                recentPenalty
            }
        };
    }

    return { getExperienceMatches, score };
})();
