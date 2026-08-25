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

    assert.equal(priority.signals.performance, 2);
    assert.match(priority.reason, /below the benchmark/);
    assert.ok(priority.weight > 3);
});

test('experience uses the larger overall or seasonal view instead of double counting history', () => {
    const harness = loadBrowserScripts(['services/trainingPriority.js']);
    assert.equal(harness.evaluate(`trainingPriority.getExperienceMatches({
        overall: {
            quickPlay: { matchesPlayed: 20 }, competitive: { matchesPlayed: 10 }
        },
        seasons: {
            'season-9': { competitive: { matchesPlayed: 12 } },
            'season-9-5': { competitive: { matchesPlayed: 8 } }
        }
    })`), 30);
});
