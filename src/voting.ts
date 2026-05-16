import { boutSequence, entrantId, parseLocalDate } from "./bracket";
import type { Bout, BracketData } from "./types";

export type VoteSource = "website" | "discord" | "twitter" | "instagram";

export type SourceBreakdown = {
  source: VoteSource;
  total: number;
  counts: Record<string, number>;
};

export type VoteSummary = {
  total: number;
  counts: Record<string, number>;
  sources: SourceBreakdown[];
  isMock: boolean;
};

export type VotingWindow = {
  opensAt: Date;
  closesAt: Date;
  status: "open" | "upcoming" | "closed";
};

const VOTE_SOURCES: VoteSource[] = ["website", "discord", "twitter", "instagram"];
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function deterministicCount(seed: string, min: number, spread: number) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return min + (hash % spread);
}

export function votingWindowFor(data: BracketData, bout: Bout, now = new Date()): VotingWindow {
  const opensAt = parseLocalDate(data.startDate);
  opensAt.setDate(opensAt.getDate() + (boutSequence(data, bout.round, bout.bout) - 1) * 7);

  const closesAt = new Date(opensAt);
  closesAt.setDate(opensAt.getDate() + 6);
  closesAt.setHours(23, 59, 59, 999);

  if (now < opensAt) return { opensAt, closesAt, status: "upcoming" };
  if (now <= closesAt) return { opensAt, closesAt, status: "open" };
  return { opensAt, closesAt, status: "closed" };
}

export function findPublicVotingBout(data: BracketData, bouts: Bout[], now = new Date()) {
  const decorated = bouts.map((bout) => ({ bout, window: votingWindowFor(data, bout, now) }));
  return (
    decorated.find((item) => item.window.status === "open") ??
    decorated.find((item) => item.window.status === "upcoming") ??
    decorated[decorated.length - 1] ??
    null
  );
}

export function voteSummaryFor(bout: Bout): VoteSummary {
  if (bout.voteCounts && Object.keys(bout.voteCounts).length > 0) {
    const counts = bout.entrants.reduce<Record<string, number>>((result, entrant) => {
      result[entrant] = bout.voteCounts?.[entrant] ?? bout.voteCounts?.[entrantId(entrant)] ?? 0;
      return result;
    }, {});
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return {
      total,
      counts,
      sources: [
        {
          source: "website",
          total,
          counts,
        },
      ],
      isMock: false,
    };
  }

  const sources = VOTE_SOURCES.map((source, sourceIndex) => {
    const counts = bout.entrants.reduce<Record<string, number>>((result, entrant, entrantIndex) => {
      result[entrant] = deterministicCount(`${bout.id}:${source}:${entrant}`, 8 + sourceIndex * 3 + entrantIndex, 34);
      return result;
    }, {});

    return {
      source,
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
      counts,
    };
  });

  const counts = bout.entrants.reduce<Record<string, number>>((result, entrant) => {
    result[entrant] = sources.reduce((sum, source) => sum + (source.counts[entrant] ?? 0), 0);
    return result;
  }, {});

  return {
    total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    counts,
    sources,
    isMock: true,
  };
}

export function formatWindowDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysUntil(date: Date, now = new Date()) {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / ONE_DAY_MS));
}
