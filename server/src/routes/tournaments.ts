import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getTournaments,
  getTournament,
} from '../data/loader';
import { getDb } from '../db/client';

const router = Router();

class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Get vote counts from database and merge with JSON vote_counts
 * Returns map of distillery_id -> total vote count
 */
function getMergedVoteCounts(
  tournamentYear: number,
  boutId: string
): Record<string, number> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT distillery_id, SUM(count) as total
    FROM votes
    WHERE tournament_year = ? AND bout_id = ?
    GROUP BY distillery_id
  `);

  const dbVotes = stmt.all(tournamentYear, boutId) as Array<{
    distillery_id: string;
    total: number;
  }>;

  const result: Record<string, number> = {};
  for (const row of dbVotes) {
    result[row.distillery_id] = row.total;
  }

  return result;
}

// Routes must be defined in this order: most specific first, then general

/**
 * GET /tournaments/:year/bouts/:boutId
 * Get a single bout with detailed vote breakdown by source
 */
router.get(
  '/:year/bouts/:boutId',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const yearSchema = z.coerce.number().int().positive();
      const year = yearSchema.parse(req.params.year);
      const { boutId } = req.params;

      const tournament = getTournament(year);
      if (!tournament) {
        throw new AppError(
          404,
          'NOT_FOUND',
          `Tournament year ${year} not found`
        );
      }

      let bout = null;
      for (const round of tournament.rounds) {
        const found = round.bouts.find((b) => b.bout_id === boutId);
        if (found) {
          bout = found;
          break;
        }
      }

      if (!bout) {
        throw new AppError(404, 'NOT_FOUND', `Bout ${boutId} not found`);
      }

      // Get vote breakdown by source from database
      const db = getDb();
      const votesStmt = db.prepare(`
        SELECT distillery_id, source, SUM(count) as total
        FROM votes
        WHERE tournament_year = ? AND bout_id = ?
        GROUP BY distillery_id, source
      `);

      const dbVotes = votesStmt.all(year, boutId) as Array<{
        distillery_id: string;
        source: string;
        total: number;
      }>;

      // Build vote_counts_by_source structure
      const voteCounts: Record<string, Record<string, number>> = {};
      const totalVotes: Record<string, number> = {};

      for (const row of dbVotes) {
        if (!voteCounts[row.distillery_id]) {
          voteCounts[row.distillery_id] = {};
        }
        voteCounts[row.distillery_id][row.source] = row.total;
        totalVotes[row.distillery_id] =
          (totalVotes[row.distillery_id] || 0) + row.total;
      }

      // Merge with JSON vote counts if they exist
      if (bout.vote_counts) {
        for (const [distilleryId, jsonCount] of Object.entries(
          bout.vote_counts
        )) {
          totalVotes[distilleryId] = (totalVotes[distilleryId] || 0) + jsonCount;
        }
      }

      res.json({
        bout_id: bout.bout_id,
        status: bout.status,
        scheduled_voting_opens: bout.scheduled_voting_opens,
        scheduled_voting_closes: bout.scheduled_voting_closes,
        contestants: bout.contestants,
        winner: bout.winner || null,
        vote_counts: totalVotes,
        vote_counts_by_source: voteCounts,
        notes: bout.notes || null,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /tournaments/:year/bouts
 * Get all bouts for a tournament with merged vote counts
 */
router.get(
  '/:year/bouts',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const yearSchema = z.coerce.number().int().positive();
      const year = yearSchema.parse(req.params.year);

      const tournament = getTournament(year);
      if (!tournament) {
        throw new AppError(
          404,
          'NOT_FOUND',
          `Tournament year ${year} not found`
        );
      }

      // Flatten all bouts and merge database vote counts
      const allBouts = [];
      for (const round of tournament.rounds) {
        for (const bout of round.bouts) {
          const dbVotes = getMergedVoteCounts(year, bout.bout_id);
          const mergedVoteCounts = {
            ...bout.vote_counts,
            ...dbVotes,
          };
          allBouts.push({
            ...bout,
            vote_counts: mergedVoteCounts,
          });
        }
      }

      res.json(allBouts);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /tournaments/:year/active
 * Get currently open-voting bouts
 * A bout is active if its status is 'voting_open' or if current time is between
 * scheduled_voting_opens and scheduled_voting_closes
 */
router.get(
  '/:year/active',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const yearSchema = z.coerce.number().int().positive();
      const year = yearSchema.parse(req.params.year);

      const tournament = getTournament(year);
      if (!tournament) {
        throw new AppError(
          404,
          'NOT_FOUND',
          `Tournament year ${year} not found`
        );
      }

      const now = new Date();
      const activeBouts = [];

      for (const round of tournament.rounds) {
        for (const bout of round.bouts) {
          let isActive = bout.status === 'voting_open';

          // Also check scheduled times
          if (!isActive && bout.scheduled_voting_opens && bout.scheduled_voting_closes) {
            const opens = new Date(bout.scheduled_voting_opens);
            const closes = new Date(bout.scheduled_voting_closes);
            isActive = now >= opens && now <= closes;
          }

          if (isActive) {
            const dbVotes = getMergedVoteCounts(year, bout.bout_id);
            const mergedVoteCounts = {
              ...bout.vote_counts,
              ...dbVotes,
            };
            activeBouts.push({
              ...bout,
              vote_counts: mergedVoteCounts,
            });
          }
        }
      }

      res.json(activeBouts);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /tournaments/:year
 * Get full tournament data for a specific year
 */
router.get('/:year', (req: Request, res: Response, next: NextFunction) => {
  try {
    const yearSchema = z.coerce.number().int().positive();
    const year = yearSchema.parse(req.params.year);

    const tournament = getTournament(year);
    if (!tournament) {
      throw new AppError(404, 'NOT_FOUND', `Tournament year ${year} not found`);
    }

    res.json(tournament);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /tournaments
 * List all available tournaments by year
 */
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tournaments = getTournaments();
    const list = tournaments.map((t) => ({
      year: t.year,
      name: t.name,
      status: t.status,
    }));
    res.json(list);
  } catch (error) {
    next(error);
  }
});

export default router;
