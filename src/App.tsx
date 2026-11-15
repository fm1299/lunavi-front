import { useCallback, useEffect, useMemo, useState } from "react";

import type { Analog, Bbox, BeyondMode, CellSheet, CompactCells, Feature, FullCell, Gaps, Meta, Portfolio, Profile, Query, RestrictionLevel, ResultMeta, SummaryReply, Target, Weights } from "./api";
import { api } from "./api";
import Answer, { type NextStep } from "./components/Answer";
import AskBox from "./components/AskBox";
import { GapTable, PortfolioList } from "./components/Coverage";
import FindingsView from "./components/FindingsView";
import GridMap, { type MapLayer, type ScoreRange } from "./components/GridMap";
import MethodView from "./components/MethodView";
import ProcessView from "./components/ProcessView";
import RankedList from "./components/RankedList";
import SearchSentence from "./components/SearchSentence";
import SearchSettings from "./components/SearchSettings";
import SitePicker from "./components/SitePicker";
import SiteSheet from "./components/SiteSheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { getLang, type Lang, setLang, t } from "./i18n";

type View = "analogs" | "picker" | "process" | "method" | "findings";
type ResultTab = "list" | "portfolio" | "gaps";

const RESULT_TABS: [ResultTab, string][] = [
  ["list", "List"],
  ["portfolio", "Portfolio"],
  ["gaps", "Gaps"],
];
const NO_CELLS: FullCell[] = [];

const TOP_N = 25;
const TOP_SEPARATION_KM = 300;
const DEBOUNCE_MS = 150;
const COLOR_SCALE_FLOOR = 0.9; // the lowest 10 percent of scores share the bottom color
const EMPHASIS_WEIGHT = 4; // the weight of the feature a search gives more importance to
const SUMMARY_DELAY_MS = 700; // wait for the controls to settle before asking for a new answer
const MAP_PINS = 10; // how many of the listed places get a numbered pin
const NO_PARTS: ReadonlySet<string> = new Set();

/** Everything a search is made of, kept so a question or a refinement can be undone. */
interface Snapshot {
  target: Target;
  profileId: string;
  customWeights: Weights | null;
  emphasis: string | null;
  presetId: string | null;
  drawnBbox: Bbox | null;
  terrain: string[];
  minConfidence: number;
}

function emphasized(profile: Profile, key: string): Weights {
  return { ...profile.weights, [key]: Math.max(EMPHASIS_WEIGHT, profile.weights[key] ?? 0) };
}

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
  // Texts are read through t() while rendering, so a new language only needs a re-render.
  const [lang, setLangState] = useState<Lang>(getLang());
  const onLang = useCallback((next: Lang) => {
    setLang(next);
    setLangState(next);
  }, []);

  useEffect(() => {
    Promise.all([api.meta(), api.targets(), api.profiles(), api.features(), api.analogs()])
      .then(([meta, targets, profiles, features, analogs]) => setBoot({ meta, targets, profiles, features, analogs }))
      .catch((error: Error) => setBootError(error.message));
  }, []);

  if (bootError) {
    return (
      <main className="boot-message">
        <h1>{t("LUNAVI can't reach its API")}</h1>
        <p>{bootError}</p>
        <p>
          {t("Start it from lunavi-back with")} <code>uv run uvicorn api.main:app</code>
          {t(", then reload this page.")}
        </p>
      </main>
    );
  }
  if (!boot)
    return (
      <main className="boot-message boot-loading" aria-busy="true">
        <img className="boot-logo" src="/brand/lunavi-logo-claro.svg" alt="LUNAVI" />
        <span className="boot-orbit" aria-hidden="true" />
        <p>{t("Loading LUNAVI…")}</p>
      </main>
    );
  return <Workspace boot={boot} lang={lang} onLang={onLang} />;
}

function Workspace({ boot, lang, onLang }: { boot: Boot; lang: Lang; onLang: (lang: Lang) => void }) {
  const { meta, targets, profiles, features, analogs } = boot;
  const [view, setView] = useState<View>("analogs");
  // The first preset opens by default, with results and no clicks (spec FR-W11).
  const [target, setTarget] = useState<Target>(targets[0]);
  const [profileId, setProfileId] = useState(target.default_profile);
  const profile = profiles.find((p) => p.id === profileId)!;
  // Beyond-Earth values leave the score by default, so the ranking rests on what Earth can imitate.
  const [beyond, setBeyond] = useState<BeyondMode>(meta.beyond_earth_mode ?? "exclude");
  const [avoid, setAvoid] = useState<RestrictionLevel[]>([]);
  const [newOnly, setNewOnly] = useState(false);
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
  const [mapLayer, setMapLayer] = useState<MapLayer>("score");
  const [resultTab, setResultTab] = useState<ResultTab>("list");
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [gaps, setGaps] = useState<Gaps | null>(null);

  // The search in plain words (spec FR-AI2). It only fills in the same state the controls hold.
  const [emphasis, setEmphasis] = useState<string | null>(null);
  const [previous, setPrevious] = useState<Snapshot | null>(null);
  const [asking, setAsking] = useState(false);
  const [askProblem, setAskProblem] = useState<"not_understood" | "failed" | null>(null);
  const [notApplied, setNotApplied] = useState<string[]>([]);
  const [fromQuestion, setFromQuestion] = useState<ReadonlySet<string>>(NO_PARTS);
  const [askRound, setAskRound] = useState(0);
  const [asked, setAsked] = useState(false);
  const [summary, setSummary] = useState<SummaryReply | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

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
    () => ({ target: target.id, profile: profileId, weights: debouncedWeights, bbox, terrain, minConfidence, beyond, avoid, newOnly }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [target.id, target.climate_status, profileId, debouncedWeights, bbox, terrain, minConfidence, beyond, avoid, newOnly],
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

  // The answer follows the search: it is written again a moment after the controls settle.
  useEffect(() => {
    const controller = new AbortController();
    setSummaryLoading(true);
    const timer = window.setTimeout(() => {
      api
        .summary(query, { emphasis, region: presetId, lang, minSeparationKm: TOP_SEPARATION_KM }, controller.signal)
        .then((reply) => {
          setSummary(reply);
          setSummaryLoading(false);
        })
        .catch((error: Error) => {
          if (error.name === "AbortError") return;
          // An API without /summary, or one that failed: the list still stands on its own.
          setSummary(null);
          setSummaryLoading(false);
        });
    }, SUMMARY_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, emphasis, presetId, lang]);

  // The portfolio and the gap map load only while their tab is open (spec FR-W13).
  useEffect(() => {
    if (resultTab !== "portfolio") {
      setPortfolio(null);
      return;
    }
    const controller = new AbortController();
    api
      .portfolio(query, controller.signal)
      .then(setPortfolio)
      .catch((error: Error) => {
        if (error.name !== "AbortError") setResultError(error.message);
      });
    return () => controller.abort();
  }, [resultTab, query]);

  useEffect(() => {
    if (resultTab !== "gaps") return;
    const controller = new AbortController();
    setGaps(null);
    api
      .gaps(target.id, controller.signal)
      .then(setGaps)
      .catch((error: Error) => {
        if (error.name !== "AbortError") setResultError(error.message);
      });
    return () => controller.abort();
  }, [resultTab, target.id, target.climate_status]);

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
      .cell(selected, { target: target.id, profile: profileId, weights: debouncedWeights, beyond }, controller.signal)
      .then(setSheet)
      .catch((error: Error) => {
        if (error.name !== "AbortError") setSheetError(t("Could not load this cell: {error}", { error: error.message }));
      });
    return () => controller.abort();
  }, [selected, target.id, target.climate_status, profileId, debouncedWeights, beyond]);

  // Stretch the color scale over the scores on screen, so differences stay visible.
  const range = useMemo<ScoreRange>(() => {
    // The API sorts by score, highest first.
    const scores = (cells?.score ?? []).filter((score) => score > 0);
    if (scores.length === 0) return { min: 0, max: 100 };
    return { min: scores[Math.floor((scores.length - 1) * COLOR_SCALE_FLOOR)], max: scores[0] };
  }, [cells]);

  const weights = customWeights ?? profile.weights;

  const snapshot = (): Snapshot => ({
    target,
    profileId,
    customWeights,
    emphasis,
    presetId,
    drawnBbox,
    terrain,
    minConfidence,
  });

  const restore = (saved: Snapshot) => {
    setTarget(saved.target);
    setProfileId(saved.profileId);
    setCustomWeights(saved.customWeights);
    setEmphasis(saved.emphasis);
    setPresetId(saved.presetId);
    setDrawnBbox(saved.drawnBbox);
    setTerrain(saved.terrain);
    setMinConfidence(saved.minConfidence);
    setSelected(null);
    setDrawing(false);
  };

  /** A change made by hand: remember the search before it, and drop the marks of the last question. */
  const byHand = (change: () => void) => {
    setPrevious(snapshot());
    setFromQuestion(NO_PARTS);
    setNotApplied([]);
    setAskProblem(null);
    change();
  };

  const chooseSite = (chosen: Target) => {
    setTarget(chosen);
    setProfileId(chosen.default_profile);
    setCustomWeights(null);
    setDebouncedWeights(null);
    setEmphasis(null);
    setSelected(null);
  };

  const chooseProfile = (id: string) => {
    const next = profiles.find((p) => p.id === id);
    if (!next) return;
    setProfileId(id);
    // A feature that is a gate in the new purpose cannot be stressed.
    const kept = emphasis !== null && !(emphasis in next.gates) ? emphasis : null;
    setEmphasis(kept);
    setCustomWeights(kept ? emphasized(next, kept) : null);
  };

  const chooseEmphasis = (key: string | null) => {
    setEmphasis(key);
    setCustomWeights(key ? emphasized(profile, key) : null);
  };

  const choosePreset = (id: string) => {
    if (id === "drawn") return;
    setPresetId(id);
    setDrawing(false);
  };

  const startOver = () => {
    setPrevious(snapshot());
    restore({
      target: targets[0],
      profileId: targets[0].default_profile,
      customWeights: null,
      emphasis: null,
      presetId: meta.region_presets[0]?.id ?? null,
      drawnBbox: null,
      terrain: [],
      minConfidence: 0,
    });
    setFromQuestion(NO_PARTS);
    setNotApplied([]);
    setAskProblem(null);
    setAskRound((round) => round + 1);
    setAsked(false);
  };

  const onAsk = async (text: string) => {
    setAsking(true);
    setAskProblem(null);
    setAsked(true);
    try {
      const reply = await api.ask(text, lang, {
        target: target.id,
        profile: profileId,
        emphasis,
        region: presetId,
        terrain,
        minConfidence,
      });
      if (!reply.understood || !reply.plan) {
        setAskProblem("not_understood");
        return;
      }
      const plan = reply.plan;
      const nextProfile = profiles.find((p) => p.id === plan.profile) ?? profile;
      const stressed = plan.emphasis !== null && !(plan.emphasis in nextProfile.gates) ? plan.emphasis : null;
      // A drawn area has no name the model could return, so it stays unless a region was asked for.
      const nextPreset = plan.region ?? (presetId === null ? null : (meta.region_presets[0]?.id ?? null));
      const parts = new Set<string>();
      if (plan.target.id !== target.id) parts.add("site");
      if (nextProfile.id !== profileId) parts.add("purpose");
      if (stressed !== null) parts.add("focus");
      if (nextPreset !== null && nextPreset !== meta.region_presets[0]?.id) parts.add("area");
      if (plan.terrain.length > 0) parts.add("terrain");
      if (parts.size === 0) parts.add("site");

      setPrevious(snapshot());
      setTarget(plan.target);
      setProfileId(nextProfile.id);
      setEmphasis(stressed);
      setCustomWeights(stressed ? emphasized(nextProfile, stressed) : null);
      setPresetId(nextPreset);
      setTerrain(plan.terrain);
      setMinConfidence(plan.min_confidence);
      setSelected(null);
      setDrawing(false);
      setFromQuestion(parts);
      setNotApplied(reply.not_applied);
    } catch {
      setAskProblem("failed");
    } finally {
      setAsking(false);
    }
  };

  const onChosen = useCallback((chosen: Target) => {
    setTarget(chosen);
    setProfileId(chosen.default_profile);
    setCustomWeights(null);
    setDebouncedWeights(null);
    setEmphasis(null);
    setFromQuestion(NO_PARTS);
    setNotApplied([]);
    setSelected(null);
    setView("analogs");
  }, []);

  // One-touch ways to refine the search, offered under the answer.
  const nextSteps: NextStep[] = [];
  if (terrain.length === 0) nextSteps.push({ label: "Only deserts", run: () => byHand(() => setTerrain(["arid"])) });
  if (bbox !== null) {
    nextSteps.push({ label: "Search the whole Earth", run: () => byHand(() => choosePreset(meta.region_presets[0].id)) });
  }
  if (emphasis !== "aridity" && features.some((f) => f.key === "aridity") && !("aridity" in profile.gates)) {
    nextSteps.push({ label: "Make it drier", run: () => byHand(() => chooseEmphasis("aridity")) });
  }
  if (profileId !== "landing_site" && profiles.some((p) => p.id === "landing_site")) {
    nextSteps.push({ label: "What about a landing site?", run: () => byHand(() => chooseProfile("landing_site")) });
  }

  const emphasisFeatures = features.filter(
    (feature) => !(feature.key in profile.gates) && feature.comparable_across_bodies !== false,
  );
  // The first places of the list get numbered pins, so the list and the map read together.
  const pins = useMemo(
    () => (resultTab === "portfolio" ? (portfolio?.cells ?? NO_CELLS) : resultTab === "list" ? top.slice(0, MAP_PINS) : NO_CELLS),
    [resultTab, portfolio, top],
  );

  const onDrawn = useCallback((drawn: Bbox) => {
    setDrawnBbox(drawn);
    setPresetId(null);
    setDrawing(false);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img className="brand-mark" src="/brand/lunavi-isotipo.svg" alt="" aria-hidden="true" />
          <span className="brand-name">LUNAVI</span>
          <span className="brand-sub">{t("Earth analogs of the Moon and Mars")}</span>
        </div>
        <nav aria-label={t("Views")}>
          <button
            className={`tab ${view === "analogs" || view === "picker" ? "active" : ""}`}
            aria-current={view === "analogs" || view === "picker" ? "page" : undefined}
            onClick={() => setView("analogs")}
          >
            {t("Find analogs")}
          </button>
          <button
            className={`tab ${view === "process" ? "active" : ""}`}
            aria-current={view === "process" ? "page" : undefined}
            onClick={() => setView("process")}
          >
            {t("Process")}
          </button>
          <button
            className={`tab ${view === "findings" ? "active" : ""}`}
            aria-current={view === "findings" ? "page" : undefined}
            onClick={() => setView("findings")}
          >
            {t("New findings")}
          </button>
          <button
            className={`tab ${view === "method" ? "active" : ""}`}
            aria-current={view === "method" ? "page" : undefined}
            onClick={() => setView("method")}
          >
            {t("Method")}
          </button>
        </nav>
        <div className={`data-badge ${meta.dummy ? "dummy" : ""}`} title={meta.region.name}>
          {meta.dummy ? t("Dummy data, not real results") : t("Prototype on open data")}
        </div>
        <div className="segmented lang-switch" role="group" aria-label={t("Language")}>
          {(["es", "en"] as const).map((option) => (
            <button
              key={option}
              className={lang === option ? "active" : ""}
              aria-pressed={lang === option}
              onClick={() => onLang(option)}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {resultError && <div className="error-banner">{t("Could not load results: {error}", { error: resultError })}</div>}

      <div className={`workspace ${view === "analogs" ? "" : "hidden"}`}>
        <aside className="panel side" aria-label={t("Search and results")}>
          {selected ? (
            <SiteSheet sheet={sheet} target={target} error={sheetError} onClose={() => setSelected(null)} />
          ) : (
            <div className="flex flex-col gap-5 p-5 print:p-0">
              {meta.ai?.available && (
                <AskBox
                  key={askRound}
                  busy={asking}
                  problem={askProblem}
                  showIdeas={!asked}
                  onAsk={onAsk}
                />
              )}
              <SearchSentence
                meta={meta}
                presets={targets}
                target={target}
                profiles={profiles}
                profile={profile}
                features={emphasisFeatures}
                emphasis={emphasis}
                customized={customWeights !== null}
                presetId={presetId}
                terrain={terrain}
                fromQuestion={fromQuestion}
                notApplied={notApplied}
                canUndo={previous !== null}
                onArea={(id) => byHand(() => choosePreset(id))}
                onSite={(id) => {
                  const preset = targets.find((item) => item.id === id);
                  if (preset && preset.id !== target.id) byHand(() => chooseSite(preset));
                }}
                onPickSite={() => setView("picker")}
                onProfile={(id) => byHand(() => chooseProfile(id))}
                onEmphasis={(key) => byHand(() => chooseEmphasis(key))}
                onTerrain={(next) => byHand(() => setTerrain(next))}
                onUndo={() => {
                  if (!previous) return;
                  restore(previous);
                  setPrevious(null);
                  setFromQuestion(NO_PARTS);
                  setNotApplied([]);
                  setAskProblem(null);
                }}
                onStartOver={startOver}
              />
              <Answer summary={summary} loading={summaryLoading} nextSteps={nextSteps.slice(0, 3)} />

              <Tabs value={resultTab} onValueChange={(value) => setResultTab(value as ResultTab)} className="flex flex-col gap-3">
                <TabsList className="print:hidden" aria-label={t("Results")}>
                  {RESULT_TABS.map(([id, label]) => (
                    <TabsTrigger key={id} value={id}>
                      {t(label)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="list">
                  <RankedList
                    cells={top}
                    features={features}
                    meta={resultMeta}
                    hovered={hovered}
                    pinned={MAP_PINS}
                    printTitle={t("Earth analogs of {site}, for {purpose}", { site: t(target.name), purpose: t(profile.label) })}
                    csvUrl={api.exportUrl(query, TOP_N, TOP_SEPARATION_KM)}
                    onSelect={setSelected}
                    onHover={setHovered}
                  />
                </TabsContent>
                <TabsContent value="portfolio" className="legacy-list">
                  <PortfolioList portfolio={portfolio} features={features} onSelect={setSelected} onHover={setHovered} />
                </TabsContent>
                <TabsContent value="gaps" className="legacy-list">
                  <GapTable gaps={gaps} features={features} />
                </TabsContent>
              </Tabs>

              <SearchSettings
                meta={meta}
                features={features}
                target={target}
                profile={profile}
                weights={weights}
                customized={customWeights !== null}
                beyondShare={resultMeta?.beyond_earth_weight_share ?? 0}
                beyond={beyond}
                excludedBeyond={resultMeta?.excluded_beyond_earth ?? []}
                avoid={avoid}
                onBeyond={setBeyond}
                onAvoid={setAvoid}
                newOnly={newOnly}
                onNewOnly={setNewOnly}
                presetId={presetId}
                terrain={terrain}
                minConfidence={minConfidence}
                drawing={drawing}
                onChangeSite={() => setView("picker")}
                onWeight={(key, value) => {
                  setEmphasis(null);
                  setCustomWeights({ ...weights, [key]: value });
                }}
                onResetWeights={() => chooseEmphasis(null)}
                onPreset={choosePreset}
                onToggleDraw={() => setDrawing((value) => !value)}
                onTerrain={setTerrain}
                onMinConfidence={setMinConfidence}
              />
            </div>
          )}
        </aside>

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
          layer={mapLayer}
          portfolio={pins}
          onLayer={setMapLayer}
          onSelect={setSelected}
          onHover={setHovered}
          onDrawn={onDrawn}
        />
      </div>

      {view === "picker" && (
        <SitePicker meta={meta} presets={targets} current={target} onChosen={onChosen} onCancel={() => setView("analogs")} />
      )}

      {view === "process" && (
        <main className="page-shell">
          <ProcessView
            target={target.id}
            profile={profileId}
            weights={debouncedWeights}
            beyond={beyond}
            onOpenCell={(cellId) => {
              setSelected(cellId);
              setView("analogs");
            }}
          />
        </main>
      )}

      {view === "findings" && (
        <main className="page-shell">
          <FindingsView
            targets={targets}
            profiles={profiles}
            features={features}
            onOpen={(targetId, cellId) => {
              const preset = targets.find((item) => item.id === targetId);
              if (preset && preset.id !== target.id) byHand(() => chooseSite(preset));
              setSelected(cellId);
              setView("analogs");
            }}
          />
        </main>
      )}

      {view === "method" && (
        <main className="page-shell">
          <MethodView meta={meta} features={features} profiles={profiles} />
        </main>
      )}

      <footer className="limits">{t(meta.limits_statement)}</footer>
    </div>
  );
}
