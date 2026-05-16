import { parseLocalDate } from "./bracket";
import type { Bout, BracketData } from "./types";

export type VotingWindowStatus = {
  key: "upcoming" | "live" | "closed";
  label: string;
  description: string;
};

function getBoutStart(data: BracketData, bout: Bout) {
  const start = parseLocalDate(data.startDate);
  const date = new Date(start);
  date.setDate(start.getDate() + (bout.sequence - 1) * 7);
  return date;
}

function getBoutEnd(data: BracketData, bout: Bout) {
  const end = getBoutStart(data, bout);
  end.setDate(end.getDate() + 7);
  return end;
}

export function getVotingWindowStatus(data: BracketData, bout: Bout, now = new Date()): VotingWindowStatus {
  const start = getBoutStart(data, bout);
  const end = getBoutEnd(data, bout);

  if (now < start) {
    return {
      key: "upcoming",
      label: "Scheduled",
      description: `Voting opens ${bout.date}`,
    };
  }

  if (now >= end) {
    return {
      key: "closed",
      label: "Closed",
      description: `Voting closed ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`,
    };
  }

  return {
    key: "live",
    label: "Live",
    description: `Voting open through ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`,
  };
}
