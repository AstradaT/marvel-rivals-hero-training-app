const test = require('node:test');
const assert = require('node:assert/strict');

const { createLocalStorage, loadBrowserScripts } = require('./helpers/browserScriptHarness');

const PRACTICE_KEY = 'marvelRivalsPracticeBlock';
const PREFERENCES_KEY = 'marvelRivalsPreferences';
const PLAYER_DATA_KEY = 'marvelRivalsPlayerData';

test('practice storage saves and restores its versioned format', () => {
    const localStorage = createLocalStorage();
    const harness = loadBrowserScripts(['services/practiceStorage.js'], { localStorage });

    harness.evaluate(`practiceStorage.save({
        heroId: 'magneto',
        heroRole: 'Vanguard',
        matchesCompleted: 2,
        matchTarget: 3,
        matchResults: [{ id: 'match-001', outcome: 'win' }]
    })`);

    const stored = JSON.parse(localStorage.snapshot()[PRACTICE_KEY]);
    const loaded = JSON.parse(harness.evaluate('JSON.stringify(practiceStorage.load())'));

    assert.equal(stored.version, 1);
    assert.equal(stored.activePracticeBlock.heroId, 'magneto');
    assert.equal(loaded.matchesCompleted, 2);
    assert.equal(loaded.matchResults[0].outcome, 'win');
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
    assert.equal(preferences.appMode, 'training');
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
                isMuted: true,
                appMode: 'invalid'
            }
        })
    });
    const harness = loadBrowserScripts(['services/preferencesStorage.js'], { localStorage });
    const preferences = JSON.parse(harness.evaluate('JSON.stringify(preferencesStorage.load())'));

    assert.deepEqual(preferences.bannedHeroIds, ['magneto']);
    assert.deepEqual(preferences.activeRoles, ['Vanguard']);
    assert.equal(preferences.isMuted, true);
    assert.equal(preferences.appMode, 'training');
});

test('preferences save and restore all current settings together', () => {
    const localStorage = createLocalStorage();
    const harness = loadBrowserScripts(['services/preferencesStorage.js'], { localStorage });

    harness.evaluate("preferencesStorage.save({ bannedHeroIds: ['hela'], activeRoles: ['Duelist'], isMuted: true, appMode: 'quickRandom', playerUid: '556779284', playerUsername: 'taskmaster07' })");
    const restored = JSON.parse(harness.evaluate('JSON.stringify(preferencesStorage.load())'));

    assert.deepEqual(restored, {
        bannedHeroIds: ['hela'],
        activeRoles: ['Duelist'],
        isMuted: true,
        appMode: 'quickRandom',
        playerUid: '556779284',
        playerUsername: 'taskmaster07'
    });
});

test('player data starts empty without requiring profile setup', () => {
    const localStorage = createLocalStorage();
    const harness = loadBrowserScripts(['services/playerDataStorage.js'], { localStorage });
    const playerData = JSON.parse(harness.evaluate('JSON.stringify(playerDataStorage.load())'));

    assert.deepEqual(playerData, {
        profile: {
            currentSeasonId: null,
            competitiveRanks: {}
        },
        heroStats: {},
        trainingSessions: []
    });
});

test('player data keeps Quick Play and Competitive hero stats separate', () => {
    const localStorage = createLocalStorage();
    const harness = loadBrowserScripts(['services/playerDataStorage.js'], { localStorage });

    harness.evaluate(`playerDataStorage.save({
        profile: {
            currentSeasonId: 'season-5',
            competitiveRanks: { 'season-5': 'Gold' }
        },
        heroStats: {
            magneto: {
                overall: {
                    quickPlay: {
                        matchesPlayed: 42,
                        matchesWon: 21,
                        metrics: { winRate: 0.512, damagePerMinute: 1184 }
                    }
                },
                seasons: {
                    'season-5': {
                        quickPlay: {
                            matchesPlayed: 8,
                            metrics: { winRate: 0.50 }
                        },
                        competitive: {
                            matchesPlayed: 12,
                            matchesWon: 7,
                            metrics: { winRate: 0.583, damageTakenPerMinute: 1840 }
                        }
                    }
                }
            }
        },
        trainingSessions: []
    })`);

    const stored = JSON.parse(localStorage.snapshot()[PLAYER_DATA_KEY]);
    const restored = JSON.parse(harness.evaluate('JSON.stringify(playerDataStorage.load())'));

    assert.equal(stored.version, 2);
    assert.equal(restored.profile.competitiveRanks['season-5'], 'Gold');
    assert.equal(restored.heroStats.magneto.overall.quickPlay.matchesPlayed, 42);
    assert.equal(restored.heroStats.magneto.overall.quickPlay.matchesWon, 21);
    assert.equal(restored.heroStats.magneto.seasons['season-5'].quickPlay.matchesPlayed, 8);
    assert.equal(restored.heroStats.magneto.seasons['season-5'].competitive.matchesPlayed, 12);
    assert.equal(restored.heroStats.magneto.seasons['season-5'].competitive.matchesWon, 7);
    assert.equal(
        restored.heroStats.magneto.seasons['season-5'].competitive.metrics.damageTakenPerMinute,
        1840
    );
});

test('player data supports extensible numeric metrics and separate training sessions', () => {
    const localStorage = createLocalStorage();
    const harness = loadBrowserScripts(['services/playerDataStorage.js'], { localStorage });

    harness.evaluate(`playerDataStorage.save({
        heroStats: {
            loki: {
                seasons: {
                    'season-5': {
                        quickPlay: {
                            matchesPlayed: 6,
                            metrics: { healingPerMinute: 1420, heroSpecificValue: 9.5 }
                        }
                    }
                }
            }
        },
        trainingSessions: [{
            id: 'session-001',
            heroId: 'loki',
            gameMode: 'quickPlay',
            seasonId: 'season-5',
            playedAt: '2026-08-24T12:00:00.000Z',
            matches: 3,
            metrics: { wins: 2, healingPerMinute: 1510 },
            matchResults: [{
                id: 'match-001',
                playedAt: '2026-08-24T12:00:00.000Z',
                gameMode: 'quickPlay',
                outcome: 'win',
                recognition: 'mvp',
                feeling: 'comfortable'
            }]
        }]
    })`);

    const restored = JSON.parse(harness.evaluate('JSON.stringify(playerDataStorage.load())'));

    assert.equal(
        restored.heroStats.loki.seasons['season-5'].quickPlay.metrics.heroSpecificValue,
        9.5
    );
    assert.deepEqual(restored.trainingSessions[0], {
        id: 'session-001',
        heroId: 'loki',
        gameMode: 'quickPlay',
        seasonId: 'season-5',
        playedAt: '2026-08-24T12:00:00.000Z',
        matches: 3,
        metrics: { wins: 2, healingPerMinute: 1510 },
        matchResults: [{
            id: 'match-001',
            playedAt: '2026-08-24T12:00:00.000Z',
            gameMode: 'quickPlay',
            outcome: 'win',
            recognition: 'mvp',
            feeling: 'comfortable'
        }]
    });
});

test('player data sanitizes malformed records without affecting other app storage', () => {
    const localStorage = createLocalStorage({
        [PRACTICE_KEY]: JSON.stringify({ version: 1, activePracticeBlock: { heroId: 'magneto' } }),
        [PLAYER_DATA_KEY]: JSON.stringify({
            version: 1,
            playerData: {
                profile: {
                    currentSeasonId: '../bad',
                    competitiveRanks: { 'season-5': ' Gold ', '../bad': 'Bronze' }
                },
                heroStats: {
                    magneto: {
                        overall: {
                            quickPlay: {
                                matchesPlayed: -4,
                                metrics: { winRate: 49.8, badValue: 'unknown', negative: -1 }
                            },
                            arcade: { matchesPlayed: 999 }
                        }
                    },
                    '../bad': { overall: {} }
                },
                trainingSessions: [{ id: '', heroId: 'loki', playedAt: '', matches: 0 }]
            }
        })
    });
    const harness = loadBrowserScripts(['services/playerDataStorage.js'], { localStorage });
    const restored = JSON.parse(harness.evaluate('JSON.stringify(playerDataStorage.load())'));

    assert.equal(restored.profile.currentSeasonId, null);
    assert.deepEqual(restored.profile.competitiveRanks, { 'season-5': 'Gold' });
    assert.equal(restored.heroStats.magneto.overall.quickPlay.matchesPlayed, 0);
    assert.deepEqual(restored.heroStats.magneto.overall.quickPlay.metrics, { winRate: 0.498 });
    assert.equal(JSON.parse(localStorage.snapshot()[PLAYER_DATA_KEY]).version, 2);
    assert.equal(restored.heroStats.magneto.overall.arcade, undefined);
    assert.equal(restored.heroStats['../bad'], undefined);
    assert.deepEqual(restored.trainingSessions, []);
    assert.ok(localStorage.snapshot()[PRACTICE_KEY]);
});

test('player data migrates percentage and per-10 metrics to canonical version 2 units', () => {
    const localStorage = createLocalStorage({
        [PLAYER_DATA_KEY]: JSON.stringify({
            version: 1,
            playerData: {
                heroStats: {
                    magneto: {
                        overall: {
                            competitive: {
                                matchesPlayed: 20,
                                metrics: {
                                    winRate: 52.5,
                                    deathsPer10: 6,
                                    damagePer10: 12000
                                }
                            }
                        }
                    }
                },
                trainingSessions: []
            }
        })
    });
    const harness = loadBrowserScripts(['services/playerDataStorage.js'], { localStorage });
    const restored = JSON.parse(harness.evaluate('JSON.stringify(playerDataStorage.load())'));
    const stored = JSON.parse(localStorage.snapshot()[PLAYER_DATA_KEY]);

    assert.deepEqual(restored.heroStats.magneto.overall.competitive.metrics, {
        winRate: 0.525,
        deathsPerMinute: 0.6,
        damagePerMinute: 1200
    });
    assert.equal(stored.version, 2);
});

test('player data canonicalizes bare numeric season IDs for benchmark lookup', () => {
    const localStorage = createLocalStorage({
        marvelRivalsPlayerData: JSON.stringify({
            version: 2,
            playerData: {
                profile: {
                    currentSeasonId: '9-5',
                    competitiveRanks: { '9-5': 'Gold' }
                },
                heroStats: {
                    'emma-frost': {
                        overall: {},
                        seasons: {
                            '9-5': {
                                competitive: {
                                    matchesPlayed: 4,
                                    metrics: { winRate: 0.25 }
                                }
                            }
                        }
                    }
                },
                trainingSessions: []
            }
        })
    });
    const harness = loadBrowserScripts(['services/playerDataStorage.js'], { localStorage });
    const restored = JSON.parse(harness.evaluate('JSON.stringify(playerDataStorage.load())'));

    assert.equal(restored.profile.currentSeasonId, 'season-9-5');
    assert.equal(restored.profile.competitiveRanks['season-9-5'], 'Gold');
    assert.equal(
        restored.heroStats['emma-frost'].seasons['season-9-5'].competitive.matchesPlayed,
        4
    );
});

test('player data clears malformed JSON safely', () => {
    const localStorage = createLocalStorage({ [PLAYER_DATA_KEY]: '{invalid json' });
    const harness = loadBrowserScripts(['services/playerDataStorage.js'], { localStorage });
    const restored = JSON.parse(harness.evaluate('JSON.stringify(playerDataStorage.load())'));

    assert.deepEqual(restored, {
        profile: {
            currentSeasonId: null,
            competitiveRanks: {}
        },
        heroStats: {},
        trainingSessions: []
    });
    assert.equal(localStorage.snapshot()[PLAYER_DATA_KEY], undefined);
});
