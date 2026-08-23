const test = require('node:test');
const assert = require('node:assert/strict');

const { createLocalStorage, loadBrowserScripts } = require('./helpers/browserScriptHarness');

const PRACTICE_KEY = 'marvelRivalsPracticeBlock';
const PREFERENCES_KEY = 'marvelRivalsPreferences';

test('practice storage saves and restores its versioned format', () => {
    const localStorage = createLocalStorage();
    const harness = loadBrowserScripts(['services/practiceStorage.js'], { localStorage });

    harness.evaluate("practiceStorage.save({ heroId: 'magneto', heroRole: 'Vanguard', matchesCompleted: 2, matchTarget: 3 })");

    const stored = JSON.parse(localStorage.snapshot()[PRACTICE_KEY]);
    const loaded = JSON.parse(harness.evaluate('JSON.stringify(practiceStorage.load())'));

    assert.equal(stored.version, 1);
    assert.equal(stored.activePracticeBlock.heroId, 'magneto');
    assert.equal(loaded.matchesCompleted, 2);
});

test('practice storage loads legacy unversioned blocks', () => {
    const legacyBlock = {
        heroName: 'Magneto',
        heroRole: 'Vanguard',
        matchesCompleted: 1,
        matchTarget: 3
    };
    const localStorage = createLocalStorage({
        [PRACTICE_KEY]: JSON.stringify(legacyBlock)
    });
    const harness = loadBrowserScripts(['services/practiceStorage.js'], { localStorage });

    assert.deepEqual(
        JSON.parse(harness.evaluate('JSON.stringify(practiceStorage.load())')),
        legacyBlock
    );
});

test('practice storage clears malformed data safely', () => {
    const localStorage = createLocalStorage({ [PRACTICE_KEY]: '{invalid json' });
    const harness = loadBrowserScripts(['services/practiceStorage.js'], { localStorage });

    assert.equal(harness.evaluate('practiceStorage.load()'), null);
    assert.equal(localStorage.snapshot()[PRACTICE_KEY], undefined);
});

test('preferences provide defaults for existing ban-only saves', () => {
    const localStorage = createLocalStorage({
        [PREFERENCES_KEY]: JSON.stringify({
            version: 1,
            preferences: { bannedHeroIds: ['magneto'] }
        })
    });
    const harness = loadBrowserScripts(['services/preferencesStorage.js'], { localStorage });
    const preferences = JSON.parse(harness.evaluate('JSON.stringify(preferencesStorage.load())'));

    assert.deepEqual(preferences.bannedHeroIds, ['magneto']);
    assert.deepEqual(preferences.activeRoles, ['Vanguard', 'Duelist', 'Strategist']);
    assert.equal(preferences.isMuted, false);
    assert.equal(preferences.playerUid, '');
    assert.equal(preferences.playerUsername, '');
});

test('preferences sanitize duplicates, invalid roles, and invalid ban values', () => {
    const localStorage = createLocalStorage({
        [PREFERENCES_KEY]: JSON.stringify({
            version: 1,
            preferences: {
                bannedHeroIds: ['magneto', 'magneto', 42],
                activeRoles: ['Vanguard', 'Invalid', 'Vanguard'],
                isMuted: true
            }
        })
    });
    const harness = loadBrowserScripts(['services/preferencesStorage.js'], { localStorage });
    const preferences = JSON.parse(harness.evaluate('JSON.stringify(preferencesStorage.load())'));

    assert.deepEqual(preferences.bannedHeroIds, ['magneto']);
    assert.deepEqual(preferences.activeRoles, ['Vanguard']);
    assert.equal(preferences.isMuted, true);
});

test('preferences save and restore all current settings together', () => {
    const localStorage = createLocalStorage();
    const harness = loadBrowserScripts(['services/preferencesStorage.js'], { localStorage });

    harness.evaluate("preferencesStorage.save({ bannedHeroIds: ['hela'], activeRoles: ['Duelist'], isMuted: true, playerUid: '556779284', playerUsername: 'taskmaster07' })");
    const restored = JSON.parse(harness.evaluate('JSON.stringify(preferencesStorage.load())'));

    assert.deepEqual(restored, {
        bannedHeroIds: ['hela'],
        activeRoles: ['Duelist'],
        isMuted: true,
        playerUid: '556779284',
        playerUsername: 'taskmaster07'
    });
});
