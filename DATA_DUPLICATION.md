# Data Duplication & Source of Truth

## Current Problem

The bracket application (`bracket.js`) contains hardcoded data that duplicates information from source files in `/data`. Due to browser CORS restrictions, we cannot load JSON files dynamically in a static site, so the data must be embedded in the JavaScript file.

**This creates a maintenance problem:** when tournament data changes, we must update both the source files AND the JavaScript file, or they will diverge.

## Source of Truth

The `/data` directory contains the authoritative source files:

| File | Purpose | Used for |
|------|---------|----------|
| `data/tournament-data.json` | Entrants and their bout assignments | Generating `firstRound` array in bracket.js |
| `data/bout-data.json` | Bout dates, links, organizer winners | Generating `boutData` array in bracket.js |
| `data/distillery-data.json` | Distillery information & profiles | Generating `distilleryProfiles` object in bracket.js |

## Embedded Data in bracket.js

These variables are **generated** from the source files and must be kept in sync:

```javascript
// From data/tournament-data.json
const firstRound = [
  ["Open Road", "Brady's", "Old House", "Three Crosses"],
  // ... 16 rows of 3-4 entrants per bout
];

// From data/distillery-data.json
const distilleryProfiles = {
  "Open Road": "distilleries/open-road.html",
  "Brady's": "distilleries/bradys.html",
  // ... 64 distilleries
};

// From data/bout-data.json
let boutData = [
  {"round":1,"bout":1,"dateRange":{...},"links":{...}},
  // ... 31 bouts
];
```

## How to Regenerate

### Option 1: Use the generation script (recommended)

When you update `/data` files, regenerate `bracket.js` data sections:

```bash
node scripts/generate-bracket-data.js
```

This script:
- Reads `data/tournament-data.json` → generates `firstRound` array
- Reads `data/distillery-data.json` → generates `distilleryProfiles` object
- Reads `data/bout-data.json` → validates and outputs `boutData`
- Replaces only the data sections in `bracket.js`, preserving all code

### Option 2: Manual regeneration (if script is unavailable)

If `generate-bracket-data.js` is missing or broken, you can manually update `bracket.js`:

#### Regenerate firstRound
```javascript
// Extract from data/tournament-data.json:
// Group entrants by bout number, organized by round
// Tournament entrants are organized as R1B1, R1B2, etc.
const firstRound = [
  ["Open Road", "Brady's", "Old House", "Three Crosses"],  // R1B1
  // ... extract all R1B* bouts, 16 rows total
];
```

#### Regenerate distilleryProfiles
```javascript
// Extract name → profile path mapping from data/distillery-data.json
// Use the distillery name as key
// Profile path follows pattern: distilleries/{kebab-case-name}.html
const distilleryProfiles = {
  "Open Road": "distilleries/open-road.html",
  "Brady's": "distilleries/bradys.html",
  // ... one entry per distillery
};
```

#### Regenerate boutData
```javascript
// Copy directly from data/bout-data.json
// No transformation needed
let boutData = [/* copy from bout-data.json */];
```

## Verification

After regenerating, verify the site still works:

```bash
# Test with local browser (open index.html)
# Verify:
# - All distillery profile links are clickable (404 means missing profile)
# - Bout dates display correctly
# - Organizer winners (if any) show with 🏆 emoji
# - Competitor selections and localStorage work
```

## Future: Remove Duplication

This duplication is temporary. Long-term solutions:

1. **Build step** (Phase 2): Create a build script that generates `index.html` from template + data files (moves this to CI/CD)

2. **Backend API** (Phase 3+): Serve bracket data from an API endpoint instead of embedding it

3. **Hybrid approach**: Use a light HTTP server locally that serves the data while keeping static deployment files

For now: **Keep `/data` as source of truth. Regenerate `bracket.js` after any data change.**
