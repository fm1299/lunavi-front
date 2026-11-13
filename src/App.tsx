import { useCallback, useEffect, useMemo, useState } from "react";

import type { Analog, Bbox, CellSheet, CompactCells, Feature, FullCell, Meta, Profile, Query, ResultMeta, Target, Weights } from "./api";
import { api } from "./api";
import Controls from "./components/Controls";
import GridMap, { type ScoreRange } from "./components/GridMap";
import MethodView from "./components/MethodView";
import RankedList from "./components/RankedList";
import SitePicker from "./components/SitePicker";
import SiteSheet from "./components/SiteSheet";

type View = "analogs" | "picker" | "method";

const TOP_N = 25;
const TOP_SEPARATION_KM = 300;
const DEBOUNCE_MS = 150;
const COLOR_SCALE_FLOOR = 0.9; // the lowest 10 percent of scores share the bottom color

interface Boot {
  meta: Meta;
  targets: Target[];
  profiles: Profile[];
  features: Feature[];
  analogs: Analog[];
}

export default function App() {
  const [boot, setBoot] = useState<Boot | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.meta(), api.targets(), api.profiles(), api.features(), api.analogs()])
      .then(([meta, targets, profiles, features, analogs]) => setBoot({ meta, targets, profiles, features, analogs }))
      .catch((error: Error) => setBootError(error.message));
  }, []);

  if (bootError) {
    return (
      <main className="boot-message">
        <h1>LUNAVI can't reach its API</h1>
        <p>{bootError}</p>
        <p>
          Start it from lunavi-back with <code>uv run uvicorn api.main:app</code>, then reload this page.
        </p>
      </main>
    );
  }
  if (!boot) return <main className="boot-message">Loading LUNAVI…</main>;
  return <Workspace boot={boot} />;
}

function Workspace({ boot }: { boot: Boot }) {
  const { meta, targets, profiles, features, analogs } = boot;
  const [view, setView] = useState<View>("analogs");
  // The first preset opens by default, with results and no clicks (spec FR-W11).
  const [target, setTarget] = useState<Target>(targets[0]);
  const [profileId, setProfileId] = useState(target.default_profile);
  const profile = profiles.find((p) => p.id === profileId)!;
  const [customWeights, setCustomWeights] = useState<Weights | null>(null);
  const [debouncedWeights, setDebouncedWeights] = useState<Weights | null>(null);
  const [presetId, setPresetId] = useState<string | null>(meta.region_presets[0]?.id ?? null);
  const [drawnBbox, setDrawnBbox] = useState<Bbox | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [terrain, setTerrain] = useState<string[]>([]);
  const [minConfidence, setMinConfidence] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const [cells, setCells] = useState<CompactCells | null>(null);
  const [top, setTop] = useState<FullCell[]>([]);
  const [resultMeta, setResultMeta] = useState<ResultMeta | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<CellSheet | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const bbox = useMemo<Bbox | null>(() => {
    if (presetId === null) return drawnBbox;
    if (presetId === meta.region_presets[0]?.id) return null;
    return meta.region_presets.find((preset) => preset.id === presetId)?.bbox ?? null;
  }, [presetId, drawnBbox, meta.region_presets]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedWeights(customWeights), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [customWeights]);

  // Results refresh when a site's slow temperature query finishes, through climate_status.
  const query = useMemo<Query>(
    () => ({ target: target.id, profile: profileId, weights: debouncedWeights, bbox, terrain, minConfidence }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [target.id, target.climate_status, profileId, debouncedWeights, bbox, terrain, minConfidence],
  );

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api.map(query, controller.signal),
      api.top(query, TOP_N, TOP_SEPARATION_KM, controller.signal),
    ])
      .then(([mapResult, topResult]) => {
        setCells(mapResult.cells);
        setResultMeta(mapResult.meta);
        setTop(topResult.cells);
        setResultError(null);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setResultError(error.message);
      });
    return () => controller.abort();
  }, [query]);

  // Mars temperature arrives after the site opens, so the user is not left waiting for it.
  useEffect(() => {
    if (target.climate_status !== "pending") return;
    let active = true;
    api
      .siteClimate(target.id)
      .then((updated) => {
        if (active) setTarget(updated);
      })
      .catch(() => {
        if (active) setTarget((current) => ({ ...current, climate_status: "unavailable" }));
      });
    return () => {
      active = false;
    };
  }, [target.id, target.climate_status]);

  useEffect(() => {
    if (!selected) {
      setSheet(null);
      setSheetError(null);
      return;
    }
    const controller = new AbortController();
    setSheetError(null);
    api
      .cell(selected, { target: target.id, profile: profileId, weights: debouncedWeights }, controller.signal)
      .then(setSheet)
      .catch((error: Error) => {
        if (error.name !== "AbortError") setSheetError(`Could not load this cell: ${error.message}`);
      });
    return () => controller.abort();
  }, [selected, target.id, target.climate_status, profileId, debouncedWeights]);

  // Stretch the color scale over the scores on screen, so differences stay visible.
  const range = useMemo<ScoreRange>(() => {
    // The API sorts by score, highest first.
    const scores = (cells?.score ?? []).filter((score) => score > 0);
    if (scores.length === 0) return { min: 0, max: 100 };
    return { min: scores[Math.floor((scores.length - 1) * COLOR_SCALE_FLOOR)], max: scores[0] };
  }, [cells]);

  const weights = customWeights ?? profile.weights;

  const onChosen = useCallback((chosen: Target) => {
    setTarget(chosen);
    setProfileId(chosen.default_profile);
    setCustomWeights(null);
    setDebouncedWeights(null);
    setSelected(null);
    setView("analogs");
  }, []);

  const onDrawn = useCallback((drawn: Bbox) => {
    setDrawnBbox(drawn);
    setPresetId(null);
    setDrawing(false);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">LUNAVI</span>
          <span className="brand-sub">Earth analogs of the Moon and Mars</span>
        </div>
        <nav aria-label="Views">
          <button
            className={`tab ${view !== "method" ? "active" : ""}`}
            aria-current={view !== "method" ? "page" : undefined}
            onClick={() => setView("analogs")}
          >
            Find analogs
          </button>
          <button
            className={`tab ${view === "method" ? "active" : ""}`}
            aria-current={view === "method" ? "page" : undefined}
            onClick={() => setView("method")}
          >
            Method
          </button>
        </nav>
        <div className={`data-badge ${meta.dummy ? "dummy" : ""}`} title={meta.region.name}>
          {meta.dummy ? "Dummy data, not real results" : "Prototype on open data"}
        </div>
      </header>

      {resultError && <div className="error-banner">Could not load results: {resultError}</div>}

      <div className={`workspace ${view === "analogs" ? "" : "hidden"}`}>
        <Controls
          meta={meta}
          profiles={profiles}
          features={features}
          target={target}
          profile={profile}
          weights={weights}
          customized={customWeights !== null}
          beyondShare={resultMeta?.beyond_earth_weight_share ?? 0}
          presetId={presetId}
          terrain={terrain}
          minConfidence={minConfidence}
          drawing={drawing}
          onChangeSite={() => setView("picker")}
          onProfile={(id) => {
            setProfileId(id);
            setCustomWeights(null);
          }}
          onWeight={(key, value) => setCustomWeights({ ...weights, [key]: value })}
          onResetWeights={() => setCustomWeights(null)}
          onPreset={(id) => {
            setPresetId(id);
            setDrawing(false);
          }}
          onToggleDraw={() => setDrawing((value) => !value)}
          onTerrain={setTerrain}
          onMinConfidence={setMinConfidence}
        />

        <GridMap
          meta={meta}
          cells={cells}
          range={range}
          analogs={analogs}
          selected={selected}
          hovered={hovered}
          bbox={bbox}
          drawing={drawing}
          visible={view === "analogs"}
          onSelect={setSelected}
          onHover={setHovered}
          onDrawn={onDrawn}
        />

        <aside className="panel results" aria-label="Results">
          {selected ? (
            <SiteSheet sheet={sheet} target={target} error={sheetError} onClose={() => setSelected(null)} />
          ) : (
            <RankedList cells={top} meta={resultMeta} hovered={hovered} onSelect={setSelected} onHover={setHovered} />
          )}
        </aside>
      </div>

      {view === "picker" && (
        <SitePicker meta={meta} presets={targets} current={target} onChosen={onChosen} onCancel={() => setView("analogs")} />
      )}

      {view === "method" && (
        <main className="page-shell">
          <MethodView meta={meta} features={features} profiles={profiles} />
        </main>
      )}

      <footer className="limits">{meta.limits_statement}</footer>
    </div>
  );
}
