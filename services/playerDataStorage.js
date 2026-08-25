const playerDataStorage = (() => {
    const STORAGE_KEY = 'marvelRivalsPlayerData';
    const STORAGE_VERSION = 2;
    const GAME_MODES = ['quickPlay', 'competitive'];
    const LEGACY_PER_10_METRICS = {
        killsPer10: 'killsPerMinute',
        deathsPer10: 'deathsPerMinute',
        damagePer10: 'damagePerMinute',
        damageTakenPer10: 'damageTakenPerMinute',
        assistsPer10: 'assistsPerMinute',
        healingPer10: 'healingPerMinute'
    };

    function createEmpty() {
        return {
            profile: {
                currentSeasonId: null,
                competitiveRanks: {}
            },
            heroStats: {},
            trainingSessions: []
        };
    }

    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function sanitizeId(value) {
        if (typeof value !== 'string') return null;

        const trimmedValue = value.trim();
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedValue)
            ? trimmedValue
            : null;
    }

    function sanitizeSeasonId(value) {
        const seasonId = sanitizeId(value);
        if (!seasonId) return null;

        return /^\d+(?:-\d+)*$/.test(seasonId)
            ? `season-${seasonId}`
            : seasonId;
    }

    function sanitizeOptionalString(value) {
        if (typeof value !== 'string') return null;

        const trimmedValue = value.trim();
        return trimmedValue || null;
    }

    function sanitizeMetrics(metrics) {
        if (!isPlainObject(metrics)) return {};

        return Object.fromEntries(
            Object.entries(metrics).filter(([metricName, value]) => (
                /^[a-z][a-zA-Z0-9]*$/.test(metricName)
                && typeof value === 'number'
                && Number.isFinite(value)
                && value >= 0
                && (metricName !== 'winRate' || value <= 1)
            ))
        );
    }

    function migrateLegacyMetrics(metrics) {
        if (!isPlainObject(metrics)) return {};

        return Object.entries(metrics).reduce((migrated, [metricName, value]) => {
            if (metricName === 'winRate' && typeof value === 'number') {
                migrated.winRate = value > 1 ? value / 100 : value;
                return migrated;
            }

            const canonicalMetricName = LEGACY_PER_10_METRICS[metricName];
            if (canonicalMetricName && typeof value === 'number') {
                migrated[canonicalMetricName] = value / 10;
                return migrated;
            }

            migrated[metricName] = value;
            return migrated;
        }, {});
    }

    function migrateVersionOne(playerData) {
        const migrated = JSON.parse(JSON.stringify(playerData || {}));

        Object.values(migrated.heroStats || {}).forEach(heroStats => {
            const periods = [
                heroStats.overall,
                ...Object.values(heroStats.seasons || {})
            ];
            periods.forEach(period => {
                GAME_MODES.forEach(mode => {
                    if (period?.[mode]) {
                        period[mode].metrics = migrateLegacyMetrics(period[mode].metrics);
                    }
                });
            });
        });
        (migrated.trainingSessions || []).forEach(session => {
            session.metrics = migrateLegacyMetrics(session.metrics);
        });

        return migrated;
    }

    function sanitizeModeStats(modeStats) {
        if (!isPlainObject(modeStats)) return null;

        const matchesPlayed = Math.max(0, Math.floor(Number(modeStats.matchesPlayed) || 0));
        const numericMatchesWon = Number(modeStats.matchesWon);
        const hasValidMatchesWon = Number.isInteger(numericMatchesWon)
            && numericMatchesWon >= 0
            && numericMatchesWon <= matchesPlayed;

        return {
            matchesPlayed,
            ...(hasValidMatchesWon ? { matchesWon: numericMatchesWon } : {}),
            metrics: sanitizeMetrics(modeStats.metrics),
            updatedAt: sanitizeOptionalString(modeStats.updatedAt)
        };
    }

    function sanitizePeriod(period) {
        if (!isPlainObject(period)) return {};

        return GAME_MODES.reduce((sanitizedPeriod, mode) => {
            const modeStats = sanitizeModeStats(period[mode]);
            if (modeStats) sanitizedPeriod[mode] = modeStats;
            return sanitizedPeriod;
        }, {});
    }

    function sanitizeHeroStats(heroStats) {
        if (!isPlainObject(heroStats)) return null;

        const seasons = isPlainObject(heroStats.seasons)
            ? Object.entries(heroStats.seasons).reduce((sanitizedSeasons, [seasonId, period]) => {
                const validSeasonId = sanitizeSeasonId(seasonId);
                if (validSeasonId) sanitizedSeasons[validSeasonId] = sanitizePeriod(period);
                return sanitizedSeasons;
            }, {})
            : {};

        return {
            overall: sanitizePeriod(heroStats.overall),
            seasons
        };
    }

    function sanitizeProfile(profile) {
        const source = isPlainObject(profile) ? profile : {};
        const competitiveRanks = isPlainObject(source.competitiveRanks)
            ? Object.entries(source.competitiveRanks).reduce((ranks, [seasonId, rank]) => {
                const validSeasonId = sanitizeSeasonId(seasonId);
                const validRank = sanitizeOptionalString(rank);
                if (validSeasonId && validRank) ranks[validSeasonId] = validRank;
                return ranks;
            }, {})
            : {};

        return {
            currentSeasonId: sanitizeSeasonId(source.currentSeasonId),
            competitiveRanks
        };
    }

    function sanitizeTrainingSession(session) {
        if (!isPlainObject(session)) return null;

        const id = sanitizeOptionalString(session.id);
        const heroId = sanitizeId(session.heroId);
        const playedAt = sanitizeOptionalString(session.playedAt);
        const matches = Math.max(0, Math.floor(Number(session.matches) || 0));

        if (!id || !heroId || !playedAt || matches === 0) return null;

        return {
            id,
            heroId,
            gameMode: GAME_MODES.includes(session.gameMode) ? session.gameMode : null,
            seasonId: sanitizeSeasonId(session.seasonId),
            playedAt,
            matches,
            metrics: sanitizeMetrics(session.metrics)
        };
    }

    function sanitize(playerData) {
        const source = isPlainObject(playerData) ? playerData : {};
        const heroStats = isPlainObject(source.heroStats)
            ? Object.entries(source.heroStats).reduce((sanitizedHeroStats, [heroId, stats]) => {
                const validHeroId = sanitizeId(heroId);
                const validStats = sanitizeHeroStats(stats);
                if (validHeroId && validStats) sanitizedHeroStats[validHeroId] = validStats;
                return sanitizedHeroStats;
            }, {})
            : {};
        const trainingSessions = Array.isArray(source.trainingSessions)
            ? source.trainingSessions.map(sanitizeTrainingSession).filter(Boolean)
            : [];

        return {
            profile: sanitizeProfile(source.profile),
            heroStats,
            trainingSessions
        };
    }

    function clear() {
        localStorage.removeItem(STORAGE_KEY);
    }

    function load() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!saved) return createEmpty();
            if (saved.version === STORAGE_VERSION) return sanitize(saved.playerData);
            if (saved.version === 1) return save(migrateVersionOne(saved.playerData));

            return createEmpty();
        } catch (error) {
            console.warn('Could not restore player data:', error);
            clear();
            return createEmpty();
        }
    }

    function save(playerData) {
        const sanitizedPlayerData = sanitize(playerData);

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            version: STORAGE_VERSION,
            playerData: sanitizedPlayerData
        }));

        return sanitizedPlayerData;
    }

    return { clear, createEmpty, load, save };
})();
