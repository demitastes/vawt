# Data Synchronization Status

## Summary

All distillery names in the tournament and distillery data files are now synchronized and consistent.

- **Tournament entrants**: 55 (from `data/tournament-data.json`)
- **Distillery profiles**: 55 (from `data/distillery-data.json`)
- **Name matches**: 100% ✅

## Changes Made

### Fixed Name: Lost Whiskey
- **Before**: Original `bracket.js` had hardcoded "Lost Whiskey Co" (incorrect)
- **After**: Synchronized to "Lost Whiskey" (correct)
- **Source**: Both `tournament-data.json` and `distillery-data.json` confirmed "Lost Whiskey"
- **Official Name**: "Lost Whiskey Distillery"

### Generation Script Improvements
- Created `scripts/generate-bracket-data.js` to regenerate `bracket.js` data from source files
- Script handles multi-line data sections safely without corrupting code
- Validates all distillery names exist in both files before generating
- Provides clear error messages if data structure changes

## Verification

Run this to verify names are synchronized:

```bash
node << 'EOF'
const fs = require("fs");
const tournament = JSON.parse(fs.readFileSync("data/tournament-data.json", "utf-8"));
const distillery = JSON.parse(fs.readFileSync("data/distillery-data.json", "utf-8"));

const tNames = new Set(tournament.entrants.map(e => e.name));
const dNames = new Set(distillery.map(d => d.name));

const missing = Array.from(tNames).filter(n => !dNames.has(n));
const extra = Array.from(dNames).filter(n => !tNames.has(n));

console.log(`Tournament: ${tNames.size}, Distilleries: ${dNames.size}`);
if (missing.length + extra.length === 0) {
  console.log("✅ All names synchronized!");
} else {
  console.log(`❌ Mismatches: ${missing.length} missing, ${extra.length} extra`);
}
EOF
```

## Workflow for Future Updates

When updating tournament data:

1. Edit `data/tournament-data.json` to add/remove/rename entrants
2. Edit `data/distillery-data.json` to add/remove/rename distilleries (keep names in sync)
3. Run the generation script: `node scripts/generate-bracket-data.js`
4. Verify the site loads: `open index.html` and test in browser
5. Commit all changes: `git add data/ bracket.js` and `git commit -m "Update bracket data"`

## Source of Truth

- **`data/tournament-data.json`** - authoritative list of tournament entrants and bouts
- **`data/distillery-data.json`** - authoritative list of distillery profiles
- **`data/bout-data.json`** - authoritative bout dates and voting links
- **`bracket.js`** - generated from above files (regenerate after data changes)

The `/data` directory is the source of truth. Never manually edit the data sections in `bracket.js`.
