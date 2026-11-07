import type { FullCell, ResultMeta } from "../api";
import { BAND_LABEL, formatCoord, NOVELTY_LABEL } from "../format";

interface Props {
  cells: FullCell[];
  meta: ResultMeta | null;
  hovered: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export default function RankedList({ cells, meta, hovered, onSelect, onHover }: Props) {
  return (
    <div className="ranked">
      <header className="panel-header">
        <h2>Top candidates</h2>
        {meta && <span>{meta.count.toLocaleString("en-US")} eligible cells shown</span>}
      </header>
      {cells.length === 0 && <p className="empty">No cells match these filters. Try a wider area or lower confidence.</p>}
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
                <span className="rank-coord">{formatCoord(cell.lat, cell.lon)}</span>
                <span className="rank-meta">
                  <span className={`novelty novelty-${cell.novelty}`}>{NOVELTY_LABEL[cell.novelty]}</span>
                  <span className={`band band-${cell.band}`}>{BAND_LABEL[cell.band]} confidence</span>
                </span>
              </span>
              <span className="rank-score">{cell.score.toFixed(1)}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
