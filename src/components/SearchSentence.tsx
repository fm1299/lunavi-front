import { RotateCcwIcon, Undo2Icon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { Feature, Meta, Profile, Target } from "../api";
import { lowerFirst, TERRAIN_CHIPS } from "../format";
import { t } from "../i18n";

interface Props {
  meta: Meta;
  presets: Target[];
  target: Target;
  profiles: Profile[];
  profile: Profile;
  /** Features that can be given more weight. */
  features: Feature[];
  /** A feature key, or null. `customized` is true when the weights were moved by hand. */
  emphasis: string | null;
  customized: boolean;
  /** Null while the area is one drawn on the map. */
  presetId: string | null;
  terrain: string[];
  /** Parts filled in by the last question, shown highlighted. */
  fromQuestion: ReadonlySet<string>;
  notApplied: string[];
  canUndo: boolean;
  onArea: (id: string) => void;
  onSite: (id: string) => void;
  onPickSite: () => void;
  onProfile: (id: string) => void;
  onEmphasis: (key: string | null) => void;
  onTerrain: (terrain: string[]) => void;
  onUndo: () => void;
  onStartOver: () => void;
}

const DRAWN = "__drawn";
const OTHER_SITE = "__other";
const CUSTOM = "__custom";
const NONE = "__none";
const SEVERAL = "__several";

/** One word of the sentence: a select that looks like text and sizes itself to its value. */
function Token(props: { label: string; value: string; highlighted: boolean; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <Select value={props.value} onValueChange={props.onChange}>
      <SelectTrigger
        aria-label={props.label}
        className={cn(
          "mx-0.5 h-7 max-w-full gap-1 border-transparent bg-secondary px-2 align-baseline text-[15px] font-medium hover:border-primary",
          props.highlighted && "border-primary/50 bg-primary/15 text-primary",
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{props.children}</SelectContent>
    </Select>
  );
}

/**
 * The search as one sentence. Each highlighted word is a control, so a person can read what the
 * app understood and change it with one touch. It works with no language model at all.
 */
export default function SearchSentence(props: Props) {
  const { meta, presets, target, profiles, profile, features, emphasis, terrain, fromQuestion } = props;
  const whole = meta.region_presets[0]?.id;
  const areaName = (id: string, name: string) => (id === whole ? t("the whole world") : t(name));
  const isPreset = presets.some((preset) => preset.id === target.id);
  const siteName = (site: Target) => `${t(site.name)} (${site.body === "moon" ? t("Moon") : t("Mars")})`;
  const emphasisValue = emphasis ?? (props.customized ? CUSTOM : NONE);
  const terrainValue = terrain.length === 0 ? NONE : terrain.length === 1 ? terrain[0] : SEVERAL;
  const terrainLabel = (id: string) => lowerFirst(t(TERRAIN_CHIPS.find((chip) => chip.id === id)?.label ?? id));

  const slots: Record<string, ReactNode> = {
    area: (
      <Token
        key="area"
        label={t("Earth area")}
        value={props.presetId ?? DRAWN}
        highlighted={fromQuestion.has("area")}
        onChange={(value) => {
          if (value !== DRAWN) props.onArea(value);
        }}
      >
        {meta.region_presets.map((preset) => (
          <SelectItem key={preset.id} value={preset.id}>
            {areaName(preset.id, preset.name)}
          </SelectItem>
        ))}
        {props.presetId === null && <SelectItem value={DRAWN}>{t("the drawn area")}</SelectItem>}
      </Token>
    ),
    site: (
      <Token
        key="site"
        label={t("Moon or Mars site")}
        value={target.id}
        highlighted={fromQuestion.has("site")}
        onChange={(value) => (value === OTHER_SITE ? props.onPickSite() : props.onSite(value))}
      >
        {presets.map((preset) => (
          <SelectItem key={preset.id} value={preset.id}>
            {siteName(preset)}
          </SelectItem>
        ))}
        {!isPreset && <SelectItem value={target.id}>{t(target.name)}</SelectItem>}
        <SelectSeparator />
        <SelectItem value={OTHER_SITE}>{t("another point on the map…")}</SelectItem>
      </Token>
    ),
    purpose: (
      <Token
        key="purpose"
        label={t("Research purpose")}
        value={profile.id}
        highlighted={fromQuestion.has("purpose")}
        onChange={props.onProfile}
      >
        {profiles.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {lowerFirst(t(option.label))}
          </SelectItem>
        ))}
      </Token>
    ),
    focus: (
      <Token
        key="focus"
        label={t("Feature that matters most")}
        value={emphasisValue}
        highlighted={fromQuestion.has("focus")}
        onChange={(value) => {
          if (value !== CUSTOM) props.onEmphasis(value === NONE ? null : value);
        }}
      >
        <SelectItem value={NONE}>{t("nothing in particular")}</SelectItem>
        {features.map((feature) => (
          <SelectItem key={feature.key} value={feature.key}>
            {lowerFirst(t(feature.label))}
          </SelectItem>
        ))}
        {emphasisValue === CUSTOM && <SelectItem value={CUSTOM}>{t("what I set by hand")}</SelectItem>}
      </Token>
    ),
    terrain: (
      <Token
        key="terrain"
        label={t("Terrain")}
        value={terrainValue}
        highlighted={fromQuestion.has("terrain")}
        onChange={(value) => {
          if (value !== SEVERAL) props.onTerrain(value === NONE ? [] : [value]);
        }}
      >
        <SelectItem value={NONE}>{t("any")}</SelectItem>
        {TERRAIN_CHIPS.map((chip) => (
          <SelectItem key={chip.id} value={chip.id}>
            {terrainLabel(chip.id)}
          </SelectItem>
        ))}
        {terrainValue === SEVERAL && <SelectItem value={SEVERAL}>{t("several kinds of")}</SelectItem>}
      </Token>
    ),
  };

  // The pattern is translated whole, so each language keeps its own word order.
  const pattern = t(
    "I'm looking for places in {area} similar to {site} for {purpose}, giving more weight to {focus}, on {terrain} terrain.",
  );
  const parts = pattern.split(/\{(\w+)\}/).map((part, index) => (index % 2 === 1 ? slots[part] : part));

  return (
    <Card className="print:hidden">
      <CardLabel>
        {fromQuestion.size > 0
          ? t("This is what I understood. Touch a word to change it")
          : t("Your search. Touch a word to change it")}
      </CardLabel>
      <p className="text-base leading-9">{parts}</p>
      {props.notApplied.length > 0 && (
        <p className="border-l-2 pl-3 text-[13px] text-muted-foreground">
          {t("I could not use: {parts}. The rest was applied.", { parts: props.notApplied.map((part) => `«${part}»`).join(", ") })}
        </p>
      )}
      <div className="-mb-1 -ml-2 flex flex-wrap gap-1">
        {props.canUndo && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={props.onUndo}>
            <Undo2Icon />
            {t("Undo last change")}
          </Button>
        )}
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={props.onStartOver}>
          <RotateCcwIcon />
          {t("Start over")}
        </Button>
      </div>
    </Card>
  );
}
