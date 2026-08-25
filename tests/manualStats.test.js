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
        seasonId: '5',
        mode: 'competitive',
        competitiveRank: 'Gold',
        matchesPlayed: '12',
        matchesWon: '7',
        metrics: {
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
        matchesWon: 7,
        metrics: {
            winRate: 7 / 12,
            deathsPerMinute: 0.58,
            damagePerMinute: 1184,
            damageTakenPerMinute: 1840
        },
        updatedAt: '2026-08-24T12:00:00.000Z'
    });
});

test('bare numeric season labels normalize to benchmark-compatible IDs', () => {
    const harness = loadBrowserScripts(['services/manualStats.js']);

    assert.equal(harness.evaluate("manualStats.normalizeSeasonId('9.5')"), 'season-9-5');
    assert.equal(harness.evaluate("manualStats.normalizeSeasonId('9')"), 'season-9');
    assert.equal(harness.evaluate("manualStats.normalizeSeasonId('season-9-5')"), 'season-9-5');
    assert.equal(harness.evaluate("manualStats.normalizeSeasonId('Season 9.5')"), null);
    assert.equal(harness.evaluate("manualStats.normalizeSeasonId('nine')"), null);
    assert.equal(harness.evaluate("manualStats.formatSeasonInputValue('season-9-5')"), '9.5');
    assert.equal(harness.evaluate("manualStats.formatSeasonInputValue('season-9')"), '9');
    assert.deepEqual(
        JSON.parse(harness.evaluate('JSON.stringify(manualStats.validCompetitiveRanks)')),
        [
            'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond',
            'Grandmaster', 'Celestial', 'Eternity', 'One Above All'
        ]
    );
});

test('manual overall Quick Play stats remain independent from season Competitive stats', () => {
    const harness = loadBrowserScripts(['services/manualStats.js']);
    harness.evaluate(`playerData = ${JSON.stringify(createEmptyPlayerData())}`);
    harness.evaluate(`playerData = manualStats.createUpdatedPlayerData(playerData, {
        heroId: 'loki',
        scope: 'overall',
        mode: 'quickPlay',
        matchesPlayed: 40,
        matchesWon: 20,
        metrics: { healingPerMinute: 1420 },
        updatedAt: '2026-08-24T12:00:00.000Z'
    })`);
    harness.evaluate(`playerData = manualStats.createUpdatedPlayerData(playerData, {
        heroId: 'loki',
        scope: 'season',
        seasonId: 'season-5',
        mode: 'competitive',
        matchesPlayed: 8,
        matchesWon: 5,
        metrics: { healingPerMinute: 1510 },
        updatedAt: '2026-08-24T13:00:00.000Z'
    })`);
    const playerData = JSON.parse(harness.evaluate('JSON.stringify(playerData)'));

    assert.equal(playerData.heroStats.loki.overall.quickPlay.matchesPlayed, 40);
    assert.equal(playerData.heroStats.loki.seasons['season-5'].competitive.matchesPlayed, 8);
    assert.equal(playerData.heroStats.loki.overall.quickPlay.matchesWon, 20);
    assert.equal(playerData.heroStats.loki.overall.quickPlay.metrics.winRate, 0.5);
    assert.equal(playerData.heroStats.loki.seasons['season-5'].competitive.metrics.winRate, 0.625);
    assert.equal(playerData.heroStats.loki.overall.competitive, undefined);
    assert.equal(playerData.heroStats.loki.seasons['season-5'].quickPlay, undefined);
});

test('Deadpool forms store independent player snapshots', () => {
    const harness = loadBrowserScripts(['services/manualStats.js']);
    harness.evaluate(`playerData = ${JSON.stringify(createEmptyPlayerData())}`);
    harness.evaluate(`playerData = manualStats.createUpdatedPlayerData(playerData, {
        heroId: 'deadpool-duelist', scope: 'season', seasonId: '9.5',
        mode: 'competitive', competitiveRank: 'Gold', matchesPlayed: 10,
        matchesWon: 5, metrics: {}
    })`);
    harness.evaluate(`playerData = manualStats.createUpdatedPlayerData(playerData, {
        heroId: 'deadpool-vanguard', scope: 'season', seasonId: '9.5',
        mode: 'competitive', competitiveRank: 'Gold', matchesPlayed: 4,
        matchesWon: 1, metrics: {}
    })`);
    const playerData = JSON.parse(harness.evaluate('JSON.stringify(playerData)'));

    assert.equal(
        playerData.heroStats['deadpool-duelist'].seasons['season-9-5'].competitive.metrics.winRate,
        0.5
    );
    assert.equal(
        playerData.heroStats['deadpool-vanguard'].seasons['season-9-5'].competitive.metrics.winRate,
        0.25
    );
    assert.equal(playerData.heroStats.deadpool, undefined);
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
            matchesWon: 1,
            metrics: {}
        })`),
        /numeric season/
    );
    assert.throws(
        () => harness.evaluate(`manualStats.createUpdatedPlayerData(playerData, {
            heroId: 'magneto',
            scope: 'overall',
            mode: 'quickPlay',
            matchesPlayed: 3,
            matchesWon: 4,
            metrics: {}
        })`),
        /cannot be greater than matches played/
    );
    assert.throws(
        () => harness.evaluate(`manualStats.createUpdatedPlayerData(playerData, {
            heroId: 'magneto', scope: 'season', seasonId: '9.5',
            mode: 'competitive', competitiveRank: 'Celestial+',
            matchesPlayed: 3, matchesWon: 1, metrics: {}
        })`),
        /exact Competitive rank/
    );
});

test('manual stats calculate win rate from whole match counts', () => {
    const harness = loadBrowserScripts(['services/manualStats.js']);
    harness.evaluate(`playerData = manualStats.createUpdatedPlayerData(${JSON.stringify(createEmptyPlayerData())}, {
        heroId: 'emma-frost', scope: 'season', seasonId: '9.5',
        mode: 'competitive', competitiveRank: 'Gold',
        matchesPlayed: 8, matchesWon: 3, metrics: { winRate: 99 }
    })`);
    const snapshot = JSON.parse(harness.evaluate(
        "JSON.stringify(playerData.heroStats['emma-frost'].seasons['season-9-5'].competitive)"
    ));

    assert.equal(snapshot.matchesPlayed, 8);
    assert.equal(snapshot.matchesWon, 3);
    assert.equal(snapshot.metrics.winRate, 0.375);
});

test('manual stats leave win rate unavailable when no matches were played', () => {
    const harness = loadBrowserScripts(['services/manualStats.js']);
    harness.evaluate(`playerData = manualStats.createUpdatedPlayerData(${JSON.stringify(createEmptyPlayerData())}, {
        heroId: 'emma-frost', scope: 'overall', mode: 'quickPlay',
        matchesPlayed: 0, matchesWon: 0, metrics: {}
    })`);
    const snapshot = JSON.parse(harness.evaluate(
        "JSON.stringify(playerData.heroStats['emma-frost'].overall.quickPlay)"
    ));

    assert.equal(snapshot.matchesWon, 0);
    assert.equal(snapshot.metrics.winRate, undefined);
});
