import { DownloadIcon, PrinterIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { Band, Feature, FullCell, ResultMeta } from "../api";
import { BAND_LABEL, formatCoord, lowerFirst } from "../format";
import { numberLocale, t } from "../i18n";
import { RestrictionBadge } from "./Restriction";

interface Props {
  cells: FullCell[];
  features: Feature[];
  meta: ResultMeta | null;
  hovered: string | null;
  /** How many of the first rows have a numbered pin on the map. */
  pinned: number;
  /** Shown only on the printed page, so a saved PDF says what it lists. */
  printTitle: string;
  csvUrl: string;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export const BAND_CLASS: Record<Band, string> = { high: "text-good", medium: "text-fair", low: "text-poor" };

export default function RankedList({ cells, features, meta, hovered, pinned, printTitle, csvUrl, onSelect, onHover }: Props) {
  const names = (keys: string[]) =>
    keys.map((key) => lowerFirst(t(features.find((feature) => feature.key === key)?.label ?? key))).join(", ");
  return (
    <div className="ranked flex flex-col gap-2">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{t("Top Earth analogs")}</h2>
          {meta && (
            <p className="text-xs text-muted-foreground">
              {t("from {count} eligible cells", { count: meta.count.toLocaleString(numberLocale()) })}
            </p>
          )}
        </div>
        {cells.length > 0 && (
          <div className="export-row flex gap-1" role="group" aria-label={t("Export the shortlist")}>
            <a
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground no-underline")}
              href={csvUrl}
              download
              title={t("Download this list as a CSV file")}
            >
              <DownloadIcon />
              CSV
            </a>
            {/* shortcut: PDF goes through the browser's print dialog, add a PDF library if the file needs a fixed layout */}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => window.print()}
              title={t("Print this list, or save it as a PDF")}
            >
              <PrinterIcon />
              PDF
            </Button>
          </div>
        )}
      </header>
      <p className="print-only print-title">{printTitle}</p>
      {cells.length === 0 && (
        <p className="py-4 text-sm text-muted-foreground">{t("No cells match these filters. Try a wider area or lower confidence.")}</p>
      )}
      <ol className="-mx-2 flex flex-col">
        {cells.map((cell, index) => (
          <li key={cell.cell_id}>
            <button
              className={cn(
                "grid w-full cursor-pointer grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-transparent px-2 py-2.5 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring print:text-black",
                hovered === cell.cell_id && "bg-accent",
              )}
              onClick={() => onSelect(cell.cell_id)}
              onMouseEnter={() => onHover(cell.cell_id)}
              onMouseLeave={() => onHover(null)}
            >
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full font-mono text-xs font-medium tabular-nums",
                  index < pinned ? "bg-foreground text-background" : "text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <span className="grid min-w-0 gap-0.5">
                <span className="font-medium">{cell.country ?? t("Unnamed area")}</span>
                <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground tabular-nums">
                  <span className="font-mono">{formatCoord(cell.lat, cell.lon)}</span>
                  <span className={cn("inline-flex items-center gap-1", BAND_CLASS[cell.band])}>
                    <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                    {t("{band} confidence", { band: t(BAND_LABEL[cell.band]) })}
                  </span>
                  <RestrictionBadge level={cell.restriction} />
                  {cell.new_candidate && (
                    <span
                      className="rounded-full border border-good/50 bg-good/10 px-1.5 py-px text-[11px] font-medium leading-4 text-good"
                      title={t("Far from every documented analog: a candidate, not yet checked in the literature.")}
                    >
                      {t("New place")}
                    </span>
                  )}
                </span>
                {cell.closest_matches && cell.closest_matches.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {cell.weakest_matches && cell.weakest_matches.length > 0
                      ? t("Matches on {closest} · differs on {weakest}", {
                          closest: names(cell.closest_matches),
                          weakest: names(cell.weakest_matches),
                        })
                      : t("Matches on {closest}", { closest: names(cell.closest_matches) })}
                  </span>
                )}
              </span>
              <span className="font-mono text-lg font-medium tabular-nums">{cell.score.toFixed(1)}</span>
            </button>
          </li>
        ))}
      </ol>
      {cells.length > 0 && (
        <p className="text-xs text-muted-foreground print:hidden">
          {t("The best cell in each area, at least 300 km apart, so each row is a different place.")}
        </p>
      )}
    </div>
  );
}
