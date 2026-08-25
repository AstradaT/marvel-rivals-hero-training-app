const test = require('node:test');
const assert = require('node:assert/strict');

const { loadBrowserScripts } = require('./helpers/browserScriptHarness');

test('portable backups preserve player data, preferences, and practice progress', () => {
    const harness = loadBrowserScripts(['services/appDataTransfer.js']);
    harness.evaluate(`backup = appDataTransfer.createBackup({
        playerData: {
            profile: { currentSeasonId: 'season-9-5', competitiveRanks: { 'season-9-5': 'Gold' } },
            heroStats: { 'emma-frost': { overall: {}, seasons: {} } },
            trainingSessions: [{ id: 'training-1', heroId: 'emma-frost' }]
        },
        preferences: {
            bannedHeroIds: ['hela'], activeRoles: ['Vanguard'], isMuted: true,
            appMode: 'training', playerUid: '123', playerUsername: 'player'
        },
        practiceBlock: {
            heroId: 'emma-frost', heroRole: 'Vanguard', matchesCompleted: 2, matchTarget: 3
        },
        exportedAt: '2026-08-25T20:00:00.000Z'
    })`);
    harness.evaluate('restored = appDataTransfer.parseBackup(JSON.stringify(backup))');

    const backup = JSON.parse(harness.evaluate('JSON.stringify(backup)'));
    const restored = JSON.parse(harness.evaluate('JSON.stringify(restored)'));

    assert.equal(backup.appId, 'marvel-rivals-hero-training-app');
    assert.equal(backup.schemaVersion, 1);
    assert.equal(backup.exportedAt, '2026-08-25T20:00:00.000Z');
    assert.equal(restored.playerData.profile.currentSeasonId, 'season-9-5');
    assert.deepEqual(restored.preferences.bannedHeroIds, ['hela']);
    assert.equal(restored.practiceBlock.matchesCompleted, 2);
});

test('backup parsing rejects malformed, unrelated, and unsupported files', () => {
    const harness = loadBrowserScripts(['services/appDataTransfer.js']);

    assert.throws(
        () => harness.evaluate("appDataTransfer.parseBackup('{bad json')"),
        /not valid JSON/
    );
    assert.throws(
        () => harness.evaluate("appDataTransfer.parseBackup(JSON.stringify({ appId: 'other' }))"),
        /not a Marvel Rivals/
    );
    assert.throws(
        () => harness.evaluate(`appDataTransfer.parseBackup(JSON.stringify({
            appId: 'marvel-rivals-hero-training-app', schemaVersion: 2, data: {}
        }))`),
        /version is not supported/
    );
});
