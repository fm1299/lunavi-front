import type { Feature, Meta, Profile, Target, Weights } from "../api";
import { formatValue, TERRAIN_CHIPS } from "../format";

interface Props {
  meta: Meta;
  profiles: Profile[];
  features: Feature[];
  target: Target;
  profile: Profile;
  weights: Weights;
  customized: boolean;
  beyondShare: number;
  presetId: string | null;
  terrain: string[];
  minConfidence: number;
  drawing: boolean;
  onChangeSite: () => void;
  onProfile: (id: string) => void;
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

const CLIMATE_MESSAGE = {
  pending: "Reading temperature from the Mars Climate Database…",
  unavailable: "Temperature could not be read right now, so those values are blank.",
};

export default function Controls(props: Props) {
  const { meta, profiles, features, target, profile, weights, customized, beyondShare } = props;
  const gated = new Set(Object.keys(profile.gates));
  const sliders = features.filter((feature) => !gated.has(feature.key));
  const missing = features.filter((feature) => (target.features[feature.key]?.value ?? null) === null);

  return (
    <aside className="panel controls" aria-label="Search settings">
      <section>
        <div className="section-row">
          <span className={`body-tag body-${target.body}`}>{target.body === "moon" ? "Moon" : "Mars"}</span>
          <button className="button primary" onClick={props.onChangeSite}>
            Change site
          </button>
        </div>
        <h1 className="site-name">{target.name}</h1>
        <p className="target-description">{target.description}</p>
        {target.climate_status !== "ready" && (
          <p className={target.climate_status === "pending" ? "hint pending" : "warning"}>
            {CLIMATE_MESSAGE[target.climate_status]}
          </p>
        )}

        <details className="stats-card" open>
          <summary>Values at this site</summary>
          <table>
            <tbody>
              {features.map((feature) => {
                const entry = target.features[feature.key];
                const hasValue = (entry?.value ?? null) !== null;
                const flagged = target.beyond_earth.includes(feature.key);
                return (
                  <tr key={feature.key} title={entry?.note ?? undefined}>
                    <th scope="row">{feature.label}</th>
                    <td className={hasValue ? "" : "no-data"}>
                      {entry?.source_url && hasValue ? (
                        <a href={entry.source_url} target="_blank" rel="noreferrer">
                          {formatValue(entry.value, feature.unit)}
                        </a>
                      ) : (
                        formatValue(entry?.value, feature.unit)
                      )}
                      {flagged && (
                        <span className="flag" title="Outside the Earth range, so a cell can only be as close as Earth gets">
                          beyond Earth
                        </span>
                      )}
                    </td>
                    <td>
                      {entry?.basis && (
                        <span className={`basis basis-${entry.basis}`} title={BASIS_TITLE[entry.basis]}>
                          {entry.basis}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {missing.length > 0 && (
            <p className="hint">Blank values are left out of the score and lower confidence. Event data can fill them later.</p>
          )}
        </details>
        {beyondShare > 0 && (
          <p className="beyond-note">
            <strong>{Math.round(beyondShare * 100)}%</strong> of the active weight rests on values beyond Earth's range.
          </p>
        )}
      </section>

      <section>
        <label className="field-label" htmlFor="profile">
          Research purpose
        </label>
        <select id="profile" value={profile.id} onChange={(e) => props.onProfile(e.target.value)}>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </section>

      <section>
        <div className="section-row">
          <h2 className="field-label">Feature weights</h2>
          <button className="link-button" onClick={props.onResetWeights} disabled={!customized}>
            Reset
          </button>
        </div>
        <div className="sliders">
          {sliders.map((feature) => (
            <label key={feature.key} className="slider">
              <span>{feature.label}</span>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={weights[feature.key] ?? 0}
                onChange={(e) => props.onWeight(feature.key, Number(e.target.value))}
              />
              <output>{weights[feature.key] ?? 0}</output>
            </label>
          ))}
        </div>
        <p className="hint">The vegetation gate stays on at any weight, so forests never rank as analogs.</p>
      </section>

      <section>
        <label className="field-label" htmlFor="preset">
          Earth area
        </label>
        <div className="section-row">
          <select id="preset" value={props.presetId ?? "drawn"} onChange={(e) => props.onPreset(e.target.value)}>
            {meta.region_presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
            {props.presetId === null && <option value="drawn">Drawn area</option>}
          </select>
          <button className={`button ${props.drawing ? "active" : ""}`} onClick={props.onToggleDraw} aria-pressed={props.drawing}>
            {props.drawing ? "Drag on map" : "Draw"}
          </button>
        </div>

        <h2 className="field-label spaced">Terrain</h2>
        <div className="chips">
          {TERRAIN_CHIPS.map((chip) => {
            const active = props.terrain.includes(chip.id);
            return (
              <button
                key={chip.id}
                className={`chip ${active ? "active" : ""}`}
                aria-pressed={active}
                onClick={() =>
                  props.onTerrain(active ? props.terrain.filter((t) => t !== chip.id) : [...props.terrain, chip.id])
                }
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <label className="slider confidence-slider">
          <span>Minimum confidence</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={props.minConfidence}
            onChange={(e) => props.onMinConfidence(Number(e.target.value))}
          />
          <output>{Math.round(props.minConfidence * 100)}%</output>
        </label>
      </section>
    </aside>
  );
}
