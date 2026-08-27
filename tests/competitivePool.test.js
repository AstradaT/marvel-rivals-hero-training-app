const test = require('node:test');
const assert = require('node:assert/strict');

const { loadBrowserScripts } = require('./helpers/browserScriptHarness');

function loadPool() {
    return loadBrowserScripts(['services/competitivePool.js']);
}

test('competitive pool turns a known peer evaluation into a recommendation', () => {
    const harness = loadPool();
    const entry = JSON.parse(harness.evaluate(`JSON.stringify(competitivePool.createEntry({
        hero: { id: 'loki', name: 'Loki', role: 'Strategist', staticImg: 'loki.jpg' },
        resolution: { status: 'resolved', source: { rankTier: 'Gold', seasonId: 'season-9-5' } },
        evaluation: {
            evaluationState: 'known', skillScore: 64,
            proficiency: { label: 'Above average' },
            confidence: { label: 'High', score: 75, playerMatches: 42 },
            summary: 'Above peers.', explanation: 'Strong healing.'
        },
        priority: { daysSincePlayed: 2 }
    }))`));

    assert.equal(entry.state, 'ready');
    assert.equal(entry.stateLabel, 'Recommended');
    assert.equal(entry.rankTier, 'Gold');
    assert.equal(entry.competitiveMatches, 42);
    assert.ok(entry.recommendationScore > 60);
});

test('low-confidence and weak evaluations remain outside the recommended pool', () => {
    const harness = loadPool();
    const states = JSON.parse(harness.evaluate(`JSON.stringify([
        competitivePool.createEntry({
            hero: { id: 'luna-snow', name: 'Luna Snow', role: 'Strategist' },
            resolution: { status: 'resolved' },
            evaluation: { evaluationState: 'unknown', confidence: { label: 'Low', score: 10 } }
        }).state,
        competitivePool.createEntry({
            hero: { id: 'magneto', name: 'Magneto', role: 'Vanguard' },
            resolution: { status: 'resolved' },
            evaluation: { evaluationState: 'weak', skillScore: 39, confidence: { label: 'Medium', score: 35 } }
        }).state
    ])`));

    assert.deepEqual(states, ['needsMoreData', 'developing']);
});

test('recommendations rank skill first and exclude banned heroes', () => {
    const harness = loadPool();
    const recommended = JSON.parse(harness.evaluate(`JSON.stringify(competitivePool.getRecommended([
        { heroId: 'a', heroName: 'A', state: 'ready', isBanned: false, recommendationScore: 60, confidenceScore: 90 },
        { heroId: 'b', heroName: 'B', state: 'ready', isBanned: false, recommendationScore: 72, confidenceScore: 50 },
        { heroId: 'c', heroName: 'C', state: 'ready', isBanned: true, recommendationScore: 90, confidenceScore: 100 },
        { heroId: 'd', heroName: 'D', state: 'developing', isBanned: false, recommendationScore: 80, confidenceScore: 80 }
    ]).map(entry => entry.heroId))`));

    assert.deepEqual(recommended, ['b', 'a']);
});

test('competitive pool filters roles and summarizes evaluation coverage', () => {
    const harness = loadPool();
    const result = JSON.parse(harness.evaluate(`JSON.stringify({
        filtered: competitivePool.rank([
            { heroName: 'A', role: 'Duelist', state: 'ready', recommendationScore: 50, confidenceScore: 50, isBanned: false },
            { heroName: 'B', role: 'Vanguard', state: 'unrated', recommendationScore: 0, confidenceScore: 0, isBanned: false }
        ], { role: 'Vanguard' }).map(entry => entry.heroName),
        summary: competitivePool.summarize([
            { state: 'ready' }, { state: 'ready' }, { state: 'needsMoreData' }, { state: 'developing' }, { state: 'unrated' }
        ])
    })`));

    assert.deepEqual(result.filtered, ['B']);
    assert.deepEqual(result.summary, {
        ready: 2,
        needsMoreData: 1,
        developing: 1,
        unrated: 1
    });
});
