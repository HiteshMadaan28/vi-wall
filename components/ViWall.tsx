"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, Maximize2, Loader2 } from "lucide-react";
import { generateViTiles } from "@/lib/vi-mask";
import { accentFor } from "@/lib/countries";
import { track } from "@/lib/analytics";
import type { OccupiedTile } from "@/lib/types";
import { TilePopup } from "./TilePopup";

interface WallData {
  cols: number;
  rows: number;
  capacity: number;
  tiles: OccupiedTile[];
}

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 8;

/**
 * Canvas-rendered VI wall.
 *
 * Every tile position is generated deterministically on the client, so the VI
 * silhouette renders immediately (even with zero claims). Only occupied tiles
 * come from the API. Drawing thousands of tiles on a single <canvas> keeps the
 * DOM tiny and the interaction smooth — no thousands of React nodes.
 */
export function ViWall({
  highlightTile,
  compact = false,
}: {
  highlightTile?: number | null;
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<WallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OccupiedTile | null>(null);
  const [hover, setHover] = useState<{ tile: OccupiedTile; px: number; py: number } | null>(null);

  // view transform
  const viewRef = useRef({ zoom: compact ? 1 : 1, panX: 0, panY: 0 });
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  // geometry (defaults match server config so the shape shows before fetch)
  const cols = data?.cols ?? 132;
  const rows = data?.rows ?? 82;

  const tiles = useMemo(() => generateViTiles(cols, rows), [cols, rows]);

  // index: "col,row" -> tileIndex  (hit testing)
  const posIndex = useMemo(() => {
    const m = new Map<string, number>();
    tiles.forEach((t) => m.set(`${t.col},${t.row}`, t.index));
    return m;
  }, [tiles]);

  // index: tileIndex -> occupied data
  const occupied = useMemo(() => {
    const m = new Map<number, OccupiedTile>();
    data?.tiles.forEach((t) => m.set(t.tileIndex, t));
    return m;
  }, [data]);

  // tileIndex -> position (for highlight centering)
  const tileByIndex = useMemo(() => {
    const m = new Map<number, { col: number; row: number }>();
    tiles.forEach((t) => m.set(t.index, { col: t.col, row: t.row }));
    return m;
  }, [tiles]);

  // ---- fetch occupied tiles ------------------------------------------------
  useEffect(() => {
    let active = true;
    fetch("/api/wall")
      .then((r) => r.json())
      .then((d: WallData) => {
        if (active) setData(d);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    track("wall_view");
    return () => {
      active = false;
    };
  }, []);

  // ---- drawing -------------------------------------------------------------
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
    const gap = tilePx > 6 ? Math.max(0.5, tilePx * 0.12) : 0;
    const size = tilePx - gap;
    const radius = Math.min(size * 0.28, 3);

    for (const t of tiles) {
      const x = originX + t.col * tilePx;
      const y = originY + t.row * tilePx;
      if (x + tilePx < 0 || x > cw || y + tilePx < 0 || y > ch) continue;

      const occ = occupied.get(t.index);
      ctx.beginPath();
      roundRect(ctx, x, y, size, size, radius);

      if (occ) {
        const accent = accentFor(occ.countryIso);
        ctx.fillStyle = occ.status === "approved" ? accent : withAlpha(accent, 0.45);
        ctx.fill();
        if (tilePx > 12) {
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          ctx.font = `700 ${Math.floor(size * 0.6)}px Rajdhani, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(occ.username.charAt(0).toUpperCase(), x + size / 2, y + size / 2 + 0.5);
        }
      } else {
        // subtle empty treatment — keeps the VI silhouette readable
        ctx.fillStyle = "rgba(168,85,247,0.07)";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(168,85,247,0.14)";
        ctx.stroke();
      }
    }

    // highlight ring
    if (highlightTile != null) {
      const pos = tileByIndex.get(highlightTile);
      if (pos) {
        const x = originX + pos.col * tilePx;
        const y = originY + pos.row * tilePx;
        ctx.beginPath();
        roundRect(ctx, x - 2, y - 2, size + 4, size + 4, radius + 2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#f472b6";
        ctx.shadowColor = "#ec4899";
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }, [cols, rows, tiles, occupied, highlightTile, tileByIndex]);

  useEffect(() => {
    draw();
  });

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  // center on highlighted tile when it changes
  useEffect(() => {
    if (highlightTile == null) return;
    const wrap = wrapRef.current;
    const pos = tileByIndex.get(highlightTile);
    if (!wrap || !pos) return;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    const targetZoom = Math.max(viewRef.current.zoom, 3);
    const fit = Math.min(cw / cols, ch / rows);
    const tilePx = fit * targetZoom;
    viewRef.current.zoom = targetZoom;
    // pan so the highlighted tile's centre lands in the middle of the viewport
    viewRef.current.panX = cw / 2 - (originBase(cols, tilePx, cw) + pos.col * tilePx + tilePx / 2);
    viewRef.current.panY = ch / 2 - (originBase(rows, tilePx, ch) + pos.row * tilePx + tilePx / 2);
    rerender();
  }, [highlightTile, cols, rows, tileByIndex]);

  // ---- interactions --------------------------------------------------------
  const dragRef = useRef<{ active: boolean; moved: boolean; x: number; y: number }>({
    active: false, moved: false, x: 0, y: 0,
  });

  const toTile = (clientX: number, clientY: number): OccupiedTile | null => {
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
    const idx = posIndex.get(`${col},${row}`);
    if (idx == null) return null;
    return occupied.get(idx) ?? null;
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
      draw();
    } else {
      const wrap = wrapRef.current!;
      const rect = wrap.getBoundingClientRect();
      const t = toTile(e.clientX, e.clientY);
      setHover(t ? { tile: t, px: e.clientX - rect.left, py: e.clientY - rect.top } : null);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d.active && !d.moved) {
      const t = toTile(e.clientX, e.clientY);
      if (t) {
        setSelected(t);
        track("player_tile_click", { country: t.countryIso });
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

  // pinch zoom
  const pinchRef = useRef<number | null>(null);
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (pinchRef.current != null) {
        zoomBy(dist / pinchRef.current > 1 ? 1.03 : 0.97);
      }
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
          compact ? "h-[340px]" : "h-[clamp(360px,62vh,640px)]"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setHover(null)}
        onWheel={onWheel}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ cursor: dragRef.current.active ? "grabbing" : "grab" }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />

        {loading && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <Loader2 className="animate-spin text-neon-violet" />
          </div>
        )}

        {/* hover tooltip (desktop) */}
        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg glass-strong px-3 py-1.5 text-xs font-semibold text-ink"
            style={{ left: hover.px, top: hover.py - 8 }}
          >
            {hover.tile.username} · {hover.tile.countryIso}
          </div>
        )}

        {/* zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
          <ControlBtn label="Zoom in" onClick={() => zoomBy(1.3)}><Plus size={18} /></ControlBtn>
          <ControlBtn label="Zoom out" onClick={() => zoomBy(0.77)}><Minus size={18} /></ControlBtn>
          <ControlBtn label="Reset view" onClick={resetView}><Maximize2 size={16} /></ControlBtn>
        </div>

        <div className="pointer-events-none absolute left-3 top-3 rounded-lg glass px-2.5 py-1 text-[11px] font-semibold text-ink-dim">
          Drag to pan · scroll / pinch to zoom · tap a tile
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
function withAlpha(hex: string, alpha: number) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function originBase(count: number, tilePx: number, canvasDim: number) {
  return (canvasDim - count * tilePx) / 2;
}
