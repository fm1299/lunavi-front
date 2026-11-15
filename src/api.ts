/** The web app talks only to the API (spec 3.1). These types mirror the data contract (spec 6). */

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type Basis = "measured" | "literature" | "physical";
export type Band = "high" | "medium" | "low";
export type Body = "moon" | "mars";
export type Weights = Record<string, number>;
export type Bbox = [number, number, number, number];

export interface TargetFeature {
  value: number | string | null;
  uncertainty: number | null;
  basis: Basis | null;
  source_url: string | null;
  note: string | null;
}

/** A Moon or Mars site: a preset, or a location chosen on the map. */
export interface Target {
  id: string;
  name: string;
  body: Body;
  lat: number;
  lon: number;
  description: string;
  coordinate_note: string | null;
  default_profile: string;
  features: Record<string, TargetFeature>;
  climate_status: "ready" | "pending" | "unavailable";
  beyond_earth: string[];
}

export interface Profile {
  id: string;
  label: string;
  weights: Weights;
  gates: Record<string, number>;
  test_tags: string[];
}

export interface Feature {
  key: string;
  label: string;
  unit: string;
  type: "numeric" | "categorical";
  direction: string;
  lo: number | null;
  hi: number | null;
  source_quality: number;
  resolution_factor: number;
  source_name: string;
  source_url: string | null;
  license: string | null;
  note: string | null;
  /** False when each body measures the value from its own zero, such as elevation. */
  comparable_across_bodies?: boolean;
}

export interface Meta {
  dummy: boolean;
  generated_at: string;
  grid_resolution_deg: number;
  land_cells: number;
  region: { id: string; name: string; lat_min: number; lat_max: number; lon_min: number; lon_max: number };
  region_presets: { id: string; name: string; bbox: Bbox }[];
  site_window_km: number;
  confidence_bands: { high: number; medium: number };
  limits_statement: string;
  /** Missing from an API built before the search in plain words (spec FR-AI2). */
  ai?: { available: boolean; provider: string | null; model: string | null };
}

export interface Analog {
  id: string;
  name: string;
  lat: number;
  lon: number;
  role: "positive_control" | "catalog_only" | "negative_control";
  citation_status: "verified" | "to_verify";
  source_ref: string | null;
}

export interface ResultMeta {
  target: string;
  profile: string;
  weights: Weights;
  gates: Record<string, number>;
  count: number;
  eligible_cells: number;
  grid_resolution_deg: number;
  beyond_earth: string[];
  beyond_earth_weight_share: number;
  dummy: boolean;
}

export interface CompactCells {
  cell_id: string[];
  lat: number[];
  lon: number[];
  score: number[];
  confidence: number[];
  /** Null in an Earth table built before the access layer existed. */
  access: (number | null)[];
}

export interface FullCell {
  cell_id: string;
  lat: number;
  lon: number;
  country: string | null;
  terrain: string[];
  score: number;
  confidence: number;
  band: Band;
  access: number | null;
  road_km: number | null;
  airport_km: number | null;
  /** The weighted features this cell matches best and worst. Missing from an older API. */
  closest_matches?: string[];
  weakest_matches?: string[];
}

/** What a request in plain words turned into: the same settings the controls hold. */
export interface AskPlan {
  target: Target;
  profile: string;
  emphasis: string | null;
  region: string | null;
  terrain: string[];
  min_confidence: number;
}

export interface AskReply {
  understood: boolean;
  plan: AskPlan | null;
  not_applied: string[];
  model: string | null;
}

/** The search as it stands, so a request such as "now only deserts" can build on it. */
export interface CurrentSearch {
  target: string;
  profile: string;
  emphasis: string | null;
  region: string | null;
  terrain: string[];
  minConfidence: number;
}

export interface SummaryFacts {
  site: string;
  body: Body;
  purpose: string;
  region: string | null;
  terrain_filter: string[];
  cells_compared: number;
  emphasis: { feature: string; site_value: number | string | null; unit: string; beyond_earth_range: boolean } | null;
  beyond_earth_features: string[];
  top: {
    rank: number;
    country: string | null;
    lat: number;
    lon: number;
    score: number;
    confidence: Band;
    closest_matches: string[];
    weakest_matches: string[];
  }[];
}

/** text is null when no model wrote it; the app then writes its own sentence from the facts. */
export interface SummaryReply {
  text: string | null;
  source: "ai" | "template";
  model: string | null;
  facts: SummaryFacts;
}

export interface Portfolio {
  threshold: number;
  cells: (FullCell & { covers: string[] })[];
  conditions: string[];
  uncovered: string[];
}

export interface Gaps {
  threshold: number;
  analogs_compared: number;
  conditions: {
    key: string;
    label: string;
    target_value: number | string | null;
    beyond_earth: boolean;
    covered: boolean | null;
    best_analog: string | null;
    best_s: number | null;
    covered_by: string[];
  }[];
}

export interface BreakdownRow {
  key: string;
  label: string;
  unit: string;
  weight: number;
  gate: number | null;
  s: number | null;
  q: number | null;
  cell_value: number | string | null;
  target_value: number | string | null;
  target_basis: Basis | null;
  target_source_url: string | null;
  target_note: string | null;
  beyond_earth: boolean;
  cell_z: number | null;
  target_z: number | null;
  source_name: string;
  source_url: string | null;
  note: string | null;
}

export interface CellSheet extends FullCell {
  target: string;
  profile: string;
  breakdown: BreakdownRow[];
  closest_matches: string[];
  weakest_matches: string[];
  beyond_earth_weight_share: number;
  missing_features: string[];
  test_tags: string[];
  eligible: boolean;
}

/** One feature through steps 2 to 5: Earth data, site value, common scale and similarity. */
export interface ProcessFeature {
  key: string;
  label: string;
  unit: string;
  type: "numeric" | "categorical";
  source_name: string;
  source_url: string | null;
  has_source: boolean;
  cells_with_data: number | null;
  share_with_data: number | null;
  lo: number | null;
  hi: number | null;
  earth_p1: number | null;
  earth_p99: number | null;
  site_value: number | string | null;
  site_basis: Basis | null;
  site_source_url: string | null;
  site_z: number | null;
  beyond_earth: boolean;
  weight: number;
  gate: number | null;
  /** Among eligible cells: the median similarity, and the share at or above the cover threshold. */
  s_median: number | null;
  s_close_share: number | null;
}

export interface ProcessExampleRow {
  key: string;
  label: string;
  unit: string;
  weight: number;
  gate: number | null;
  s: number | null;
  q: number | null;
  cell_value: number | string | null;
  site_value: number | string | null;
  cell_z: number | null;
  site_z: number | null;
  beyond_earth: boolean;
  weighted: number | null;
  passes_gate: boolean | null;
}

export type FunnelStage =
  | "land_cells"
  | "after_masks"
  | "after_gates"
  | "medium_confidence_or_better"
  | "new"
  | "candidates"
  | "findings";

export interface ControlRow {
  id: string;
  name: string;
  comparable: boolean;
  score: number | null;
  top_share: number | null;
  passes?: boolean;
  in_lower_half?: boolean;
}

/** How LUNAVI reaches its analogs for one site, step by step (GET /process). */
export interface ProcessReport {
  target: { id: string; name: string; body: Body; lat: number; lon: number };
  profile: { id: string; label: string };
  weights: Weights;
  gates: Record<string, number>;
  dummy: boolean;
  generated_at: string;
  grid: { resolution_deg: number; land_cells: number; countries: number; min_land_fraction: number };
  site_window_km: number;
  target_quality: Record<Basis, number>;
  features: ProcessFeature[];
  terrain: {
    eligible: number;
    by_class: Record<string, number>;
    arid_precip_mm: number;
    polar_lat_deg: number;
    volcano_distance_km: number;
    max_glaciated_fraction: number;
    exceptions: string[];
    caves_tagged: number;
  };
  score: {
    vetoed: number;
    after_gates: number;
    above_zero: number;
    p50: number | null;
    p90: number | null;
    p99: number | null;
    max: number | null;
  };
  confidence: { bands: { high: number; medium: number }; high: number; medium: number; low: number };
  novelty: { catalog_size: number; known_km: number; new_km: number; known: number; near_known: number; new: number };
  candidates: {
    top_share: number;
    score_cut: number;
    cells: number;
    regions: number;
    top_regions: {
      cell_id: string;
      lat: number;
      lon: number;
      country: string | null;
      cells: number;
      score: number;
      confidence: number;
      nearest_known_km: number;
    }[];
  };
  /** Null for a location chosen on the map: only the presets have reviewed findings. */
  findings: {
    profile: string;
    count: number;
    by_result: Record<string, number>;
    items: { id: string; name: string; lat: number; lon: number; cell_id: string; score: number | null; band: Band | null; status: string }[];
  } | null;
  /** Null for a location chosen on the map: the controls are assigned to the presets. */
  validation: {
    profile: string;
    accept_top_share: number;
    stretch_top_share: number;
    positive_controls: ControlRow[];
    negative_controls: ControlRow[];
    positives_passed: number;
    positives_compared: number;
    negatives_low: number;
    negatives_compared: number;
    lowest_top_overlap: number | null;
  } | null;
  funnel: { stage: FunnelStage; count: number | null }[];
  /** The best cell worked out term by term. Null when no cell scores above 0. */
  example: {
    cell_id: string;
    lat: number;
    lon: number;
    country: string | null;
    terrain: string[];
    rows: ProcessExampleRow[];
    weight_sum: number;
    weighted_sum: number;
    score: number;
    mean_quality: number | null;
    available_share: number | null;
    confidence: number;
    band: Band;
    closest_matches: string[];
    weakest_matches: string[];
  } | null;
}

export interface Query {
  target: string;
  profile: string;
  weights: Weights | null;
  bbox: Bbox | null;
  terrain: string[];
  minConfidence: number;
}

async function get<T>(path: string, params?: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const query = params && params.size ? `?${params}` : "";
  const response = await fetch(`${API_URL}${path}${query}`, { signal });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

function weightsParam(weights: Weights): string {
  return Object.entries(weights)
    .map(([key, value]) => `${key}:${value}`)
    .join(",");
}

function resultParams(query: Query): URLSearchParams {
  const params = new URLSearchParams({ target: query.target, profile: query.profile });
  if (query.weights) params.set("weights", weightsParam(query.weights));
  if (query.bbox) params.set("bbox", query.bbox.join(","));
  if (query.terrain.length) params.set("terrain", query.terrain.join(","));
  if (query.minConfidence > 0) params.set("min_confidence", String(query.minConfidence));
  return params;
}

export const api = {
  meta: () => get<Meta>("/meta"),
  targets: () => get<Target[]>("/targets"),
  profiles: () => get<Profile[]>("/profiles"),
  features: () => get<Feature[]>("/features"),
  analogs: () => get<Analog[]>("/analogs"),
  resolveSite: (body: Body, lat: number, lon: number) =>
    get<Target>("/sites/resolve", new URLSearchParams({ body, lat: String(lat), lon: String(lon) })),
  siteClimate: (id: string) => get<Target>(`/sites/${id}/climate`),
  map: (query: Query, signal?: AbortSignal) =>
    get<{ meta: ResultMeta; cells: CompactCells }>("/results", resultParams(query), signal),
  /** The best cells, spaced apart so the list shows distinct places. */
  top: (query: Query, topN: number, minSeparationKm: number, signal?: AbortSignal) => {
    const params = resultParams(query);
    params.set("detail", "full");
    params.set("top_n", String(topN));
    params.set("min_separation_km", String(minSeparationKm));
    return get<{ meta: ResultMeta; cells: FullCell[] }>("/results", params, signal);
  },
  /** A link to the same list as a CSV file (spec FR-W12). */
  exportUrl: (query: Query, topN: number, minSeparationKm: number) => {
    const params = resultParams(query);
    params.set("format", "csv");
    params.set("top_n", String(topN));
    params.set("min_separation_km", String(minSeparationKm));
    return `${API_URL}/export?${params}`;
  },
  /** Turn a request in plain words into search settings (spec FR-AI2). */
  ask: (text: string, lang: string, current: CurrentSearch) => {
    const params = new URLSearchParams({ text, lang, target: current.target, profile: current.profile });
    if (current.emphasis) params.set("emphasis", current.emphasis);
    if (current.region) params.set("region", current.region);
    if (current.terrain.length) params.set("terrain", current.terrain.join(","));
    if (current.minConfidence > 0) params.set("min_confidence", String(current.minConfidence));
    return get<AskReply>("/ask", params);
  },
  /** A short answer about the best results, written from their numbers. */
  summary: (
    query: Query,
    extras: { emphasis: string | null; region: string | null; lang: string; minSeparationKm: number },
    signal?: AbortSignal,
  ) => {
    const params = resultParams(query);
    params.set("lang", extras.lang);
    params.set("min_separation_km", String(extras.minSeparationKm));
    if (extras.emphasis) params.set("emphasis", extras.emphasis);
    if (extras.region) params.set("region", extras.region);
    return get<SummaryReply>("/summary", params, signal);
  },
  portfolio: (query: Query, signal?: AbortSignal) => get<Portfolio>("/portfolio", resultParams(query), signal),
  gaps: (target: string, signal?: AbortSignal) => get<Gaps>("/gaps", new URLSearchParams({ target }), signal),
  /** The search process step by step, for the current site, purpose and weights. */
  process: (query: Pick<Query, "target" | "profile" | "weights">, signal?: AbortSignal) => {
    const params = new URLSearchParams({ target: query.target, profile: query.profile });
    if (query.weights) params.set("weights", weightsParam(query.weights));
    return get<ProcessReport>("/process", params, signal);
  },
  cell: (cellId: string, query: Pick<Query, "target" | "profile" | "weights">, signal?: AbortSignal) => {
    const params = new URLSearchParams({ target: query.target, profile: query.profile });
    if (query.weights) params.set("weights", weightsParam(query.weights));
    return get<CellSheet>(`/cells/${cellId}`, params, signal);
  },
};

/** Mirrors pipeline.grid.cell_id, so the map can find the cell under the cursor. */
export function cellId(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  const latPart = String(Math.round(Math.abs(lat) * 100)).padStart(4, "0");
  const lonPart = String(Math.round(Math.abs(lon) * 100)).padStart(5, "0");
  return `${ns}${latPart}_${ew}${lonPart}`;
}
