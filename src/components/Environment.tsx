import { LeafIcon } from "lucide-react";

import type { PlaceEnvironment } from "../api";
import { t } from "../i18n";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** What to check at a place no one has reviewed yet, such as a new candidate. */
const NEW_PLACE_CHECKS = [
  "Protected areas, Ramsar wetlands and World Heritage sites (protectedplanet.net)",
  "Breeding or migration seasons of sensitive wildlife",
  "Climate hazards: flash floods, extreme heat or cold, altitude",
  "Fragile ground: soil crusts, permafrost, salt or gypsum crusts, microbial mats",
  "Local rules for vehicles, drones and sampling, and land owners or Indigenous territories",
];

/** A small marker for list rows: how many environmental areas hold a place. */
export function EnvironmentMarker({ count }: { count: number | undefined }) {
  if (!count) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] text-good"
      title={t("Environmental notes for this place: open the sheet to read them.")}
    >
      <LeafIcon className="size-3" aria-hidden="true" />
      {count}
    </span>
  );
}

/** Environmental notes of a place: protected areas, wildlife, hazards and impact rules. */
export function EnvironmentDetails({
  environment,
  isNew = false,
}: {
  environment: PlaceEnvironment | null | undefined;
  /** A new candidate: when no area holds it, show what to check before going. */
  isNew?: boolean;
}) {
  if (!environment) return null;
  const empty = environment.areas.length === 0;
  if (empty && !isNew) return null;
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <h3 className="m-0 flex items-center gap-1.5 text-sm font-semibold">
        <LeafIcon className="size-4 text-good" aria-hidden="true" />
        {t("Environmental notes")}
      </h3>
      {empty && (
        <>
          <p className="m-0 text-xs">{t("No one has reviewed this place yet. Before planning fieldwork, check:")}</p>
          <ul className="m-0 flex flex-col gap-0.5 pl-4 text-xs">
            {NEW_PLACE_CHECKS.map((item) => (
              <li key={item}>{t(item)}</li>
            ))}
          </ul>
        </>
      )}
      {environment.areas.map((area, index) => (
        <details key={area.id} open={index === 0}>
          <summary className="cursor-pointer text-sm">{area.name}</summary>
          <ul className="mt-1 flex flex-col gap-2">
            {area.environmental_notes.map((note) => (
              <li key={note.topic + note.text.slice(0, 40)} className="text-xs leading-relaxed">
                <span className="mr-1 rounded-full border border-border px-1.5 py-px text-[10px] text-muted-foreground">
                  {t(environment.categories[note.category] ?? note.category)}
                </span>
                <strong>{t(note.topic)}.</strong> {note.text}{" "}
                <a href={note.source_url} target="_blank" rel="noreferrer" className="whitespace-nowrap">
                  {hostname(note.source_url)}
                </a>
              </li>
            ))}
          </ul>
        </details>
      ))}
      <p className="m-0 text-[11px] text-muted-foreground">
        {t("Reviewed {date}. Planning information only: it never changes the analog score, and boxes are approximate.", {
          date: environment.checked,
        })}
      </p>
    </section>
  );
}
