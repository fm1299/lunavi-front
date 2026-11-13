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
