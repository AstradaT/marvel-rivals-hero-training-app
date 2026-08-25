const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDataset, parseCsv } = require('../scripts/buildBenchmarks');
const { projectRoot } = require('./helpers/browserScriptHarness');

const csvPaths = [
    'marvel_rivals_bronze_s9_5_benchmark.csv',
    'marvel_rivals_silver_s9_5_benchmark.csv',
    'marvel_rivals_gold_s9_5_benchmark.csv',
    'marvel_rivals_platinum_s9_5_benchmark.csv',
    'marvel_rivals_diamond_s9_5_benchmark.csv',
    'marvel_rivals_diamond_plus_s9_5_benchmark.csv',
    'marvel_rivals_grandmaster_s9_5_benchmark.csv',
    'marvel_rivals_grandmaster_plus_s9_5_benchmark.csv',
    'marvel_rivals_celestial_s9_5_benchmark.csv',
    'marvel_rivals_celestial_plus_s9_5_benchmark.csv',
    'marvel_rivals_eternity_s9_5_benchmark.csv',
    'marvel_rivals_eternity_plus_s9_5_benchmark.csv',
    'marvel_rivals_one_above_all_s9_5_benchmark.csv'
].map(fileName => path.join(projectRoot, 'data', fileName));
const FULL_EXACT_RANKS = [
    'bronze', 'silver', 'gold', 'platinum', 'diamond',
    'grandmaster', 'celestial', 'eternity'
];
const THRESHOLD_RANKS = [
    'diamond-plus', 'grandmaster-plus', 'celestial-plus', 'eternity-plus'
];
const supplementalPath = path.join(projectRoot, 'data', 'benchmarkSupplemental.json');

function buildProductionFixture() {
    return buildDataset(
        csvPaths.map(csvPath => fs.readFileSync(csvPath, 'utf8')),
        JSON.parse(fs.readFileSync(supplementalPath, 'utf8'))
    );
}

test('all 13 rank-filter CSVs import without averaging or changing context', () => {
    const dataset = buildProductionFixture();
    const seasonal = dataset.records.filter(record => (
        ['seasonalRank', 'seasonalRankThreshold'].includes(record.context.type)
    ));
    const exact = seasonal.filter(record => record.context.type === 'seasonalRank');
    const thresholds = seasonal.filter(record => record.context.type === 'seasonalRankThreshold');

    assert.equal(exact.length, 483);
    assert.equal(thresholds.length, 220);
    assert.equal(dataset.records.length, 708);
    assert.deepEqual(
        [...new Set(seasonal.map(record => record.context.rankTier))].sort(),
        [...FULL_EXACT_RANKS, ...THRESHOLD_RANKS, 'one-above-all'].sort()
    );
    assert.ok(seasonal.every(record => (
        record.source.id === 'rivalstracker'
        && record.source.type === 'primary'
        && record.context.seasonId === 'season-9-5'
    )));
    assert.ok(seasonal.filter(record => !['bronze', 'silver'].includes(
        record.context.rankTier
    )).every(record => Object.keys(record.metrics).sort().join('|') === 'banRate|pickRate|winRate'));
    assert.ok(seasonal.filter(record => ['bronze', 'silver'].includes(
        record.context.rankTier
    )).every(record => (
        Object.keys(record.metrics).sort().join('|') === 'pickRate|winRate'
        && record.sourceMetadata.unavailableMetrics.join('|') === 'banRate'
    )));
    assert.ok(thresholds.every(record => (
        record.context.population.type === 'rankThreshold'
        && record.context.rankTier === `${record.context.population.minimumRank}-plus`
    )));
});

test('empty Bronze and Silver ban rates remain unavailable rather than becoming zero', () => {
    const seasonal = buildProductionFixture().records.filter(
        record => record.context.type === 'seasonalRank'
    );

    ['bronze', 'silver'].forEach(rankTier => {
        const rankRecords = seasonal.filter(record => record.context.rankTier === rankTier);
        assert.equal(rankRecords.length, 55);
        assert.ok(rankRecords.every(record => !Object.hasOwn(record.metrics, 'banRate')));
        assert.ok(rankRecords.every(record => record.sampleSize.matches > 0));
    });
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
        record.context.type === 'seasonalRank'
        && record.context.rankTier === 'gold'
        && record.heroId === 'emma-frost'
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

test('Deadpool source forms stay distinct and missing top-rank rows are not fabricated', () => {
    const dataset = buildProductionFixture();
    const deadpoolRecords = dataset.records
        .filter(record => (
            ['seasonalRank', 'seasonalRankThreshold'].includes(record.context.type)
            && record.heroId.startsWith('deadpool-')
        ));
    const deadpoolIdsByRank = Object.groupBy(
        deadpoolRecords,
        record => record.context.rankTier
    );

    [...FULL_EXACT_RANKS, ...THRESHOLD_RANKS].forEach(rankTier => {
        assert.deepEqual(deadpoolIdsByRank[rankTier].map(record => record.heroId).sort(), [
            'deadpool-duelist',
            'deadpool-strategist',
            'deadpool-vanguard'
        ]);
    });
    assert.deepEqual(deadpoolIdsByRank['one-above-all'].map(record => record.heroId).sort(), [
        'deadpool-duelist',
        'deadpool-vanguard'
    ]);
    assert.equal(
        dataset.records.filter(record => (
            record.context.type === 'seasonalRank'
            && record.context.rankTier === 'one-above-all'
        )).length,
        43
    );
    assert.equal(dataset.records.some(record => (
        record.context.type === 'seasonalRank' && record.heroId === 'deadpool'
    )), false);
});

test('CSV parser preserves quoted methodology notes with commas', () => {
    const rows = parseCsv('a,b,c\n1,"two, still two",3\n');
    assert.deepEqual(rows, [['a', 'b', 'c'], ['1', 'two, still two', '3']]);
});
