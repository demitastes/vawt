import type { AuthSession } from "./authSession";
import { entrantId } from "./bracket";
import type { Bout, BracketData, DistilleryProfile } from "./types";
import {
  daysUntil,
  findPublicVotingBout,
  formatWindowDate,
  voteSummaryFor,
} from "./voting";

type VotingLandingProps = {
  data: BracketData;
  bouts: Bout[];
  profiles: Map<string, DistilleryProfile>;
  session: AuthSession | null;
  selectedVotes: Map<string, string>;
  onVote: (boutId: string, entrant: string) => void;
  onCreateBracket: () => void;
};

function sourceLabel(source: string) {
  return source.charAt(0).toUpperCase() + source.slice(1);
}

function isPlaceholder(name: string) {
  return name.endsWith(" Winner");
}

export function VotingLanding({
  data,
  bouts,
  profiles,
  session,
  selectedVotes,
  onVote,
  onCreateBracket,
}: VotingLandingProps) {
  const publicBout = findPublicVotingBout(data, bouts);
  if (!publicBout) return null;

  const { bout, window } = publicBout;
  const summary = voteSummaryFor(bout);
  const canVote = Boolean(session) && window.status === "open" && !bout.entrants.some(isPlaceholder);
  const selectedVote = selectedVotes.get(bout.id);
  const headline =
    window.status === "open"
      ? "Voting is open"
      : window.status === "upcoming"
        ? `Voting opens in ${daysUntil(window.opensAt).toLocaleString()} day${daysUntil(window.opensAt) === 1 ? "" : "s"}`
        : "Latest public results";

  return (
    <section className="voting-landing" aria-labelledby="voting-title">
      <div className="voting-copy">
        <p className="eyebrow">Public voting</p>
        <h2 id="voting-title">{headline}</h2>
        <p>
          {bout.label} runs {formatWindowDate(window.opensAt)} through {formatWindowDate(window.closesAt)}.
        </p>
        {summary.isMock ? <p className="mock-note">Showing seeded local totals until live vote data is available.</p> : null}
      </div>

      <div className="vote-matchup" aria-label={`${bout.label} voting choices`}>
        {bout.entrants.map((entrant) => {
          const profile = profiles.get(entrant);
          const count = summary.counts[entrant] ?? 0;
          const percent = summary.total ? Math.round((count / summary.total) * 100) : 0;
          const placeholder = isPlaceholder(entrant);

          return (
            <article key={entrant} className={`vote-option${selectedVote === entrant ? " is-selected" : ""}`}>
              <div className="vote-option__identity">
                <span className="avatar" aria-hidden="true">
                  {profile?.imageUrl ? <img src={profile.imageUrl} alt="" loading="lazy" /> : profile?.initials || "?"}
                </span>
                <div>
                  <h3>{entrant}</h3>
                  <p>{profile?.location?.city ? [profile.location.city, profile.location.state].filter(Boolean).join(", ") : "Virginia"}</p>
                </div>
              </div>
              <div className="vote-meter" aria-label={`${entrant} has ${percent}% of public votes`}>
                <span style={{ width: `${percent}%` }} />
              </div>
              <div className="vote-count-row">
                <strong>{count.toLocaleString()} votes</strong>
                <span>{percent}%</span>
              </div>
              <button type="button" disabled={!canVote || placeholder} onClick={() => onVote(bout.id, entrant)}>
                {selectedVote === entrant ? "Vote saved" : session ? "Vote" : "Login to vote"}
              </button>
            </article>
          );
        })}
      </div>

      <div className="source-breakdown" aria-label="Vote source breakdown">
        {summary.sources.map((source) => (
          <div key={source.source}>
            <div className="source-breakdown__header">
              <strong>{sourceLabel(source.source)}</strong>
              <span>{source.total.toLocaleString()}</span>
            </div>
            <ul>
              {bout.entrants.map((entrant) => (
                <li key={`${source.source}-${entrantId(entrant)}`}>
                  <span>{entrant}</span>
                  <strong>{(source.counts[entrant] ?? 0).toLocaleString()}</strong>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bracket-cta">
        <div>
          <strong>Create your tournament bracket</strong>
          <span>{session ? "Ready for the bracket picker." : "Sign in to unlock bracket creation."}</span>
        </div>
        <button type="button" disabled={!session} onClick={onCreateBracket}>
          Create Bracket
        </button>
      </div>
    </section>
  );
}
