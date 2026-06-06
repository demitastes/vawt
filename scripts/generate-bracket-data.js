#!/usr/bin/env node

/**
 * Generate bracket-data.js from source files.
 *
 * This script reads authoritative data from /data and generates
 * bracket-data.js which contains all data declarations (firstRound,
 * distilleryProfiles, rounds, boutData). This file is then loaded
 * by index.html before bracket.js, which contains only logic.
 *
 * Run this after updating any /data files.
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const BRACKET_DATA_JS = path.join(PROJECT_ROOT, "bracket-data.js");

function loadJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    process.exit(1);
  }
}

function generateFirstRound(tournamentData) {
  if (!tournamentData || !tournamentData.entrants) {
    throw new Error("Invalid tournament-data.json: missing 'entrants' array");
  }

  const entrants = tournamentData.entrants;
  const firstRoundBouts = {};

  // Group entrants by bout (e.g., "R1B1" -> bout 1)
  entrants.forEach((entrant) => {
    const match = entrant.bout.match(/R1B(\d+)/);
    if (!match) {
      throw new Error(`Invalid bout format: "${entrant.bout}" (expected R1B#)`);
    }
    const boutNum = parseInt(match[1], 10);
    if (!firstRoundBouts[boutNum]) {
      firstRoundBouts[boutNum] = [];
    }
    firstRoundBouts[boutNum].push(entrant.name);
  });

  // Build array in order (bout 1 to 16)
  const maxBout = Math.max(...Object.keys(firstRoundBouts).map(Number));
  const result = [];
  for (let i = 1; i <= maxBout; i++) {
    if (firstRoundBouts[i]) {
      result.push(firstRoundBouts[i]);
    }
  }

  return result;
}

function generateDistilleryProfiles(distilleryData) {
  if (!Array.isArray(distilleryData)) {
    throw new Error("Invalid distillery-data.json: expected array");
  }

  const profiles = {};
  distilleryData.forEach((distillery) => {
    if (!distillery.name) {
      throw new Error("Invalid distillery: missing 'name'");
    }
    // Convert name to kebab-case using algorithm:
    // 1. Remove apostrophes
    // 2. Replace non-alphanumerics and spaces with single hyphen
    // 3. Lowercase
    // Examples: "GW's Grist Mill" -> "gws-grist-mill"
    //           "Trial & Error" -> "trial-error"
    const kebabName = distillery.name
      .replace(/'/g, "")                  // Remove apostrophes
      .replace(/[^\w-]/g, "-")            // Replace non-word chars (except hyphen) with hyphen
      .replace(/-+/g, "-")                // Coalesce multiple hyphens to single
      .toLowerCase()
      .replace(/^-|-$/g, "");             // Remove leading/trailing hyphens
    profiles[distillery.name] = `distilleries/${kebabName}.html`;
  });

  return profiles;
}

function formatFirstRound(firstRound) {
  return (
    "const firstRound = [\n" +
    firstRound
      .map((bouts) => {
        const boutStr = bouts
          .map((name) => `"${name.replace(/"/g, '\\"')}"`)
          .join(", ");
        return `  [${boutStr}]`;
      })
      .join(",\n") +
    "\n];"
  );
}

function formatDistilleryProfiles(profiles) {
  const entries = Object.entries(profiles)
    .map(
      ([name, path]) =>
        `  "${name.replace(/"/g, '\\"')}": "${path.replace(/"/g, '\\"')}"`
    )
    .join(",\n");

  return `const distilleryProfiles = {\n${entries}\n};`;
}

function formatRounds() {
  return `const rounds = [
  { round: 1, bouts: 16 },
  { round: 2, bouts: 8 },
  { round: 3, bouts: 4 },
  { round: 4, bouts: 2 },
  { round: 5, bouts: 1 }
];`;
}

function formatBoutData(boutData) {
  const json = JSON.stringify(boutData, null, 2);
  return "let boutData = " + json + ";";
}

function generateBracketData(firstRound, distilleryProfiles, boutData) {
  const content = [
    formatFirstRound(firstRound),
    "",
    formatDistilleryProfiles(distilleryProfiles),
    "",
    formatRounds(),
    "",
    formatBoutData(boutData)
  ].join("\n");

  fs.writeFileSync(BRACKET_DATA_JS, content, "utf-8");
}

function main() {
  console.log("📊 Generating bracket-data.js from source files...\n");

  try {
    // Load source files
    console.log("📂 Loading source files...");
    const tournamentData = loadJSON(path.join(DATA_DIR, "tournament-data.json"));
    const distilleryData = loadJSON(path.join(DATA_DIR, "distillery-data.json"));
    const boutData = loadJSON(path.join(DATA_DIR, "bout-data.json"));
    console.log(`   ✓ tournament-data.json (${tournamentData.entrants.length} entrants)`);
    console.log(`   ✓ distillery-data.json (${distilleryData.length} distilleries)`);
    console.log(`   ✓ bout-data.json (${boutData.length} bouts)\n`);

    // Generate data structures
    console.log("🔄 Generating data structures...");
    const firstRound = generateFirstRound(tournamentData);
    const distilleryProfiles = generateDistilleryProfiles(distilleryData);
    console.log(`   ✓ firstRound (${firstRound.length} bouts)`);
    console.log(`   ✓ distilleryProfiles (${Object.keys(distilleryProfiles).length} profiles)`);
    console.log(`   ✓ rounds (5 rounds)`);
    console.log(`   ✓ boutData (${boutData.length} bouts)\n`);

    // Generate bracket-data.js
    console.log("✏️  Generating bracket-data.js...");
    generateBracketData(firstRound, distilleryProfiles, boutData);
    console.log("   ✓ bracket-data.js generated\n");

    console.log("✅ Done! Data file created.\n");
    console.log("Next steps:");
    console.log("  1. Verify the site still loads: open index.html");
    console.log("  2. Test that all features work");
    console.log("  3. Commit the changes:");
    console.log("     git add data/ bracket-data.js");
    console.log("     git commit -m 'Update bracket data'");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
