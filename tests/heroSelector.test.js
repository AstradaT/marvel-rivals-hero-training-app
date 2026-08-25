const test = require('node:test');
const assert = require('node:assert/strict');

const { loadBrowserScripts } = require('./helpers/browserScriptHarness');

test('returns null for an empty candidate pool', () => {
    const harness = loadBrowserScripts(['services/heroSelector.js']);

    assert.equal(harness.evaluate('heroSelector.selectQuickRandom([])'), null);
    assert.equal(harness.evaluate('heroSelector.selectTraining([])'), null);
});

test('Quick Random remains uniformly random within the supplied pool', () => {
    const harness = loadBrowserScripts(['services/heroSelector.js']);

    harness.evaluate('Math.random = () => 0');
    assert.equal(harness.evaluate("heroSelector.selectQuickRandom(['first', 'middle', 'last'])"), 'first');

    harness.evaluate('Math.random = () => 0.999999');
    assert.equal(harness.evaluate("heroSelector.selectQuickRandom(['first', 'middle', 'last'])"), 'last');
});

test('Training has an independent selection entry point', () => {
    const harness = loadBrowserScripts(['services/heroSelector.js']);

    harness.evaluate('Math.random = () => 0.5');
    assert.equal(
        harness.evaluate("heroSelector.selectTraining(['first', 'middle', 'last'])"),
        'middle'
    );
});

test('Training uses priority weights while Quick Random remains uniform', () => {
    const harness = loadBrowserScripts(['services/heroSelector.js']);
    harness.evaluate(`candidates = [
        { id: 'first' }, { id: 'priority' }, { id: 'last' }
    ]`);
    harness.evaluate('Math.random = () => 0.4');

    assert.equal(
        harness.evaluate("heroSelector.selectQuickRandom(candidates).id"),
        'priority'
    );
    assert.equal(
        harness.evaluate(`heroSelector.selectTraining(candidates, {
            first: 1, priority: 10, last: 1
        }).id`),
        'priority'
    );
    harness.evaluate('Math.random = () => 0.2');
    assert.equal(
        harness.evaluate(`heroSelector.selectTraining(candidates, {
            first: 1, priority: 1, last: 10
        }).id`),
        'last'
    );
});
