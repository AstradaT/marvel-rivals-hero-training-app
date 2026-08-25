const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const defaultCsvPaths = [
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
const defaultSupplementalPath = path.join(projectRoot, 'data', 'benchmarkSupplemental.json');
const defaultOutputPath = path.join(projectRoot, 'data', 'benchmarks.json');
const REQUIRED_METRICS = ['winRate', 'pickRate', 'banRate'];
const EXPECTED_HEADERS = [
    'benchmark_group_id', 'hero_id', 'hero_name', 'context_type', 'season',
    'game_mode', 'rank_tier', 'platform', 'region', 'metric_name', 'average',
    'unit', 'sample_matches', 'sample_players', 'source_id', 'source_role',
    'source_url', 'source_updated_at', 'collected_at', 'tier_label', 'hero_rank',
    'hero_pool_size', 'methodology_notes'
];

function parseCsv(csvText) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;

    for (let index = 0; index < csvText.length; index += 1) {
        const character = csvText[index];
        if (quoted) {
            if (character === '"' && csvText[index + 1] === '"') {
                field += '"';
                index += 1;
            } else if (character === '"') {
                quoted = false;
            } else {
                field += character;
            }
            continue;
        }

        if (character === '"') {
            quoted = true;
        } else if (character === ',') {
            row.push(field);
            field = '';
        } else if (character === '\n') {
            row.push(field.replace(/\r$/, ''));
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += character;
        }
    }

    if (quoted) throw new Error('CSV contains an unterminated quoted field.');
    if (field || row.length) {
        row.push(field.replace(/\r$/, ''));
        rows.push(row);
    }
    return rows;
}

function normalizeSeasonId(value) {
    const numericSeason = String(value).trim();
    if (!/^\d+(?:\.\d+)?$/.test(numericSeason)) {
        throw new Error(`Invalid numeric season: ${value}`);
    }
    return `season-${numericSeason.replace('.', '-')}`;
}

function normalizeRankTier(value) {
    const normalized = String(value)
        .trim()
        .toLowerCase()
        .replace(/\s*\+$/, '-plus')
        .replace(/[\s_]+/g, '-');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
        throw new Error(`Invalid rank tier: ${value}`);
    }
    return normalized;
}

function nullableInteger(value, fieldName) {
    if (value === '') return null;
    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0) {
        throw new Error(`${fieldName} must be empty or a positive integer.`);
    }
    return number;
}

function assertSame(groupId, rows, fieldName) {
    const values = new Set(rows.map(row => row[fieldName]));
    if (values.size !== 1) {
        throw new Error(`${groupId} has inconsistent ${fieldName} values.`);
    }
    return rows[0][fieldName];
}

function buildCsvRecords(csvText, supplemental) {
    const parsedRows = parseCsv(csvText);
    const headers = parsedRows.shift();
    if (!headers || headers.join('|') !== EXPECTED_HEADERS.join('|')) {
        throw new Error('CSV headers do not match the benchmark import contract.');
    }

    const rows = parsedRows.filter(row => row.some(value => value !== '')).map((values, index) => {
        if (values.length !== headers.length) {
            throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${headers.length}.`);
        }
        return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
    });
    const groups = rows.reduce((result, row) => {
        result[row.benchmark_group_id] ||= [];
        result[row.benchmark_group_id].push(row);
        return result;
    }, {});
    const groupCount = Object.keys(groups).length;
    if (groupCount === 0 || groupCount > 55 || rows.length !== groupCount * REQUIRED_METRICS.length) {
        throw new Error(`Expected three metric rows for each of up to 55 benchmark groups; found ${rows.length} rows across ${groupCount} groups.`);
    }

    const seasonalRecords = Object.entries(groups).map(([groupId, groupRows]) => {
        const metricNames = groupRows.map(row => row.metric_name).sort();
        if (metricNames.join('|') !== [...REQUIRED_METRICS].sort().join('|')) {
            throw new Error(`${groupId} must contain winRate, pickRate, and banRate exactly once.`);
        }

        const sampleMatches = nullableInteger(
            assertSame(groupId, groupRows, 'sample_matches'),
            `${groupId} sample_matches`
        );
        const samplePlayers = nullableInteger(
            assertSame(groupId, groupRows, 'sample_players'),
            `${groupId} sample_players`
        );
        const sourceRole = assertSame(groupId, groupRows, 'source_role');
        if (sourceRole !== 'primary') throw new Error(`${groupId} must use a primary source.`);
        const contextType = assertSame(groupId, groupRows, 'context_type');
        if (!['seasonalRank', 'seasonalRankThreshold'].includes(contextType)) {
            throw new Error(`${groupId} has an unsupported context type.`);
        }
        if (assertSame(groupId, groupRows, 'game_mode') !== 'competitive') {
            throw new Error(`${groupId} must use Competitive data.`);
        }

        const rankTier = normalizeRankTier(assertSame(groupId, groupRows, 'rank_tier'));
        if (contextType === 'seasonalRankThreshold' && !rankTier.endsWith('-plus')) {
            throw new Error(`${groupId} threshold rank must end in plus.`);
        }
        const unavailableMetrics = [];
        const metrics = Object.fromEntries(groupRows.flatMap(row => {
            if (row.average === '') {
                const canBeUnavailable = row.metric_name === 'banRate'
                    && ['bronze', 'silver'].includes(rankTier);
                if (!canBeUnavailable) {
                    throw new Error(`${groupId} has an unexpected empty ${row.metric_name} average.`);
                }
                unavailableMetrics.push(row.metric_name);
                return [];
            }

            const average = Number(row.average);
            if (!Number.isFinite(average) || average < 0 || average > 1 || row.unit !== 'ratio') {
                throw new Error(`${groupId} has an invalid ${row.metric_name} ratio.`);
            }
            return [[row.metric_name, {
                average,
                unit: 'ratio',
                sampleSize: { matches: sampleMatches, players: samplePlayers }
            }]];
        }));

        const heroRank = nullableInteger(assertSame(groupId, groupRows, 'hero_rank'), `${groupId} hero_rank`);
        const heroPoolSize = nullableInteger(
            assertSame(groupId, groupRows, 'hero_pool_size'),
            `${groupId} hero_pool_size`
        );
        const sourceUpdatedAt = assertSame(groupId, groupRows, 'source_updated_at') || null;
        const platform = assertSame(groupId, groupRows, 'platform') || null;
        const region = assertSame(groupId, groupRows, 'region') || null;
        const sourceNotes = assertSame(groupId, groupRows, 'methodology_notes') || null;
        const tierLabel = assertSame(groupId, groupRows, 'tier_label') || null;

        return {
            heroId: assertSame(groupId, groupRows, 'hero_id'),
            context: contextType === 'seasonalRank'
                ? {
                    type: 'seasonalRank',
                    seasonId: normalizeSeasonId(assertSame(groupId, groupRows, 'season')),
                    gameMode: 'competitive',
                    rankTier
                }
                : {
                    type: 'seasonalRankThreshold',
                    seasonId: normalizeSeasonId(assertSame(groupId, groupRows, 'season')),
                    gameMode: 'competitive',
                    rankTier,
                    population: {
                        type: 'rankThreshold',
                        minimumRank: rankTier.replace(/-plus$/, '')
                    }
                },
            metrics,
            sampleSize: { matches: sampleMatches, players: samplePlayers },
            collectedAt: assertSame(groupId, groupRows, 'collected_at'),
            source: {
                id: assertSame(groupId, groupRows, 'source_id'),
                type: sourceRole,
                url: assertSame(groupId, groupRows, 'source_url') || null,
                datasetId: groupId,
                reference: sourceUpdatedAt ? `Source updated at ${sourceUpdatedAt}.` : null
            },
            sourceMetadata: {
                sourceUpdatedAt,
                platform,
                region,
                tierLabel,
                heroRank,
                heroPoolSize,
                ...(unavailableMetrics.length > 0 ? { unavailableMetrics } : {})
            },
            validations: supplemental.validationsByBenchmarkGroupId?.[groupId] || [],
            methodologyNotes: [
                sourceNotes,
                `Source metadata: tier ${tierLabel || 'unknown'}, displayed rank ${heroRank || 'unknown'} of ${heroPoolSize || 'unknown'}, platform ${platform || 'not stated'}, region ${region || 'not stated'}.`
            ].filter(Boolean).join(' '),
            _sortRank: heroRank
        };
    }).sort((left, right) => left._sortRank - right._sortRank)
        .map(({ _sortRank, ...record }) => record);

    return { rows, seasonalRecords };
}

function buildDataset(csvTexts, supplemental) {
    const sources = Array.isArray(csvTexts) ? csvTexts : [csvTexts];
    const imported = sources.map(csvText => buildCsvRecords(csvText, supplemental));
    const rows = imported.flatMap(source => source.rows);
    const seasonalRecords = imported.flatMap(source => source.seasonalRecords);
    const recordKeys = new Set(seasonalRecords.map(record => [
        record.context.seasonId,
        record.context.gameMode,
        record.context.rankTier,
        record.heroId
    ].join('|')));
    if (recordKeys.size !== seasonalRecords.length) {
        throw new Error('CSV sources contain duplicate benchmark contexts.');
    }

    const latestCollectionDate = rows.map(row => row.collected_at).sort().at(-1);
    return {
        schemaVersion: 2,
        datasetVersion: 'season-9-5-all-rivalstracker-rank-filters-2026-08-25',
        updatedAt: latestCollectionDate,
        records: [...seasonalRecords, ...(supplemental.records || [])]
    };
}

function main() {
    const csvTexts = defaultCsvPaths.map(csvPath => fs.readFileSync(csvPath, 'utf8'));
    const supplemental = JSON.parse(fs.readFileSync(defaultSupplementalPath, 'utf8'));
    const dataset = buildDataset(csvTexts, supplemental);
    fs.writeFileSync(defaultOutputPath, `${JSON.stringify(dataset, null, 2)}\n`);
    console.log(`Built ${dataset.records.length} records: ${dataset.records.length - (supplemental.records || []).length} seasonal benchmarks and ${(supplemental.records || []).length} supplemental references.`);
}

if (require.main === module) main();

module.exports = { buildDataset, normalizeRankTier, normalizeSeasonId, parseCsv };
