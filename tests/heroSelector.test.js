const test = require('node:test');
const assert = require('node:assert/strict');

const { loadBrowserScripts } = require('./helpers/browserScriptHarness');

test('returns null for an empty candidate pool', () => {
    const harness = loadBrowserScripts(['services/heroSelector.js']);

    assert.equal(harness.evaluate('heroSelector.selectRandom([])'), null);
});

test('selects only candidates from the supplied pool', () => {
    const harness = loadBrowserScripts(['services/heroSelector.js']);

    harness.evaluate('Math.random = () => 0');
    assert.equal(harness.evaluate("heroSelector.selectRandom(['first', 'middle', 'last'])"), 'first');

    harness.evaluate('Math.random = () => 0.999999');
    assert.equal(harness.evaluate("heroSelector.selectRandom(['first', 'middle', 'last'])"), 'last');
});
