import { useEffect, useState } from "react";

import type { Candidate, Feature, Findings, Target } from "../api";
import { api } from "../api";
import { formatCoord } from "../format";

interface Props {
  target: Target;
  features: Feature[];
  onOpen: (cellId: string) => void;
}

function CandidateCard({
  candidate,
  features,
  onOpen,
}: {
  candidate: Candidate;
  features: Feature[];
  onOpen: (cellId: string) => void;
}) {
  const label = (key: string) => features.find((f) => f.key === key)?.label ?? key;
  const bestCell = candidate.cell_ids.find((id) => candidate.id.endsWith(id)) ?? candidate.cell_ids[0];
  return (
    <article className="candidate">
      <header>
        <h3>{candidate.name ?? "Unnamed region"}</h3>
        <strong>{candidate.score.toFixed(1)}</strong>
      </header>
      <p className="muted">
        {formatCoord(candidate.lat, candidate.lon)} · {candidate.cell_ids.length} cell
        {candidate.cell_ids.length === 1 ? "" : "s"} · confidence {Math.round(candidate.confidence * 100)}%
      </p>
      <dl>
        <dt>Closest</dt>
        <dd>{candidate.closest_matches.map(label).join(", ") || "None"}</dd>
        <dt>Weakest</dt>
        <dd>{candidate.weakest_matches.map(label).join(", ") || "None"}</dd>
        <dt>Test first</dt>
        <dd>{candidate.test_first.join(", ")}</dd>
      </dl>
      <button className="button" onClick={() => onOpen(bestCell)}>
        Open on map
      </button>
    </article>
  );
}

export default function FindingsView({ target, features, onOpen }: Props) {
  const [findings, setFindings] = useState<Findings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setFindings(null);
    api
      .findings(target.id)
      .then((data) => active && setFindings(data))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [target.id]);

  if (error) return <p className="empty">Could not load findings: {error}</p>;
  if (!findings) return <p className="empty">Loading findings…</p>;

  return (
    <div className="page">
      <h1>Findings for {target.name}</h1>
      <p className="lede">
        Findings are named new candidates that passed the selection rules and a literature check. New means not in our
        catalog, not never studied.
      </p>

      {!findings.ready_for_findings && (
        <p className="warning">
          Findings are blocked: the catalog has {findings.catalog_size_verified} cited sites of the{" "}
          {findings.catalog_size_required} required. Without a full catalog, LUNAVI could call a documented analog new.
        </p>
      )}

      <h2>Named findings</h2>
      {findings.candidates.length === 0 ? (
        <p className="empty">None yet. The team names findings after the literature check.</p>
      ) : (
        <div className="candidate-grid">
          {findings.candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} features={features} onOpen={onOpen} />
          ))}
        </div>
      )}

      <h2>Awaiting literature check</h2>
      {findings.pending.length === 0 ? (
        <p className="empty">
          No cell in this region passes the rules: top scores, medium confidence or higher, and more than the novelty
          distance from every catalog site. This is reported as a shortfall. The thresholds are not lowered to fill the
          list.
        </p>
      ) : (
        <div className="candidate-grid">
          {findings.pending.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} features={features} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
