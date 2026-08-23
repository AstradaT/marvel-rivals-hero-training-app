const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { loadBrowserScripts, projectRoot } = require('./helpers/browserScriptHarness');

function loadHeroData() {
    const harness = loadBrowserScripts(['data/heroes.js']);

    return {
        heroes: JSON.parse(harness.evaluate('JSON.stringify(heroes)')),
        officialHeroPageIds: JSON.parse(harness.evaluate('JSON.stringify(officialHeroPageIds)')),
        getOfficialUrl(heroId) {
            return harness.evaluate(`getOfficialHeroPageUrl(${JSON.stringify(heroId)})`);
        }
    };
}

test('roster entries have complete, valid core fields', () => {
    const { heroes } = loadHeroData();
    const validRoles = new Set(['Vanguard', 'Duelist', 'Strategist']);

    assert.equal(heroes.length, 55);

    heroes.forEach(hero => {
        assert.match(hero.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        assert.ok(hero.name.length > 0);
        assert.ok(validRoles.has(hero.role));
        assert.ok(hero.img.endsWith('.webp'));
        assert.ok(hero.staticImg.endsWith('.jpg'));
    });
});

test('every roster entry references existing image assets', () => {
    const { heroes } = loadHeroData();

    heroes.forEach(hero => {
        assert.ok(fs.existsSync(path.join(projectRoot, hero.img)), `${hero.name} is missing ${hero.img}`);
        assert.ok(fs.existsSync(path.join(projectRoot, hero.staticImg)), `${hero.name} is missing ${hero.staticImg}`);
    });
});

test('multi-role heroes share one stable identity', () => {
    const { heroes } = loadHeroData();
    const uniqueHeroIds = new Set(heroes.map(hero => hero.id));
    const deadpoolEntries = heroes.filter(hero => hero.id === 'deadpool');

    assert.equal(uniqueHeroIds.size, 53);
    assert.deepEqual(
        deadpoolEntries.map(hero => hero.role).sort(),
        ['Duelist', 'Strategist', 'Vanguard']
    );
});

test('every unique hero has one valid official page mapping', () => {
    const { heroes, officialHeroPageIds, getOfficialUrl } = loadHeroData();
    const uniqueHeroIds = [...new Set(heroes.map(hero => hero.id))].sort();
    const mappedHeroIds = Object.keys(officialHeroPageIds).sort();

    assert.deepEqual(mappedHeroIds, uniqueHeroIds);

    uniqueHeroIds.forEach(heroId => {
        assert.match(
            getOfficialUrl(heroId),
            /^https:\/\/www\.marvelrivals\.com\/heroes\/index\.html\?id=[0-9a-f-]{36}$/
        );
    });

    assert.equal(getOfficialUrl('unknown-hero'), null);
});

test('The Hood is configured as a Vanguard with complete assets', () => {
    const { heroes } = loadHeroData();
    const theHood = heroes.find(hero => hero.id === 'the-hood');

    assert.ok(theHood);
    assert.equal(theHood.role, 'Vanguard');
    assert.equal(theHood.img, 'assets/thehood.webp');
    assert.equal(theHood.staticImg, 'assets/static/thehood.jpg');
});
