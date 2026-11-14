import type { ReactNode } from "react";

import type { Feature, Meta, Profile, Target } from "../api";
import { lowerFirst, TERRAIN_CHIPS } from "../format";
import { t } from "../i18n";

interface Props {
  meta: Meta;
  presets: Target[];
  target: Target;
  profiles: Profile[];
  profile: Profile;
  /** Features that can be given more importance. */
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

const OTHER_SITE = "__other";
const CUSTOM = "__custom";
const NONE = "__none";
const SEVERAL = "__several";

/** A native select sized to its current text, so the sentence reads as a sentence. */
function Token(props: {
  label: string;
  value: string;
  text: string;
  highlighted: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      className={`token ${props.highlighted ? "token-set" : ""}`}
      aria-label={props.label}
      value={props.value}
      style={{ width: `calc(${(props.text.length * 0.58).toFixed(1)}em + 36px)` }}
      onChange={(event) => props.onChange(event.target.value)}
    >
      {props.children}
    </select>
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

  const areaValue = props.presetId ?? "drawn";
  const areaText =
    props.presetId === null
      ? t("the drawn area")
      : areaName(props.presetId, meta.region_presets.find((preset) => preset.id === props.presetId)?.name ?? "");
  const emphasisValue = emphasis ?? (props.customized ? CUSTOM : NONE);
  const emphasisText =
    emphasis !== null
      ? lowerFirst(t(features.find((feature) => feature.key === emphasis)?.label ?? emphasis))
      : props.customized
        ? t("what I set by hand")
        : t("nothing in particular");
  const terrainValue = terrain.length === 0 ? NONE : terrain.length === 1 ? terrain[0] : SEVERAL;
  const terrainLabel = (id: string) => lowerFirst(t(TERRAIN_CHIPS.find((chip) => chip.id === id)?.label ?? id));
  const terrainText =
    terrain.length === 0 ? t("any") : terrain.length === 1 ? terrainLabel(terrain[0]) : t("several kinds of");

  const slots: Record<string, ReactNode> = {
    area: (
      <Token
        key="area"
        label={t("Earth area")}
        value={areaValue}
        text={areaText}
        highlighted={fromQuestion.has("area")}
        onChange={props.onArea}
      >
        {meta.region_presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {areaName(preset.id, preset.name)}
          </option>
        ))}
        {props.presetId === null && <option value="drawn">{t("the drawn area")}</option>}
      </Token>
    ),
    site: (
      <Token
        key="site"
        label={t("Moon or Mars site")}
        value={target.id}
        text={isPreset ? siteName(target) : t(target.name)}
        highlighted={fromQuestion.has("site")}
        onChange={(value) => (value === OTHER_SITE ? props.onPickSite() : props.onSite(value))}
      >
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {siteName(preset)}
          </option>
        ))}
        {!isPreset && <option value={target.id}>{t(target.name)}</option>}
        <option value={OTHER_SITE}>{t("another point on the map…")}</option>
      </Token>
    ),
    purpose: (
      <Token
        key="purpose"
        label={t("Research purpose")}
        value={profile.id}
        text={lowerFirst(t(profile.label))}
        highlighted={fromQuestion.has("purpose")}
        onChange={props.onProfile}
      >
        {profiles.map((option) => (
          <option key={option.id} value={option.id}>
            {lowerFirst(t(option.label))}
          </option>
        ))}
      </Token>
    ),
    focus: (
      <Token
        key="focus"
        label={t("Feature that matters most")}
        value={emphasisValue}
        text={emphasisText}
        highlighted={fromQuestion.has("focus")}
        onChange={(value) => {
          if (value !== CUSTOM) props.onEmphasis(value === NONE ? null : value);
        }}
      >
        <option value={NONE}>{t("nothing in particular")}</option>
        {features.map((feature) => (
          <option key={feature.key} value={feature.key}>
            {lowerFirst(t(feature.label))}
          </option>
        ))}
        {emphasisValue === CUSTOM && <option value={CUSTOM}>{t("what I set by hand")}</option>}
      </Token>
    ),
    terrain: (
      <Token
        key="terrain"
        label={t("Terrain")}
        value={terrainValue}
        text={terrainText}
        highlighted={fromQuestion.has("terrain")}
        onChange={(value) => {
          if (value !== SEVERAL) props.onTerrain(value === NONE ? [] : [value]);
        }}
      >
        <option value={NONE}>{t("any")}</option>
        {TERRAIN_CHIPS.map((chip) => (
          <option key={chip.id} value={chip.id}>
            {terrainLabel(chip.id)}
          </option>
        ))}
        {terrainValue === SEVERAL && <option value={SEVERAL}>{t("several kinds of")}</option>}
      </Token>
    ),
  };

  // The pattern is translated whole, so each language keeps its own word order.
  const pattern = t(
    "I'm looking for places in {area} similar to {site} for {purpose}, giving more weight to {focus}, on {terrain} terrain.",
  );
  const parts = pattern.split(/\{(\w+)\}/).map((part, index) => (index % 2 === 1 ? slots[part] : part));

  return (
    <section className="sentence-card">
      <span className="field-label">
        {fromQuestion.size > 0
          ? t("This is what I understood. Touch a word to change it")
          : t("Your search. Touch a word to change it")}
      </span>
      <p className="sentence">{parts}</p>
      {props.notApplied.length > 0 && (
        <p className="sentence-skipped">
          {t("I could not use: {parts}. The rest was applied.", { parts: props.notApplied.map((part) => `«${part}»`).join(", ") })}
        </p>
      )}
      <div className="sentence-foot">
        {props.canUndo && (
          <button className="link-button" type="button" onClick={props.onUndo}>
            {t("Back to the previous search")}
          </button>
        )}
        <button className="link-button" type="button" onClick={props.onStartOver}>
          {t("Start over")}
        </button>
      </div>
    </section>
  );
}
