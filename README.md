# Marvel Rivals Hero Training Assistant

A personal Marvel Rivals training companion that helps players practice a wider range of heroes instead of repeatedly choosing the same favorites.

The project began as a simple hero roulette and is being developed incrementally into a smarter training tool. Its current focus is deliberate practice: once a hero is selected, the player completes several matches with that hero before rolling again.

## Live app

**[Open the Marvel Rivals Hero Training Assistant](https://marvel-rivals-hero-training-app.vercel.app/)**

## Current features

- Random hero selection with Vanguard, Duelist, and Strategist role filters
- Separate Quick Random and Training modes with a persisted mode preference
- Free Quick Random rerolls that preserve unfinished Training blocks
- Animated roulette with sound effects and a mute control
- Selected hero image links to the hero's official Marvel Rivals page
- Responsive mobile-first layout with a two-column desktop workspace
- Three-match practice blocks
- Optional extension from three to five matches
- Undo control for accidental match completions
- Confirmed abandonment of unfinished practice blocks
- Persistent, searchable hero ban list with role browsing and portraits
- Persistent mute and roulette role-filter preferences
- Roulette locking while a practice block is unfinished
- Automatic practice-block persistence using browser local storage
- Automatic recovery of the active block after a page reload
- Static image fallback when an animated hero image cannot be loaded
- Stable hero IDs and versioned saved data for future expansion
- Versioned local player-data foundation for optional hero stats and training history
- Optional role-based manual hero-stat entry for Quick Play, Competitive, overall, and current-season snapshots
- Versioned benchmark catalog with the complete sourced Season 9.5 Gold dataset
- Visible role-based peer evaluation with separate skill and confidence results
- Strict Competitive proficiency resolver with separate Quick Play training evidence

## Local development

The application is built with plain HTML, CSS, and JavaScript. It does not require a build step.

You can open `index.html` directly in a browser. For a more consistent local environment, serve the directory with any static web server. For example, if Python is installed:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

An internet connection is currently required for Tailwind CSS, which is loaded from a CDN.

## Project structure

```text
.
|-- index.html             # Page structure and interface
|-- app.js                 # Roulette, practice rules, and UI behavior
|-- data/                  # Hero roster, source CSV, supplemental records, and generated catalog
|-- scripts/               # Reproducible benchmark catalog generator
|-- services/              # Practice, preferences, player data, and hero selection
|-- tests/                 # Dependency-free Node test suite
|-- style.css              # Custom roulette animation styling
|-- assets/                # Hero images, role icons, and sound effects
|-- package.json           # Test command and project metadata
`-- compress_animated.js   # Optional animated WebP optimization utility
```

The asset utility uses the `sharp` Node.js package and is not required to run the web app.

## Automated tests

The test suite uses Node's built-in test runner, so no packages need to be installed. Run:

```bash
npm test
```

The tests currently cover roster integrity, asset references, stable hero identities, selector boundaries, storage versioning, manual-stat normalization, benchmark validation, role evaluation, confidence, legacy migration, and preference validation.

## Benchmark philosophy

Competitive is currently the app's measurement instrument, not its identity. Rank tiers provide the strongest available peer-comparison context, so benchmarked proficiency requires an exact match for:

- season;
- Competitive game mode;
- rank tier;
- hero;
- compatible metric names and canonical units.

Quick Play data is stored independently and remains useful for experience, recency, sessions, and future training-priority signals. It is never compared with a Competitive benchmark. A missing rank, wrong rank, wrong season, Quick Play-only profile, or missing compatible benchmark produces an unrated result instead of an inferred fallback.

Seasonal rank records and rolling high-elo records are different schema contexts. A `Celestial+ / rolling 180 days` record can be retained as reference data, but it cannot satisfy a seasonal Gold peer lookup. Benchmark records preserve a primary source, collection date, sample metadata, methodology notes, and optional validation sources. Validation values remain separate rather than being averaged into the primary value.

The production source CSVs contain 55 Season 9.5 Competitive entries for Bronze, Silver, Gold, Platinum, and Diamond from RivalsTracker, with win rate, pick rate, match sample, tier, displayed rank, timestamps, and hero-specific source URLs. Gold, Platinum, and Diamond also include ban rate. RivalsTracker does not publish ban rate below Gold, so Bronze and Silver preserve it as explicitly unavailable rather than converting the empty source cells to zero. The generated catalog combines those 275 rank-specific entries with five separate Emma Frost Celestial+ rolling references. Emma's RivalsMeta and official Marvel Rivals snapshots remain independent validations of the Gold pilot and are never averaged into the primary values.

RivalsTracker exposes Deadpool's Duelist, Strategist, and Vanguard forms as separate source entries. The app likewise treats `deadpool-duelist`, `deadpool-strategist`, and `deadpool-vanguard` as three complete hero identities for roulette selection, bans, training sessions, manual statistics, and benchmark lookup. They only share visual assets and the official Marvel Rivals page. Player snapshots and source values remain separate and are never merged or averaged. Legacy statistics stored under the former shared `deadpool` ID remain preserved but are not guessed into a form.

Regenerate the catalog after updating the CSV or supplemental records with:

```bash
npm run build:benchmarks
```

Player-data schema version 2 uses canonical internal units:

- win rate is stored as a `0–1` ratio;
- rate metrics use `perMinute` keys;
- percentages and per-10-minute values are presentation or import concerns.

Version 1 player data is migrated automatically. The current manual-entry MVP asks only for match count and win rate, while the role model remains extensible for future compatible metrics. A visible Training-mode panel explains the matched benchmark, blended player value, effective sample, confidence, and source. Very-low and low-confidence samples remain `unknown`; at least medium confidence is required before assigning a performance category.

## Practice-block flow

1. Select the roles to include in the hero pool.
2. Spin the roulette to choose a training hero.
3. Play three matches with that hero.
4. Mark each match as complete in the app.
5. Optionally extend the block to five matches.
6. Spin again after the block is complete.

The current block is stored locally in the browser. Clearing site data will remove that saved progress.

The ban list is also stored locally. Banning a multi-role hero excludes that hero from every role while leaving the current practice block unchanged.

## Development direction

The long-term goal is to support this flow:

```text
Marvel Rivals account data
        |
        v
Player statistics
        |
        v
Hero performance analysis
        |
        v
Training recommendations
        |
        v
Smart hero randomization
```

Planned capabilities include:

- Per-hero performance and recency statistics sourced from external account data
- Training priorities based on experience, performance, and time since last played
- Weighted hero selection that balances improvement, variety, repetition, and fun
- A data-source boundary that can integrate with a third-party Marvel Rivals statistics provider

The player-data layer keeps Quick Play and Competitive snapshots separate across overall and per-season time horizons. For proficiency, the resolver uses Competitive data only, progressively favors the current season, and uses capped overall history as supporting evidence. Quick Play remains available as non-comparative training evidence. Manual stat entry remains optional. Quick Random and Training use independent selector entry points, although Training remains uniformly random for now. The production catalog now covers every directly compatible roster hero in Season 9.5 Gold. Evaluation is displayed for compatible saved stats but is not used for selection yet, and smart weighting is not implemented.

## Data and privacy

At present, the app does not connect to a Marvel Rivals account or send player information to a server. Practice progress, preferences, and optional player data are stored only in the browser's local storage.

## Status

This is a personal project under active development. Roster data and assets may need updates as Marvel Rivals changes over time.
