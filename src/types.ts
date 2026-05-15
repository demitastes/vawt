export interface BracketRound {
  round: number;
  boutCount: number;
}

export interface FirstRoundBout {
  bout: number;
  entrants: string[];
}

export interface BracketData {
  title: string;
  startDate: string;
  rounds: BracketRound[];
  firstRound: FirstRoundBout[];
}

export interface BoutRef {
  round: number;
  bout: number;
}

export type BracketSide = "left" | "right";
export type BoutSide = BracketSide | "center";

export type Bout = BoutRef & {
  id: string;
  label: string;
  sequence: number;
  side: BoutSide;
  date: string;
  entrants: string[];
  winner?: string;
  voteCounts?: Record<string, number>;
};

export type DistilleryProfile = {
  id: string;
  name: string;
  initials: string;
  veteranOwned?: boolean | null;
  founded?: string | null;
  foundingYear?: number | null;
  location?: {
    city?: string;
    state?: string;
    region?: string;
  } | null;
  awards?: string[];
  website?: string | null;
  imageUrl?: string | null;
  notes?: string | null;
  primaryProducts?: string[];
  source: "registry" | "fallback";
};
