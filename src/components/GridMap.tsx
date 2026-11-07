import L from "leaflet";
import { useEffect, useRef } from "react";

import type { Analog, Bbox, CompactCells, Meta } from "../api";
import { cellId } from "../api";
import { formatCoord, viridis } from "../format";

const GIBS_URL = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";

export interface ScoreRange {
  min: number;
  max: number;
}

interface Props {
  meta: Meta;
  cells: CompactCells | null;
  range: ScoreRange;
  analogs: Analog[];
  selected: string | null;
  hovered: string | null;
  bbox: Bbox | null;
  drawing: boolean;
  visible: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onDrawn: (bbox: Bbox) => void;
}

/** A grid drawn on one canvas, so a global grid stays interactive (spec section 9). */
class CellCanvas extends L.Layer {
  private canvas = L.DomUtil.create("canvas", "leaflet-zoom-hide cell-canvas");
  private leaflet: L.Map | null = null;
  cells: CompactCells | null = null;
  range: ScoreRange = { min: 0, max: 100 };
  resolution = 0.25;
  selected: string | null = null;
  hovered: string | null = null;

  onAdd(map: L.Map) {
    this.leaflet = map;
    map.getPanes().overlayPane.appendChild(this.canvas);
    map.on("moveend zoomend resize", this.draw, this);
    this.draw();
    return this;
  }

  onRemove(map: L.Map) {
    this.canvas.remove();
    map.off("moveend zoomend resize", this.draw, this);
    this.leaflet = null;
    return this;
  }

  draw() {
    const map = this.leaflet;
    if (!map) return;
    const size = map.getSize();
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = size.x * ratio;
    this.canvas.height = size.y * ratio;
    this.canvas.style.width = `${size.x}px`;
    this.canvas.style.height = `${size.y}px`;
    L.DomUtil.setPosition(this.canvas, map.containerPointToLayerPoint([0, 0]));

    const context = this.canvas.getContext("2d");
    if (!context || !this.cells) return;
    context.scale(ratio, ratio);

    const half = this.resolution / 2;
    const { cell_id, lat, lon, score, confidence } = this.cells;
    const spread = Math.max(this.range.max - this.range.min, 1);
    const box = (index: number) => {
      const a = map.latLngToContainerPoint([lat[index] + half, lon[index] - half]);
      const b = map.latLngToContainerPoint([lat[index] - half, lon[index] + half]);
      return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
    };

    for (let i = 0; i < cell_id.length; i++) {
      const { x, y, w, h } = box(i);
      if (x > size.x || y > size.y || x + w < 0 || y + h < 0) continue;
      if (score[i] <= 0) {
        // Vetoed by the gate: visible, but clearly not a candidate.
        context.globalAlpha = 0.28;
        context.fillStyle = "#3b4350";
      } else {
        // Confidence as opacity (spec FR-W8).
        context.globalAlpha = 0.3 + 0.65 * confidence[i];
        context.fillStyle = viridis((score[i] - this.range.min) / spread);
      }
      context.fillRect(x, y, Math.ceil(w), Math.ceil(h));
    }

    context.globalAlpha = 1;
    for (const [id, color] of [
      [this.hovered, "#ffffff"],
      [this.selected, "#f2a65a"],
    ] as const) {
      if (!id) continue;
      const index = cell_id.indexOf(id);
      if (index < 0) continue;
      const { x, y, w, h } = box(index);
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.strokeRect(x, y, w, h);
    }
  }
}

export default function GridMap(props: Props) {
  const { meta, cells, range, analogs, selected, hovered, bbox, drawing, visible } = props;
  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<CellCanvas | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const handlers = useRef(props);
  handlers.current = props;
  const lookup = useRef(new Map<string, number>());

  // Create the map once.
  useEffect(() => {
    if (!element.current || mapRef.current) return;
    const map = L.map(element.current, { zoomControl: true, attributionControl: true, minZoom: 3 });
    L.tileLayer(`${GIBS_URL}/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg`, {
      attribution: 'Imagery: <a href="https://earthdata.nasa.gov/gibs">NASA GIBS</a>',
      maxNativeZoom: 8,
      maxZoom: 11,
    }).addTo(map);
    const layer = new CellCanvas();
    layer.resolution = meta.grid_resolution_deg;
    layer.addTo(map);
    // Place names sit above the grid, so a cell is easy to locate.
    const labels = map.createPane("labels");
    labels.style.zIndex = "450";
    labels.style.pointerEvents = "none";
    // These tiles are opaque black where there are no names. "screen" turns black transparent.
    labels.style.mixBlendMode = "screen";
    L.tileLayer(`${GIBS_URL}/Reference_Labels_15m/default/GoogleMapsCompatible_Level13/{z}/{y}/{x}.png`, {
      pane: "labels",
      maxNativeZoom: 13,
      maxZoom: 11,
    }).addTo(map);
    const { region } = meta;
    map.fitBounds([
      [region.lat_min, region.lon_min],
      [region.lat_max, region.lon_max],
    ]);
    mapRef.current = map;
    layerRef.current = layer;

    const cellAt = (event: L.LeafletMouseEvent) => {
      const res = meta.grid_resolution_deg;
      const lat = Math.round(event.latlng.lat / res) * res;
      const lon = Math.round(event.latlng.lng / res) * res;
      const id = cellId(lat, lon);
      return lookup.current.has(id) ? id : null;
    };

    map.on("mousemove", (event: L.LeafletMouseEvent) => {
      const id = cellAt(event);
      handlers.current.onHover(id);
      const tip = tipRef.current;
      const data = layerRef.current?.cells;
      if (!tip) return;
      if (id && data) {
        const index = lookup.current.get(id)!;
        tip.style.display = "block";
        tip.style.transform = `translate(${event.containerPoint.x + 14}px, ${event.containerPoint.y + 14}px)`;
        const vetoed = data.score[index] <= 0;
        tip.innerHTML =
          `<strong>${vetoed ? "Vegetation gate" : `Score ${data.score[index].toFixed(1)}`}</strong>` +
          `<span>${formatCoord(data.lat[index], data.lon[index])}</span>` +
          `<span>Confidence ${(data.confidence[index] * 100).toFixed(0)}%</span>`;
      } else {
        tip.style.display = "none";
      }
    });
    map.on("mouseout", () => {
      handlers.current.onHover(null);
      if (tipRef.current) tipRef.current.style.display = "none";
    });
    map.on("click", (event: L.LeafletMouseEvent) => {
      if (handlers.current.drawing) return;
      const id = cellAt(event);
      if (id) handlers.current.onSelect(id);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // The region and resolution are fixed for the life of a results set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw when the data or highlights change.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    if (layer.cells !== cells) {
      lookup.current = new Map((cells?.cell_id ?? []).map((id, index) => [id, index]));
    }
    layer.cells = cells;
    layer.range = range;
    layer.selected = selected;
    layer.hovered = hovered;
    layer.draw();
  }, [cells, range, selected, hovered]);

  // Keep the selected cell in view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected || !cells) return;
    const index = cells.cell_id.indexOf(selected);
    if (index < 0) return;
    const point = L.latLng(cells.lat[index], cells.lon[index]);
    if (!map.getBounds().contains(point)) map.panTo(point);
  }, [selected, cells]);

  // Known analog pins. Negative controls are not analogs, so they get no pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const group = L.layerGroup(
      analogs
        .filter((site) => site.role !== "negative_control")
        .map((site) =>
          L.circleMarker([site.lat, site.lon], {
            radius: 5,
            color: "#0d1117",
            weight: 1.5,
            fillColor: "#f2a65a",
            fillOpacity: 1,
          }).bindTooltip(site.name, { direction: "top", offset: [0, -4] }),
        ),
    ).addTo(map);
    return () => {
      group.remove();
    };
  }, [analogs]);

  // Show the active area.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bbox) return;
    const [west, south, east, north] = bbox;
    const rectangle = L.rectangle(
      [
        [south, west],
        [north, east],
      ],
      { color: "#f2a65a", weight: 1.5, fill: false, dashArray: "6 5", interactive: false },
    ).addTo(map);
    return () => {
      rectangle.remove();
    };
  }, [bbox]);

  // Drawn rectangle (spec FR-W7).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !drawing) return;
    map.dragging.disable();
    map.getContainer().style.cursor = "crosshair";
    let start: L.LatLng | null = null;
    let preview: L.Rectangle | null = null;
    const down = (event: L.LeafletMouseEvent) => {
      start = event.latlng;
    };
    const move = (event: L.LeafletMouseEvent) => {
      if (!start) return;
      const bounds = L.latLngBounds(start, event.latlng);
      if (preview) preview.setBounds(bounds);
      else preview = L.rectangle(bounds, { color: "#f2a65a", weight: 1.5, fillOpacity: 0.08 }).addTo(map);
    };
    const up = (event: L.LeafletMouseEvent) => {
      if (!start) return;
      const bounds = L.latLngBounds(start, event.latlng);
      start = null;
      preview?.remove();
      preview = null;
      if (bounds.getNorth() !== bounds.getSouth() && bounds.getEast() !== bounds.getWest()) {
        handlers.current.onDrawn([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]);
      }
    };
    map.on("mousedown", down);
    map.on("mousemove", move);
    map.on("mouseup", up);
    return () => {
      map.off("mousedown", down);
      map.off("mousemove", move);
      map.off("mouseup", up);
      preview?.remove();
      map.dragging.enable();
      map.getContainer().style.cursor = "";
    };
  }, [drawing]);

  // The map keeps its state while another view is open, and needs its size back on return.
  useEffect(() => {
    if (visible) mapRef.current?.invalidateSize();
  }, [visible]);

  return (
    <div className="map-shell">
      <div ref={element} className="map" role="application" aria-label="Map of Earth cells colored by analog score" />
      <div ref={tipRef} className="map-tip" />
      <div className="legend">
        <div className="legend-bar" />
        <div className="legend-scale">
          <span>{range.min.toFixed(0)}</span>
          <span>Score</span>
          <span>{range.max.toFixed(0)}</span>
        </div>
        <p>Brighter cells are more similar. Faint cells have lower confidence. Pins are documented analogs.</p>
      </div>
    </div>
  );
}
