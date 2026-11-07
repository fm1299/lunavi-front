import { useEffect, useState } from "react";

import type { ControlRow, Feature, Target, Validation } from "../api";
import { api } from "../api";

interface Props {
  targets: Target[];
  features: Feature[];
}

const FUNNEL_LABELS: [string, string][] = [
  ["land_cells", "Land cells"],
  ["after_masks", "After terrain masks"],
  ["after_gates", "After vegetation gate"],
  ["medium_confidence_or_higher", "Medium confidence or higher"],
  ["new", "New (not in our catalog)"],
  ["findings", "Named findings"],
];

function controlResult(row: ControlRow, kind: "positive" | "negative") {
  if (row.status === "outside_region") return <span className="muted">Outside this region</span>;
  if (row.status === "not_comparable") return <span className="muted">No eligible cell nearby</span>;
  if (row.status === "not_land") return <span className="muted">Not a land cell</span>;
  const pass = kind === "positive" ? row.meets_goal : row.in_bottom_half;
  return (
    <span className={pass ? "pass" : "fail"}>
      Top {row.top_percent}% · {pass ? "passes" : "misses"}
    </span>
  );
}

function ControlTable({ rows, kind }: { rows: ControlRow[]; kind: "positive" | "negative" }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">{kind === "positive" ? "Documented analog" : "Negative control"}</th>
          <th scope="col">Score</th>
          <th scope="col">Rank</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <th scope="row">
              {row.name}
              {row.used_nearby_cell && <span className="muted"> (nearest eligible cell)</span>}
            </th>
            <td>{row.score ?? "–"}</td>
            <td>{controlResult(row, kind)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ValidationView({ targets, features }: Props) {
  const [report, setReport] = useState<Validation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.validation().then(setReport).catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="empty">Could not load validation: {error}</p>;
  if (!report) return <p className="empty">Loading validation…</p>;

  const name = (id: string) => targets.find((t) => t.id === id)?.name ?? id;
  const label = (key: string) => features.find((f) => f.key === key)?.label ?? key;

  return (
    <div className="page">
      <h1>Validation</h1>
      <p className="lede">
        Does LUNAVI rank documented Earth analogs highly enough to trust its new candidates as a screening result? The
        goal for each analog is the top {report.goals.top_percent}% of eligible cells, and the stretch goal is the top{" "}
        {report.goals.stretch_top_percent}%.
      </p>

      <h2>Honest gaps</h2>
      <ul className="gaps">
        {report.honest_gaps.map((gap) => (
          <li key={gap}>{gap}</li>
        ))}
      </ul>

      {report.targets.map((entry) => {
        const top = entry.funnel.land_cells || 1;
        return (
          <section key={entry.target} className="report">
            <h2>{name(entry.target)}</h2>

            <div className="report-grid">
              <div>
                <h3>Positive controls</h3>
                {entry.positive_controls.length ? (
                  <ControlTable rows={entry.positive_controls} kind="positive" />
                ) : (
                  <p className="empty">None assigned.</p>
                )}
                <h3>Negative controls</h3>
                <p className="hint">Should fall in the bottom half of all land cells, with masks and the gate off.</p>
                <ControlTable rows={entry.negative_controls} kind="negative" />
              </div>

              <div>
                <h3>Screening funnel</h3>
                <ul className="funnel">
                  {FUNNEL_LABELS.map(([key, text]) => (
                    <li key={key}>
                      <span>{text}</span>
                      <strong>{(entry.funnel[key] ?? 0).toLocaleString("en-US")}</strong>
                      <div className="bar" aria-hidden="true">
                        <span style={{ width: `${((entry.funnel[key] ?? 0) / top) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>

                <h3>Stability</h3>
                <p className="hint">
                  Changing every weight by up to {entry.weight_sensitivity.perturbation * 100}% keeps{" "}
                  {Math.round(entry.weight_sensitivity.mean_top50_overlap * 100)}% of the top 50 cells on average (lowest{" "}
                  {Math.round(entry.weight_sensitivity.min_top50_overlap * 100)}%).
                </p>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Feature removed</th>
                      <th scope="col">Top 50 kept</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.leave_one_feature_out.map((row) => (
                      <tr key={row.feature}>
                        <th scope="row">{label(row.feature)}</th>
                        <td>{Math.round(row.top50_overlap * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
