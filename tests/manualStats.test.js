const test = require('node:test');
const assert = require('node:assert/strict');

const { loadBrowserScripts } = require('./helpers/browserScriptHarness');

function createEmptyPlayerData() {
    return {
        profile: {
            currentSeasonId: null,
            competitiveRanks: {}
        },
        heroStats: {},
        trainingSessions: []
    };
}

test('role stat definitions expose the initial metrics without coupling them to the UI', () => {
    const harness = loadBrowserScripts(['data/heroStatFields.js']);
    const vanguardFields = JSON.parse(
        harness.evaluate("JSON.stringify(getHeroStatFields('Vanguard'))")
    );
    const advancedStrategistFields = JSON.parse(
        harness.evaluate(`JSON.stringify(getHeroStatFields('Strategist', [
            'winRate', 'deathsPerMinute', 'assistsPerMinute', 'healingPerMinute'
        ]))`)
    );

    assert.deepEqual(vanguardFields.map(field => field.key), ['winRate']);
    assert.deepEqual(advancedStrategistFields.map(field => field.key), [
        'winRate',
        'deathsPerMinute',
        'assistsPerMinute',
        'healingPerMinute'
    ]);
    assert.deepEqual(
        JSON.parse(harness.evaluate("JSON.stringify(getHeroStatFields('Unknown'))")),
        []
    );
});

test('manual stats normalize a season snapshot without mutating existing player data', () => {
    const harness = loadBrowserScripts(['services/manualStats.js']);
    const original = createEmptyPlayerData();
    harness.evaluate(`original = ${JSON.stringify(original)}`);
    harness.evaluate(`updated = manualStats.createUpdatedPlayerData(original, {
        heroId: 'magneto',
        scope: 'season',
        seasonId: ' Season 5 ',
        mode: 'competitive',
        competitiveRank: 'Gold',
        matchesPlayed: '12',
        metrics: {
            winRate: '58.3',
            deathsPerMinute: '0.58',
            damagePerMinute: '1184',
            damageTakenPerMinute: '1840'
        },
        updatedAt: '2026-08-24T12:00:00.000Z'
    })`);

    const unchanged = JSON.parse(harness.evaluate('JSON.stringify(original)'));
    const updated = JSON.parse(harness.evaluate('JSON.stringify(updated)'));

    assert.deepEqual(unchanged, original);
    assert.equal(updated.profile.currentSeasonId, 'season-5');
    assert.equal(updated.profile.competitiveRanks['season-5'], 'Gold');
    assert.deepEqual(updated.heroStats.magneto.seasons['season-5'].competitive, {
        matchesPlayed: 12,
        metrics: {
            winRate: 0.583,
            deathsPerMinute: 0.58,
            damagePerMinute: 1184,
            damageTakenPerMinute: 1840
        },
        updatedAt: '2026-08-24T12:00:00.000Z'
    });
});

test('manual overall Quick Play stats remain independent from season Competitive stats', () => {
    const harness = loadBrowserScripts(['services/manualStats.js']);
    harness.evaluate(`playerData = ${JSON.stringify(createEmptyPlayerData())}`);
    harness.evaluate(`playerData = manualStats.createUpdatedPlayerData(playerData, {
        heroId: 'loki',
        scope: 'overall',
        mode: 'quickPlay',
        matchesPlayed: 40,
        metrics: { winRate: 51, healingPerMinute: 1420 },
        updatedAt: '2026-08-24T12:00:00.000Z'
    })`);
    harness.evaluate(`playerData = manualStats.createUpdatedPlayerData(playerData, {
        heroId: 'loki',
        scope: 'season',
        seasonId: 'season-5',
        mode: 'competitive',
        matchesPlayed: 8,
        metrics: { winRate: 62.5, healingPerMinute: 1510 },
        updatedAt: '2026-08-24T13:00:00.000Z'
    })`);
    const playerData = JSON.parse(harness.evaluate('JSON.stringify(playerData)'));

    assert.equal(playerData.heroStats.loki.overall.quickPlay.matchesPlayed, 40);
    assert.equal(playerData.heroStats.loki.seasons['season-5'].competitive.matchesPlayed, 8);
    assert.equal(playerData.heroStats.loki.overall.quickPlay.metrics.winRate, 0.51);
    assert.equal(playerData.heroStats.loki.seasons['season-5'].competitive.metrics.winRate, 0.625);
    assert.equal(playerData.heroStats.loki.overall.competitive, undefined);
    assert.equal(playerData.heroStats.loki.seasons['season-5'].quickPlay, undefined);
});

test('manual stats reject invalid values before they reach storage', () => {
    const harness = loadBrowserScripts(['services/manualStats.js']);
    harness.evaluate(`playerData = ${JSON.stringify(createEmptyPlayerData())}`);

    assert.throws(
        () => harness.evaluate(`manualStats.createUpdatedPlayerData(playerData, {
            heroId: 'magneto',
            scope: 'season',
            seasonId: '',
            mode: 'quickPlay',
            matchesPlayed: 3,
            metrics: { winRate: 50 }
        })`),
        /Season is required/
    );
    assert.throws(
        () => harness.evaluate(`manualStats.createUpdatedPlayerData(playerData, {
            heroId: 'magneto',
            scope: 'overall',
            mode: 'quickPlay',
            matchesPlayed: 3,
            metrics: { winRate: 101 }
        })`),
        /Win rate cannot be greater than 100%/
    );
});
