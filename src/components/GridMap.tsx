import L from "leaflet";
import { useEffect, useRef } from "react";

import type { Analog, Bbox, CompactCells, Meta } from "../api";
import { cellId } from "../api";
import { formatCoord, viridis } from "../format";

const GIBS_URL = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";
const MIN_HIGHLIGHT_PX = 12;
const FOCUS_ZOOM = 5;

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

/**
 * The grid drawn on one canvas, so the whole Earth stays interactive (spec section 9).
 * Highlights use a second canvas, so hovering never redraws tens of thousands of cells.
 */
class CellCanvas extends L.Layer {
  private cellsCanvas = L.DomUtil.create("canvas", "leaflet-zoom-hide cell-canvas");
  private highlightCanvas = L.DomUtil.create("canvas", "leaflet-zoom-hide cell-canvas");
  private leaflet: L.Map | null = null;
  cells: CompactCells | null = null;
  lookup = new Map<string, number>();
  range: ScoreRange = { min: 0, max: 100 };
  resolution = 0.5;
  selected: string | null = null;
  hovered: string | null = null;

  onAdd(map: L.Map) {
    this.leaflet = map;
    const pane = map.getPanes().overlayPane;
    pane.appendChild(this.cellsCanvas);
    pane.appendChild(this.highlightCanvas);
    map.on("moveend zoomend resize", this.draw, this);
    this.draw();
    return this;
  }

  onRemove(map: L.Map) {
    this.cellsCanvas.remove();
    this.highlightCanvas.remove();
    map.off("moveend zoomend resize", this.draw, this);
    this.leaflet = null;
    return this;
  }

  private prepare(canvas: HTMLCanvasElement, map: L.Map) {
    const size = map.getSize();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = size.x * ratio;
    canvas.height = size.y * ratio;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
    const context = canvas.getContext("2d");
    context?.scale(ratio, ratio);
    return context;
  }

  /** A pixel rectangle for a cell. Mercator x depends only on longitude and y only on latitude. */
  private projector(map: L.Map) {
    const half = this.resolution / 2;
    const xs = new Map<number, [number, number]>();
    const ys = new Map<number, [number, number]>();
    return (lat: number, lon: number) => {
      let x = xs.get(lon);
      if (!x) {
        x = [map.latLngToContainerPoint([0, lon - half]).x, map.latLngToContainerPoint([0, lon + half]).x];
        xs.set(lon, x);
      }
      let y = ys.get(lat);
      if (!y) {
        y = [map.latLngToContainerPoint([lat + half, 0]).y, map.latLngToContainerPoint([lat - half, 0]).y];
        ys.set(lat, y);
      }
      return { x: x[0], y: y[0], w: x[1] - x[0], h: y[1] - y[0] };
    };
  }

  draw() {
    const map = this.leaflet;
    if (!map) return;
    const context = this.prepare(this.cellsCanvas, map);
    if (context && this.cells) {
      const size = map.getSize();
      const box = this.projector(map);
      const { lat, lon, score, confidence } = this.cells;
      const spread = Math.max(this.range.max - this.range.min, 1);
      for (let i = 0; i < lat.length; i++) {
        const { x, y, w, h } = box(lat[i], lon[i]);
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
    }
    this.drawHighlights();
  }

  drawHighlights() {
    const map = this.leaflet;
    if (!map) return;
    const context = this.prepare(this.highlightCanvas, map);
    if (!context || !this.cells) return;
    const box = this.projector(map);
    for (const [id, color] of [
      [this.hovered, "#ffffff"],
      [this.selected, "#f2a65a"],
    ] as const) {
      const index = id ? this.lookup.get(id) : undefined;
      if (index === undefined) continue;
      const { x, y, w, h } = box(this.cells.lat[index], this.cells.lon[index]);
      // At low zoom a cell is a pixel or two, so keep the outline big enough to see.
      const width = Math.max(w, MIN_HIGHLIGHT_PX);
      const height = Math.max(h, MIN_HIGHLIGHT_PX);
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.strokeRect(x + w / 2 - width / 2, y + h / 2 - height / 2, width, height);
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

  // Create the map once.
  useEffect(() => {
    if (!element.current || mapRef.current) return;
    const map = L.map(element.current, {
      zoomControl: true,
      attributionControl: true,
      minZoom: 2,
      maxBounds: [
        [-85.05, -180],
        [85.05, 180],
      ],
      maxBoundsViscosity: 0.8,
    });
    L.tileLayer(`${GIBS_URL}/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg`, {
      attribution: 'Imagery: <a href="https://earthdata.nasa.gov/gibs">NASA GIBS</a>',
      maxNativeZoom: 8,
      maxZoom: 11,
      noWrap: true,
    }).addTo(map);
    const layer = new CellCanvas();
    layer.resolution = meta.grid_resolution_deg;
    layer.addTo(map);
    map.setView([15, 0], 2);
    mapRef.current = map;
    layerRef.current = layer;

    const cellAt = (event: L.LeafletMouseEvent) => {
      const res = meta.grid_resolution_deg;
      const lat = Math.round(event.latlng.lat / res) * res;
      const lon = Math.round(event.latlng.lng / res) * res;
      const id = cellId(lat, lon);
      return layerRef.current?.lookup.has(id) ? id : null;
    };

    map.on("mousemove", (event: L.LeafletMouseEvent) => {
      const id = cellAt(event);
      handlers.current.onHover(id);
      const tip = tipRef.current;
      const current = layerRef.current;
      if (!tip) return;
      if (id && current?.cells) {
        const index = current.lookup.get(id)!;
        const data = current.cells;
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
    // The grid resolution is fixed for the life of a results set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw every cell when the data changes.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    if (layer.cells !== cells) {
      layer.lookup = new Map((cells?.cell_id ?? []).map((id, index) => [id, index]));
      layer.cells = cells;
    }
    layer.range = range;
    layer.draw();
  }, [cells, range]);

  // Hovering and selecting only touch the highlight canvas.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.selected = selected;
    layer.hovered = hovered;
    layer.drawHighlights();
  }, [selected, hovered]);

  // Bring the selected cell into view, close enough to see it.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !selected || !cells) return;
    const index = layer.lookup.get(selected);
    if (index === undefined) return;
    const point = L.latLng(cells.lat[index], cells.lon[index]);
    if (map.getZoom() < FOCUS_ZOOM) map.flyTo(point, FOCUS_ZOOM, { duration: 0.6 });
    else if (!map.getBounds().contains(point)) map.panTo(point);
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
            radius: 4,
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

  // Show the active area, and fit the view to it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bbox) return;
    const [west, south, east, north] = bbox;
    const bounds = L.latLngBounds([south, west], [north, east]);
    const rectangle = L.rectangle(bounds, {
      color: "#f2a65a",
      weight: 1.5,
      fill: false,
      dashArray: "6 5",
      interactive: false,
    }).addTo(map);
    map.fitBounds(bounds);
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
