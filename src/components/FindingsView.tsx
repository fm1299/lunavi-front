import { MapPinIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { Feature, Finding, FindingSet, Profile, RestrictionLevel, Restrictions, Target } from "../api";
import { api } from "../api";
import { BAND_LABEL, formatCoord, lowerFirst } from "../format";
import { t } from "../i18n";
import { BAND_CLASS } from "./RankedList";
import { LegalNotes, RESTRICTION_LABEL, RestrictionBadge, RestrictionDetails } from "./Restriction";
import BrandStar from "./BrandStar";

interface Props {
  targets: Target[];
  profiles: Profile[];
  features: Feature[];
  /** Switch to this preset and open the finding's main cell on the map. */
  onOpen: (targetId: string, cellId: string) => void;
}

const LITERATURE_LABEL: Record<Finding["literature_check"]["result"], string> = {
  no_analog_literature_found: "No analog literature found",
  studied_in_other_context: "Studied in another context",
  used_as_analog: "Already used as an analog",
};

type Show = "all" | "feasible";

/** Can a team go there now? Conflict or Do Not Travel says no; a permit or a legal limit says yes, with work. */
const feasible = (finding: Finding) => finding.restrictions?.level !== "do_not_travel";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function FindingCard({ finding, features, onOpen }: { finding: Finding; features: Feature[]; onOpen: () => void }) {
  const label = (key: string) => lowerFirst(t(features.find((f) => f.key === key)?.label ?? key));
  const pairs = (record?: Record<string, number>) =>
    Object.entries(record ?? {})
      .map(([key, s]) => `${label(key)} ${s.toFixed(2)}`)
      .join(", ");
  const { live, checks } = finding;
  const warnings = [
    !checks.has_sources && t("No source was found for this region"),
    live.band === "low" && t("Low confidence: few features with good data"),
    checks.cells_outside_bbox.length > 0 && t("Some cells lie outside the region's box"),
    checks.cells_missing_from_table.length > 0 && t("Some cells are missing from the loaded table"),
  ].filter(Boolean) as string[];
  const blocked = finding.restrictions?.level === "do_not_travel";

  return (
    <Card className={cn("flex flex-col gap-3 p-4", blocked && "opacity-80")}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="m-0 text-base font-semibold">{finding.name}</h3>
          <p className="m-0 text-xs text-muted-foreground tabular-nums">
            {finding.restrictions?.country ?? t("Unnamed area")} · {formatCoord(finding.lat, finding.lon)} ·{" "}
            {t("{count} cells", { count: finding.n_cells })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums">{live.score === null ? "–" : live.score.toFixed(1)}</div>
          {live.band && (
            <div className={cn("text-xs", BAND_CLASS[live.band])}>
              {t("{band} confidence", { band: t(BAND_LABEL[live.band]) })}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-1.5">
        <RestrictionBadge level={finding.restrictions?.level} />
        <span className="rounded-full border border-border px-1.5 py-px text-[11px]">
          {t(LITERATURE_LABEL[finding.literature_check.result])}
        </span>
        {checks.nearest_known_analog_km !== null && (
          <span className="text-[11px] text-muted-foreground">
            {t("{km} km from the nearest known analog", { km: Math.round(checks.nearest_known_analog_km) })}
          </span>
        )}
      </div>

      {live.closest_matches && (
        <p className="m-0 text-sm">
          <span className="text-muted-foreground">{t("Matches on")}</span> {pairs(live.closest_matches)}
          {live.weakest_matches && Object.keys(live.weakest_matches).length > 0 && (
            <>
              {" · "}
              <span className="text-muted-foreground">{t("differs on")}</span> {pairs(live.weakest_matches)}
            </>
          )}
        </p>
      )}

      <div className="text-sm">
        <span className="text-muted-foreground">{t("Test first")}: </span>
        {finding.test_first.map((tag) => t(tag)).join(" → ")}
      </div>

      <p className="m-0 text-sm leading-relaxed">
        <strong>{t("Honest limit")}:</strong> {finding.limits}
      </p>

      {warnings.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {warnings.map((warning) => (
            <li key={warning} className="flex items-center gap-1.5 text-xs text-fair">
              <TriangleAlertIcon className="size-3.5 shrink-0" aria-hidden="true" />
              {warning}
            </li>
          ))}
        </ul>
      )}

      <RestrictionDetails restrictions={finding.restrictions} />

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">
          {t("Literature review: {count} searches on {date}", {
            count: finding.literature_check.queries.length,
            date: finding.literature_check.date,
          })}
        </summary>
        <ul className="mt-1 flex flex-col gap-0.5">
          {finding.literature_check.queries.map((query) => (
            <li key={query}>
              <code className="text-[11px]">{query}</code>
            </li>
          ))}
        </ul>
        {finding.sources.length > 0 && (
          <p className="mt-2">
            {t("Sources read")}:{" "}
            {finding.sources.map((url, index) => (
              <span key={url}>
                {index > 0 && " · "}
                <a href={url} target="_blank" rel="noreferrer">
                  {hostname(url)}
                </a>
              </span>
            ))}
          </p>
        )}
      </details>

      <div>
        <Button variant="outline" size="sm" onClick={onOpen} disabled={live.score === null}>
          <MapPinIcon />
          {t("Open on the map")}
        </Button>
      </div>
    </Card>
  );
}

export default function FindingsView({ targets, profiles, features, onOpen }: Props) {
  const [sets, setSets] = useState<FindingSet[] | null>(null);
  const [restrictions, setRestrictions] = useState<Restrictions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState<Show>("all");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([api.findings(controller.signal), api.restrictions(controller.signal)])
      .then(([findingSets, notes]) => {
        setSets(findingSets);
        setRestrictions(notes);
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, []);

  const counts = useMemo(() => {
    const all = (sets ?? []).flatMap((set) => set.findings);
    const byLevel: Partial<Record<RestrictionLevel | "none", number>> = {};
    for (const finding of all) {
      const level = finding.restrictions?.level ?? "none";
      byLevel[level] = (byLevel[level] ?? 0) + 1;
    }
    return { total: all.length, byLevel, feasible: all.filter(feasible).length };
  }, [sets]);

  if (error) return <div className="page"><p className="error-banner">{t("Could not load the findings: {error}", { error })}</p></div>;
  if (!sets) return <div className="page"><p className="muted">{t("Loading the findings…")}</p></div>;

  return (
    <div className="page flex flex-col gap-6">
      <div>
        <h1 className="flex items-start gap-2">
          {t("New findings")}
          <BrandStar className="mt-1 size-4 text-foreground" />
        </h1>
        <p className="lede">
          {t(
            "{count} Earth regions that rank in the top 1% for a preset site but are not documented analogs. Each one was checked in the literature in two rounds, and the app recomputes its score from the current table.",
            { count: counts.total },
          )}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {(["do_not_travel", "restricted", "permit"] as const).map(
            (level) =>
              counts.byLevel[level] !== undefined && (
                <span key={level} className="inline-flex items-center gap-1">
                  <RestrictionBadge level={level} /> {counts.byLevel[level]}
                </span>
              ),
          )}
          {counts.byLevel.none !== undefined && (
            <span className="text-muted-foreground">
              {t("{count} with no known restriction", { count: counts.byLevel.none })}
            </span>
          )}
        </div>
        <div className="segmented mt-3" role="group" aria-label={t("Which findings to show")}>
          <button className={show === "all" ? "active" : ""} aria-pressed={show === "all"} onClick={() => setShow("all")}>
            {t("All ({count})", { count: counts.total })}
          </button>
          <button
            className={show === "feasible" ? "active" : ""}
            aria-pressed={show === "feasible"}
            onClick={() => setShow("feasible")}
          >
            {t("Fieldwork possible now ({count})", { count: counts.feasible })}
          </button>
        </div>
      </div>

      {sets.map((set) => {
        const target = targets.find((item) => item.id === set.target_id);
        const profile = profiles.find((item) => item.id === set.profile);
        const findings = set.findings.filter((finding) => show === "all" || feasible(finding));
        return (
          <section key={set.target_id} className="flex flex-col gap-3">
            <h2 className="m-0">
              {t(target?.name ?? set.target_id)}
              <span className="text-sm font-normal text-muted-foreground"> · {t(profile?.label ?? set.profile)}</span>
            </h2>
            {findings.length === 0 && <p className="muted">{t("No finding here can be visited now.")}</p>}
            <div className="grid gap-3 md:grid-cols-2">
              {findings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  features={features}
                  onOpen={() => onOpen(set.target_id, finding.live.cell_id)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {restrictions && (
        <section className="flex flex-col gap-2">
          <h2 className="m-0">{t("Legal notes for every site")}</h2>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
            {(Object.keys(restrictions.levels) as RestrictionLevel[]).map((level) => (
              <li key={level} className="flex flex-wrap items-center gap-2">
                <RestrictionBadge level={level} />
                <span className="text-muted-foreground">{t(RESTRICTION_LABEL[level])}:</span>
                {restrictions.levels[level]}
              </li>
            ))}
          </ul>
          <LegalNotes notes={restrictions.general_notes} />
        </section>
      )}
    </div>
  );
}
