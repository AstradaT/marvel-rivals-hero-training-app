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
- Quick per-match result capture with mode, victory/defeat, optional MVP/SVP, and optional comfort rating
- Confirmed abandonment of unfinished practice blocks
- Persistent, searchable hero ban list with role browsing and portraits
- Persistent mute and roulette role-filter preferences
- Roulette locking while a practice block is unfinished
- Automatic practice-block persistence using browser local storage
- Automatic recovery of the active block after a page reload
- Static image fallback when an animated hero image cannot be loaded
- Stable hero IDs and versioned saved data for future expansion
- Versioned local player-data foundation for optional hero stats and training history
- Optional role-based manual hero-stat entry for Quick Play, Competitive, overall, and current-season snapshots; win rate is calculated from matches played and won
- Versioned benchmark catalog covering all sourced Season 9.5 rank filters
- Official Season 9 Quick Match benchmark snapshots for PC and console
- Counterwatch Season 9 Quick Match community snapshot with per-hero samples and Bayesian shrinkage metadata
- Visible role-based peer evaluation with separate skill and confidence results
- Strict Competitive proficiency resolver with separate Quick Play training evidence
- Exact Competitive rank selector that excludes cumulative `+` filters
- Explainable Quick Match-first Training selection using experience, evidence quality, performance, and recency
- Responsive Hero Progress dashboard with roster-wide status, priority, evidence, recency, search, filters, and sorting
- Separate Competitive Pool with stable ranked recommendations based on compatible peer evaluation, skill, confidence, and recent practice
- Quick Play Training Insight in the practice screen, with ranked evaluation kept out of the roulette workflow
- Automatic training-session history when completed blocks are replaced
- Portable JSON export/import for player stats, training history, preferences, bans, and the active practice block

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

The tests currently cover roster integrity, asset references, stable hero identities, selector boundaries, storage versioning, per-match Training results, manual-stat normalization, benchmark validation, role evaluation, confidence, legacy migration, and preference validation.

## Benchmark philosophy

Competitive is currently the app's measurement instrument, not its identity. Rank tiers provide the strongest available peer-comparison context, so benchmarked proficiency requires an exact match for:

- season;
- Competitive game mode;
- rank tier;
- hero;
- compatible metric names and canonical units.

Quick Play data is stored independently and remains useful for experience, recency, sessions, and training-priority signals. It is never compared with a Competitive benchmark. A missing rank, wrong rank, wrong season, Quick Play-only profile, or missing compatible benchmark produces an unrated result instead of an inferred fallback.

The interface reflects this separation. **Training** is Quick Play-first and presents a Quick Play Training Insight. **Competitive Pool** is not a roulette: it ranks only heroes with compatible Competitive peer evaluations, using skill as the primary signal and confidence plus recent practice as supporting signals. Low-confidence, weak, missing, or incompatible contexts remain visible as evaluation coverage but do not become ranked recommendations.

Seasonal rank records and rolling high-elo records are different schema contexts. A `Celestial+ / rolling 180 days` record can be retained as reference data, but it cannot satisfy a seasonal Gold peer lookup. Benchmark records preserve a primary source, collection date, sample metadata, methodology notes, and optional validation sources. Validation values remain separate rather than being averaged into the primary value.

The production source CSVs cover all 13 RivalsTracker Season 9.5 Competitive rank filters. Exact-rank contexts include Bronze, Silver, Gold, Platinum, Diamond, Grandmaster, Celestial, Eternity, and One Above All. Diamond+, Grandmaster+, Celestial+, and Eternity+ remain separate seasonal threshold populations and never substitute for an exact-rank benchmark. Every complete filter contains 55 hero entries; One Above All contains only the 43 heroes published by the source, and omitted heroes are not fabricated. RivalsTracker does not publish ban rate below Gold, so Bronze and Silver preserve it as explicitly unavailable rather than converting empty cells to zero.

The catalog also contains 108 primary Quick Match records captured from the official Marvel Rivals Hero Hot List: 54 for PC and 54 for console. The snapshot was updated on August 4, 2026, during Season 9 and publishes pick rate and win rate without match or player sample counts. Platform contexts remain separate. The Hood is intentionally absent because the snapshot predates the hero's release. These Quick Match records never satisfy a Competitive rank lookup.

A separate Counterwatch snapshot contributes 55 Season 9 Quick Match / All Ranks community records collected on August 26, 2026 from a source update dated August 25. Counterwatch observes matches from opted-in desktop-app users, so its population is self-selected and is never treated as the full game population. Its displayed win rate is Bayesian-shrunk toward 50% with a 400-match prior and is stored as `shrunkWinRate`, never raw `winRate`. Per-hero match counts, 95% confidence intervals, displayed pick rate, and K/10, D/10, and A/10 are preserved; per-10 rates are converted to canonical per-minute units. Platform, region, and player count remain unavailable.

The generated catalog combines 703 RivalsTracker seasonal Competitive entries, 108 official Quick Match entries, 55 Counterwatch community Quick Match entries, and five separate Emma Frost rolling references. Contexts and source populations remain separate and are never averaged automatically. Emma's RivalsMeta and official Marvel Rivals snapshots remain independent validations of the Gold pilot.

RivalsTracker exposes Deadpool's Duelist, Strategist, and Vanguard forms as separate source entries. The app likewise treats `deadpool-duelist`, `deadpool-strategist`, and `deadpool-vanguard` as three complete hero identities for roulette selection, bans, training sessions, manual statistics, and benchmark lookup. They only share visual assets and the official Marvel Rivals page. Player snapshots and source values remain separate and are never merged or averaged. Legacy statistics stored under the former shared `deadpool` ID remain preserved but are not guessed into a form.

Regenerate the catalog after updating the CSV or supplemental records with:

```bash
npm run build:benchmarks
```

Player-data schema version 2 uses canonical internal units:

- win rate is stored as a `0–1` ratio;
- rate metrics use `perMinute` keys;
- percentages and per-10-minute values are presentation or import concerns.

Version 1 player data is migrated automatically. The current manual-entry MVP asks for matches played and matches won, then calculates and stores the canonical win-rate ratio automatically. Existing snapshots without a saved win count remain compatible. The role model remains extensible for future compatible metrics. A visible Training-mode panel explains the matched benchmark, blended player value, effective sample, confidence, and source. Very-low and low-confidence samples remain `unknown`; at least medium confidence is required before assigning a performance category.

## Practice-block flow

1. Select the roles to include in the hero pool.
2. Spin the roulette to choose a training hero.
3. Play three matches with that hero.
4. Mark each match as complete and optionally record its result, MVP/SVP, and how the hero felt.
5. Optionally extend the block to five matches.
6. Spin again after the block is complete.

The current block and its per-match results are stored locally in the browser. Completed blocks become Training sessions. A manual Career Profile snapshot acts as a dated baseline; Training adds only ledger matches played after that snapshot. Saving a newer snapshot therefore supersedes earlier ledger matches while later matches continue accumulating. Snapshots without a reliable timestamp remain conservatively separate. Clearing site data will remove that saved progress.

The ban list is also stored locally. Banning a multi-role hero excludes that hero from every role while leaving the current practice block unchanged.

## Moving data to another browser

Open **Player Stats**, then use **Export data** to download a private JSON backup. On the other computer, open the same panel, choose **Import data**, select that JSON file, and confirm the replacement of the destination browser's local data. The backup includes hero snapshots, training sessions, preferences, bans, player identifiers, and the active practice block. Benchmarks and application code are not included because they are distributed with the repository.

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

Future capabilities include:

- Per-hero performance and recency statistics sourced from external account data
- Further calibration of training priorities using real player feedback
- More advanced weighting that balances improvement, variety, repetition, and fun
- A data-source boundary that can integrate with a third-party Marvel Rivals statistics provider

The player-data layer keeps Quick Play and Competitive snapshots separate across overall and per-season time horizons. For formal proficiency, the resolver uses Competitive data only, progressively favors the current season, and uses capped overall history as supporting evidence. Manual stat entry remains optional. Quick Random stays uniformly random.

Training is Quick Match-first. It compares compatible personal Quick Match win rate with Counterwatch's latest community `shrunkWinRate`, while official PC and console values validate agreement without being averaged into the baseline. Personal reliability grows smoothly as `n / (n + 8)`, so there is no 16-match cliff: weak results add practice priority progressively and strong early results provide only modest relief. Quick Match experience counts fully, Competitive familiarity counts at `0.35`, and a compatible weak Competitive evaluation adds only a small secondary signal. Older seasonal Quick Match data remains usable with reduced context compatibility. **Why this hero** shows at most the two strongest reasons.

The production catalog covers all published Season 9.5 exact-rank and cumulative rank-filter records without using cumulative populations as exact-rank fallbacks.

## Data and privacy

At present, the app does not connect to a Marvel Rivals account or send player information to a server. Practice progress, preferences, and optional player data are stored only in the browser's local storage.

## Status

This is a personal project under active development. Roster data and assets may need updates as Marvel Rivals changes over time.
