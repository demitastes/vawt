import { useEffect, useMemo, useState } from "react";
import {
  boutKey,
  buildBouts,
  columnFor,
  entrantId,
  initialsFor,
} from "./bracket";
import { AuthPanel } from "./AuthPanel";
import { loadSession } from "./authSession";
import { useDraftBracketPicks } from "./pickerState";
import { VotingLanding } from "./VotingLanding";
import type { AuthSession } from "./authSession";
import type { Bout, BracketData, DistilleryProfile } from "./types";
import { getVotingWindowStatus, type VotingWindowStatus } from "./votingWindows";

const TOURNAMENTS = [
  { year: "2026", label: "2026", dataUrl: "/data/bracket-2026.json" },
];
const DISTILLERY_DATA_URL = "/data/distilleries.json";

type DetailState =
  | { type: "bout"; bout: Bout }
  | { type: "distillery"; profile: DistilleryProfile; sourceBout: Bout }
  | null;

type DistilleryRegistryData = {
  distilleries?: Array<{
    id?: string;
    name: string;
    veteran_owned?: boolean | null;
    veteranOwned?: boolean | null;
    founding_year?: number | null;
    foundingYear?: number | null;
    location?: DistilleryProfile["location"];
    website?: string | null;
    image_url?: string | null;
    imageUrl?: string | null;
    primary_products?: string[];
    primaryProducts?: string[];
    awards?: string[];
    notes?: string | null;
  }>;
};

function createFallbackProfiles(data: BracketData): Map<string, DistilleryProfile> {
  const year = data.title.match(/\b(20\d{2})\b/)?.[1];
  return new Map(
    data.firstRound.flatMap((bout) =>
      bout.entrants.map((name) => [
        name,
        {
          id: entrantId(name),
          name,
          initials: initialsFor(name),
          veteranOwned: null,
          founded: null,
          foundingYear: null,
          location: null,
          awards: [],
          website: null,
          imageUrl: null,
          notes: year ? `Listed as a ${year} tournament entrant.` : "Listed as a tournament entrant.",
          primaryProducts: [],
          source: "fallback" as const,
        },
      ]),
    ),
  );
}

async function createProfiles(data: BracketData): Promise<{ profiles: Map<string, DistilleryProfile>; usedFallback: boolean }> {
  const profiles = createFallbackProfiles(data);

  try {
    const response = await fetch(DISTILLERY_DATA_URL);
    if (!response.ok) return { profiles, usedFallback: true };

    const registry = (await response.json()) as DistilleryRegistryData;
    for (const item of registry.distilleries ?? []) {
      profiles.set(item.name, {
        id: item.id ?? entrantId(item.name),
        name: item.name,
        initials: initialsFor(item.name),
        veteranOwned: item.veteranOwned ?? item.veteran_owned ?? null,
        foundingYear: item.foundingYear ?? item.founding_year ?? null,
        founded: item.foundingYear || item.founding_year ? String(item.foundingYear ?? item.founding_year) : null,
        location: item.location ?? null,
        website: item.website ?? null,
        imageUrl: item.imageUrl ?? item.image_url ?? null,
        primaryProducts: item.primaryProducts ?? item.primary_products ?? [],
        awards: item.awards ?? [],
        notes: item.notes ?? null,
        source: "registry",
      });
    }

    return { profiles, usedFallback: false };
  } catch {
    return { profiles, usedFallback: true };
  }
}

function isPlaceholder(name: string) {
  return name.endsWith(" Winner");
}

function statusFor(bout: Bout) {
  if (bout.winner) return "Complete";
  if (bout.entrants.some(isPlaceholder)) return "Awaiting feeders";
  return "Open";
}

function voteCountFor(bout: Bout, entrant: string) {
  return bout.voteCounts?.[entrant] ?? bout.voteCounts?.[entrantId(entrant)];
}

export function App() {
  const [selectedTournament, setSelectedTournament] = useState(TOURNAMENTS[0]);
  const [data, setData] = useState<BracketData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { picks, selectPick, resetPicks } = useDraftBracketPicks(selectedTournament.year);
  const [profiles, setProfiles] = useState(() => new Map<string, DistilleryProfile>());
  const [query, setQuery] = useState("");
  const [roundFilter, setRoundFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState<DetailState>(null);
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());
  const [selectedVotes, setSelectedVotes] = useState(() => new Map<string, string>());
  const [bracketCtaMessage, setBracketCtaMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setData(null);
    setLoadError(null);
    setProfiles(new Map());

    fetch(selectedTournament.dataUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${selectedTournament.dataUrl}`);
        return response.json() as Promise<BracketData>;
      })
      .then(async (nextData) => {
        const profileResult = await createProfiles(nextData);
        if (!ignore) {
          setData(nextData);
          setProfiles(profileResult.profiles);
          document.title = nextData.title;
        }
      })
      .catch((error: Error) => {
        if (!ignore) setLoadError(error.message);
      });

    return () => {
      ignore = true;
    };
  }, [selectedTournament]);

  const bouts = useMemo(() => (data ? buildBouts(data, picks) : []), [data, picks]);
  const normalizedQuery = query.trim().toLowerCase();
  const pickStats = useMemo(() => {
    const pickableBouts = bouts.filter((bout) => !bout.entrants.some(isPlaceholder));
    return {
      made: pickableBouts.filter((bout) => Boolean(bout.winner)).length,
      total: pickableBouts.length,
    };
  }, [bouts]);

  const visibleBoutIds = useMemo(() => {
    return new Set(
      bouts
        .filter((bout) => {
          const matchesQuery =
            !normalizedQuery ||
            bout.label.toLowerCase().includes(normalizedQuery) ||
            bout.entrants.some((entrant) => entrant.toLowerCase().includes(normalizedQuery));
          const matchesRound = roundFilter === "all" || String(bout.round) === roundFilter;
          const matchesStatus = statusFilter === "all" || statusFor(bout) === statusFilter;
          return matchesQuery && matchesRound && matchesStatus;
        })
        .map((bout) => bout.id),
    );
  }, [bouts, normalizedQuery, roundFilter, statusFilter]);

  const champion = picks.get(boutKey(5, 1));
  const picksEnabled = Boolean(session);

  function openDistillery(name: string, sourceBout: Bout) {
    const profile = profiles.get(name);
    if (profile) setDetail({ type: "distillery", profile, sourceBout });
  }

  function saveLocalVote(boutId: string, entrant: string) {
    setSelectedVotes((current) => new Map(current).set(boutId, entrant));
  }

  function handleCreateBracket() {
    setBracketCtaMessage("Your bracket picker is ready below. Pick winners in the bracket and your draft saves in this browser.");
  }

  if (loadError) {
    return (
      <main className="app-shell app-shell--status">
        <p className="status-message">Bracket data could not be loaded: {loadError}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="app-shell app-shell--status">
        <p className="status-message">Loading bracket data...</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Virginia Whiskey Tournament</p>
          <h1>{data.title}</h1>
        </div>
        <div className="masthead-actions">
          <AuthPanel session={session} onSessionChange={setSession} />
          <div className="champion-panel">
            <span>Champion</span>
            <strong>{champion || "To be decided"}</strong>
          </div>
        </div>
      </header>

      <VotingLanding
        data={data}
        bouts={bouts}
        profiles={profiles}
        session={session}
        selectedVotes={selectedVotes}
        onVote={saveLocalVote}
        onCreateBracket={handleCreateBracket}
      />

      {bracketCtaMessage ? <p className="inline-status">{bracketCtaMessage}</p> : null}

      <section className="draft-summary" aria-label="Draft bracket progress">
        <div>
          <span>Draft picks</span>
          <strong>
            {picksEnabled ? `${pickStats.made} of ${pickStats.total} ready bouts picked` : "Sign in to start a draft bracket"}
          </strong>
        </div>
        <button type="button" onClick={resetPicks} disabled={!picksEnabled || picks.size === 0}>
          Reset picks
        </button>
      </section>

      <section className="controls" aria-label="Bracket filters">
        <label>
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Distillery or bout"
          />
        </label>
        <label>
          <span>Round</span>
          <select value={roundFilter} onChange={(event) => setRoundFilter(event.target.value)}>
            <option value="all">All rounds</option>
            {data.rounds.map((round) => (
              <option key={round.round} value={round.round}>
                Round {round.round}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="Open">Open</option>
            <option value="Awaiting feeders">Awaiting feeders</option>
            <option value="Complete">Complete</option>
          </select>
        </label>
        <label>
          <span>Year</span>
          <select
            value={selectedTournament.year}
            onChange={(event) => {
              const tournament = TOURNAMENTS.find((item) => item.year === event.target.value);
              if (tournament) setSelectedTournament(tournament);
            }}
          >
            {TOURNAMENTS.map((tournament) => (
              <option key={tournament.year} value={tournament.year}>
                {tournament.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="bracket-shell" aria-label={`${data.title} bracket`}>
        <div className="bracket-grid">
          {[1, 2, 3, 4].map((round) => (
            <RoundColumn
              key={`left-${round}`}
              round={round}
              side="left"
              bouts={bouts}
              visibleBoutIds={visibleBoutIds}
              profiles={profiles}
              bracketData={data}
              picksEnabled={picksEnabled}
              onSelectWinner={selectPick}
              onOpenBout={(bout) => setDetail({ type: "bout", bout })}
              onOpenDistillery={openDistillery}
            />
          ))}
          <section className="round-column championship" style={{ gridColumn: columnFor(5, "center") }}>
            <RoundHeading round={5} />
            {bouts
              .filter((bout) => bout.round === 5)
              .map((bout) => (
                <BoutCard
                  key={bout.id}
                  bout={bout}
                  isDimmed={!visibleBoutIds.has(bout.id)}
                  profiles={profiles}
                  bracketData={data}
                  picksEnabled={picksEnabled}
                  onSelectWinner={selectPick}
                  onOpenBout={() => setDetail({ type: "bout", bout })}
                  onOpenDistillery={openDistillery}
                />
              ))}
            <div className="champion-badge">{champion || "Champion"}</div>
          </section>
          {[4, 3, 2, 1].map((round) => (
            <RoundColumn
              key={`right-${round}`}
              round={round}
              side="right"
              bouts={bouts}
              visibleBoutIds={visibleBoutIds}
              profiles={profiles}
              bracketData={data}
              picksEnabled={picksEnabled}
              onSelectWinner={selectPick}
              onOpenBout={(bout) => setDetail({ type: "bout", bout })}
              onOpenDistillery={openDistillery}
            />
          ))}
        </div>
      </section>

      {detail ? <DetailDialog detail={detail} bracketData={data} onClose={() => setDetail(null)} /> : null}
    </main>
  );
}

function RoundColumn({
  round,
  side,
  bouts,
  visibleBoutIds,
  profiles,
  bracketData,
  picksEnabled,
  onSelectWinner,
  onOpenBout,
  onOpenDistillery,
}: {
  round: number;
  side: "left" | "right";
  bouts: Bout[];
  visibleBoutIds: Set<string>;
  profiles: Map<string, DistilleryProfile>;
  bracketData: BracketData;
  picksEnabled: boolean;
  onSelectWinner: (round: number, bout: number, winner: string) => void;
  onOpenBout: (bout: Bout) => void;
  onOpenDistillery: (name: string, sourceBout: Bout) => void;
}) {
  const sideBouts = bouts.filter((bout) => bout.round === round && bout.side === side);

  return (
    <section className="round-column" data-side={side} style={{ gridColumn: columnFor(round, side) }}>
      <RoundHeading round={round} />
      <div className="bout-stack">
        {sideBouts.map((bout) => (
          <BoutCard
            key={bout.id}
            bout={bout}
            isDimmed={!visibleBoutIds.has(bout.id)}
            profiles={profiles}
            bracketData={bracketData}
            picksEnabled={picksEnabled}
            onSelectWinner={onSelectWinner}
            onOpenBout={() => onOpenBout(bout)}
            onOpenDistillery={onOpenDistillery}
          />
        ))}
      </div>
    </section>
  );
}

function RoundHeading({ round }: { round: number }) {
  const label = round === 5 ? "Final" : `Round ${round}`;
  return <h2>{label}</h2>;
}

function BoutCard({
  bout,
  isDimmed,
  profiles,
  bracketData,
  picksEnabled,
  onSelectWinner,
  onOpenBout,
  onOpenDistillery,
}: {
  bout: Bout;
  isDimmed: boolean;
  profiles: Map<string, DistilleryProfile>;
  bracketData: BracketData;
  picksEnabled: boolean;
  onSelectWinner: (round: number, bout: number, winner: string) => void;
  onOpenBout: () => void;
  onOpenDistillery: (name: string, sourceBout: Bout) => void;
}) {
  const hasPlaceholder = bout.entrants.some(isPlaceholder);
  const windowStatus = getVotingWindowStatus(bracketData, bout);
  const stateClass = bout.winner ? "is-picked" : hasPlaceholder ? "is-blocked" : "is-unpicked";

  return (
    <article className={`bout-card ${stateClass} is-window-${windowStatus.key}${isDimmed ? " is-dimmed" : ""}`}>
      <button type="button" className="bout-summary" onClick={onOpenBout}>
        <span>{bout.label}</span>
        <strong>{bout.date}</strong>
        <StatusPill status={windowStatus} />
      </button>
      <div className="competitor-list">
        {bout.entrants.map((entrant) => {
          const placeholder = isPlaceholder(entrant);
          const profile = profiles.get(entrant);
          return (
            <div key={entrant} className={`competitor-row${bout.winner === entrant ? " is-winner" : ""}`}>
              <button
                type="button"
                className="competitor-pick"
                disabled={placeholder || !picksEnabled}
                onClick={() => onSelectWinner(bout.round, bout.bout, entrant)}
                aria-pressed={bout.winner === entrant}
              >
                <span className="avatar" aria-hidden="true">
                  {profile?.imageUrl ? <img src={profile.imageUrl} alt="" loading="lazy" /> : profile?.initials || "?"}
                </span>
                <span>{entrant}</span>
              </button>
              {!placeholder ? (
                <button
                  type="button"
                  className="profile-button"
                  onClick={() => onOpenDistillery(entrant, bout)}
                  aria-label={`Open ${entrant} profile`}
                >
                  Profile
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: VotingWindowStatus }) {
  return (
    <span className={`status-pill status-pill--${status.key}`} title={status.description}>
      {status.label}
    </span>
  );
}

function DetailDialog({
  detail,
  bracketData,
  onClose,
}: {
  detail: DetailState;
  bracketData: BracketData;
  onClose: () => void;
}) {
  if (!detail) return null;

  const title = detail.type === "bout" ? detail.bout.label : detail.profile.name;

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="detail-title">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close details">
            Close
          </button>
        </div>
        {detail.type === "bout" ? <BoutDetails bout={detail.bout} bracketData={bracketData} /> : <DistilleryDetails {...detail} />}
      </section>
    </div>
  );
}

function BoutDetails({ bout, bracketData }: { bout: Bout; bracketData: BracketData }) {
  const totalVotes = Object.values(bout.voteCounts ?? {}).reduce((total, count) => total + count, 0);
  const windowStatus = getVotingWindowStatus(bracketData, bout);

  return (
    <div className="detail-content">
      <dl className="detail-list">
        <div>
          <dt>Voting date</dt>
          <dd>{bout.date}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{statusFor(bout)}</dd>
        </div>
        <div>
          <dt>Voting window</dt>
          <dd>{windowStatus.description}</dd>
        </div>
        <div>
          <dt>Vote counts</dt>
          <dd>{totalVotes > 0 ? totalVotes.toLocaleString() : "Not available yet"}</dd>
        </div>
      </dl>
      <div>
        <h3>Participants</h3>
        <ul className="plain-list">
          {bout.entrants.map((entrant) => (
            <li key={entrant}>
              <span>{entrant}</span>
              {typeof voteCountFor(bout, entrant) === "number" ? <strong>{voteCountFor(bout, entrant)?.toLocaleString()} votes</strong> : null}
            </li>
          ))}
        </ul>
      </div>
      <a className="results-link" href={`#results-${bout.id}`}>
        View Results
      </a>
    </div>
  );
}

function DistilleryDetails({
  profile,
  sourceBout,
}: {
  profile: DistilleryProfile;
  sourceBout: Bout;
}) {
  return (
    <div className="detail-content">
      <div className="profile-hero">
        <span className="avatar avatar--large" aria-hidden="true">
          {profile.imageUrl ? <img src={profile.imageUrl} alt="" /> : profile.initials}
        </span>
        <div>
          <p>{sourceBout.label}</p>
          <strong>{sourceBout.date}</strong>
        </div>
      </div>
      <dl className="detail-list">
        <div>
          <dt>Veteran owned</dt>
          <dd>{profile.veteranOwned === true ? "Yes" : profile.veteranOwned === false ? "No" : "Not listed yet"}</dd>
        </div>
        <div>
          <dt>Founded</dt>
          <dd>{profile.founded || "Not listed yet"}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{formatLocation(profile)}</dd>
        </div>
        <div>
          <dt>Awards</dt>
          <dd>{profile.awards?.length ? profile.awards.join(", ") : "Not listed yet"}</dd>
        </div>
      </dl>
      {profile.notes ? <p className="profile-note">{profile.notes}</p> : null}
      {profile.website ? (
        <a className="results-link" href={profile.website} target="_blank" rel="noreferrer">
          Website
        </a>
      ) : null}
    </div>
  );
}

function formatLocation(profile: DistilleryProfile) {
  const location = [profile.location?.city, profile.location?.region, profile.location?.state].filter(Boolean).join(", ");
  return location || "Not listed yet";
}
