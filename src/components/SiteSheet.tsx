import type { BreakdownRow, CellSheet, Target } from "../api";
import { BAND_LABEL, formatCoord, formatValue, viridis } from "../format";

interface Props {
  sheet: CellSheet | null;
  target: Target;
  error: string | null;
  onClose: () => void;
}

/** Target against candidate, on the normalized scale that scoring uses. */
function Radar({ rows, target }: { rows: BreakdownRow[]; target: Target }) {
  const axes = rows.filter((row) => row.weight > 0 && row.cell_z !== null && row.target_z !== null);
  if (axes.length < 3) return null;
  const size = 220;
  const center = size / 2;
  const radius = 76;
  const point = (index: number, value: number) => {
    const angle = (index / axes.length) * 2 * Math.PI - Math.PI / 2;
    return [center + Math.cos(angle) * radius * value, center + Math.sin(angle) * radius * value];
  };
  const polygon = (key: "cell_z" | "target_z") =>
    axes.map((row, index) => point(index, row[key] as number).join(",")).join(" ");
  return (
    <figure className="radar">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Candidate compared with ${target.name}`}>
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon
            key={ring}
            points={axes.map((_, index) => point(index, ring).join(",")).join(" ")}
            className="radar-ring"
          />
        ))}
        {axes.map((row, index) => {
          const [x, y] = point(index, 1);
          const [labelX, labelY] = point(index, 1.2);
          return (
            <g key={row.key}>
              <line x1={center} y1={center} x2={x} y2={y} className="radar-ring" />
              <text x={labelX} y={labelY} className="radar-label" textAnchor="middle" dominantBaseline="middle">
                {row.label.split(" ")[0]}
              </text>
            </g>
          );
        })}
        <polygon points={polygon("target_z")} className="radar-target" />
        <polygon points={polygon("cell_z")} className="radar-cell" />
      </svg>
      <figcaption>
        <span className="key key-target" /> {target.name}
        <span className="key key-cell" /> This cell
      </figcaption>
    </figure>
  );
}

function labels(keys: string[], rows: BreakdownRow[]) {
  return keys.map((key) => rows.find((row) => row.key === key)?.label ?? key).join(", ") || "None";
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default function SiteSheet({ sheet, target, error, onClose }: Props) {
  if (error) {
    return (
      <div className="sheet">
        <button className="link-button" onClick={onClose}>
          ← Back to list
        </button>
        <p className="empty">{error}</p>
      </div>
    );
  }
  if (!sheet) return <div className="sheet"><p className="empty">Loading site sheet…</p></div>;

  const rows = sheet.breakdown;
  const active = rows.filter((row) => row.weight > 0);
  const inactive = rows.filter((row) => row.weight === 0);
  const earthSources = [...new Map(active.filter((row) => row.source_url).map((row) => [row.source_name, row])).values()];
  const siteSources = [...new Set(active.flatMap((row) => (row.target_source_url ? [row.target_source_url] : [])))];
  const scaleNote = rows.find((row) => row.key === "slope")?.note;

  return (
    <div className="sheet">
      <button className="link-button" onClick={onClose}>
        ← Back to list
      </button>
      <header className="sheet-header">
        <h2>{sheet.country ?? "Unnamed area"}</h2>
        <p className="muted">{formatCoord(sheet.lat, sheet.lon)}</p>
        <div className="sheet-score">
          <strong>{sheet.score.toFixed(1)}</strong>
          <span>of 100, compared with {target.name}</span>
        </div>
        <div className="rank-meta">
          <span className={`band band-${sheet.band}`}>
            {BAND_LABEL[sheet.band]} confidence ({Math.round(sheet.confidence * 100)}%)
          </span>
          {sheet.terrain.map((terrain) => (
            <span key={terrain} className="chip-static">
              {terrain}
            </span>
          ))}
        </div>
      </header>

      {!sheet.eligible && <p className="warning">This cell does not meet any terrain class, so it is outside the ranking.</p>}
      {sheet.score === 0 && sheet.eligible && (
        <p className="warning">Score 0: this cell fails the vegetation gate, so it is too green to be an analog.</p>
      )}

      <div className="match-grid">
        <div>
          <h3>Closest matches</h3>
          <p>{labels(sheet.closest_matches, rows)}</p>
        </div>
        <div>
          <h3>Weakest matches</h3>
          <p>{labels(sheet.weakest_matches, rows)}</p>
        </div>
      </div>

      {sheet.missing_features.length > 0 && (
        <p className="hint">
          <strong>No data yet:</strong> {labels(sheet.missing_features, rows)}. These are left out of the score and lower
          confidence. Event data can fill them later.
        </p>
      )}

      <Radar rows={rows} target={target} />

      <h3>Breakdown</h3>
      <ul className="breakdown">
        {active.map((row) => (
          <li key={row.key} title={row.target_note ?? undefined}>
            <div className="breakdown-head">
              <span>{row.label}</span>
              <span className="muted">weight {row.weight}</span>
            </div>
            <div className="bar" aria-hidden="true">
              <span style={{ width: `${(row.s ?? 0) * 100}%`, background: viridis(row.s ?? 0) }} />
            </div>
            <div className="breakdown-values">
              <span>Cell {formatValue(row.cell_value, row.unit)}</span>
              <span>
                Site {formatValue(row.target_value, row.unit)}
                {row.target_basis && <span className={`basis basis-${row.target_basis}`}>{row.target_basis}</span>}
              </span>
            </div>
            {row.beyond_earth && <p className="flag-note">Beyond Earth: this is only as close as Earth gets.</p>}
          </li>
        ))}
      </ul>

      {sheet.beyond_earth_weight_share > 0 && (
        <p className="beyond-note">
          <strong>{Math.round(sheet.beyond_earth_weight_share * 100)}%</strong> of the active weight rests on values beyond Earth's range.
        </p>
      )}

      {inactive.length > 0 && (
        <details className="stats-card">
          <summary>Other values for this cell</summary>
          <table>
            <tbody>
              {inactive.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td>{formatValue(row.cell_value, row.unit)}</td>
                  <td>Site {formatValue(row.target_value, row.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      <h3>What to test here</h3>
      <ul className="tags">
        {sheet.test_tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>

      {scaleNote && <p className="hint">{scaleNote}</p>}

      <h3>Earth data sources</h3>
      <ul className="sources">
        {earthSources.map((row) => (
          <li key={row.source_name}>
            <a href={row.source_url!} target="_blank" rel="noreferrer">
              {row.source_name}
            </a>
          </li>
        ))}
      </ul>
      {siteSources.length > 0 && (
        <>
          <h3>Site data sources</h3>
          <ul className="sources">
            {siteSources.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {hostname(url)}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
