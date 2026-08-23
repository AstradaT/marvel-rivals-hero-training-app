# Marvel Rivals Hero Training Assistant

A personal Marvel Rivals training companion that helps players practice a wider range of heroes instead of repeatedly choosing the same favorites.

The project began as a simple hero roulette and is being developed incrementally into a smarter training tool. Its current focus is deliberate practice: once a hero is selected, the player completes several matches with that hero before rolling again.

## Current features

- Random hero selection with Vanguard, Duelist, and Strategist role filters
- Animated roulette with sound effects and a mute control
- Three-match practice blocks
- Optional extension from three to five matches
- Persistent hero ban list for excluding heroes from future spins
- Roulette locking while a practice block is unfinished
- Automatic practice-block persistence using browser local storage
- Automatic recovery of the active block after a page reload
- Static image fallback when an animated hero image cannot be loaded
- Stable hero IDs and versioned saved data for future expansion

## Running the app locally

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
|-- data/heroes.js         # Canonical hero roster
|-- services/              # Practice state, preferences, and hero selection
|-- style.css              # Custom roulette animation styling
|-- assets/                # Hero images, role icons, and sound effects
`-- compress_animated.js   # Optional animated WebP optimization utility
```

The asset utility uses the `sharp` Node.js package and is not required to run the web app.

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

External account integration and smart weighting are not implemented yet. The current code is being prepared in small steps so those systems can be added without unnecessarily rewriting the app.

## Data and privacy

At present, the app does not connect to a Marvel Rivals account or send player information to a server. Practice-block progress is stored only in the browser's local storage.

## Status

This is a personal project under active development. Roster data and assets may need updates as Marvel Rivals changes over time.
