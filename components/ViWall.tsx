"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, Maximize2, Loader2 } from "lucide-react";
import { generateViTiles } from "@/lib/vi-mask";
import { sampleGradient, scaleBrightness, lighten, rgbString, type RGB } from "@/lib/gradient";
import { track } from "@/lib/analytics";
import { TilePopup } from "./TilePopup";
import type { OccupiedTile, ReservedTile } from "@/lib/types";

interface WallData {
  cols: number;
  rows: number;
  capacity: number;
  tiles: OccupiedTile[];
  reserved: ReservedTile[];
}

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 9;

type WallMode = "view" | "select";

/**
 * Canvas-rendered VI wall with one continuous sunset gradient.
 *
 * Each tile samples its colour from its vertical position in the whole VI, so
 * the silhouette reads as a single piece of artwork. Ownership never changes
 * the colour: available tiles are the same gradient shown muted, occupied tiles
 * are the gradient at full strength with a subtle light border. In "select"
 * mode the user picks their own available block.
 */
export function ViWall({
  highlightTile,
  compact = false,
  mode = "view",
  selectedTile = null,
  onSelectTile,
}: {
  highlightTile?: number | null;
  compact?: boolean;
  mode?: WallMode;
  selectedTile?: number | null;
  onSelectTile?: (tileIndex: number, pos: { x: number; y: number }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<WallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OccupiedTile | null>(null);
  const [hover, setHover] = useState<{ label: string; px: number; py: number } | null>(null);

  const viewRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const cols = data?.cols ?? 132;
  const rows = data?.rows ?? 82;

  const tiles = useMemo(() => generateViTiles(cols, rows), [cols, rows]);

  // precompute each tile's base gradient colour once (by vertical position)
  const baseColors = useMemo<RGB[]>(
    () => tiles.map((t) => sampleGradient(t.ny)),
    [tiles]
  );

  const posIndex = useMemo(() => {
    const m = new Map<string, number>();
    tiles.forEach((t) => m.set(`${t.col},${t.row}`, t.index));
    return m;
  }, [tiles]);

  const occupied = useMemo(() => {
    const m = new Map<number, OccupiedTile>();
    data?.tiles.forEach((t) => m.set(t.tileIndex, t));
    return m;
  }, [data]);

  const reservedSet = useMemo(() => {
    const s = new Set<number>();
    data?.reserved.forEach((t) => s.add(t.tileIndex));
    return s;
  }, [data]);

  const tileByIndex = useMemo(() => {
    const m = new Map<number, { col: number; row: number }>();
    tiles.forEach((t) => m.set(t.index, { col: t.col, row: t.row }));
    return m;
  }, [tiles]);

  const load = useCallback(() => {
    fetch("/api/wall")
      .then((r) => r.json())
      .then((d: WallData) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    track("wall_view", { mode });
  }, [load, mode]);

  // refresh occupancy periodically so the wall stays current during a session
  useEffect(() => {
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [load]);

  const hoverIndexRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const { zoom, panX, panY } = viewRef.current;
    const fit = Math.min(cw / cols, ch / rows);
    const tilePx = fit * zoom;
    const originX = (cw - cols * tilePx) / 2 + panX;
    const originY = (ch - rows * tilePx) / 2 + panY;
    const gap = tilePx > 6 ? Math.max(0.5, tilePx * 0.1) : 0;
    const size = tilePx - gap;
    const radius = Math.min(size * 0.26, 3);

    for (const t of tiles) {
      const x = originX + t.col * tilePx;
      const y = originY + t.row * tilePx;
      if (x + tilePx < 0 || x > cw || y + tilePx < 0 || y > ch) continue;

      const base = baseColors[t.index];
      const occ = occupied.get(t.index);
      const isReserved = reservedSet.has(t.index);
      const isHover = hoverIndexRef.current === t.index;

      ctx.beginPath();
      roundRect(ctx, x, y, size, size, radius);

      if (occ) {
        // occupied: full gradient colour + subtle light ownership border
        ctx.fillStyle = rgbString(base);
        ctx.fill();
        if (tilePx > 7) {
          ctx.lineWidth = Math.max(0.6, tilePx * 0.08);
          ctx.strokeStyle = rgbString(lighten(base, 0.55), 0.9);
          ctx.stroke();
        }
      } else if (isReserved) {
        // reserved mid-claim: muted gradient + amber ring
        ctx.fillStyle = rgbString(scaleBrightness(base, 0.5));
        ctx.fill();
        ctx.lineWidth = Math.max(0.6, tilePx * 0.09);
        ctx.strokeStyle = "rgba(251,191,36,0.8)";
        ctx.stroke();
      } else {
        // available: same gradient, muted; brighter on hover / in select mode
        const factor = isHover ? 0.82 : mode === "select" ? 0.5 : 0.42;
        ctx.fillStyle = rgbString(scaleBrightness(base, factor));
        ctx.fill();
        if (isHover) {
          ctx.lineWidth = Math.max(0.6, tilePx * 0.1);
          ctx.strokeStyle = "rgba(255,255,255,0.85)";
          ctx.stroke();
        }
      }
    }

    // selected tile (select mode) — bright ring + glow
    const ringFor = (idx: number, color: string, glow: string) => {
      const pos = tileByIndex.get(idx);
      if (!pos) return;
      const x = originX + pos.col * tilePx;
      const y = originY + pos.row * tilePx;
      ctx.beginPath();
      roundRect(ctx, x - 2, y - 2, size + 4, size + 4, radius + 2);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    if (selectedTile != null) ringFor(selectedTile, "#ffffff", "#fbbf24");
    if (highlightTile != null) ringFor(highlightTile, "#f472b6", "#ec4899");
  }, [cols, rows, tiles, baseColors, occupied, reservedSet, mode, selectedTile, highlightTile, tileByIndex]);

  useEffect(() => {
    draw();
  });

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  // center on highlighted or selected tile when it changes
  const focusTile = highlightTile ?? null;
  useEffect(() => {
    if (focusTile == null) return;
    const wrap = wrapRef.current;
    const pos = tileByIndex.get(focusTile);
    if (!wrap || !pos) return;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    const targetZoom = Math.max(viewRef.current.zoom, 3);
    const fit = Math.min(cw / cols, ch / rows);
    const tilePx = fit * targetZoom;
    viewRef.current.zoom = targetZoom;
    viewRef.current.panX = cw / 2 - (originBase(cols, tilePx, cw) + pos.col * tilePx + tilePx / 2);
    viewRef.current.panY = ch / 2 - (originBase(rows, tilePx, ch) + pos.row * tilePx + tilePx / 2);
    rerender();
  }, [focusTile, cols, rows, tileByIndex]);

  const dragRef = useRef<{ active: boolean; moved: boolean; x: number; y: number }>({
    active: false, moved: false, x: 0, y: 0,
  });

  const hitTest = (clientX: number, clientY: number): number | null => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const rect = wrap.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const { zoom, panX, panY } = viewRef.current;
    const fit = Math.min(rect.width / cols, rect.height / rows);
    const tilePx = fit * zoom;
    const originX = (rect.width - cols * tilePx) / 2 + panX;
    const originY = (rect.height - rows * tilePx) / 2 + panY;
    const col = Math.floor((mx - originX) / tilePx);
    const row = Math.floor((my - originY) / tilePx);
    return posIndex.get(`${col},${row}`) ?? null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { active: true, moved: false, x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d.active) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
      viewRef.current.panX += dx;
      viewRef.current.panY += dy;
      d.x = e.clientX;
      d.y = e.clientY;
      setHover(null);
      hoverIndexRef.current = null;
      draw();
      return;
    }
    const wrap = wrapRef.current!;
    const rect = wrap.getBoundingClientRect();
    const idx = hitTest(e.clientX, e.clientY);
    hoverIndexRef.current = idx;
    if (idx == null) {
      setHover(null);
    } else {
      const occ = occupied.get(idx);
      const label = occ
        ? `${occ.username} · ${occ.countryIso}`
        : reservedSet.has(idx)
          ? `Block #${idx} · reserved`
          : `Block #${idx} · available`;
      setHover({ label, px: e.clientX - rect.left, py: e.clientY - rect.top });
    }
    draw();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d.active && !d.moved) {
      const idx = hitTest(e.clientX, e.clientY);
      if (idx != null) {
        const occ = occupied.get(idx);
        if (mode === "select") {
          if (!occ && !reservedSet.has(idx)) {
            const pos = tileByIndex.get(idx)!;
            onSelectTile?.(idx, { x: pos.col, y: pos.row });
            track("country_selected", { kind: "tile_select" });
          }
        } else if (occ) {
          setSelected(occ);
          track("player_tile_click", { country: occ.countryIso });
        }
      }
    }
    dragRef.current.active = false;
  };

  const zoomBy = (factor: number) => {
    viewRef.current.zoom = clamp(viewRef.current.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    track("wall_zoom", { zoom: Math.round(viewRef.current.zoom * 10) / 10 });
    rerender();
  };
  const resetView = () => {
    viewRef.current = { zoom: 1, panX: 0, panY: 0 };
    rerender();
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.12 : 0.89);
  };

  const pinchRef = useRef<number | null>(null);
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (pinchRef.current != null) zoomBy(dist / pinchRef.current > 1 ? 1.03 : 0.97);
      pinchRef.current = dist;
    }
  };
  const onTouchEnd = () => {
    pinchRef.current = null;
  };

  return (
    <div className="relative">
      <div
        ref={wrapRef}
        className={`relative w-full touch-none select-none overflow-hidden rounded-2xl border border-white/10 bg-[#0a0518] ${
          compact ? "h-[340px]" : "h-[clamp(380px,64vh,680px)]"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          setHover(null);
          hoverIndexRef.current = null;
        }}
        onWheel={onWheel}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ cursor: dragRef.current.active ? "grabbing" : mode === "select" ? "crosshair" : "grab" }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />

        {loading && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <Loader2 className="animate-spin text-neon-violet" />
          </div>
        )}

        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg glass-strong px-3 py-1.5 text-xs font-semibold text-ink"
            style={{ left: hover.px, top: hover.py - 8 }}
          >
            {hover.label}
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
          <ControlBtn label="Zoom in" onClick={() => zoomBy(1.3)}><Plus size={18} /></ControlBtn>
          <ControlBtn label="Zoom out" onClick={() => zoomBy(0.77)}><Minus size={18} /></ControlBtn>
          <ControlBtn label="Reset view" onClick={resetView}><Maximize2 size={16} /></ControlBtn>
        </div>

        <div className="pointer-events-none absolute left-3 top-3 rounded-lg glass px-2.5 py-1 text-[11px] font-semibold text-ink-dim">
          {mode === "select"
            ? "Tap an available block to choose your place"
            : "Drag to pan · scroll / pinch to zoom · tap a block"}
        </div>
      </div>

      {selected && <TilePopup tile={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ControlBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-lg glass-strong text-ink transition-colors hover:text-neon-pink"
    >
      {children}
    </button>
  );
}

// ---- helpers ---------------------------------------------------------------
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function originBase(count: number, tilePx: number, canvasDim: number) {
  return (canvasDim - count * tilePx) / 2;
}
