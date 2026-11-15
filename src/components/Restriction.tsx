import { ShieldAlertIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { LegalNote, PlaceRestrictions, RestrictionLevel } from "../api";
import { t } from "../i18n";

export const RESTRICTION_LABEL: Record<RestrictionLevel, string> = {
  do_not_travel: "Conflict or Do Not Travel",
  restricted: "Legally restricted",
  permit: "Permit required",
};

const RESTRICTION_CLASS: Record<RestrictionLevel, string> = {
  do_not_travel: "border-poor/50 bg-poor/10 text-poor",
  restricted: "border-fair/50 bg-fair/10 text-fair",
  permit: "border-sky-300/40 bg-sky-300/10 text-sky-300",
};

/** A short label for a place where fieldwork is unsafe, restricted or needs permits. */
export function RestrictionBadge({ level, className }: { level: RestrictionLevel | null | undefined; className?: string }) {
  if (!level) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[11px] font-medium leading-4",
        RESTRICTION_CLASS[level],
        className,
      )}
      title={t("A planning label: it never changes the analog score.")}
    >
      <ShieldAlertIcon className="size-3" aria-hidden="true" />
      {t(RESTRICTION_LABEL[level])}
    </span>
  );
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const KIND_LABEL: Record<LegalNote["source_kind"], string> = {
  official: "official source",
  news: "news report",
  secondary: "secondary source",
};

export function LegalNotes({ notes }: { notes: LegalNote[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {notes.map((note) => (
        <li key={note.topic + note.source_url} className="text-xs leading-relaxed">
          <strong>{t(note.topic)}.</strong> {note.text}{" "}
          <a href={note.source_url} target="_blank" rel="noreferrer" className="whitespace-nowrap">
            {hostname(note.source_url)}
          </a>{" "}
          <span className="text-muted-foreground">({t(KIND_LABEL[note.source_kind])})</span>
        </li>
      ))}
    </ul>
  );
}

/** Every zone that holds a place, with its legal notes. Notes stay in English, as sources do. */
export function RestrictionDetails({ restrictions }: { restrictions: PlaceRestrictions | null | undefined }) {
  if (!restrictions || restrictions.zones.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 text-sm font-semibold">{t("Fieldwork and legal notes")}</h3>
        <RestrictionBadge level={restrictions.level} />
      </div>
      {restrictions.zones.map((zone) => (
        <details key={zone.id} open={zone.level === restrictions.level}>
          <summary className="cursor-pointer text-sm">
            {zone.name} · <span className="text-muted-foreground">{t(RESTRICTION_LABEL[zone.level])}</span>
          </summary>
          <p className="my-1 text-xs">{zone.summary}</p>
          <LegalNotes notes={zone.legal_notes} />
        </details>
      ))}
      <p className="m-0 text-[11px] text-muted-foreground">
        {t("Reviewed {date}. Informational only, not legal advice: rules change and depend on your nationality.", {
          date: restrictions.checked,
        })}
      </p>
    </section>
  );
}
