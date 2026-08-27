const test = require('node:test');
const assert = require('node:assert/strict');

const { loadBrowserScripts } = require('./helpers/browserScriptHarness');

function loadMatchResult() {
    return loadBrowserScripts(['services/matchResult.js']);
}

test('match result preserves mode, outcome, recognition, and feeling', () => {
    const harness = loadMatchResult();
    const result = JSON.parse(harness.evaluate(`JSON.stringify(matchResult.create({
        id: 'match-001',
        playedAt: '2026-08-26T12:00:00.000Z',
        gameMode: 'quickPlay',
        outcome: 'win',
        recognition: 'mvp',
        feeling: 'comfortable'
    }))`));

    assert.deepEqual(result, {
        id: 'match-001',
        playedAt: '2026-08-26T12:00:00.000Z',
        gameMode: 'quickPlay',
        outcome: 'win',
        recognition: 'mvp',
        feeling: 'comfortable'
    });
});

test('match result removes recognition that contradicts the outcome', () => {
    const harness = loadMatchResult();
    const recognition = harness.evaluate(`matchResult.sanitize({
        id: 'match-002',
        playedAt: '2026-08-26T12:00:00.000Z',
        outcome: 'loss',
        recognition: 'mvp'
    }).recognition`);

    assert.equal(recognition, null);
});

test('match result accepts completion without optional details', () => {
    const harness = loadMatchResult();
    const result = JSON.parse(harness.evaluate(`JSON.stringify(matchResult.create({
        id: 'match-003',
        playedAt: '2026-08-26T12:00:00.000Z',
        gameMode: 'quickPlay'
    }))`));

    assert.equal(result.outcome, null);
    assert.equal(result.recognition, null);
    assert.equal(result.feeling, null);
});

test('match result summarizes a block and detects a shared mode', () => {
    const harness = loadMatchResult();
    const block = `[
        { id: 'm1', playedAt: '2026-08-26T12:00:00Z', gameMode: 'quickPlay', outcome: 'win', recognition: 'mvp', feeling: 'comfortable' },
        { id: 'm2', playedAt: '2026-08-26T12:20:00Z', gameMode: 'quickPlay', outcome: 'loss', recognition: 'svp', feeling: 'struggled' },
        { id: 'm3', playedAt: '2026-08-26T12:40:00Z', gameMode: 'quickPlay' }
    ]`;
    const summary = JSON.parse(harness.evaluate(`JSON.stringify(matchResult.summarize(${block}))`));

    assert.deepEqual(summary, {
        recorded: 3,
        wins: 1,
        losses: 1,
        mvpAwards: 1,
        svpAwards: 1,
        feelings: { struggled: 1, okay: 0, comfortable: 1 }
    });
    assert.equal(harness.evaluate(`matchResult.getSessionGameMode(${block})`), 'quickPlay');
});

test('match result reports mixed sessions without claiming one game mode', () => {
    const harness = loadMatchResult();
    const mode = harness.evaluate(`matchResult.getSessionGameMode([
        { id: 'm1', playedAt: '2026-08-26T12:00:00Z', gameMode: 'quickPlay' },
        { id: 'm2', playedAt: '2026-08-26T12:20:00Z', gameMode: 'competitive' }
    ])`);

    assert.equal(mode, null);
});
