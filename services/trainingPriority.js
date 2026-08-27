const trainingPriority = (() => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const COMPETITIVE_FAMILIARITY_FACTOR = 0.35;
    const EXPERIENCE_DECAY_MATCHES = 12;
    const PERSONAL_RELIABILITY_PRIOR = 8;
    const MEANINGFUL_WIN_RATE_GAP = 0.08;

    function clamp(value, minimum, maximum) {
        return Math.min(maximum, Math.max(minimum, value));
    }

    function round(value, precision = 2) {
        const multiplier = 10 ** precision;
        return Math.round(value * multiplier) / multiplier;
    }

    function getRecordedMatchResults(heroId, trainingSessions) {
        return (trainingSessions || [])
            .filter(session => session.heroId === heroId)
            .flatMap(session => (session.matchResults || []).map(result => ({
                ...result,
                playedAt: result.playedAt || session.playedAt,
                seasonId: session.seasonId
            })));
    }

    function getTimestamp(value) {
        if (typeof value !== 'string' || !value.trim()) return null;
        const timestamp = new Date(value).getTime();
        return Number.isFinite(timestamp) ? timestamp : null;
    }

    function countResultsAfter(results, updatedAt) {
        const boundary = getTimestamp(updatedAt);
        if (boundary === null) return 0;
        return results.filter(result => {
            const playedAt = getTimestamp(result.playedAt);
            return playedAt !== null && playedAt > boundary;
        }).length;
    }

    function getModeExperience(heroStats, mode, recordedResults) {
        const modeResults = recordedResults.filter(result => result.gameMode === mode);
        const ledgerMatches = modeResults.length;
        const overall = heroStats?.overall?.[mode];
        const overallMatches = Math.max(0, Number(overall?.matchesPlayed) || 0);
        const overallCandidate = overall
            ? overallMatches + countResultsAfter(modeResults, overall.updatedAt)
            : ledgerMatches;

        const seasonEntries = Object.entries(heroStats?.seasons || {})
            .filter(([, period]) => period?.[mode]);
        const seasonsWithSnapshots = new Set(seasonEntries.map(([seasonId]) => seasonId));
        const seasonalBase = seasonEntries.reduce((total, [seasonId, period]) => {
            const snapshot = period[mode];
            const seasonResults = modeResults.filter(result => result.seasonId === seasonId);
            return total
                + Math.max(0, Number(snapshot.matchesPlayed) || 0)
                + countResultsAfter(seasonResults, snapshot.updatedAt);
        }, 0);
        const unsnapshottedSeasonMatches = modeResults.filter(result => (
            result.seasonId && !seasonsWithSnapshots.has(result.seasonId)
        )).length;
        const seasonalCandidate = seasonEntries.length > 0
            ? seasonalBase + unsnapshottedSeasonMatches
            : ledgerMatches;

        return Math.max(overallCandidate, seasonalCandidate, ledgerMatches);
    }

    function getExperience(heroStats, trainingSessions = [], heroId = null) {
        const recordedResults = heroId
            ? getRecordedMatchResults(heroId, trainingSessions)
            : [];
        const quickPlayMatches = getModeExperience(heroStats, 'quickPlay', recordedResults);
        const competitiveMatches = getModeExperience(heroStats, 'competitive', recordedResults);
        return {
            quickPlayMatches,
            competitiveMatches,
            effectiveMatches: quickPlayMatches
                + (competitiveMatches * COMPETITIVE_FAMILIARITY_FACTOR)
        };
    }

    function getExperienceMatches(heroStats) {
        return getExperience(heroStats).effectiveMatches;
    }

    function isUsableQuickPlaySnapshot(snapshot) {
        return Number(snapshot?.matchesPlayed) > 0
            && Number.isFinite(Number(snapshot?.metrics?.winRate));
    }

    function getQuickPlayEvidence(heroStats, currentSeasonId) {
        const current = currentSeasonId
            ? heroStats?.seasons?.[currentSeasonId]?.quickPlay
            : null;
        const overall = heroStats?.overall?.quickPlay;
        const hasCurrent = isUsableQuickPlaySnapshot(current);
        const hasOverall = isUsableQuickPlaySnapshot(overall);

        if (!hasCurrent && !hasOverall) {
            const latestSeasonal = Object.entries(heroStats?.seasons || {})
                .filter(([, period]) => isUsableQuickPlaySnapshot(period?.quickPlay))
                .sort((left, right) => {
                    const leftDate = left[1].quickPlay.updatedAt || '';
                    const rightDate = right[1].quickPlay.updatedAt || '';
                    return String(rightDate).localeCompare(String(leftDate))
                        || right[0].localeCompare(left[0]);
                })[0];
            if (!latestSeasonal) return null;

            return {
                matchesPlayed: Number(latestSeasonal[1].quickPlay.matchesPlayed),
                winRate: Number(latestSeasonal[1].quickPlay.metrics.winRate),
                source: 'manualSnapshot',
                updatedAt: latestSeasonal[1].quickPlay.updatedAt || null,
                seasonWeight: 1,
                overallWeight: 0,
                scope: 'season',
                seasonId: latestSeasonal[0]
            };
        }
        if (hasCurrent && !hasOverall) {
            return {
                matchesPlayed: Number(current.matchesPlayed),
                winRate: Number(current.metrics.winRate),
                source: 'manualSnapshot',
                updatedAt: current.updatedAt || null,
                seasonWeight: 1,
                overallWeight: 0,
                scope: 'season',
                seasonId: currentSeasonId
            };
        }
        if (!hasCurrent && hasOverall) {
            return {
                matchesPlayed: Number(overall.matchesPlayed),
                winRate: Number(overall.metrics.winRate),
                source: 'manualSnapshot',
                updatedAt: overall.updatedAt || null,
                seasonWeight: 0,
                overallWeight: 1,
                scope: 'overall'
            };
        }

        const currentMatches = Number(current.matchesPlayed);
        const overallMatches = Number(overall.matchesPlayed);
        const seasonWeight = Math.min(1, 0.25 + ((currentMatches / 30) * 0.75));
        const overallWeight = 1 - seasonWeight;
        const currentUpdatedAt = getTimestamp(current.updatedAt);
        const overallUpdatedAt = getTimestamp(overall.updatedAt);
        const combinedUpdatedAt = currentUpdatedAt !== null && overallUpdatedAt !== null
            ? new Date(Math.max(currentUpdatedAt, overallUpdatedAt)).toISOString()
            : null;
        return {
            matchesPlayed: currentMatches + (Math.min(30, overallMatches) * overallWeight),
            winRate: (
                (Number(current.metrics.winRate) * seasonWeight)
                + (Number(overall.metrics.winRate) * overallWeight)
            ),
            source: 'manualSnapshot',
            updatedAt: combinedUpdatedAt,
            seasonWeight,
            overallWeight,
            scope: 'blended',
            seasonId: currentSeasonId
        };
    }

    function getTrainingLedgerEvidence(
        heroId,
        trainingSessions,
        currentSeasonId,
        manualEvidence = null
    ) {
        const quickPlayResults = getRecordedMatchResults(heroId, trainingSessions)
            .filter(result => (
                result.gameMode === 'quickPlay'
                && ['win', 'loss'].includes(result.outcome)
            ));
        const currentSeasonResults = currentSeasonId
            ? quickPlayResults.filter(result => result.seasonId === currentSeasonId)
            : [];
        let evidenceResults;
        if (manualEvidence) {
            const boundary = getTimestamp(manualEvidence.updatedAt);
            if (boundary === null) return null;
            const contextResults = manualEvidence.scope === 'overall'
                ? quickPlayResults
                : quickPlayResults.filter(result => result.seasonId === manualEvidence.seasonId);
            evidenceResults = contextResults.filter(result => {
                const playedAt = getTimestamp(result.playedAt);
                return playedAt !== null && playedAt > boundary;
            });
        } else {
            evidenceResults = currentSeasonResults.length > 0
                ? currentSeasonResults
                : quickPlayResults;
        }
        if (evidenceResults.length === 0) return null;

        return {
            matchesPlayed: evidenceResults.length,
            winRate: evidenceResults.filter(result => result.outcome === 'win').length
                / evidenceResults.length,
            source: 'trainingLedger',
            seasonWeight: manualEvidence?.seasonWeight
                ?? (currentSeasonResults.length > 0 ? 1 : 0),
            overallWeight: manualEvidence?.overallWeight
                ?? (currentSeasonResults.length > 0 ? 0 : 1),
            scope: manualEvidence?.scope
                || (currentSeasonResults.length > 0 ? 'season' : 'overall'),
            ...(manualEvidence?.seasonId || currentSeasonResults.length > 0
                ? { seasonId: manualEvidence?.seasonId || currentSeasonId }
                : {})
        };
    }

    function combineQuickPlayEvidence(manualEvidence, ledgerEvidence) {
        if (!manualEvidence) return ledgerEvidence;
        if (!ledgerEvidence) return manualEvidence;

        const matchesPlayed = manualEvidence.matchesPlayed + ledgerEvidence.matchesPlayed;
        return {
            ...manualEvidence,
            matchesPlayed,
            winRate: (
                (manualEvidence.winRate * manualEvidence.matchesPlayed)
                + (ledgerEvidence.winRate * ledgerEvidence.matchesPlayed)
            ) / matchesPlayed,
            source: 'manualSnapshot+trainingLedger',
            ledgerMatchesAdded: ledgerEvidence.matchesPlayed
        };
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

    function getBenchmarkAgreement(communityBenchmark, officialBenchmarks = []) {
        const communityValue = Number(communityBenchmark?.metrics?.shrunkWinRate?.average);
        const officialValues = officialBenchmarks
            .map(record => Number(record?.metrics?.winRate?.average))
            .filter(Number.isFinite);
        if (!Number.isFinite(communityValue) || officialValues.length === 0) {
            return { multiplier: 0.85, closestDifference: null, validationCount: 0 };
        }

        const closestDifference = Math.min(
            ...officialValues.map(value => Math.abs(value - communityValue))
        );
        return {
            multiplier: closestDifference <= 0.02
                ? 1
                : closestDifference <= 0.05
                    ? 0.8
                    : 0.5,
            closestDifference,
            validationCount: officialValues.length
        };
    }

    function getContextCompatibility(quickPlayEvidence, playerSeasonId, benchmarkSeasonId) {
        if (!quickPlayEvidence) return 0;
        if (quickPlayEvidence.scope === 'overall') return 0.6;
        if (playerSeasonId === benchmarkSeasonId) return 1;

        const playerBase = String(playerSeasonId || '').match(/^season-(\d+)/)?.[1];
        const benchmarkBase = String(benchmarkSeasonId || '').match(/^season-(\d+)/)?.[1];
        return playerBase && playerBase === benchmarkBase ? 0.8 : 0.55;
    }

    function getQuickPlayPerformance({
        heroId,
        heroStats,
        trainingSessions = [],
        currentSeasonId,
        communityBenchmark,
        officialBenchmarks = []
    }) {
        const manualEvidence = getQuickPlayEvidence(heroStats, currentSeasonId);
        const ledgerEvidence = getTrainingLedgerEvidence(
            heroId,
            trainingSessions,
            currentSeasonId,
            manualEvidence
        );
        const evidence = combineQuickPlayEvidence(manualEvidence, ledgerEvidence);
        const benchmarkValue = Number(communityBenchmark?.metrics?.shrunkWinRate?.average);
        if (!evidence || !Number.isFinite(benchmarkValue)) {
            return {
                evidence,
                benchmarkValue: null,
                reliability: 0,
                quality: 0,
                gap: 0,
                signal: 0,
                agreement: getBenchmarkAgreement(communityBenchmark, officialBenchmarks)
            };
        }

        const reliability = evidence.matchesPlayed
            / (evidence.matchesPlayed + PERSONAL_RELIABILITY_PRIOR);
        const agreement = getBenchmarkAgreement(communityBenchmark, officialBenchmarks);
        const compatibility = getContextCompatibility(
            evidence,
            evidence.seasonId,
            communityBenchmark.context?.seasonId
        );
        const benchmarkMatches = Number(communityBenchmark.sampleSize?.matches) || 0;
        const benchmarkReliability = benchmarkMatches > 0
            ? benchmarkMatches / (benchmarkMatches + 400)
            : 0.5;
        const quality = agreement.multiplier * compatibility * benchmarkReliability;
        const gap = clamp(
            (benchmarkValue - evidence.winRate) / MEANINGFUL_WIN_RATE_GAP,
            -1,
            1
        );
        const signal = gap >= 0
            ? 1.25 * gap * reliability * quality
            : 0.25 * gap * reliability * quality;

        return {
            evidence,
            benchmarkValue,
            reliability,
            quality,
            gap,
            signal,
            agreement
        };
    }

    function buildReasons({
        exploration,
        lowExperience,
        experience,
        recency,
        quickPlayPerformance,
        evidenceCollection,
        competitiveNeed
    }) {
        const reasons = [];
        const quickMatches = quickPlayPerformance.evidence?.matchesPlayed || 0;

        if (quickPlayPerformance.signal >= 0.1) {
            reasons.push({
                strength: quickPlayPerformance.signal + 0.2,
                text: `Your early Quick Match results are below the Counterwatch community baseline; influence is limited by ${Math.round(quickMatches)} recorded matches.`
            });
        }
        if (exploration > 0) {
            reasons.push({
                strength: exploration,
                text: 'This hero has no recorded match experience, so it is prioritized for exploration.'
            });
        }
        if (evidenceCollection >= 0.2) {
            reasons.push({
                strength: evidenceCollection + 0.15,
                text: quickMatches > 0
                    ? `Only ${Math.round(quickMatches)} effective Quick Match matches are recorded, so Training is gathering evidence without judging performance.`
                    : 'No Quick Match results are saved yet, so Training is gathering evidence without judging performance.'
            });
        }
        if (recency.daysSincePlayed === null) {
            reasons.push({
                strength: 1,
                text: 'This hero has no recorded training sessions yet.'
            });
        } else if (recency.daysSincePlayed >= 7) {
            reasons.push({
                strength: Math.min(1, recency.daysSincePlayed / 30),
                text: `You last trained this hero ${Math.floor(recency.daysSincePlayed)} days ago.`
            });
        }
        if (lowExperience >= 0.35 && exploration === 0) {
            reasons.push({
                strength: lowExperience,
                text: experience.competitiveMatches > 0
                    ? 'Your effective familiarity is still limited; Competitive matches count only partially for Training.'
                    : 'Your Quick Match experience with this hero is still limited.'
            });
        }
        if (competitiveNeed > 0) {
            reasons.push({
                strength: competitiveNeed + 0.1,
                text: 'Compatible Competitive results add a small secondary practice signal.'
            });
        }

        const selected = reasons.sort((left, right) => right.strength - left.strength)
            .slice(0, 2)
            .map(item => item.text);
        return selected.length > 0
            ? selected
            : ['Selected to balance practice variety with your current hero history.'];
    }

    function score({
        heroId,
        heroStats,
        trainingSessions = [],
        evaluation = null,
        currentSeasonId = null,
        communityBenchmark = null,
        officialBenchmarks = [],
        now = Date.now()
    }) {
        const nowTimestamp = new Date(now).getTime();
        const safeNow = Number.isFinite(nowTimestamp) ? nowTimestamp : Date.now();
        const experience = getExperience(heroStats, trainingSessions, heroId);
        const recency = getRecency(heroId, trainingSessions, safeNow);
        const exploration = experience.effectiveMatches === 0 ? 1.25 : 0;
        const lowExperience = Math.exp(-experience.effectiveMatches / EXPERIENCE_DECAY_MATCHES);
        const recencySignal = recency.daysSincePlayed === null
            ? 1
            : clamp(recency.daysSincePlayed / 30, 0, 1);
        const quickPlayPerformance = getQuickPlayPerformance({
            heroId,
            heroStats,
            trainingSessions,
            currentSeasonId,
            communityBenchmark,
            officialBenchmarks
        });
        const evidenceReliability = quickPlayPerformance.evidence
            ? quickPlayPerformance.reliability
            : 0;
        const evidenceCollection = 0.5 * (1 - evidenceReliability);
        const competitiveNeed = evaluation?.evaluationState === 'weak' ? 0.35 : 0;
        const recentPenalty = recency.daysSincePlayed !== null && recency.daysSincePlayed < 1
            ? 0.75
            : 0;
        const weight = round(clamp(
            1
            + exploration
            + lowExperience
            + recencySignal
            + quickPlayPerformance.signal
            + evidenceCollection
            + competitiveNeed
            - recentPenalty,
            0.25,
            5
        ));
        const reasons = buildReasons({
            exploration,
            lowExperience,
            experience,
            recency,
            quickPlayPerformance,
            evidenceCollection,
            competitiveNeed
        });

        return {
            heroId,
            weight,
            experienceMatches: round(experience.effectiveMatches),
            experience,
            ...recency,
            evaluationState: evaluation?.evaluationState || 'unrated',
            reason: reasons.join(' '),
            reasons,
            quickPlayPerformance: {
                playerMatches: round(quickPlayPerformance.evidence?.matchesPlayed || 0),
                playerWinRate: quickPlayPerformance.evidence?.winRate ?? null,
                evidenceSource: quickPlayPerformance.evidence?.source || null,
                benchmarkWinRate: quickPlayPerformance.benchmarkValue,
                reliability: round(quickPlayPerformance.reliability, 4),
                quality: round(quickPlayPerformance.quality, 4),
                agreementDifference: quickPlayPerformance.agreement.closestDifference,
                signal: round(quickPlayPerformance.signal, 4)
            },
            signals: {
                exploration: round(exploration),
                experience: round(lowExperience),
                recency: round(recencySignal),
                quickPlayPerformance: round(quickPlayPerformance.signal, 4),
                evidenceCollection: round(evidenceCollection, 4),
                competitive: round(competitiveNeed),
                recentPenalty: round(recentPenalty)
            }
        };
    }

    return {
        getExperience,
        getExperienceMatches,
        getQuickPlayEvidence,
        getTrainingLedgerEvidence,
        combineQuickPlayEvidence,
        getQuickPlayPerformance,
        score
    };
})();
