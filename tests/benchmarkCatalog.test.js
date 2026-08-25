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

test('the production catalog contains the complete sourced Season 9.5 Gold dataset', () => {
    const dataset = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'data', 'benchmarks.json'), 'utf8')
    );

    assert.equal(dataset.schemaVersion, 2);
    assert.equal(dataset.datasetVersion, 'season-9-5-gold-rivalstracker-2026-08-25');
    assert.equal(dataset.updatedAt, '2026-08-25T14:58:14.626Z');
    assert.equal(dataset.records.length, 60);

    const seasonalRecords = dataset.records.filter(record => record.context.type === 'seasonalRank');
    const seasonal = seasonalRecords.find(record => record.heroId === 'emma-frost');
    assert.equal(seasonalRecords.length, 55);
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
});

test('the production dataset survives catalog validation and only exact Gold lookup resolves it', () => {
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

    assert.equal(harness.evaluate('catalog.records.length'), 60);
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
    })`), null);
    assert.equal(harness.evaluate(`catalog.findSeasonalCompetitive({
        seasonId: 'season-9-5', rankTier: 'gold', heroId: 'ultron'
    }).metrics.winRate.average`), 0.6007);
    assert.equal(harness.evaluate(`catalog.findSeasonalCompetitive({
        seasonId: 'season-9-5', rankTier: 'gold', heroId: 'deadpool'
    })`), null);
});

test('Gold benchmarks cover every directly compatible roster identity except shared Deadpool', () => {
    const dataset = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'data', 'benchmarks.json'), 'utf8')
    );
    const harness = loadBrowserScripts(['data/heroes.js', 'services/benchmarkCatalog.js']);
    harness.evaluate(`catalog = benchmarkCatalog.create(${JSON.stringify(dataset)})`);
    const coverage = JSON.parse(harness.evaluate(`JSON.stringify(
        [...new Set(heroes.map(hero => hero.id))].map(heroId => ({
            heroId,
            covered: Boolean(catalog.findSeasonalCompetitive({
                seasonId: 'season-9-5', rankTier: 'gold', heroId
            }))
        }))
    )`));
    const uncovered = coverage.filter(item => !item.covered).map(item => item.heroId);

    assert.deepEqual(uncovered, ['deadpool']);
    assert.equal(coverage.filter(item => item.covered).length, 52);
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
