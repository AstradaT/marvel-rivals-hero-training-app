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
