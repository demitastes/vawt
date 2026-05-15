import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import config from '../config';

/**
 * Zod schemas for data validation
 */

const DistillerySchema = z.object({
  id: z.string(),
  name: z.string(),
  veteran_owned: z.boolean().optional(),
  founding_year: z.number().int().optional(),
  location: z
    .object({
      city: z.string().optional(),
      state: z.string().optional(),
      region: z.string().optional(),
    })
    .optional(),
  website: z.string().url().optional(),
  image_url: z.string().nullable().optional(),
  primary_products: z.array(z.string()).optional(),
  awards: z.array(z.unknown()).optional(),
  notes: z.string().nullable().optional(),
  active: z.boolean().nullable().optional(),
});

type Distillery = z.infer<typeof DistillerySchema>;

const DistilleriesFileSchema = z.object({
  version: z.number().int(),
  distilleries: z.array(DistillerySchema),
});

type DistilleriesFile = z.infer<typeof DistilleriesFileSchema>;

const BoutVotesSchema = z.record(z.string(), z.number());

const BoutSchema = z.object({
  bout_id: z.string(),
  status: z.enum(['pending', 'voting_open', 'voting_closed', 'complete']),
  scheduled_voting_opens: z.string().datetime().optional(),
  scheduled_voting_closes: z.string().datetime().optional(),
  contestants: z.array(z.string()),
  winner: z.string().nullable().optional(),
  vote_counts: BoutVotesSchema.optional(),
  notes: z.string().nullable().optional(),
});

const RoundSchema = z.object({
  round_number: z.number().int(),
  label: z.string(),
  voting_opens: z.string().datetime().optional(),
  voting_closes: z.string().datetime().optional(),
  bouts: z.array(BoutSchema),
});

const AdvancementRulesSchema = z.record(
  z.string(),
  z.object({
    from: z.array(z.string()),
  })
);

const TournamentSchema = z.object({
  year: z.number().int(),
  name: z.string(),
  status: z.enum(['pending', 'in_progress', 'complete']),
  rounds: z.array(RoundSchema),
  advancement_rules: AdvancementRulesSchema.optional(),
});

export type Tournament = z.infer<typeof TournamentSchema>;

/**
 * In-memory cache for loaded data
 */
let tournamentsCache: Tournament[] | null = null;
let distilleriesCache: DistilleriesFile | null = null;
let fileWatchers: fs.FSWatcher[] = [];

/**
 * Load all tournament JSON files from DATA_DIR
 * Matches pattern: bracket-*.json
 */
function loadTournamentsSync(): Tournament[] {
  const dataDir = config.DATA_DIR;
  const tournaments: Tournament[] = [];

  try {
    const files = fs.readdirSync(dataDir);
    const bracketFiles = files.filter((f) => f.match(/^bracket-\d+\.json$/));

    for (const filename of bracketFiles) {
      const filepath = path.join(dataDir, filename);
      const content = fs.readFileSync(filepath, 'utf-8');
      const data = JSON.parse(content);
      const validated = TournamentSchema.parse(data);
      tournaments.push(validated);
    }

    // Sort by year descending
    tournaments.sort((a, b) => b.year - a.year);
  } catch (error) {
    console.error(`Failed to load tournaments from ${config.DATA_DIR}:`, error);
    throw error;
  }

  return tournaments;
}

/**
 * Load distilleries.json from DATA_DIR
 */
function loadDistilleriesSync(): DistilleriesFile {
  const filepath = path.join(config.DATA_DIR, 'distilleries.json');

  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const data = JSON.parse(content);
    const validated = DistilleriesFileSchema.parse(data);
    return validated;
  } catch (error) {
    console.error(`Failed to load distilleries from ${filepath}:`, error);
    // Return empty structure if file doesn't exist (not critical for startup)
    return {
      version: 1,
      distilleries: [],
    };
  }
}

/**
 * Set up file watchers to reload data on changes
 */
function setupFileWatchers(): void {
  const dataDir = config.DATA_DIR;

  // Stop existing watchers
  fileWatchers.forEach((watcher) => watcher.close());
  fileWatchers = [];

  try {
    // Watch for bracket file changes
    const bracketWatcher = fs.watch(
      dataDir,
      { recursive: false },
      (eventType, filename) => {
        if (
          eventType === 'change' &&
          filename &&
          filename.match(/^bracket-\d+\.json$/)
        ) {
          console.log(`Data file changed: ${filename}, reloading tournaments`);
          tournamentsCache = null;
        }
      }
    );

    // Watch for distilleries file changes
    const distilleriesWatcher = fs.watch(
      dataDir,
      { recursive: false },
      (eventType, filename) => {
        if (eventType === 'change' && filename === 'distilleries.json') {
          console.log('Distilleries file changed, reloading');
          distilleriesCache = null;
        }
      }
    );

    fileWatchers.push(bracketWatcher, distilleriesWatcher);
  } catch (error) {
    console.warn('Failed to setup file watchers:', error);
    // Non-fatal; proceed without auto-reload
  }
}

/**
 * Get all cached tournaments, loading if needed
 */
export function getTournaments(): Tournament[] {
  if (!tournamentsCache) {
    tournamentsCache = loadTournamentsSync();
  }
  return tournamentsCache;
}

/**
 * Get cached distilleries, loading if needed
 */
export function getDistilleries(): Distillery[] {
  if (!distilleriesCache) {
    distilleriesCache = loadDistilleriesSync();
  }
  return distilleriesCache.distilleries;
}

/**
 * Get a single distillery by ID
 */
export function getDistillery(id: string): Distillery | undefined {
  return getDistilleries().find((d) => d.id === id);
}

/**
 * Get a single tournament by year
 */
export function getTournament(year: number): Tournament | undefined {
  return getTournaments().find((t) => t.year === year);
}

/**
 * Force reload of all in-memory data
 * Called by admin endpoint when needed
 */
export function forceReload(): void {
  console.log('Force reloading all data from disk');
  tournamentsCache = null;
  distilleriesCache = null;
  // Reload immediately
  getTournaments();
  getDistilleries();
}

/**
 * Initialize the data loader: load data and setup watchers
 */
export function initializeDataLoader(): void {
  console.log(`Loading data from: ${config.DATA_DIR}`);
  getTournaments();
  getDistilleries();
  setupFileWatchers();
}

/**
 * Cleanup function to close file watchers
 */
export function cleanupDataLoader(): void {
  fileWatchers.forEach((watcher) => watcher.close());
  fileWatchers = [];
}
