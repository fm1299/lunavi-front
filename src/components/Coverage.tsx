import type { Feature, Gaps, Portfolio } from "../api";
import { BAND_LABEL, formatCoord, formatValue } from "../format";
import { t } from "../i18n";

/** The fewest cells that together cover the site's conditions (spec FR-P13, FR-W13). */
export function PortfolioList({
  portfolio,
  features,
  onSelect,
  onHover,
}: {
  portfolio: Portfolio | null;
  features: Feature[];
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  if (!portfolio) return <p className="empty">{t("Loading…")}</p>;
  const label = (key: string) => t(features.find((feature) => feature.key === key)?.label ?? key);
  return (
    <div className="ranked">
      <p className="ranked-note">
        {t(
          "The fewest cells that together cover this site's weighted conditions. A cell covers a condition at {percent}% similarity or more. Numbered pins show them on the map.",
          { percent: Math.round(portfolio.threshold * 100) },
        )}
      </p>
      {portfolio.cells.length === 0 && <p className="empty">{t("No cell covers any condition with these filters.")}</p>}
      <ol>
        {portfolio.cells.map((cell, index) => (
          <li key={cell.cell_id}>
            <button
              className="rank-row"
              onClick={() => onSelect(cell.cell_id)}
              onMouseEnter={() => onHover(cell.cell_id)}
              onMouseLeave={() => onHover(null)}
            >
              <span className="rank-number">{index + 1}</span>
              <span className="rank-main">
                <span className="rank-place">{cell.country ?? t("Unnamed area")}</span>
                <span className="rank-meta">
                  <span className="rank-coord">{formatCoord(cell.lat, cell.lon)}</span>
                  <span className={`band band-${cell.band}`}>{t("{band} confidence", { band: t(BAND_LABEL[cell.band]) })}</span>
                </span>
                <span className="rank-covers">
                  {t("Covers:")} {cell.covers.map(label).join(", ")}
                </span>
              </span>
              <span className="rank-score">{cell.score.toFixed(1)}</span>
            </button>
          </li>
        ))}
      </ol>
      {portfolio.uncovered.length > 0 && (
        <p className="warning coverage-note">
          <strong>{t("Not covered by any cell:")}</strong> {portfolio.uncovered.map(label).join(", ")}
        </p>
      )}
    </div>
  );
}

const STATE_LABEL = { covered: "Covered", gap: "Gap", unknown: "Cannot be judged" };

/** For each site condition, whether a documented analog covers it (spec FR-P12, FR-W13). */
export function GapTable({ gaps, features }: { gaps: Gaps | null; features: Feature[] }) {
  if (!gaps) return <p className="empty">{t("Loading…")}</p>;
  const unit = (key: string) => features.find((feature) => feature.key === key)?.unit ?? "";
  return (
    <div className="ranked">
      <p className="ranked-note">
        {t(
          "For each condition of this site, whether a documented analog matches it at {percent}% similarity or more. A gap is a condition that no documented analog reproduces.",
          { percent: Math.round(gaps.threshold * 100) },
        )}{" "}
        {t("{count} documented analogs lie in the Earth table.", { count: gaps.analogs_compared })}
      </p>
      <table className="gap-table">
        <thead>
          <tr>
            <th scope="col">{t("Condition")}</th>
            <th scope="col">{t("Status")}</th>
            <th scope="col">{t("Closest analog")}</th>
          </tr>
        </thead>
        <tbody>
          {gaps.conditions.map((row) => {
            const state = row.covered === null ? "unknown" : row.covered ? "covered" : "gap";
            return (
              <tr key={row.key}>
                <th scope="row">
                  {t(row.label)}
                  <span className="muted gap-value">{formatValue(row.target_value, unit(row.key))}</span>
                  {row.beyond_earth && <span className="flag">{t("beyond Earth")}</span>}
                </th>
                <td>
                  <span className={`gap-state gap-${state}`}>{t(STATE_LABEL[state])}</span>
                </td>
                <td>
                  {row.best_analog ? `${row.best_analog} (${Math.round((row.best_s ?? 0) * 100)}%)` : "–"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
