const evaluationModels = (() => {
    const sharedMetrics = {
        winRate: {
            label: 'win rate',
            unit: 'ratio',
            direction: 'higher',
            positive: 'Your win rate is above average.',
            negative: 'Your win rate is below average.'
        },
        deathsPerMinute: {
            label: 'survival',
            unit: 'perMinute',
            direction: 'lower',
            positive: 'You die less often than expected.',
            negative: 'You die more often than expected.'
        }
    };

    const roleModels = {
        Duelist: {
            metrics: {
                winRate: { ...sharedMetrics.winRate, weight: 0.30 },
                killsPerMinute: {
                    label: 'eliminations',
                    unit: 'perMinute',
                    direction: 'higher',
                    weight: 0.25,
                    positive: 'Your elimination output is above average.',
                    negative: 'Your elimination output is below average.'
                },
                deathsPerMinute: { ...sharedMetrics.deathsPerMinute, weight: 0.20 },
                damagePerMinute: {
                    label: 'damage',
                    unit: 'perMinute',
                    direction: 'higher',
                    weight: 0.25,
                    positive: 'Your damage output is above average.',
                    negative: 'Your damage output is below average.'
                }
            }
        },
        Vanguard: {
            metrics: {
                winRate: { ...sharedMetrics.winRate, weight: 0.30 },
                deathsPerMinute: { ...sharedMetrics.deathsPerMinute, weight: 0.25 },
                damagePerMinute: {
                    label: 'damage',
                    unit: 'perMinute',
                    direction: 'higher',
                    weight: 0.20,
                    positive: 'Your damage output is above average.',
                    negative: 'Your damage output is below average.'
                },
                damageTakenPerMinute: {
                    label: 'damage absorbed',
                    unit: 'perMinute',
                    direction: 'higher',
                    weight: 0.25,
                    positive: 'You absorb more damage than expected.',
                    negative: 'You absorb less damage than expected.'
                }
            }
        },
        Strategist: {
            metrics: {
                winRate: { ...sharedMetrics.winRate, weight: 0.25 },
                deathsPerMinute: { ...sharedMetrics.deathsPerMinute, weight: 0.20 },
                assistsPerMinute: {
                    label: 'assists',
                    unit: 'perMinute',
                    direction: 'higher',
                    weight: 0.20,
                    positive: 'Your assist output is above average.',
                    negative: 'Your assist output is below average.'
                },
                healingPerMinute: {
                    label: 'healing',
                    unit: 'perMinute',
                    direction: 'higher',
                    weight: 0.35,
                    positive: 'Your healing output is above average.',
                    negative: 'Your healing output is below average.'
                }
            }
        }
    };

    // Add only evidence-backed exceptions here as hero-specific models become
    // available. Empty production overrides avoid pretending every hero is known.
    const heroOverrides = {};

    function getEvaluationModel(role, heroId) {
        const baseModel = roleModels[role];
        if (!baseModel) return null;

        const override = heroOverrides[heroId];
        return {
            metrics: {
                ...baseModel.metrics,
                ...(override?.metrics || {})
            }
        };
    }

    return { getEvaluationModel, heroOverrides, roleModels };
})();
