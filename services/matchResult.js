const matchResult = (() => {
    const GAME_MODES = ['quickPlay', 'competitive'];
    const OUTCOMES = ['win', 'loss'];
    const RECOGNITIONS = ['mvp', 'svp'];
    const FEELINGS = ['struggled', 'okay', 'comfortable'];

    function optionalString(value) {
        if (typeof value !== 'string') return null;
        return value.trim() || null;
    }

    function sanitize(result) {
        if (!result || typeof result !== 'object' || Array.isArray(result)) return null;

        const id = optionalString(result.id);
        const playedAt = optionalString(result.playedAt);
        if (!id || !playedAt) return null;

        const outcome = OUTCOMES.includes(result.outcome) ? result.outcome : null;
        let recognition = RECOGNITIONS.includes(result.recognition) ? result.recognition : null;
        if (
            (recognition === 'mvp' && outcome !== 'win')
            || (recognition === 'svp' && outcome !== 'loss')
        ) recognition = null;

        return {
            id,
            playedAt,
            gameMode: GAME_MODES.includes(result.gameMode) ? result.gameMode : 'quickPlay',
            outcome,
            recognition,
            feeling: FEELINGS.includes(result.feeling) ? result.feeling : null
        };
    }

    function create(result) {
        const sanitized = sanitize(result);
        if (!sanitized) throw new Error('A match result requires an id and timestamp.');
        return sanitized;
    }

    function sanitizeMany(results, limit = Number.POSITIVE_INFINITY) {
        if (!Array.isArray(results)) return [];
        const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : results.length;
        return results.map(sanitize).filter(Boolean).slice(0, safeLimit);
    }

    function summarize(results) {
        const safeResults = sanitizeMany(results);
        return safeResults.reduce((summary, result) => {
            summary.recorded += 1;
            if (result.outcome === 'win') summary.wins += 1;
            if (result.outcome === 'loss') summary.losses += 1;
            if (result.recognition === 'mvp') summary.mvpAwards += 1;
            if (result.recognition === 'svp') summary.svpAwards += 1;
            if (result.feeling) summary.feelings[result.feeling] += 1;
            return summary;
        }, {
            recorded: 0,
            wins: 0,
            losses: 0,
            mvpAwards: 0,
            svpAwards: 0,
            feelings: { struggled: 0, okay: 0, comfortable: 0 }
        });
    }

    function getSessionGameMode(results) {
        const modes = new Set(sanitizeMany(results).map(result => result.gameMode));
        return modes.size === 1 ? Array.from(modes)[0] : null;
    }

    return { create, getSessionGameMode, sanitize, sanitizeMany, summarize };
})();
