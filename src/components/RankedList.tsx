import type { Feature, FullCell, ResultMeta } from "../api";
import { BAND_LABEL, formatCoord, lowerFirst } from "../format";
import { numberLocale, t } from "../i18n";

interface Props {
  cells: FullCell[];
  features: Feature[];
  meta: ResultMeta | null;
  hovered: string | null;
  /** Shown only on the printed page, so a saved PDF says what it lists. */
  printTitle: string;
  csvUrl: string;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export default function RankedList({ cells, features, meta, hovered, printTitle, csvUrl, onSelect, onHover }: Props) {
  const names = (keys: string[]) =>
    keys.map((key) => lowerFirst(t(features.find((feature) => feature.key === key)?.label ?? key))).join(", ");
  return (
    <div className="ranked">
      <header className="panel-header">
        <h2>{t("Top Earth analogs")}</h2>
        {meta && <span>{t("from {count} eligible cells", { count: meta.count.toLocaleString(numberLocale()) })}</span>}
      </header>
      <p className="print-only print-title">{printTitle}</p>
      <p className="ranked-note">
        {t("The best cell in each area, at least 300 km apart, so each row is a different place.")}
      </p>
      {cells.length === 0 && <p className="empty">{t("No cells match these filters. Try a wider area or lower confidence.")}</p>}
      {cells.length > 0 && (
        <div className="export-row" role="group" aria-label={t("Export the shortlist")}>
          <a className="button" href={csvUrl} download title={t("Download this list as a CSV file")}>
            CSV
          </a>
          {/* shortcut: PDF goes through the browser's print dialog, add a PDF library if the file needs a fixed layout */}
          <button className="button" onClick={() => window.print()} title={t("Print this list, or save it as a PDF")}>
            PDF
          </button>
        </div>
      )}
      <ol>
        {cells.map((cell, index) => (
          <li key={cell.cell_id}>
            <button
              className={`rank-row ${hovered === cell.cell_id ? "hovered" : ""}`}
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
                {cell.closest_matches && cell.closest_matches.length > 0 && (
                  <span className="rank-why">
                    {cell.weakest_matches && cell.weakest_matches.length > 0
                      ? t("Matches on {closest} · differs on {weakest}", {
                          closest: names(cell.closest_matches),
                          weakest: names(cell.weakest_matches),
                        })
                      : t("Matches on {closest}", { closest: names(cell.closest_matches) })}
                  </span>
                )}
              </span>
              <span className="rank-score">{cell.score.toFixed(1)}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
