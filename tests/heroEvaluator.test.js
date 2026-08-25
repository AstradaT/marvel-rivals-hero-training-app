const test = require('node:test');
const assert = require('node:assert/strict');

const { loadBrowserScripts } = require('./helpers/browserScriptHarness');

function createHarness() {
    return loadBrowserScripts(['data/evaluationModels.js', 'services/heroEvaluator.js']);
}

function benchmark(metrics, matches = 10000) {
    return JSON.stringify({
        sampleSize: { matches },
        metrics
    });
}

test('large compatible sample below benchmark is a distinct weak state', () => {
    const harness = createHarness();
    const result = JSON.parse(harness.evaluate(`JSON.stringify(heroEvaluator.evaluate({
        heroId: 'emma-frost', heroName: 'Emma Frost', role: 'Vanguard',
        playerStats: { matchesPlayed: 40, metrics: { winRate: 0.40 } },
        benchmark: ${benchmark({ winRate: { average: 0.468, unit: 'ratio' } })}
    }))`));

    assert.equal(result.status, 'weak');
    assert.equal(result.evaluationState, 'weak');
    assert.equal(result.reason, 'belowBenchmark');
    assert.equal(result.displayCategory.label, 'Needs practice');
    assert.match(result.explanation, /win rate is below average/);
});

test('low player sample stays unknown even when comparison is computable', () => {
    const harness = createHarness();
    const result = JSON.parse(harness.evaluate(`JSON.stringify(heroEvaluator.evaluate({
        heroId: 'emma-frost', heroName: 'Emma Frost', role: 'Vanguard',
        playerStats: { matchesPlayed: 3, metrics: { winRate: 0.75 } },
        benchmark: ${benchmark({ winRate: { average: 0.468, unit: 'ratio' } })}
    }))`));

    assert.equal(result.status, 'unknown');
    assert.equal(result.evaluationState, 'unknown');
    assert.equal(result.reason, 'insufficientEvidence');
    assert.equal(result.displayCategory.label, 'Needs more data');
    assert.equal(result.confidence.label, 'Very low');
    assert.ok(result.skillScore > 50);
});

test('low confidence remains unknown instead of declaring weak performance', () => {
    const harness = createHarness();
    const result = JSON.parse(harness.evaluate(`JSON.stringify(heroEvaluator.evaluate({
        heroId: 'emma-frost', heroName: 'Emma Frost', role: 'Vanguard',
        playerStats: { matchesPlayed: 9, metrics: { winRate: 0.33125 } },
        benchmark: ${benchmark({ winRate: { average: 0.4737, unit: 'ratio' } }, 11001)}
    }))`));

    assert.equal(result.status, 'unknown');
    assert.equal(result.evaluationState, 'unknown');
    assert.equal(result.reason, 'insufficientEvidence');
    assert.equal(result.confidence.label, 'Low');
    assert.equal(result.displayCategory.label, 'Needs more data');
});

test('missing benchmark sample metadata conservatively limits confidence', () => {
    const harness = createHarness();
    const result = JSON.parse(harness.evaluate(`JSON.stringify(heroEvaluator.evaluate({
        heroId: 'emma-frost', heroName: 'Emma Frost', role: 'Vanguard',
        playerStats: { matchesPlayed: 60, metrics: { winRate: 0.55 } },
        benchmark: {
            metrics: { winRate: { average: 0.468, unit: 'ratio' } },
            sampleSize: { matches: null }
        }
    }))`));

    assert.equal(result.status, 'unknown');
    assert.equal(result.confidence.benchmarkMatches, 0);
    assert.equal(result.confidence.limitingMatches, 0);
});

test('incomplete benchmark records evaluate only compatible available metrics', () => {
    const harness = createHarness();
    const result = JSON.parse(harness.evaluate(`JSON.stringify(heroEvaluator.evaluate({
        heroId: 'loki', heroName: 'Loki', role: 'Strategist',
        playerStats: {
            matchesPlayed: 32,
            metrics: { winRate: 0.55, healingPerMinute: 1600 }
        },
        benchmark: ${benchmark({ winRate: { average: 0.50, unit: 'ratio' } })}
    }))`));

    assert.equal(result.status, 'rated');
    assert.equal(result.comparisons.length, 1);
    assert.equal(result.comparisons[0].metricName, 'winRate');
    assert.equal(result.displayCategory.label, 'Above average');
});

test('metric unit mismatch is unrated rather than converted implicitly', () => {
    const harness = createHarness();
    const result = JSON.parse(harness.evaluate(`JSON.stringify(heroEvaluator.evaluate({
        heroId: 'loki', heroName: 'Loki', role: 'Strategist',
        playerStats: { matchesPlayed: 32, metrics: { healingPerMinute: 1600 } },
        benchmark: ${benchmark({ healingPerMinute: { average: 16000, unit: 'count' } })}
    }))`));

    assert.equal(result.status, 'unrated');
    assert.equal(result.evaluationState, 'unrated');
    assert.equal(result.reason, 'noCompatibleMetrics');
    assert.equal(result.skillScore, null);
    assert.equal(result.displayCategory.label, 'Not rated yet');
});

test('confidence is limited by both player and benchmark samples', () => {
    const harness = createHarness();

    assert.equal(harness.evaluate("heroEvaluator.getConfidence(60, 5).key"), 'veryLow');
    assert.equal(harness.evaluate("heroEvaluator.getConfidence(60, 6).key"), 'low');
    assert.equal(harness.evaluate("heroEvaluator.getConfidence(60, 16).key"), 'medium');
    assert.equal(harness.evaluate("heroEvaluator.getConfidence(60, 31).key"), 'high');
    assert.equal(harness.evaluate("heroEvaluator.getConfidence(60, 1000).key"), 'veryHigh');
});

test('hero-specific metric overrides extend canonical role models', () => {
    const harness = createHarness();
    harness.evaluate(`evaluationModels.heroOverrides.loki = {
        metrics: {
            heroSpecificValue: {
                label: 'hero-specific value', unit: 'count', direction: 'higher', weight: 0.10,
                positive: 'Your hero-specific value is above average.',
                negative: 'Your hero-specific value is below average.'
            }
        }
    }`);
    const metricNames = JSON.parse(harness.evaluate(
        "JSON.stringify(Object.keys(evaluationModels.getEvaluationModel('Strategist', 'loki').metrics))"
    ));

    assert.ok(metricNames.includes('healingPerMinute'));
    assert.ok(metricNames.includes('heroSpecificValue'));
});
