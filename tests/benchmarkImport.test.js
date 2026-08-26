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
const quickPlayPath = path.join(
    projectRoot,
    'data',
    'marvel_rivals_official_quickplay_s9_2026-08-04.csv'
);
const counterwatchPath = path.join(
    projectRoot,
    'data',
    'counterwatch_quickplay_s9_all_ranks_2026-08-25.csv'
);

function buildProductionFixture() {
    return buildDataset(
        csvPaths.map(csvPath => fs.readFileSync(csvPath, 'utf8')),
        JSON.parse(fs.readFileSync(supplementalPath, 'utf8')),
        fs.readFileSync(quickPlayPath, 'utf8'),
        fs.readFileSync(counterwatchPath, 'utf8')
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
    assert.equal(dataset.records.length, 871);
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

test('Counterwatch Quick Match snapshot preserves community population and shrinkage', () => {
    const community = buildProductionFixture().records.filter(
        record => record.context.type === 'communitySeasonalMode'
    );

    assert.equal(community.length, 55);
    assert.ok(community.every(record => (
        record.context.seasonId === 'season-9'
        && record.context.gameMode === 'quickPlay'
        && record.context.rankTier === 'all-ranks'
        && record.context.population.type === 'optInTrackerUsers'
        && record.context.population.tracker === 'counterwatch'
        && record.source.id === 'counterwatch'
        && record.sourceMetadata.shrinkagePriorMatches === 400
        && !Object.hasOwn(record.metrics, 'winRate')
    )));

    const mantis = community.find(record => record.heroId === 'mantis');
    assert.equal(mantis.metrics.shrunkWinRate.average, 0.562);
    assert.equal(mantis.metrics.pickRate.average, 0.23);
    assert.equal(mantis.metrics.killsPerMinute.average, 1.1);
    assert.equal(mantis.sampleSize.matches, 49642);
    assert.equal(mantis.sourceMetadata.confidenceInterval95, 0.004);

    const hulk = community.find(record => record.heroId === 'hulk');
    const cloakAndDagger = community.find(record => record.heroId === 'cloak-and-dagger');
    assert.equal(hulk.sourceMetadata.sourceHeroId, 'bruce-banner');
    assert.equal(cloakAndDagger.sourceMetadata.sourceHeroId, 'cloak-dagger');
    assert.equal(community.filter(record => record.heroId.startsWith('deadpool-')).length, 3);
});

test('official Season 9 Quick Match snapshots preserve PC and console separately', () => {
    const quickPlay = buildProductionFixture().records.filter(
        record => record.context.type === 'seasonalMode'
    );

    assert.equal(quickPlay.length, 108);
    assert.equal(quickPlay.filter(record => record.context.platform === 'pc').length, 54);
    assert.equal(quickPlay.filter(record => record.context.platform === 'console').length, 54);
    assert.ok(quickPlay.every(record => (
        record.context.gameMode === 'quickPlay'
        && record.context.seasonId === 'season-9'
        && record.source.id === 'marvel-rivals-official'
        && record.sourceMetadata.sourceUpdatedAt === '2026-08-04'
        && record.sampleSize.matches === null
        && Object.keys(record.metrics).sort().join('|') === 'pickRate|winRate'
    )));

    const pcMagneto = quickPlay.find(record => (
        record.heroId === 'magneto' && record.context.platform === 'pc'
    ));
    const consoleMagneto = quickPlay.find(record => (
        record.heroId === 'magneto' && record.context.platform === 'console'
    ));
    assert.equal(pcMagneto.metrics.pickRate.average, 0.1227);
    assert.equal(pcMagneto.metrics.winRate.average, 0.5233);
    assert.equal(consoleMagneto.metrics.pickRate.average, 0.1229);
    assert.equal(consoleMagneto.metrics.winRate.average, 0.5256);
    assert.equal(quickPlay.some(record => record.heroId === 'the-hood'), false);
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
