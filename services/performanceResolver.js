const performanceResolver = (() => {
    const CURRENT_SEASON_FULL_WEIGHT_MATCHES = 30;
    const OVERALL_SUPPORT_MATCH_CAP = 30;

    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function isUsableSnapshot(snapshot) {
        return isPlainObject(snapshot)
            && Number(snapshot.matchesPlayed) > 0
            && isPlainObject(snapshot.metrics)
            && Object.keys(snapshot.metrics).length > 0;
    }

    function getHistoryWeights(currentSeasonStats, overallStats) {
        const hasCurrentSeason = isUsableSnapshot(currentSeasonStats);
        const hasOverall = isUsableSnapshot(overallStats);

        if (hasCurrentSeason && !hasOverall) return { currentSeason: 1, overall: 0 };
        if (!hasCurrentSeason && hasOverall) return { currentSeason: 0, overall: 1 };
        if (!hasCurrentSeason && !hasOverall) return { currentSeason: 0, overall: 0 };

        const currentMatches = Number(currentSeasonStats.matchesPlayed);
        const currentEvidence = Math.min(
            1,
            currentMatches / CURRENT_SEASON_FULL_WEIGHT_MATCHES
        );
        const currentSeasonWeight = Math.min(1, 0.25 + (currentEvidence * 0.75));

        return {
            currentSeason: currentSeasonWeight,
            overall: 1 - currentSeasonWeight
        };
    }

    function blendHistory(currentSeasonStats, overallStats) {
        const weights = getHistoryWeights(currentSeasonStats, overallStats);
        if (weights.currentSeason === 0 && weights.overall === 0) return null;

        const metricNames = new Set([
            ...Object.keys(currentSeasonStats?.metrics || {}),
            ...Object.keys(overallStats?.metrics || {})
        ]);
        const metrics = {};

        metricNames.forEach(metricName => {
            const candidates = [
                {
                    value: Number(currentSeasonStats?.metrics?.[metricName]),
                    weight: weights.currentSeason
                },
                {
                    value: Number(overallStats?.metrics?.[metricName]),
                    weight: weights.overall
                }
            ].filter(candidate => Number.isFinite(candidate.value) && candidate.weight > 0);
            const metricWeight = candidates.reduce((total, candidate) => total + candidate.weight, 0);

            if (metricWeight > 0) {
                metrics[metricName] = candidates.reduce(
                    (total, candidate) => total + (candidate.value * candidate.weight),
                    0
                ) / metricWeight;
            }
        });

        const currentMatches = isUsableSnapshot(currentSeasonStats)
            ? Number(currentSeasonStats.matchesPlayed)
            : 0;
        const overallMatches = isUsableSnapshot(overallStats)
            ? Math.min(OVERALL_SUPPORT_MATCH_CAP, Number(overallStats.matchesPlayed))
            : 0;

        return {
            matchesPlayed: currentMatches + (overallMatches * weights.overall),
            metrics,
            historyWeights: weights,
            sourceMatches: {
                currentSeason: currentMatches,
                overall: isUsableSnapshot(overallStats) ? Number(overallStats.matchesPlayed) : 0
            }
        };
    }

    function buildTrainingEvidence(playerData, heroId, heroStats, currentSeasonId) {
        return {
            quickPlay: blendHistory(
                heroStats?.seasons?.[currentSeasonId]?.quickPlay,
                heroStats?.overall?.quickPlay
            ),
            competitive: blendHistory(
                heroStats?.seasons?.[currentSeasonId]?.competitive,
                heroStats?.overall?.competitive
            ),
            sessions: (playerData?.trainingSessions || []).filter(session => session.heroId === heroId)
        };
    }

    function unresolved(evaluationState, reason, trainingEvidence, details = {}) {
        return {
            status: 'unresolved',
            evaluationState,
            reason,
            playerStats: null,
            benchmark: null,
            source: null,
            trainingEvidence,
            details
        };
    }

    function resolve({ playerData, catalog, heroId }) {
        const currentSeasonId = playerData?.profile?.currentSeasonId || null;
        const heroStats = playerData?.heroStats?.[heroId] || null;
        const trainingEvidence = buildTrainingEvidence(
            playerData,
            heroId,
            heroStats,
            currentSeasonId
        );

        if (!heroStats) {
            return unresolved('unknown', 'noPlayerData', trainingEvidence, { heroId });
        }
        if (!currentSeasonId) {
            return unresolved('unrated', 'missingSeason', trainingEvidence, { heroId });
        }

        const competitiveStats = trainingEvidence.competitive;
        if (!competitiveStats) {
            return unresolved('unrated', 'noCompetitiveData', trainingEvidence, { heroId });
        }

        const rankTier = playerData.profile.competitiveRanks?.[currentSeasonId] || null;
        if (!rankTier) {
            return unresolved('unrated', 'missingCompetitiveRank', trainingEvidence, {
                heroId,
                seasonId: currentSeasonId
            });
        }

        const benchmark = catalog.findSeasonalCompetitive({
            seasonId: currentSeasonId,
            rankTier,
            heroId
        });
        if (!benchmark) {
            return unresolved('unrated', 'noCompatibleBenchmark', trainingEvidence, {
                heroId,
                seasonId: currentSeasonId,
                gameMode: 'competitive',
                rankTier
            });
        }

        return {
            status: 'resolved',
            evaluationState: 'comparable',
            reason: null,
            playerStats: {
                matchesPlayed: Math.round(competitiveStats.matchesPlayed),
                metrics: competitiveStats.metrics
            },
            benchmark,
            source: {
                gameMode: 'competitive',
                seasonId: currentSeasonId,
                rankTier: benchmark.context.rankTier,
                historyWeights: competitiveStats.historyWeights,
                sourceMatches: competitiveStats.sourceMatches,
                provenance: benchmark.source
            },
            trainingEvidence,
            details: { heroId }
        };
    }

    return { blendHistory, resolve };
})();
