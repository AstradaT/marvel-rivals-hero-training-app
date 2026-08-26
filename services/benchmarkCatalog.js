const benchmarkCatalog = (() => {
    const SCHEMA_VERSION = 2;
    const SOURCE_TYPES = ['primary', 'validation', 'reference'];
    const METRIC_UNITS = ['ratio', 'perMinute', 'count'];

    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function normalizeId(value) {
        if (typeof value !== 'string') return null;

        const normalized = value.trim().toLowerCase();
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized) ? normalized : null;
    }

    function normalizeRankTier(value) {
        if (typeof value !== 'string') return null;

        return normalizeId(value
            .trim()
            .toLowerCase()
            .replace(/\s*\+$/, '-plus')
            .replace(/[\s_]+/g, '-'));
    }

    function sanitizeSampleSize(sampleSize) {
        if (!isPlainObject(sampleSize)) return { matches: null, players: null };

        const matches = Math.max(0, Math.floor(Number(sampleSize.matches) || 0)) || null;
        const players = Math.max(0, Math.floor(Number(sampleSize.players) || 0)) || null;
        return { matches, players };
    }

    function sanitizeSource(source) {
        if (!isPlainObject(source)) return null;

        const id = normalizeId(source.id);
        const type = SOURCE_TYPES.includes(source.type) ? source.type : null;
        if (!id || !type) return null;

        return {
            id,
            type,
            reference: typeof source.reference === 'string' && source.reference.trim()
                ? source.reference.trim()
                : null,
            url: typeof source.url === 'string' && source.url.trim()
                ? source.url.trim()
                : null,
            datasetId: typeof source.datasetId === 'string' && source.datasetId.trim()
                ? source.datasetId.trim()
                : null
        };
    }

    function sanitizeSourceMetadata(metadata) {
        if (!isPlainObject(metadata)) return null;

        const unavailableMetrics = Array.isArray(metadata.unavailableMetrics)
            ? metadata.unavailableMetrics.filter(metricName => (
                typeof metricName === 'string' && /^[a-z][a-zA-Z0-9]*$/.test(metricName)
            ))
            : [];

        return {
            sourceUpdatedAt: typeof metadata.sourceUpdatedAt === 'string'
                ? metadata.sourceUpdatedAt.trim() || null
                : null,
            platform: normalizeId(metadata.platform),
            region: normalizeId(metadata.region),
            tierLabel: typeof metadata.tierLabel === 'string'
                ? metadata.tierLabel.trim() || null
                : null,
            heroRank: sanitizeSampleSize({ matches: metadata.heroRank }).matches,
            heroPoolSize: sanitizeSampleSize({ matches: metadata.heroPoolSize }).matches,
            ...(unavailableMetrics.length > 0 ? { unavailableMetrics } : {})
        };
    }

    function sanitizeMetrics(metrics) {
        if (!isPlainObject(metrics)) return {};

        return Object.entries(metrics).reduce((result, [metricName, metric]) => {
            if (!/^[a-z][a-zA-Z0-9]*$/.test(metricName) || !isPlainObject(metric)) {
                return result;
            }

            const average = Number(metric.average);
            const unit = METRIC_UNITS.includes(metric.unit) ? metric.unit : null;
            const hasValidValue = Number.isFinite(average) && average >= 0;
            const hasValidWinRate = metricName !== 'winRate'
                || (unit === 'ratio' && average <= 1);
            if (!hasValidValue || !unit || !hasValidWinRate) return result;

            result[metricName] = {
                average,
                unit,
                sampleSize: sanitizeSampleSize(metric.sampleSize)
            };
            return result;
        }, {});
    }

    function sanitizeContext(context) {
        if (!isPlainObject(context)) return null;

        if (context.type === 'seasonalMode') {
            const seasonId = normalizeId(context.seasonId);
            const platform = normalizeId(context.platform);
            if (
                context.gameMode !== 'quickPlay'
                || !seasonId
                || !['pc', 'console'].includes(platform)
            ) return null;

            return {
                type: 'seasonalMode',
                seasonId,
                gameMode: 'quickPlay',
                platform
            };
        }

        if (context.gameMode !== 'competitive') return null;

        if (context.type === 'seasonalRank') {
            const seasonId = normalizeId(context.seasonId);
            const rankTier = normalizeRankTier(context.rankTier);
            if (!seasonId || !rankTier) return null;

            return {
                type: 'seasonalRank',
                seasonId,
                gameMode: 'competitive',
                rankTier
            };
        }

        if (context.type === 'seasonalRankThreshold') {
            const seasonId = normalizeId(context.seasonId);
            const rankTier = normalizeRankTier(context.rankTier);
            const minimumRank = context.population?.type === 'rankThreshold'
                ? normalizeRankTier(context.population.minimumRank)
                : null;
            if (!seasonId || !rankTier || !minimumRank || !rankTier.endsWith('-plus')) return null;

            return {
                type: 'seasonalRankThreshold',
                seasonId,
                gameMode: 'competitive',
                rankTier,
                population: { type: 'rankThreshold', minimumRank }
            };
        }

        if (context.type === 'rollingRankThreshold') {
            const minimumRank = context.population?.type === 'rankThreshold'
                ? normalizeId(context.population.minimumRank)
                : null;
            const days = context.timeWindow?.type === 'rollingDays'
                ? Math.max(0, Math.floor(Number(context.timeWindow.days) || 0))
                : 0;
            if (!minimumRank || days === 0) return null;

            return {
                type: 'rollingRankThreshold',
                gameMode: 'competitive',
                population: { type: 'rankThreshold', minimumRank },
                timeWindow: { type: 'rollingDays', days }
            };
        }

        return null;
    }

    function sanitizeRecord(record) {
        if (!isPlainObject(record)) return null;

        const heroId = normalizeId(record.heroId);
        const context = sanitizeContext(record.context);
        const metrics = sanitizeMetrics(record.metrics);
        const source = sanitizeSource(record.source);
        const collectedAt = typeof record.collectedAt === 'string' && record.collectedAt.trim()
            ? record.collectedAt.trim()
            : null;
        if (
            !heroId
            || !context
            || !source
            || !collectedAt
            || Object.keys(metrics).length === 0
        ) return null;

        const validations = Array.isArray(record.validations)
            ? record.validations.map(validation => {
                const validationSource = sanitizeSource(validation.source);
                const validationMetrics = sanitizeMetrics(validation.metrics);
                return validationSource && Object.keys(validationMetrics).length > 0
                    ? {
                        source: validationSource,
                        metrics: validationMetrics,
                        sampleSize: sanitizeSampleSize(validation.sampleSize),
                        collectedAt: typeof validation.collectedAt === 'string'
                            ? validation.collectedAt.trim() || null
                            : null,
                        methodologyNotes: typeof validation.methodologyNotes === 'string'
                            ? validation.methodologyNotes.trim() || null
                            : null
                    }
                    : null;
            }).filter(Boolean)
            : [];

        return {
            heroId,
            context,
            metrics,
            sampleSize: sanitizeSampleSize(record.sampleSize),
            collectedAt,
            source,
            sourceMetadata: sanitizeSourceMetadata(record.sourceMetadata),
            validations,
            methodologyNotes: typeof record.methodologyNotes === 'string'
                ? record.methodologyNotes.trim() || null
                : null
        };
    }

    function create(dataset) {
        const source = isPlainObject(dataset) ? dataset : {};
        const isSupported = source.schemaVersion === SCHEMA_VERSION;
        const records = isSupported && Array.isArray(source.records)
            ? source.records.map(sanitizeRecord).filter(Boolean)
            : [];

        function findSeasonalCompetitive({ seasonId, rankTier, heroId }) {
            const normalizedSeasonId = normalizeId(seasonId);
            const normalizedRank = normalizeRankTier(rankTier);
            const normalizedHeroId = normalizeId(heroId);

            return records.find(record => (
                record.context.type === 'seasonalRank'
                && record.context.seasonId === normalizedSeasonId
                && record.context.rankTier === normalizedRank
                && record.heroId === normalizedHeroId
            )) || null;
        }

        function findSeasonalCompetitiveThreshold({ seasonId, rankTier, heroId }) {
            const normalizedSeasonId = normalizeId(seasonId);
            const normalizedRank = normalizeRankTier(rankTier);
            const normalizedHeroId = normalizeId(heroId);

            return records.find(record => (
                record.context.type === 'seasonalRankThreshold'
                && record.context.seasonId === normalizedSeasonId
                && record.context.rankTier === normalizedRank
                && record.heroId === normalizedHeroId
            )) || null;
        }

        function findSeasonalQuickPlay({ seasonId, platform, heroId }) {
            const normalizedSeasonId = normalizeId(seasonId);
            const normalizedPlatform = normalizeId(platform);
            const normalizedHeroId = normalizeId(heroId);

            return records.find(record => (
                record.context.type === 'seasonalMode'
                && record.context.gameMode === 'quickPlay'
                && record.context.seasonId === normalizedSeasonId
                && record.context.platform === normalizedPlatform
                && record.heroId === normalizedHeroId
            )) || null;
        }

        return {
            schemaVersion: SCHEMA_VERSION,
            datasetVersion: typeof source.datasetVersion === 'string'
                ? source.datasetVersion
                : 'unknown',
            updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : null,
            records,
            findSeasonalCompetitive,
            findSeasonalCompetitiveThreshold,
            findSeasonalQuickPlay
        };
    }

    return { create };
})();
