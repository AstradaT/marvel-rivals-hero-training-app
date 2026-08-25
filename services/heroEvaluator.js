const heroEvaluator = (() => {
    // Evaluates one normalized player snapshot against one matched benchmark.
    // Time-horizon and game-mode blending belongs in a separate resolver.
    const CONFIDENCE_LEVELS = [
        { minimumMatches: 60, key: 'veryHigh', label: 'Very high' },
        { minimumMatches: 31, key: 'high', label: 'High' },
        { minimumMatches: 16, key: 'medium', label: 'Medium' },
        { minimumMatches: 6, key: 'low', label: 'Low' },
        { minimumMatches: 0, key: 'veryLow', label: 'Very low' }
    ];

    function clamp(value, minimum, maximum) {
        return Math.min(maximum, Math.max(minimum, value));
    }

    function getConfidence(playerMatchesPlayed, benchmarkMatches = 0) {
        const playerMatches = Math.max(0, Math.floor(Number(playerMatchesPlayed) || 0));
        const benchmarkSample = Math.max(0, Math.floor(Number(benchmarkMatches) || 0));
        const limitingMatches = Math.min(playerMatches, benchmarkSample);
        const level = CONFIDENCE_LEVELS.find(item => limitingMatches >= item.minimumMatches);

        return {
            ...level,
            playerMatches,
            benchmarkMatches: benchmarkSample,
            limitingMatches,
            score: Math.round(clamp(limitingMatches / 60, 0, 1) * 100)
        };
    }

    function getProficiency(score) {
        if (score >= 65) return { key: 'strong', label: 'Strong' };
        if (score >= 55) return { key: 'aboveAverage', label: 'Above average' };
        if (score >= 45) return { key: 'average', label: 'Average' };
        return { key: 'needsPractice', label: 'Needs practice' };
    }

    function buildExplanation(comparisons) {
        const meaningfulFactors = comparisons
            .filter(comparison => Math.abs(comparison.normalizedDifference) >= 0.05)
            .sort((a, b) => Math.abs(b.weightedDifference) - Math.abs(a.weightedDifference))
            .slice(0, 2);

        if (meaningfulFactors.length === 0) {
            return 'Your available stats are close to the expected range.';
        }

        return meaningfulFactors
            .map(factor => factor.normalizedDifference >= 0 ? factor.positive : factor.negative)
            .join(' ');
    }

    function evaluate({ heroId, heroName, role, playerStats, benchmark }) {
        const model = evaluationModels.getEvaluationModel(role, heroId);
        const playerMetrics = playerStats?.metrics || {};
        const benchmarkMetrics = benchmark?.metrics || {};
        const benchmarkMatches = benchmark?.sampleSize?.matches
            || Math.min(...Object.values(benchmarkMetrics)
                .map(metric => Number(metric?.sampleSize?.matches))
                .filter(matches => Number.isFinite(matches) && matches > 0), Infinity);
        const confidence = getConfidence(
            playerStats?.matchesPlayed,
            Number.isFinite(benchmarkMatches) ? benchmarkMatches : 0
        );

        if (!model) {
            return {
                status: 'unrated',
                evaluationState: 'unrated',
                reason: 'missingRoleModel',
                displayCategory: { key: 'unrated', label: 'Not rated yet' },
                confidence,
                skillScore: null,
                proficiency: null,
                comparisons: [],
                summary: 'No evaluation model is available for this role yet.',
                explanation: 'Add a role evaluation model before comparing this hero.'
            };
        }

        const comparisons = Object.entries(model.metrics).reduce((results, [metricName, config]) => {
            const playerValue = Number(playerMetrics[metricName]);
            const benchmarkValue = Number(benchmarkMetrics[metricName]?.average);
            if (
                !Number.isFinite(playerValue)
                || !Number.isFinite(benchmarkValue)
                || benchmarkValue < 0
                || benchmarkMetrics[metricName]?.unit !== config.unit
            ) return results;

            const rawDifference = (playerValue - benchmarkValue) / Math.max(benchmarkValue, 1);
            const normalizedDifference = clamp(
                config.direction === 'lower' ? -rawDifference : rawDifference,
                -0.5,
                0.5
            );

            results.push({
                metricName,
                label: config.label,
                playerValue,
                benchmarkValue,
                normalizedDifference,
                weightedDifference: normalizedDifference * config.weight,
                weight: config.weight,
                positive: config.positive,
                negative: config.negative
            });
            return results;
        }, []);

        if (comparisons.length === 0) {
            return {
                status: 'unrated',
                evaluationState: 'unrated',
                reason: 'noCompatibleMetrics',
                displayCategory: { key: 'unrated', label: 'Not rated yet' },
                confidence,
                skillScore: null,
                proficiency: null,
                comparisons: [],
                summary: `We cannot evaluate ${heroName || 'this hero'} from the available stats yet.`,
                explanation: 'Add player stats and a benchmark with at least one matching metric.'
            };
        }

        const comparedWeight = comparisons.reduce((total, item) => total + item.weight, 0);
        const weightedDifference = comparisons.reduce(
            (total, item) => total + item.weightedDifference,
            0
        ) / comparedWeight;
        const skillScore = Math.round((50 + weightedDifference * 100) * 10) / 10;
        const proficiency = getProficiency(skillScore);
        const needsMoreEvidence = confidence.key === 'veryLow';
        const displayCategory = needsMoreEvidence
            ? { key: 'needsMoreData', label: 'Needs more data' }
            : proficiency;
        const isWeak = !needsMoreEvidence && proficiency.key === 'needsPractice';

        return {
            status: needsMoreEvidence ? 'unknown' : isWeak ? 'weak' : 'rated',
            evaluationState: needsMoreEvidence ? 'unknown' : isWeak ? 'weak' : 'known',
            reason: needsMoreEvidence ? 'insufficientEvidence' : isWeak ? 'belowBenchmark' : null,
            displayCategory,
            confidence,
            skillScore,
            proficiency,
            comparisons,
            summary: needsMoreEvidence
                ? `We need more matches before judging your ${heroName || 'hero'} performance.`
                : `You're performing ${proficiency.key === 'needsPractice' ? 'below' : proficiency.key === 'average' ? 'around' : 'above'} the expected level for ${heroName || 'this hero'}.`,
            explanation: buildExplanation(comparisons)
        };
    }

    return { evaluate, getConfidence };
})();
