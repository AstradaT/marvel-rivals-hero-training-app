const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { loadBrowserScripts, projectRoot } = require('./helpers/browserScriptHarness');

function seasonalRecord(overrides = '') {
    return `{
        heroId: 'emma-frost',
        context: {
            type: 'seasonalRank', seasonId: 'season-9-5',
            gameMode: 'competitive', rankTier: 'gold'
        },
        metrics: { winRate: { average: 0.468, unit: 'ratio' } },
        sampleSize: { matches: 48213 },
        collectedAt: '2026-08-25',
        source: { id: 'rivalsTracker', type: 'primary', reference: 'fixture-only' },
        ${overrides}
    }`;
}

test('the production catalog contains all sourced Season 9.5 rank datasets', () => {
    const dataset = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'data', 'benchmarks.json'), 'utf8')
    );

    assert.equal(dataset.schemaVersion, 2);
    assert.equal(dataset.datasetVersion, 'season-9-5-all-rivalstracker-rank-filters-2026-08-25');
    assert.equal(dataset.updatedAt, '2026-08-25T18:57:56.232Z');
    assert.equal(dataset.records.length, 708);

    const seasonalRecords = dataset.records.filter(record => record.context.type === 'seasonalRank');
    const thresholdRecords = dataset.records.filter(
        record => record.context.type === 'seasonalRankThreshold'
    );
    const seasonal = seasonalRecords.find(record => (
        record.heroId === 'emma-frost' && record.context.rankTier === 'gold'
    ));
    const platinum = seasonalRecords.find(record => (
        record.heroId === 'emma-frost' && record.context.rankTier === 'platinum'
    ));
    assert.equal(seasonalRecords.length, 483);
    assert.equal(thresholdRecords.length, 220);
    assert.equal(seasonal.heroId, 'emma-frost');
    assert.equal(seasonal.context.seasonId, 'season-9-5');
    assert.equal(seasonal.context.rankTier, 'gold');
    assert.equal(seasonal.metrics.winRate.average, 0.4737);
    assert.equal(seasonal.sampleSize.matches, 11001);
    assert.equal(seasonal.source.id, 'rivalstracker');
    assert.equal(seasonal.sourceMetadata.tierLabel, 'C');
    assert.equal(seasonal.sourceMetadata.heroRank, 44);
    assert.equal(seasonal.sourceMetadata.heroPoolSize, 55);
    assert.equal(seasonal.validations.length, 2);
    assert.equal(platinum.metrics.winRate.average, 0.4668);
    assert.equal(platinum.sampleSize.matches, 32912);
    assert.equal(platinum.validations.length, 0);
    const bronze = seasonalRecords.find(record => (
        record.heroId === 'emma-frost' && record.context.rankTier === 'bronze'
    ));
    assert.equal(bronze.metrics.winRate.average, 0.4629);
    assert.equal(bronze.metrics.banRate, undefined);
    assert.deepEqual(bronze.sourceMetadata.unavailableMetrics, ['banRate']);
    const oneAboveAll = seasonalRecords.find(record => (
        record.heroId === 'emma-frost' && record.context.rankTier === 'one-above-all'
    ));
    const celestialPlus = thresholdRecords.find(record => (
        record.heroId === 'emma-frost' && record.context.rankTier === 'celestial-plus'
    ));
    assert.equal(oneAboveAll.metrics.winRate.average, 0.3636);
    assert.equal(oneAboveAll.sourceMetadata.heroPoolSize, 43);
    assert.equal(celestialPlus.context.population.minimumRank, 'celestial');
    assert.equal(celestialPlus.metrics.winRate.average, 0.4526);
});

test('the production dataset survives validation and resolves only an exact rank lookup', () => {
    const dataset = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'data', 'benchmarks.json'), 'utf8')
    );
    const harness = loadBrowserScripts(['services/benchmarkCatalog.js']);
    harness.evaluate(`catalog = benchmarkCatalog.create(${JSON.stringify(dataset)})`);

    const seasonal = JSON.parse(harness.evaluate(`JSON.stringify(
        catalog.findSeasonalCompetitive({
            seasonId: 'season-9-5', rankTier: 'gold', heroId: 'emma-frost'
        })
    )`));

    assert.equal(harness.evaluate('catalog.records.length'), 708);
    assert.equal(seasonal.metrics.winRate.average, 0.4737);
    assert.equal(seasonal.validations[0].metrics.banRate.average, 0.0366);
    assert.equal(seasonal.validations[0].sampleSize.matches, 11001);
    assert.equal(
        seasonal.source.url,
        'https://rivalstracker.com/heroes/emma-frost'
    );
    assert.equal(
        seasonal.validations[0].source.url,
        'https://rivalsmeta.com/characters?rank=3'
    );
    assert.equal(
        seasonal.validations[1].source.url,
        'https://www.marvelrivals.com/heroes_data/'
    );
    assert.equal(seasonal.validations[1].collectedAt, '2026-08-04');
    assert.match(seasonal.validations[0].methodologyNotes, /not reconciled or averaged/);
    assert.equal(harness.evaluate(`catalog.findSeasonalCompetitive({
        seasonId: 'season-9-5', rankTier: 'platinum', heroId: 'emma-frost'
    }).metrics.winRate.average`), 0.4668);
    assert.equal(harness.evaluate(`catalog.findSeasonalCompetitive({
        seasonId: 'season-9-5', rankTier: 'diamond', heroId: 'emma-frost'
    }).metrics.winRate.average`), 0.4569);
    assert.equal(harness.evaluate(`catalog.findSeasonalCompetitive({
        seasonId: 'season-9-5', rankTier: 'grandmaster', heroId: 'emma-frost'
    }).metrics.winRate.average`), 0.4481);
    assert.equal(harness.evaluate(`catalog.findSeasonalCompetitive({
        seasonId: 'season-9-5', rankTier: 'One Above All', heroId: 'emma-frost'
    }).metrics.winRate.average`), 0.3636);
    assert.equal(harness.evaluate(`catalog.findSeasonalCompetitive({
        seasonId: 'season-9-5', rankTier: 'celestial-plus', heroId: 'emma-frost'
    })`), null);
    assert.equal(harness.evaluate(`catalog.findSeasonalCompetitiveThreshold({
        seasonId: 'season-9-5', rankTier: 'Celestial+', heroId: 'emma-frost'
    }).metrics.winRate.average`), 0.4526);
    assert.equal(harness.evaluate(`catalog.findSeasonalCompetitive({
        seasonId: 'season-9-5', rankTier: 'gold', heroId: 'ultron'
    }).metrics.winRate.average`), 0.6007);
    assert.equal(harness.evaluate(`catalog.findSeasonalCompetitive({
        seasonId: 'season-9-5', rankTier: 'gold', heroId: 'deadpool'
    })`), null);
});

test('exact and threshold rank filters preserve their published roster coverage', () => {
    const dataset = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'data', 'benchmarks.json'), 'utf8')
    );
    const harness = loadBrowserScripts(['data/heroes.js', 'services/benchmarkCatalog.js']);
    harness.evaluate(`catalog = benchmarkCatalog.create(${JSON.stringify(dataset)})`);
    const coverage = JSON.parse(harness.evaluate(`JSON.stringify({
        exact: [
            'bronze', 'silver', 'gold', 'platinum', 'diamond',
            'grandmaster', 'celestial', 'eternity', 'one-above-all'
        ].flatMap(rankTier => heroes.map(hero => ({
            rankTier,
            heroId: hero.id,
            covered: Boolean(catalog.findSeasonalCompetitive({
                seasonId: 'season-9-5', rankTier, heroId: hero.id
            }))
        }))),
        thresholds: [
            'diamond-plus', 'grandmaster-plus', 'celestial-plus', 'eternity-plus'
        ].flatMap(rankTier => heroes.map(hero => ({
            rankTier,
            heroId: hero.id,
            covered: Boolean(catalog.findSeasonalCompetitiveThreshold({
                seasonId: 'season-9-5', rankTier, heroId: hero.id
            }))
        })))
    })`));
    const exactUncovered = coverage.exact
        .filter(item => !item.covered)
        .map(item => `${item.rankTier}:${item.heroId}`);
    const expectedTopRankGaps = [
        'captain-america', 'deadpool-strategist', 'devil-dinosaur', 'hawkeye',
        'hulk', 'iron-man', 'moon-knight', 'namor', 'peni-parker', 'phoenix',
        'ultron', 'white-fox'
    ].map(heroId => `one-above-all:${heroId}`).sort();

    assert.deepEqual(exactUncovered.sort(), expectedTopRankGaps);
    assert.equal(coverage.exact.filter(item => item.covered).length, 483);
    assert.equal(coverage.thresholds.filter(item => item.covered).length, 220);
});

test('seasonal Competitive lookup requires exact season, rank, and hero compatibility', () => {
    const harness = loadBrowserScripts(['services/benchmarkCatalog.js']);
    harness.evaluate(`catalog = benchmarkCatalog.create({
        schemaVersion: 2,
        datasetVersion: 'test-fixture',
        records: [${seasonalRecord()}]
    })`);

    const compatible = JSON.parse(harness.evaluate(`JSON.stringify(
        catalog.findSeasonalCompetitive({
            seasonId: 'season-9-5', rankTier: 'Gold', heroId: 'emma-frost'
        })
    )`));

    assert.equal(compatible.context.gameMode, 'competitive');
    assert.equal(compatible.metrics.winRate.average, 0.468);
    assert.equal(compatible.metrics.winRate.unit, 'ratio');
    assert.equal(compatible.sampleSize.matches, 48213);
    assert.equal(harness.evaluate(`catalog.findSeasonalCompetitive({
        seasonId: 'season-9', rankTier: 'gold', heroId: 'emma-frost'
    })`), null);
    assert.equal(harness.evaluate(`catalog.findSeasonalCompetitive({
        seasonId: 'season-9-5', rankTier: 'diamond', heroId: 'emma-frost'
    })`), null);
});

test('sparse metrics remain valid and validation sources do not change the primary value', () => {
    const harness = loadBrowserScripts(['services/benchmarkCatalog.js']);
    harness.evaluate(`catalog = benchmarkCatalog.create({
        schemaVersion: 2,
        records: [${seasonalRecord(`
            validations: [{
                source: { id: 'rivalsMeta', type: 'validation' },
                metrics: { winRate: { average: 0.47, unit: 'ratio' } },
                sampleSize: { matches: 12000 },
                collectedAt: '2026-08-24',
                methodologyNotes: 'Independent comparison only.'
            }]
        `)}]
    })`);
    const record = JSON.parse(harness.evaluate('JSON.stringify(catalog.records[0])'));

    assert.deepEqual(Object.keys(record.metrics), ['winRate']);
    assert.equal(record.metrics.winRate.average, 0.468);
    assert.equal(record.validations[0].metrics.winRate.average, 0.47);
    assert.equal(record.validations[0].source.type, 'validation');
    assert.equal(record.validations[0].sampleSize.matches, 12000);
    assert.equal(record.validations[0].collectedAt, '2026-08-24');
    assert.equal(record.validations[0].methodologyNotes, 'Independent comparison only.');
});

test('rolling high-elo records are representable but cannot satisfy seasonal peer lookup', () => {
    const harness = loadBrowserScripts(['services/benchmarkCatalog.js']);
    harness.evaluate(`catalog = benchmarkCatalog.create({
        schemaVersion: 2,
        records: [{
            heroId: 'emma-frost',
            context: {
                type: 'rollingRankThreshold',
                gameMode: 'competitive',
                population: { type: 'rankThreshold', minimumRank: 'celestial' },
                timeWindow: { type: 'rollingDays', days: 180 }
            },
            metrics: { damagePerMinute: { average: 1250, unit: 'perMinute' } },
            sampleSize: { matches: 20000 },
            collectedAt: '2026-08-25',
            source: { id: 'rivalsTracker', type: 'reference' }
        }]
    })`);
    const rolling = JSON.parse(harness.evaluate('JSON.stringify(catalog.records[0])'));

    assert.equal(rolling.context.type, 'rollingRankThreshold');
    assert.equal(rolling.context.population.minimumRank, 'celestial');
    assert.equal(rolling.context.timeWindow.days, 180);
    assert.equal(harness.evaluate(`catalog.findSeasonalCompetitive({
        seasonId: 'season-9-5', rankTier: 'gold', heroId: 'emma-frost'
    })`), null);
});

test('invalid provenance, Quick Play rank contexts, and noncanonical units are rejected', () => {
    const harness = loadBrowserScripts(['services/benchmarkCatalog.js']);
    harness.evaluate(`catalog = benchmarkCatalog.create({
        schemaVersion: 2,
        records: [
            {
                heroId: 'emma-frost',
                context: { type: 'seasonalRank', seasonId: 'season-9-5', gameMode: 'quickPlay', rankTier: 'gold' },
                metrics: { winRate: { average: 0.47, unit: 'ratio' } },
                collectedAt: '2026-08-25', source: { id: 'source', type: 'primary' }
            },
            {
                heroId: 'emma-frost',
                context: { type: 'seasonalRank', seasonId: 'season-9-5', gameMode: 'competitive', rankTier: 'gold' },
                metrics: { damagePer10: { average: 12000, unit: 'per10' } },
                collectedAt: '2026-08-25', source: { id: 'source', type: 'primary' }
            },
            {
                heroId: 'emma-frost',
                context: { type: 'seasonalRank', seasonId: 'season-9-5', gameMode: 'competitive', rankTier: 'gold' },
                metrics: { winRate: { average: 0.47, unit: 'ratio' } },
                collectedAt: '2026-08-25'
            }
        ]
    })`);

    assert.equal(harness.evaluate('catalog.records.length'), 0);
});
