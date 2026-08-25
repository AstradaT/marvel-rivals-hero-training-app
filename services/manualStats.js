const manualStats = (() => {
    const VALID_MODES = ['quickPlay', 'competitive'];
    const VALID_SCOPES = ['overall', 'season'];

    function normalizeSeasonId(value) {
        if (typeof value !== 'string' && typeof value !== 'number') return null;

        const seasonInput = String(value).trim().toLowerCase();
        if (/^season-\d+(?:-\d+)?$/.test(seasonInput)) return seasonInput;
        if (!/^\d+(?:\.\d+)?$/.test(seasonInput)) return null;

        return `season-${seasonInput.replace('.', '-')}`;
    }

    function formatSeasonInputValue(value) {
        if (typeof value !== 'string') return '';

        const match = value.trim().toLowerCase().match(/^season-(\d+)(?:-(\d+))?$/);
        if (!match) return '';

        return match[2] ? `${match[1]}.${match[2]}` : match[1];
    }

    function requireNonNegativeNumber(value, fieldName) {
        const number = Number(value);
        if (!Number.isFinite(number) || number < 0) {
            throw new Error(`${fieldName} must be a non-negative number.`);
        }

        return number;
    }

    function createUpdatedPlayerData(playerData, entry) {
        if (!entry || typeof entry !== 'object') throw new Error('Stat entry is required.');
        if (!VALID_MODES.includes(entry.mode)) throw new Error('Choose a supported game mode.');
        if (!VALID_SCOPES.includes(entry.scope)) throw new Error('Choose a supported time period.');
        if (typeof entry.heroId !== 'string' || !entry.heroId) throw new Error('Hero is required.');

        const seasonId = entry.scope === 'season'
            ? normalizeSeasonId(entry.seasonId)
            : null;
        if (entry.scope === 'season' && !seasonId) {
            throw new Error('Enter a numeric season such as 9 or 9.5.');
        }

        const matchesPlayed = Math.floor(requireNonNegativeNumber(
            entry.matchesPlayed,
            'Matches played'
        ));
        const enteredMetrics = Object.fromEntries(
            Object.entries(entry.metrics || {}).map(([metricName, value]) => [
                metricName,
                requireNonNegativeNumber(value, metricName)
            ])
        );

        if (typeof enteredMetrics.winRate === 'number' && enteredMetrics.winRate > 100) {
            throw new Error('Win rate cannot be greater than 100%.');
        }
        const metrics = {
            ...enteredMetrics,
            ...(typeof enteredMetrics.winRate === 'number'
                ? { winRate: enteredMetrics.winRate / 100 }
                : {})
        };

        const nextPlayerData = JSON.parse(JSON.stringify(playerData));
        nextPlayerData.profile ||= { currentSeasonId: null, competitiveRanks: {} };
        nextPlayerData.profile.competitiveRanks ||= {};
        nextPlayerData.heroStats ||= {};
        nextPlayerData.trainingSessions ||= [];
        nextPlayerData.heroStats[entry.heroId] ||= { overall: {}, seasons: {} };
        nextPlayerData.heroStats[entry.heroId].overall ||= {};
        nextPlayerData.heroStats[entry.heroId].seasons ||= {};

        let targetPeriod = nextPlayerData.heroStats[entry.heroId].overall;
        if (seasonId) {
            nextPlayerData.profile.currentSeasonId = seasonId;
            nextPlayerData.heroStats[entry.heroId].seasons[seasonId] ||= {};
            targetPeriod = nextPlayerData.heroStats[entry.heroId].seasons[seasonId];

            const competitiveRank = typeof entry.competitiveRank === 'string'
                ? entry.competitiveRank.trim()
                : '';
            if (entry.mode === 'competitive' && competitiveRank) {
                nextPlayerData.profile.competitiveRanks[seasonId] = competitiveRank;
            }
        }

        targetPeriod[entry.mode] = {
            matchesPlayed,
            metrics,
            updatedAt: entry.updatedAt || new Date().toISOString()
        };

        return nextPlayerData;
    }

    return { createUpdatedPlayerData, formatSeasonInputValue, normalizeSeasonId };
})();
