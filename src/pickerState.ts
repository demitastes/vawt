import { useCallback, useEffect, useMemo, useState } from "react";

import { boutKey, clearDownstream } from "./bracket";

const STORAGE_PREFIX = "vawt:draft-picks";

type StoredPicks = Record<string, string>;

function storageKey(year: string) {
  return `${STORAGE_PREFIX}:${year}`;
}

function mapFromStored(value: StoredPicks | null) {
  return new Map(Object.entries(value ?? {}));
}

function storedFromMap(picks: Map<string, string>) {
  return Object.fromEntries(picks.entries());
}

function readStoredPicks(year: string) {
  if (typeof window === "undefined") return new Map<string, string>();

  try {
    const rawValue = window.localStorage.getItem(storageKey(year));
    if (!rawValue) return new Map<string, string>();
    return mapFromStored(JSON.parse(rawValue) as StoredPicks);
  } catch {
    return new Map<string, string>();
  }
}

function writeStoredPicks(year: string, picks: Map<string, string>) {
  if (typeof window === "undefined") return;

  const key = storageKey(year);
  if (picks.size === 0) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(storedFromMap(picks)));
}

export function useDraftBracketPicks(year: string) {
  const [draft, setDraft] = useState(() => ({
    year,
    picks: readStoredPicks(year),
  }));

  useEffect(() => {
    setDraft({ year, picks: readStoredPicks(year) });
  }, [year]);

  useEffect(() => {
    if (draft.year === year) writeStoredPicks(year, draft.picks);
  }, [draft, year]);

  const selectPick = useCallback((round: number, bout: number, entrant: string) => {
    setDraft((current) => {
      const key = boutKey(round, bout);
      const next = clearDownstream(current.picks, round, bout);

      if (current.picks.get(key) === entrant) {
        next.delete(key);
      } else {
        next.set(key, entrant);
      }

      return { year: current.year, picks: next };
    });
  }, []);

  const resetPicks = useCallback(() => {
    setDraft((current) => ({ year: current.year, picks: new Map() }));
  }, []);

  return useMemo(
    () => ({
      picks: draft.picks,
      selectPick,
      resetPicks,
    }),
    [draft.picks, resetPicks, selectPick],
  );
}
