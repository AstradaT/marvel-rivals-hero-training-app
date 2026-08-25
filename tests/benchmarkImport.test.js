const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDataset, parseCsv } = require('../scripts/buildBenchmarks');
const { projectRoot } = require('./helpers/browserScriptHarness');

const csvPath = path.join(projectRoot, 'data', 'marvel_rivals_gold_s9_5_benchmark.csv');
const supplementalPath = path.join(projectRoot, 'data', 'benchmarkSupplemental.json');

function buildProductionFixture() {
    return buildDataset(
        fs.readFileSync(csvPath, 'utf8'),
        JSON.parse(fs.readFileSync(supplementalPath, 'utf8'))
    );
}

test('the Gold CSV imports 55 complete source entries without averaging', () => {
    const dataset = buildProductionFixture();
    const seasonal = dataset.records.filter(record => record.context.type === 'seasonalRank');

    assert.equal(seasonal.length, 55);
    assert.equal(dataset.records.length, 60);
    assert.ok(seasonal.every(record => (
        record.source.id === 'rivalstracker'
        && record.source.type === 'primary'
        && record.context.seasonId === 'season-9-5'
        && record.context.rankTier === 'gold'
        && Object.keys(record.metrics).sort().join('|') === 'banRate|pickRate|winRate'
    )));
});

test('the generated production JSON is synchronized with its CSV sources', () => {
    const generated = buildProductionFixture();
    const production = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'data', 'benchmarks.json'), 'utf8')
    );

    assert.deepEqual(production, generated);
});

test('Emma Frost retains primary CSV values and independent pilot validations', () => {
    const dataset = buildProductionFixture();
    const emma = dataset.records.find(record => (
        record.context.type === 'seasonalRank' && record.heroId === 'emma-frost'
    ));

    assert.equal(emma.metrics.winRate.average, 0.4737);
    assert.equal(emma.metrics.pickRate.average, 0.1967);
    assert.equal(emma.metrics.banRate.average, 0.0183);
    assert.equal(emma.sampleSize.matches, 11001);
    assert.deepEqual(emma.sourceMetadata, {
        sourceUpdatedAt: '2026-08-25T10:04:58.000Z',
        platform: null,
        region: null,
        tierLabel: 'C',
        heroRank: 44,
        heroPoolSize: 55
    });
    assert.equal(emma.validations.length, 2);
    assert.equal(emma.validations[0].source.type, 'validation');
});

test('Deadpool source forms stay distinct instead of being silently merged', () => {
    const dataset = buildProductionFixture();
    const deadpoolIds = dataset.records
        .filter(record => record.context.type === 'seasonalRank' && record.heroId.startsWith('deadpool-'))
        .map(record => record.heroId)
        .sort();

    assert.deepEqual(deadpoolIds, [
        'deadpool-duelist',
        'deadpool-strategist',
        'deadpool-vanguard'
    ]);
    assert.equal(dataset.records.some(record => (
        record.context.type === 'seasonalRank' && record.heroId === 'deadpool'
    )), false);
});

test('CSV parser preserves quoted methodology notes with commas', () => {
    const rows = parseCsv('a,b,c\n1,"two, still two",3\n');
    assert.deepEqual(rows, [['a', 'b', 'c'], ['1', 'two, still two', '3']]);
});
