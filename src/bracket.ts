import type { Bout, BoutRef, BracketData } from "./types";

export function boutKey(round: number, bout: number) {
  return `r${round}b${bout}`;
}

export function entrantId(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function initialsFor(name: string) {
  return name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function sideForBout(bout: number): "left" | "right" {
  return bout % 2 === 1 ? "left" : "right";
}

export function columnFor(round: number, side: "left" | "right" | "center") {
  if (round === 5 || side === "center") return 5;
  return side === "left" ? round : 10 - round;
}

export function boutSequence(data: BracketData, round: number, bout: number) {
  return data.rounds
    .slice(0, round - 1)
    .reduce((total, item) => total + item.boutCount, 0) + bout;
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatBoutDate(data: BracketData, round: number, bout: number) {
  const start = parseLocalDate(data.startDate);
  const date = new Date(start);
  date.setDate(start.getDate() + (boutSequence(data, round, bout) - 1) * 7);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function feedersFor(round: number, bout: number): BoutRef[] {
  if (round === 5) {
    return [
      { round: 4, bout: 1 },
      { round: 4, bout: 2 },
    ];
  }

  const sideIndex = Math.ceil(bout / 2);
  const firstFeeder = bout % 2 === 1 ? sideIndex * 4 - 3 : sideIndex * 4 - 2;
  return [
    { round: round - 1, bout: firstFeeder },
    { round: round - 1, bout: firstFeeder + 2 },
  ];
}

export function targetFor(round: number, bout: number): BoutRef {
  if (round === 4) {
    return { round: 5, bout: 1 };
  }

  const sideIndex = Math.ceil(bout / 2);
  const nextSideIndex = Math.ceil(sideIndex / 2);
  const nextBout = bout % 2 === 1 ? nextSideIndex * 2 - 1 : nextSideIndex * 2;
  return { round: round + 1, bout: nextBout };
}

export function entrantsFor(
  data: BracketData,
  winners: Map<string, string>,
  round: number,
  bout: number,
) {
  if (round === 1) {
    return data.firstRound
      .slice()
      .sort((a, b) => a.bout - b.bout)[bout - 1].entrants;
  }

  if (round === 5) {
    return [
      winners.get(boutKey(4, 1)) || "Round 4 Bout 1 Winner",
      winners.get(boutKey(4, 2)) || "Round 4 Bout 2 Winner",
    ];
  }

  return feedersFor(round, bout).map((feeder) => {
    return winners.get(boutKey(feeder.round, feeder.bout)) || `Round ${feeder.round} Bout ${feeder.bout} Winner`;
  });
}

export function buildBouts(data: BracketData, winners: Map<string, string>): Bout[] {
  return data.rounds.flatMap((round) => {
    return Array.from({ length: round.boutCount }, (_, index) => {
      const bout = index + 1;
      const side = round.round === 5 ? "center" : sideForBout(bout);
      return {
        id: boutKey(round.round, bout),
        round: round.round,
        bout,
        label: `Round ${round.round} Bout ${bout}`,
        sequence: boutSequence(data, round.round, bout),
        side,
        date: formatBoutDate(data, round.round, bout),
        entrants: entrantsFor(data, winners, round.round, bout),
        winner: winners.get(boutKey(round.round, bout)),
      };
    });
  });
}

export function clearDownstream(winners: Map<string, string>, round: number, bout: number) {
  const next = new Map(winners);
  let target = targetFor(round, bout);

  while (target.round <= 5) {
    next.delete(boutKey(target.round, target.bout));
    if (target.round === 5) break;
    target = targetFor(target.round, target.bout);
  }

  return next;
}
