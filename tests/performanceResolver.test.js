const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { loadBrowserScripts, projectRoot } = require('./helpers/browserScriptHarness');

function createHarness(includeEvaluator = false) {
    const scripts = ['services/benchmarkCatalog.js', 'services/performanceResolver.js'];
    if (includeEvaluator) {
        scripts.unshift('data/evaluationModels.js');
        scripts.push('services/heroEvaluator.js');
    }
    return loadBrowserScripts(scripts);
}

function installCatalog(harness, { season = 'season-9-5', rank = 'gold' } = {}) {
    harness.evaluate(`catalog = benchmarkCatalog.create({
        schemaVersion: 2,
        datasetVersion: 'test-fixture',
        records: [{
            heroId: 'emma-frost',
            context: {
                type: 'seasonalRank', seasonId: '${season}',
                gameMode: 'competitive', rankTier: '${rank}'
            },
            metrics: { winRate: { average: 0.468, unit: 'ratio' } },
            sampleSize: { matches: 48213 },
            collectedAt: '2026-08-25',
            source: { id: 'rivalsTracker', type: 'primary' }
        }]
    })`);
}

function installPlayerData(harness, options = {}) {
    const {
        rank = 'Gold',
        currentSeasonId = 'season-9-5',
        competitive = `{ matchesPlayed: 20, metrics: { winRate: 0.50 } }`,
        quickPlay = `{ matchesPlayed: 40, metrics: { winRate: 0.60 } }`,
        overallCompetitive = 'null'
    } = options;
    harness.evaluate(`playerData = {
        profile: {
            currentSeasonId: '${currentSeasonId}',
            competitiveRanks: { '${currentSeasonId}': '${rank}' }
        },
        heroStats: {
            'emma-frost': {
                overall: {
                    ...((${overallCompetitive}) ? { competitive: ${overallCompetitive} } : {})
                },
                seasons: {
                    '${currentSeasonId}': {
                        ...((${competitive}) ? { competitive: ${competitive} } : {}),
                        ...((${quickPlay}) ? { quickPlay: ${quickPlay} } : {})
                    }
                }
            }
        },
        trainingSessions: [{
            id: 'session-1', heroId: 'emma-frost', gameMode: 'quickPlay',
            seasonId: '${currentSeasonId}', playedAt: '2026-08-25', matches: 3, metrics: {}
        }]
    }`);
}

test('current-season Competitive history progressively replaces overall support', () => {
    const harness = createHarness();
    const sparse = JSON.parse(harness.evaluate(`JSON.stringify(performanceResolver.blendHistory(
        { matchesPlayed: 2, metrics: { winRate: 0.40 } },
        { matchesPlayed: 100, metrics: { winRate: 0.50 } }
    ))`));
    const established = JSON.parse(harness.evaluate(`JSON.stringify(performanceResolver.blendHistory(
        { matchesPlayed: 30, metrics: { winRate: 0.55 } },
        { matchesPlayed: 200, metrics: { winRate: 0.45 } }
    ))`));

    assert.equal(sparse.historyWeights.currentSeason, 0.3);
    assert.equal(sparse.metrics.winRate, 0.47);
    assert.equal(sparse.matchesPlayed, 23);
    assert.equal(established.historyWeights.currentSeason, 1);
    assert.equal(established.metrics.winRate, 0.55);
});

test('matching season, Competitive mode, rank, and hero resolves proficiency context', () => {
    const harness = createHarness();
    installCatalog(harness);
    installPlayerData(harness);
    const resolved = JSON.parse(harness.evaluate(`JSON.stringify(performanceResolver.resolve({
        playerData, catalog, heroId: 'emma-frost'
    }))`));

    assert.equal(resolved.status, 'resolved');
    assert.equal(resolved.evaluationState, 'comparable');
    assert.equal(resolved.source.gameMode, 'competitive');
    assert.equal(resolved.source.rankTier, 'gold');
    assert.equal(resolved.playerStats.metrics.winRate, 0.5);
    assert.equal(resolved.benchmark.metrics.winRate.average, 0.468);
    assert.equal(resolved.source.provenance.id, 'rivalstracker');
});

test('wrong rank and wrong season are incompatible with no fallback', () => {
    const rankHarness = createHarness();
    installCatalog(rankHarness, { rank: 'diamond' });
    installPlayerData(rankHarness, { rank: 'Gold' });
    const wrongRank = JSON.parse(rankHarness.evaluate(`JSON.stringify(performanceResolver.resolve({
        playerData, catalog, heroId: 'emma-frost'
    }))`));

    const seasonHarness = createHarness();
    installCatalog(seasonHarness, { season: 'season-9' });
    installPlayerData(seasonHarness, { currentSeasonId: 'season-9-5' });
    const wrongSeason = JSON.parse(seasonHarness.evaluate(`JSON.stringify(performanceResolver.resolve({
        playerData, catalog, heroId: 'emma-frost'
    }))`));

    assert.equal(wrongRank.reason, 'noCompatibleBenchmark');
    assert.equal(wrongRank.evaluationState, 'unrated');
    assert.equal(wrongSeason.reason, 'noCompatibleBenchmark');
    assert.equal(wrongSeason.evaluationState, 'unrated');
});

test('Quick Play-only history remains useful training evidence but proficiency is unrated', () => {
    const harness = createHarness();
    installCatalog(harness);
    installPlayerData(harness, { competitive: 'null' });
    const resolved = JSON.parse(harness.evaluate(`JSON.stringify(performanceResolver.resolve({
        playerData, catalog, heroId: 'emma-frost'
    }))`));

    assert.equal(resolved.status, 'unresolved');
    assert.equal(resolved.evaluationState, 'unrated');
    assert.equal(resolved.reason, 'noCompetitiveData');
    assert.equal(resolved.trainingEvidence.quickPlay.matchesPlayed, 40);
    assert.equal(resolved.trainingEvidence.sessions[0].gameMode, 'quickPlay');
    assert.equal(resolved.playerStats, null);
});

test('Quick Play values never alter a resolved Competitive proficiency snapshot', () => {
    const harness = createHarness();
    installCatalog(harness);
    installPlayerData(harness, {
        competitive: `{ matchesPlayed: 20, metrics: { winRate: 0.50 } }`,
        quickPlay: `{ matchesPlayed: 1000, metrics: { winRate: 0.99 } }`
    });
    const resolved = JSON.parse(harness.evaluate(`JSON.stringify(performanceResolver.resolve({
        playerData, catalog, heroId: 'emma-frost'
    }))`));

    assert.equal(resolved.playerStats.metrics.winRate, 0.5);
    assert.equal(resolved.playerStats.matchesPlayed, 20);
    assert.equal(resolved.trainingEvidence.quickPlay.metrics.winRate, 0.99);
});

test('unknown player data and incompatible benchmark data remain distinct states', () => {
    const harness = createHarness();
    installCatalog(harness);
    harness.evaluate(`emptyPlayerData = {
        profile: { currentSeasonId: 'season-9-5', competitiveRanks: {} },
        heroStats: {}, trainingSessions: []
    }`);
    const unknown = JSON.parse(harness.evaluate(`JSON.stringify(performanceResolver.resolve({
        playerData: emptyPlayerData, catalog, heroId: 'emma-frost'
    }))`));
    installPlayerData(harness, { rank: '' });
    const unrated = JSON.parse(harness.evaluate(`JSON.stringify(performanceResolver.resolve({
        playerData, catalog, heroId: 'emma-frost'
    }))`));

    assert.equal(unknown.evaluationState, 'unknown');
    assert.equal(unknown.reason, 'noPlayerData');
    assert.equal(unrated.evaluationState, 'unrated');
    assert.equal(unrated.reason, 'missingCompetitiveRank');
});

test('resolved Competitive context feeds directly into conservative evaluation', () => {
    const harness = createHarness(true);
    installCatalog(harness);
    installPlayerData(harness, {
        competitive: `{ matchesPlayed: 20, metrics: { winRate: 0.52 } }`
    });
    const evaluation = JSON.parse(harness.evaluate(`
        resolved = performanceResolver.resolve({ playerData, catalog, heroId: 'emma-frost' });
        JSON.stringify(heroEvaluator.evaluate({
            heroId: 'emma-frost', heroName: 'Emma Frost', role: 'Vanguard',
            playerStats: resolved.playerStats, benchmark: resolved.benchmark
        }))
    `));

    assert.equal(evaluation.status, 'rated');
    assert.equal(evaluation.evaluationState, 'known');
    assert.equal(evaluation.confidence.playerMatches, 20);
    assert.equal(evaluation.confidence.benchmarkMatches, 48213);
    assert.notEqual(evaluation.displayCategory.label, 'Needs more data');
});

test('the real Emma Frost pilot flows through catalog, resolver, and evaluation', () => {
    const dataset = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'data', 'benchmarks.json'), 'utf8')
    );
    const harness = createHarness(true);
    harness.evaluate(`catalog = benchmarkCatalog.create(${JSON.stringify(dataset)})`);
    installPlayerData(harness, {
        competitive: `{ matchesPlayed: 20, metrics: { winRate: 0.52 } }`
    });

    const result = JSON.parse(harness.evaluate(`
        resolved = performanceResolver.resolve({ playerData, catalog, heroId: 'emma-frost' });
        evaluation = heroEvaluator.evaluate({
            heroId: 'emma-frost', heroName: 'Emma Frost', role: 'Vanguard',
            playerStats: resolved.playerStats, benchmark: resolved.benchmark
        });
        JSON.stringify({ resolved, evaluation })
    `));

    assert.equal(result.resolved.status, 'resolved');
    assert.equal(result.resolved.benchmark.metrics.winRate.average, 0.4737);
    assert.equal(result.resolved.source.provenance.id, 'rivalstracker');
    assert.equal(result.evaluation.status, 'rated');
    assert.equal(result.evaluation.evaluationState, 'known');
    assert.equal(result.evaluation.confidence.benchmarkMatches, 11001);
});
