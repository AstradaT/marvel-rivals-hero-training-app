const test = require('node:test');
const assert = require('node:assert/strict');

const { loadBrowserScripts } = require('./helpers/browserScriptHarness');

test('unexplored heroes receive a larger priority than recently trained established heroes', () => {
    const harness = loadBrowserScripts(['services/trainingPriority.js']);
    const result = JSON.parse(harness.evaluate(`JSON.stringify({
        unexplored: trainingPriority.score({
            heroId: 'storm', heroStats: null, trainingSessions: [],
            now: '2026-08-25T12:00:00.000Z'
        }),
        recent: trainingPriority.score({
            heroId: 'magneto',
            heroStats: {
                overall: { competitive: { matchesPlayed: 80 } }, seasons: {}
            },
            trainingSessions: [{
                heroId: 'magneto', playedAt: '2026-08-25T10:00:00.000Z'
            }],
            evaluation: { evaluationState: 'known', skillScore: 55 },
            now: '2026-08-25T12:00:00.000Z'
        })
    })`));

    assert.ok(result.unexplored.weight > result.recent.weight);
    assert.match(result.unexplored.reason, /exploration/);
    assert.equal(result.recent.signals.recentPenalty, 0.75);
});

test('weak compatible performance is an explicit priority signal', () => {
    const harness = loadBrowserScripts(['services/trainingPriority.js']);
    const priority = JSON.parse(harness.evaluate(`JSON.stringify(trainingPriority.score({
        heroId: 'emma-frost',
        heroStats: {
            overall: {},
            seasons: { 'season-9-5': { competitive: { matchesPlayed: 30 } } }
        },
        trainingSessions: [{
            heroId: 'emma-frost', playedAt: '2026-08-10T12:00:00.000Z'
        }],
        evaluation: { evaluationState: 'weak', skillScore: 40 },
        now: '2026-08-25T12:00:00.000Z'
    }))`));

    assert.equal(priority.signals.competitive, 0.35);
    assert.equal(priority.evaluationState, 'weak');
    assert.ok(priority.weight > 2);
});

test('experience avoids double counting history and discounts Competitive familiarity', () => {
    const harness = loadBrowserScripts(['services/trainingPriority.js']);
    assert.equal(harness.evaluate(`trainingPriority.getExperienceMatches({
        overall: {
            quickPlay: { matchesPlayed: 20 }, competitive: { matchesPlayed: 10 }
        },
        seasons: {
            'season-9': { competitive: { matchesPlayed: 12 } },
            'season-9-5': { competitive: { matchesPlayed: 8 } }
        }
    })`), 27);
});

test('Quick Match weakness grows gradually as personal evidence becomes more reliable', () => {
    const harness = loadBrowserScripts(['services/trainingPriority.js']);
    harness.evaluate(`benchmark = {
        context: { seasonId: 'season-9' },
        metrics: { shrunkWinRate: { average: 0.55 } },
        sampleSize: { matches: 20000 }
    }`);
    harness.evaluate(`official = [{ metrics: { winRate: { average: 0.54 } } }]`);
    const result = JSON.parse(harness.evaluate(`JSON.stringify({
        early: trainingPriority.score({
            heroId: 'storm', currentSeasonId: 'season-9',
            heroStats: { overall: {}, seasons: {
                'season-9': { quickPlay: { matchesPlayed: 3, metrics: { winRate: 0.33 } } }
            } },
            trainingSessions: [{
                heroId: 'storm', playedAt: '2026-08-23T12:00:00.000Z'
            }],
            now: '2026-08-25T12:00:00.000Z',
            communityBenchmark: benchmark, officialBenchmarks: official
        }),
        established: trainingPriority.score({
            heroId: 'storm', currentSeasonId: 'season-9',
            heroStats: { overall: {}, seasons: {
                'season-9': { quickPlay: { matchesPlayed: 16, metrics: { winRate: 0.33 } } }
            } },
            communityBenchmark: benchmark, officialBenchmarks: official
        })
    })`));

    assert.ok(result.early.signals.quickPlayPerformance > 0);
    assert.ok(result.established.signals.quickPlayPerformance
        > result.early.signals.quickPlayPerformance);
    assert.match(result.early.reason, /Counterwatch community baseline/);
    assert.ok(result.early.reasons.length <= 2);
});

test('strong early Quick Match results only apply a small relief to priority', () => {
    const harness = loadBrowserScripts(['services/trainingPriority.js']);
    const priority = JSON.parse(harness.evaluate(`JSON.stringify(trainingPriority.score({
        heroId: 'rogue', currentSeasonId: 'season-9',
        heroStats: { overall: {}, seasons: {
            'season-9': { quickPlay: { matchesPlayed: 4, metrics: { winRate: 0.75 } } }
        } },
        communityBenchmark: {
            context: { seasonId: 'season-9' },
            metrics: { shrunkWinRate: { average: 0.51 } },
            sampleSize: { matches: 10000 }
        },
        officialBenchmarks: [{ metrics: { winRate: { average: 0.52 } } }]
    }))`));

    assert.ok(priority.signals.quickPlayPerformance < 0);
    assert.ok(priority.signals.quickPlayPerformance >= -0.25);
    assert.ok(priority.signals.evidenceCollection > 0);
});

test('official values validate agreement without replacing the Counterwatch baseline', () => {
    const harness = loadBrowserScripts(['services/trainingPriority.js']);
    harness.evaluate(`heroStats = { overall: {}, seasons: {
        'season-9': { quickPlay: { matchesPlayed: 16, metrics: { winRate: 0.4 } } }
    } }`);
    harness.evaluate(`community = {
        context: { seasonId: 'season-9' },
        metrics: { shrunkWinRate: { average: 0.55 } },
        sampleSize: { matches: 20000 }
    }`);
    const result = JSON.parse(harness.evaluate(`JSON.stringify({
        agreed: trainingPriority.getQuickPlayPerformance({
            heroStats, currentSeasonId: 'season-9', communityBenchmark: community,
            officialBenchmarks: [{ metrics: { winRate: { average: 0.54 } } }]
        }),
        disagreed: trainingPriority.getQuickPlayPerformance({
            heroStats, currentSeasonId: 'season-9', communityBenchmark: community,
            officialBenchmarks: [{ metrics: { winRate: { average: 0.45 } } }]
        })
    })`));

    assert.equal(result.agreed.benchmarkValue, 0.55);
    assert.equal(result.disagreed.benchmarkValue, 0.55);
    assert.ok(result.agreed.signal > result.disagreed.signal);
});

test('older seasonal Quick Match data remains evidence with reduced context compatibility', () => {
    const harness = loadBrowserScripts(['services/trainingPriority.js']);
    const result = JSON.parse(harness.evaluate(`JSON.stringify(trainingPriority.score({
        heroId: 'psylocke', currentSeasonId: 'season-9-5',
        heroStats: { overall: {}, seasons: {
            'season-5': { quickPlay: {
                matchesPlayed: 12, metrics: { winRate: 0.4 },
                updatedAt: '2026-08-25T02:32:06.000Z'
            } }
        } },
        communityBenchmark: {
            context: { seasonId: 'season-9' },
            metrics: { shrunkWinRate: { average: 0.52 } },
            sampleSize: { matches: 10000 }
        },
        officialBenchmarks: [{ metrics: { winRate: { average: 0.51 } } }]
    }))`));

    assert.equal(result.quickPlayPerformance.playerMatches, 12);
    assert.ok(result.quickPlayPerformance.signal > 0);
    assert.ok(result.quickPlayPerformance.quality < 0.6);
    assert.doesNotMatch(result.reason, /No Quick Match results are saved/);
});
