const test = require('node:test');
const assert = require('node:assert/strict');

const { loadBrowserScripts } = require('./helpers/browserScriptHarness');

function createPriority(overrides = {}) {
    return {
        weight: 2,
        experienceMatches: 20,
        experience: { quickPlayMatches: 20, competitiveMatches: 0 },
        lastPlayedAt: '2026-08-20T12:00:00.000Z',
        daysSincePlayed: 6,
        reason: 'Fixture reason.',
        quickPlayPerformance: {
            playerMatches: 20,
            reliability: 0.71
        },
        signals: { quickPlayPerformance: 0, competitive: 0 },
        ...overrides
    };
}

test('progress states are derived from existing priority evidence', () => {
    const harness = loadBrowserScripts(['services/trainingProgress.js']);
    harness.evaluate(`base = ${JSON.stringify(createPriority())}`);
    const states = JSON.parse(harness.evaluate(`JSON.stringify({
        untried: trainingProgress.getStatus({
            ...base, experienceMatches: 0,
            quickPlayPerformance: { playerMatches: 0, reliability: 0 }
        }),
        gathering: trainingProgress.getStatus({
            ...base,
            quickPlayPerformance: { playerMatches: 5, reliability: 0.38 }
        }),
        needsPractice: trainingProgress.getStatus({
            ...base, signals: { quickPlayPerformance: 0.3, competitive: 0 }
        }),
        maintenance: trainingProgress.getStatus({
            ...base, lastPlayedAt: null, daysSincePlayed: null
        }),
        wellCovered: trainingProgress.getStatus(base)
    })`));

    assert.deepEqual(states, {
        untried: 'untried',
        gathering: 'gathering',
        needsPractice: 'needsPractice',
        maintenance: 'maintenance',
        wellCovered: 'wellCovered'
    });
});

test('progress entries preserve visible evidence and banned state', () => {
    const harness = loadBrowserScripts(['services/trainingProgress.js']);
    const entry = JSON.parse(harness.evaluate(`JSON.stringify(trainingProgress.createEntry({
        hero: { id: 'storm', name: 'Storm', role: 'Duelist', staticImg: 'storm.jpg' },
        priority: ${JSON.stringify(createPriority())},
        isBanned: true
    }))`));

    assert.equal(entry.status, 'wellCovered');
    assert.equal(entry.reliabilityLabel, 'Growing');
    assert.equal(entry.quickPlayMatches, 20);
    assert.equal(entry.isBanned, true);
});

test('progress filtering and sorting combine search, role, status, and priority', () => {
    const harness = loadBrowserScripts(['services/trainingProgress.js']);
    harness.evaluate(`entries = [
        { heroName: 'Storm', role: 'Duelist', status: 'untried', priorityWeight: 4, statusRank: 0, experienceMatches: 0, daysSincePlayed: null },
        { heroName: 'Thor', role: 'Vanguard', status: 'gathering', priorityWeight: 3, statusRank: 1, experienceMatches: 4, daysSincePlayed: 20 },
        { heroName: 'The Thing', role: 'Vanguard', status: 'gathering', priorityWeight: 2, statusRank: 1, experienceMatches: 8, daysSincePlayed: 5 }
    ]`);

    const filtered = JSON.parse(harness.evaluate(`JSON.stringify(
        trainingProgress.filterAndSort(entries, {
            search: 'th', role: 'Vanguard', status: 'gathering', sort: 'priority'
        }).map(entry => entry.heroName)
    )`));
    const leastExperience = JSON.parse(harness.evaluate(`JSON.stringify(
        trainingProgress.filterAndSort(entries, { sort: 'experience' })
            .map(entry => entry.heroName)
    )`));

    assert.deepEqual(filtered, ['Thor', 'The Thing']);
    assert.deepEqual(leastExperience, ['Storm', 'Thor', 'The Thing']);
});

test('progress summary counts every dashboard state', () => {
    const harness = loadBrowserScripts(['services/trainingProgress.js']);
    const summary = JSON.parse(harness.evaluate(`JSON.stringify(trainingProgress.summarize([
        { status: 'untried' }, { status: 'untried' },
        { status: 'gathering' }, { status: 'needsPractice' },
        { status: 'maintenance' }, { status: 'wellCovered' }
    ]))`));

    assert.deepEqual(summary, {
        total: 6,
        untried: 2,
        gathering: 1,
        needsPractice: 1,
        maintenance: 1,
        wellCovered: 1
    });
});
