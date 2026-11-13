import type { Band } from "./api";

/** Viridis is colorblind-safe and stays readable on a projector (spec FR-W3). */
const VIRIDIS: [number, number, number][] = [
  [68, 1, 84],
  [72, 40, 120],
  [62, 74, 137],
  [49, 104, 142],
  [38, 130, 142],
  [31, 158, 137],
  [53, 183, 121],
  [109, 205, 89],
  [180, 222, 44],
  [253, 231, 37],
];

export function viridis(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const position = clamped * (VIRIDIS.length - 1);
  const lower = Math.floor(position);
  const upper = Math.min(VIRIDIS.length - 1, lower + 1);
  const mix = position - lower;
  const channel = (i: number) =>
    Math.round(VIRIDIS[lower][i] + (VIRIDIS[upper][i] - VIRIDIS[lower][i]) * mix);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

export function formatCoord(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns}, ${Math.abs(lon).toFixed(2)}°${ew}`;
}

export function formatValue(value: number | string | null | undefined, unit: string): string {
  if (value === null || value === undefined) return "no data yet";
  if (typeof value === "string") return value;
  const magnitude = Math.abs(value);
  const digits = magnitude >= 100 ? 0 : magnitude >= 10 ? 1 : 2;
  const text = value.toLocaleString("en-US", { maximumFractionDigits: digits });
  if (unit === "class" || unit === "NDVI") return text;
  if (unit === "deg") return `${text}°`;
  if (unit === "C") return `${text} °C`;
  return `${text} ${unit}`;
}

export const BAND_LABEL: Record<Band, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const TERRAIN_CHIPS = [
  { id: "arid", label: "Desert and arid" },
  { id: "polar", label: "Polar" },
  { id: "volcanic", label: "Volcanic" },
  { id: "other", label: "Other" },
];
