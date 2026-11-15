import { MapPinIcon, PencilRulerIcon } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import type { BeyondMode, Feature, Meta, Profile, RestrictionLevel, Target, Weights } from "../api";
import { formatValue, TERRAIN_CHIPS } from "../format";
import { t } from "../i18n";
import { RESTRICTION_LABEL } from "./Restriction";

interface Props {
  meta: Meta;
  features: Feature[];
  target: Target;
  profile: Profile;
  weights: Weights;
  customized: boolean;
  beyondShare: number;
  beyond: BeyondMode;
  /** Features the purpose weighs but the score leaves out, because no Earth site reaches them. */
  excludedBeyond: string[];
  avoid: RestrictionLevel[];
  onBeyond: (mode: BeyondMode) => void;
  onAvoid: (levels: RestrictionLevel[]) => void;
  presetId: string | null;
  terrain: string[];
  minConfidence: number;
  drawing: boolean;
  onChangeSite: () => void;
  onWeight: (key: string, value: number) => void;
  onResetWeights: () => void;
  onPreset: (id: string) => void;
  onToggleDraw: () => void;
  onTerrain: (terrain: string[]) => void;
  onMinConfidence: (value: number) => void;
}

const BASIS_TITLE = {
  measured: "From an instrument",
  literature: "From a published value or model, so it carries lower quality",
  physical: "Follows directly from the body",
};
const BASIS_CLASS = {
  measured: "border-good/40 text-good",
  literature: "border-fair/40 text-fair",
  physical: "border-sky-300/40 text-sky-300",
};
const CLIMATE_MESSAGE = {
  pending: "Reading temperature from the Mars Climate Database…",
  unavailable: "Temperature could not be read right now, so those values are blank.",
};
const DRAWN = "__drawn";

/**
 * Everything behind the sentence, folded away until someone wants it: the site's values and
 * where each comes from, the weight of each feature, and the area, terrain and confidence filters.
 */
export default function SearchSettings(props: Props) {
  const { meta, features, target, profile, weights, beyondShare, terrain } = props;
  const sliders = features.filter((feature) => !(feature.key in profile.gates));
  const missing = features.filter((feature) => (target.features[feature.key]?.value ?? null) === null);
  const beyond = target.beyond_earth.length;

  return (
    <Accordion type="multiple" className="border-t print:hidden">
      <AccordionItem value="site">
        <AccordionTrigger>
          <span className="flex flex-wrap items-center gap-2">
            {t("Values at this site")}
            {beyond > 0 && <Badge variant="warning">{t("{count} beyond Earth", { count: beyond })}</Badge>}
            {missing.length > 0 && <Badge variant="outline">{t("{count} with no data", { count: missing.length })}</Badge>}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                {t(target.name)} · {target.body === "moon" ? t("Moon") : t("Mars")}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">{t(target.description)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={props.onChangeSite}>
              <MapPinIcon />
              {t("Change site")}
            </Button>
          </div>
          {target.climate_status !== "ready" && (
            <p className={cn("text-[13px]", target.climate_status === "pending" ? "text-primary" : "text-destructive")}>
              {t(CLIMATE_MESSAGE[target.climate_status])}
            </p>
          )}
          <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1.5 text-[13px]">
            {features.map((feature) => {
              const entry = target.features[feature.key];
              const hasValue = (entry?.value ?? null) !== null;
              const flagged = target.beyond_earth.includes(feature.key);
              return (
                <div key={feature.key} className="contents" title={entry?.note ?? undefined}>
                  <dt className="text-muted-foreground">{t(feature.label)}</dt>
                  <dd className={cn("m-0 text-right tabular-nums", !hasValue && "text-muted-foreground italic")}>
                    {entry?.source_url && hasValue ? (
                      <a href={entry.source_url} target="_blank" rel="noreferrer">
                        {formatValue(entry.value, feature.unit)}
                      </a>
                    ) : (
                      formatValue(entry?.value, feature.unit)
                    )}
                    {flagged && (
                      <span
                        className="block text-[11px] text-primary"
                        title={t("Outside the Earth range, so a cell can only be as close as Earth gets")}
                      >
                        {t("beyond Earth")}
                      </span>
                    )}
                  </dd>
                  <dd className="m-0">
                    {entry?.basis && (
                      <Badge variant="outline" className={BASIS_CLASS[entry.basis]} title={t(BASIS_TITLE[entry.basis])}>
                        {t(entry.basis)}
                      </Badge>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
          {missing.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("Blank values are left out of the score and lower confidence. Event data can fill them later.")}
            </p>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="weights">
        <AccordionTrigger>
          <span className="flex flex-wrap items-center gap-2">
            {t("Feature weights")}
            {props.customized && <Badge variant="warning">{t("changed")}</Badge>}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-[minmax(0,1fr)_9rem_1.75rem] items-center gap-x-3 gap-y-2 text-[13px]">
            {sliders.map((feature) => {
              const value = weights[feature.key] ?? 0;
              return (
                <div key={feature.key} className="contents">
                  <span className={cn(value === 0 && "text-muted-foreground")}>{t(feature.label)}</span>
                  <Slider
                    label={t(feature.label)}
                    min={0}
                    max={5}
                    step={0.5}
                    value={[value]}
                    onValueChange={([next]) => props.onWeight(feature.key, next)}
                  />
                  <output className="text-right tabular-nums text-muted-foreground">{value}</output>
                </div>
              );
            })}
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {t("The vegetation gate stays on at any weight, so forests never rank as analogs.")}
            </p>
            <Button variant="ghost" size="sm" disabled={!props.customized} onClick={props.onResetWeights}>
              {t("Reset")}
            </Button>
          </div>
          {beyondShare > 0 && (
            <p className="text-xs text-primary">
              <strong>{Math.round(beyondShare * 100)}%</strong> {t("of the active weight rests on values beyond Earth's range.")}
            </p>
          )}
          {props.excludedBeyond.length > 0 && (
            <p className="text-xs text-primary">
              {t("Left out of the score: {features}. No place on Earth reaches these values, so test them in a thermal vacuum chamber, not in the field.", {
                features: props.excludedBeyond.map((key) => t(features.find((f) => f.key === key)?.label ?? key)).join(", "),
              })}
            </p>
          )}
          {target.beyond_earth.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">{t("Values beyond Earth's range")}</span>
              <div className="segmented" role="group" aria-label={t("Values beyond Earth's range")}>
                {(
                  [
                    ["exclude", "Leave them out"],
                    ["clamp", "Count them at Earth's edge"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    className={props.beyond === mode ? "active" : ""}
                    aria-pressed={props.beyond === mode}
                    onClick={() => props.onBeyond(mode)}
                  >
                    {t(label)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="filters">
        <AccordionTrigger>
          <span className="flex flex-wrap items-center gap-2">
            {t("Area, terrain and confidence")}
            {props.minConfidence > 0 && (
              <Badge variant="warning">{t("confidence {percent}% or more", { percent: Math.round(props.minConfidence * 100) })}</Badge>
            )}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{t("Earth area")}</span>
            <div className="flex gap-2">
              <Select
                value={props.presetId ?? DRAWN}
                onValueChange={(value) => {
                  if (value !== DRAWN) props.onPreset(value);
                }}
              >
                <SelectTrigger className="min-w-0 flex-1" aria-label={t("Earth area")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meta.region_presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {t(preset.name)}
                    </SelectItem>
                  ))}
                  {props.presetId === null && <SelectItem value={DRAWN}>{t("Drawn area")}</SelectItem>}
                </SelectContent>
              </Select>
              <Button variant={props.drawing ? "default" : "outline"} aria-pressed={props.drawing} onClick={props.onToggleDraw}>
                <PencilRulerIcon />
                {props.drawing ? t("Drag on map") : t("Draw")}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{t("Terrain")}</span>
            <div className="flex flex-wrap gap-1.5">
              {TERRAIN_CHIPS.map((chip) => {
                const active = terrain.includes(chip.id);
                return (
                  <Button
                    key={chip.id}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className="h-7 rounded-full"
                    aria-pressed={active}
                    onClick={() => props.onTerrain(active ? terrain.filter((id) => id !== chip.id) : [...terrain, chip.id])}
                  >
                    {t(chip.label)}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{t("Leave out places where fieldwork is")}</span>
            <div className="flex flex-wrap gap-1.5">
              {(["do_not_travel", "restricted", "permit"] as const).map((level) => {
                const active = props.avoid.includes(level);
                return (
                  <Button
                    key={level}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className="h-7 rounded-full"
                    aria-pressed={active}
                    onClick={() => props.onAvoid(active ? props.avoid.filter((item) => item !== level) : [...props.avoid, level])}
                  >
                    {t(RESTRICTION_LABEL[level])}
                  </Button>
                );
              })}
            </div>
            <p className="m-0 text-[11px] text-muted-foreground">
              {t("A planning filter: it never changes a score.")}
            </p>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_9rem_2.5rem] items-center gap-x-3 text-[13px]">
            <span>{t("Minimum confidence")}</span>
            <Slider
              label={t("Minimum confidence")}
              min={0}
              max={1}
              step={0.05}
              value={[props.minConfidence]}
              onValueChange={([next]) => props.onMinConfidence(next)}
            />
            <output className="text-right tabular-nums text-muted-foreground">{Math.round(props.minConfidence * 100)}%</output>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
