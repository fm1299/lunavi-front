import L from "leaflet";
import { useEffect, useRef, useState } from "react";

import type { Body, Meta, Target } from "../api";
import { api } from "../api";
import { formatCoord } from "../format";

interface Props {
  meta: Meta;
  presets: Target[];
  current: Target;
  onChosen: (target: Target) => void;
  onCancel: () => void;
}

const BODY_LABEL: Record<Body, string> = { moon: "Moon", mars: "Mars" };

/** NASA Trek maps, in the equirectangular tile layout that Leaflet calls EPSG4326. */
const TREK_TILES: Record<Body, string> = {
  moon: "https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",
  mars: "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",
};

const READ_HINT: Record<Body, string> = {
  moon: "Reading LOLA elevation and Diviner temperature. This can take up to half a minute the first time.",
  mars: "Reading MOLA elevation. Temperature follows from the Mars Climate Database.",
};

function clampCoordinate(value: string, limit: number): number | null {
  const parsed = Number(value);
  if (value.trim() === "" || Number.isNaN(parsed) || Math.abs(parsed) > limit) return null;
  return parsed;
}

export default function SitePicker({ meta, presets, current, onChosen, onCancel }: Props) {
  const [body, setBody] = useState<Body>(current.body);
  const [lat, setLat] = useState(String(current.lat));
  const [lon, setLon] = useState(String(current.lon));
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  const latValue = clampCoordinate(lat, 90);
  const lonValue = clampCoordinate(lon, 180);
  const valid = latValue !== null && lonValue !== null;

  useEffect(() => {
    if (!element.current || mapRef.current) return;
    const map = L.map(element.current, {
      crs: L.CRS.EPSG4326,
      minZoom: 1,
      maxZoom: 9,
      maxBounds: [
        [-90, -180],
        [90, 180],
      ],
      maxBoundsViscosity: 0.8,
    }).setView([0, 0], 1);
    map.on("click", (event: L.LeafletMouseEvent) => {
      setLat(event.latlng.lat.toFixed(2));
      setLon(event.latlng.lng.toFixed(2));
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      tilesRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    tilesRef.current?.remove();
    tilesRef.current = L.tileLayer(TREK_TILES[body], {
      attribution: 'Imagery: <a href="https://trek.nasa.gov/">NASA Trek</a>',
      maxNativeZoom: 7,
      maxZoom: 9,
      noWrap: true,
      bounds: [
        [-90, -180],
        [90, 180],
      ],
    }).addTo(map);
  }, [body]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!valid) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const point = L.latLng(latValue, lonValue);
    if (markerRef.current) {
      markerRef.current.setLatLng(point);
    } else {
      markerRef.current = L.circleMarker(point, {
        radius: 8,
        color: "#0d1117",
        weight: 2,
        fillColor: "#f2a65a",
        fillOpacity: 1,
      }).addTo(map);
    }
  }, [latValue, lonValue, valid]);

  const find = async () => {
    if (!valid) return;
    setReading(true);
    setError(null);
    try {
      onChosen(await api.resolveSite(body, latValue, lonValue));
    } catch (failure) {
      setError(`Could not read this location: ${(failure as Error).message}`);
      setReading(false);
    }
  };

  return (
    <div className="picker">
      <aside className="panel picker-panel" aria-label="Choose a site">
        <section>
          <div className="section-row">
            <h1 className="picker-title">Choose a site</h1>
            <button className="link-button" onClick={onCancel}>
              Cancel
            </button>
          </div>
          <p className="hint">
            Click anywhere on the map or type coordinates. LUNAVI reads about {meta.site_window_km} km around that point,
            then ranks every Earth cell against it.
          </p>
          <div className="segmented" role="group" aria-label="Body">
            {(["moon", "mars"] as const).map((option) => (
              <button
                key={option}
                className={body === option ? "active" : ""}
                aria-pressed={body === option}
                onClick={() => setBody(option)}
              >
                {BODY_LABEL[option]}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="coordinate-grid">
            <label>
              <span className="field-label">Latitude</span>
              <input
                value={lat}
                inputMode="decimal"
                aria-invalid={latValue === null}
                onChange={(e) => setLat(e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Longitude</span>
              <input
                value={lon}
                inputMode="decimal"
                aria-invalid={lonValue === null}
                onChange={(e) => setLon(e.target.value)}
              />
            </label>
          </div>
          {!valid && <p className="warning">Latitude runs from -90 to 90, and longitude from -180 to 180.</p>}
          {valid && <p className="hint">{formatCoord(latValue, lonValue)}, east positive</p>}
          <button className="button primary" disabled={!valid || reading} onClick={find}>
            {reading ? "Reading this location…" : "Find Earth analogs"}
          </button>
          {reading && <p className="hint">{READ_HINT[body]}</p>}
          {error && <p className="warning">{error}</p>}
        </section>

        <section>
          <h2 className="field-label">Or start from a preset</h2>
          <ul className="preset-list">
            {presets
              .filter((preset) => preset.body === body)
              .map((preset) => (
                <li key={preset.id}>
                  <button className="preset" onClick={() => onChosen(preset)}>
                    <strong>{preset.name}</strong>
                    <span>{formatCoord(preset.lat, preset.lon)}</span>
                  </button>
                </li>
              ))}
          </ul>
        </section>
      </aside>
      <div className="map-shell">
        <div ref={element} className="map" role="application" aria-label={`Map of the ${BODY_LABEL[body]}`} />
      </div>
    </div>
  );
}
