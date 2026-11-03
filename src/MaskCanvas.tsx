// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The mask tool on the canvas: the canvas tool this extension holds while a
// mask tool is armed. A drag draws a radial or linear component, or paints a
// brush one; the selected component's handles move, size and turn it; with
// the colour range eyedropper on, a click picks the range's target colour.
// Components live in source UV and are drawn through the photo's transform
// onto the region the canvas shows.

import type { ComponentType, PointerEvent as ReactPointerEvent } from "react";
import { React, api } from "./rt";
import type { CanvasTool, CropRect, Mask, MaskComponent, OverlayRect, RadialMaskGeo } from "./safelight";
import { DEFAULT_MASK_PANELS, defaultColorRange, defaultMaskAdjustments } from "./masks";
import { buildForwardTransform, buildInverseTransform, mat3Apply, type Mat3 } from "./transform";
import {
  addBrushDab,
  addComponent,
  addMask,
  findComponent,
  genId,
  leaveMaskTool,
  maskTool,
  removeComponent,
  setMaskTool,
  updateComponent,
  useMaskTool,
  type MaskTool,
} from "./state";

type Rect = OverlayRect;

// Pointer position in an element's local LAYOUT pixels, the space `rect` is in:
// Preferences ▸ Interface scale zooms <body>, and under CSS zoom clientX and
// getBoundingClientRect() are in zoomed visual pixels, which otherwise drifts
// brush dabs and the brush ring away from the pointer.
function frameLocalPoint(rect: { left: number; top: number }, clientX: number, clientY: number) {
  const z = api.stores.useSettings.getState().uiScale || 1;
  return { x: (clientX - rect.left) / z, y: (clientY - rect.top) / z };
}

function projectToScreen(rect: Rect, crop: CropRect, forward: Mat3, sx: number, sy: number) {
  const t = mat3Apply(forward, sx, sy);
  const ox = (t.x - crop.x) / crop.width;
  const oy = (t.y - crop.y) / crop.height;
  return { x: rect.x + ox * rect.w, y: rect.y + oy * rect.h };
}

/** A disc as drawn on screen: semi-axes in px, turn in degrees. */
interface ScreenDisc {
  rx: number;
  ry: number;
  angle: number;
}

// The screen size of the photo's disc of radius r (image-height units) at
// (sx, sy). The transform scales each axis on its own (Aspect, Perspective),
// so a dab that paints round in the photo can be an ellipse on screen: its
// axes are the singular values of the map the disc's two radii go through.
function discOnScreen(toScreen: (sx: number, sy: number) => { x: number; y: number }, sx: number, sy: number, r: number, imageAspect: number): ScreenDisc {
  const c = toScreen(sx, sy);
  const ex = toScreen(sx + r / imageAspect, sy);
  const ey = toScreen(sx, sy + r);
  const m00 = ex.x - c.x, m01 = ey.x - c.x, m10 = ex.y - c.y, m11 = ey.y - c.y;
  const e = (m00 + m11) / 2, f = (m00 - m11) / 2, g = (m10 + m01) / 2, h = (m10 - m01) / 2;
  const q = Math.hypot(e, h), w = Math.hypot(f, g);
  const angle = ((Math.atan2(g, f) + Math.atan2(h, e)) / 2) * (180 / Math.PI);
  return { rx: q + w, ry: Math.abs(q - w), angle };
}

// A small radius to measure the transform's local scale with; the ring scales
// it to the brush size, so resizing the brush maps nothing.
const PROBE_RADIUS = 0.01;

const HIT = 13; // px handle hit radius (generous grips)
const ROT_OFFSET = 0.06; // rotate-handle gap beyond the ellipse top (q-units)
const SNAP = Math.PI / 12; // 15° rotation snap

// Add components draw blue/white, subtract components draw orange — matching the
// panel's colour language.
const COLOR = {
  add: "#4aa3ff",
  addDim: "rgba(255,255,255,0.5)",
  sub: "#ff7a4a",
  subDim: "rgba(255,150,90,0.5)",
};

type HandleId =
  | "radial-move"
  | "radial-e"
  | "radial-w"
  | "radial-n"
  | "radial-s"
  | "radial-rotate"
  | "linear-p0"
  | "linear-p1";

type DragKind = "create-radial" | "create-linear" | "brush" | HandleId;

interface DragState {
  kind: DragKind;
  maskId: string;
  compId: string;
  downSrc: { x: number; y: number };
  lastDab?: { x: number; y: number };
  fromCenter?: boolean;
}

// The view's mapping from source UV to the canvas. Screen-proportional ("q")
// space scales x by the aspect so rotation is rigid: the radial ellipse, its
// handles and the rotation maths use it.
function maskView(rect: Rect, crop: CropRect, forward: Mat3, imageAspect: number) {
  const toScreen = (sx: number, sy: number) => projectToScreen(rect, crop, forward, sx, sy);
  const uvFromQ = (qx: number, qy: number, cx: number, cy: number) => ({ x: cx + qx / imageAspect, y: cy + qy });
  const radialHandle = (r: RadialMaskGeo, which: "center" | "e" | "w" | "n" | "s" | "rotate") => {
    if (which === "center") return toScreen(r.cx, r.cy);
    const ca = Math.cos(r.angle);
    const sa = Math.sin(r.angle);
    let qx = 0;
    let qy = 0;
    if (which === "e") qx = r.rx * imageAspect;
    else if (which === "w") qx = -r.rx * imageAspect;
    else if (which === "n") qy = -r.ry;
    else if (which === "s") qy = r.ry;
    else qy = -(r.ry + ROT_OFFSET); // rotate
    const uv = uvFromQ(ca * qx - sa * qy, sa * qx + ca * qy, r.cx, r.cy);
    return toScreen(uv.x, uv.y);
  };
  const rotatedEllipsePath = (r: RadialMaskGeo) => {
    const ca = Math.cos(r.angle);
    const sa = Math.sin(r.angle);
    const pts: string[] = [];
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const qx = r.rx * imageAspect * Math.cos(a);
      const qy = r.ry * Math.sin(a);
      const uv = uvFromQ(ca * qx - sa * qy, sa * qx + ca * qy, r.cx, r.cy);
      const p = toScreen(uv.x, uv.y);
      pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    return "M" + pts.join("L") + "Z";
  };
  return { toScreen, radialHandle, rotatedEllipsePath };
}

// Where the pointer is over the canvas (layout px), and whether Alt is held.
// Only the cursor rings read it, so a hover move redraws them and nothing else.
interface PointerState {
  at: { x: number; y: number; alt: boolean } | null;
}

function pointerStore() {
  let state: PointerState = { at: null };
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next: PointerState) {
      state = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

type PointerStore = ReturnType<typeof pointerStore>;

// Snap an endpoint so the line from `anchor` lies on a 0/45/90° axis (in
// screen-proportional space).
function snapLinear(anchor: { x: number; y: number }, p: { x: number; y: number }, aspect: number) {
  const qx = (p.x - anchor.x) * aspect;
  const qy = p.y - anchor.y;
  const len = Math.hypot(qx, qy);
  if (len < 1e-6) return p;
  const ang = Math.round(Math.atan2(qy, qx) / (Math.PI / 4)) * (Math.PI / 4);
  return { x: anchor.x + (Math.cos(ang) * len) / aspect, y: anchor.y + Math.sin(ang) * len };
}

/** The tool held while a mask tool is armed. */
export function MaskCanvas({ rect: given }: { rect: Rect }) {
  const useDevelopStore = api.stores.useDevelopStore;
  const masks = useDevelopStore((s) => s.params.masks);
  const straighten = useDevelopStore((s) => s.params.straighten);
  const transform = useDevelopStore((s) => s.params.transform);
  const editCrop = useDevelopStore((s) => s.params.crop);
  const { region, imageAspect, rect: bufferRect } = api.develop.useDevelopOverlay();
  const tool = useMaskTool();
  const { activeTool, maskToolType, selectedMaskId, selectedComponentId } = tool;
  const [pointer] = React.useState(pointerStore);
  const [hovered, setHovered] = React.useState<HandleId | null>(null);
  const dragRef = React.useRef<DragState | null>(null);
  // Last brush point, kept across strokes for Shift+click straight lines.
  const lastBrushPt = React.useRef<{ x: number; y: number } | null>(null);

  // The canvas hands over a new rect on each of its renders; the outlines
  // keep theirs while its numbers stay.
  const rect = React.useMemo(() => given, [given.x, given.y, given.w, given.h]);
  const crop = region ?? editCrop;
  const forward = React.useMemo(
    () => buildForwardTransform(straighten, transform, imageAspect),
    [straighten, transform, imageAspect],
  );
  const inv = React.useMemo(
    () => buildInverseTransform(straighten, transform, imageAspect),
    [straighten, transform, imageAspect],
  );
  const view = maskView(rect, crop, forward, imageAspect);
  const { toScreen, radialHandle } = view;
  const toSource = (px: number, py: number) => {
    const ox = (px - rect.x) / rect.w;
    const oy = (py - rect.y) / rect.h;
    return mat3Apply(inv, crop.x + ox * crop.width, crop.y + oy * crop.height);
  };
  const frameXY = (e: ReactPointerEvent) =>
    frameLocalPoint(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY);
  const store = useDevelopStore.getState;

  const selectedMask = masks.find((m) => m.id === selectedMaskId) ?? null;
  const selectedComp = selectedMask?.components.find((c) => c.id === selectedComponentId) ?? null;

  function hitSelectedComponent(px: number, py: number): HandleId | null {
    const c = selectedComp;
    if (!c) return null;
    if (c.kind === "radial" && c.radial) {
      const rot = radialHandle(c.radial, "rotate");
      if (Math.hypot(px - rot.x, py - rot.y) <= HIT) return "radial-rotate";
      for (const [w, k] of [["e", "radial-e"], ["w", "radial-w"], ["n", "radial-n"], ["s", "radial-s"]] as const) {
        const h = radialHandle(c.radial, w);
        if (Math.hypot(px - h.x, py - h.y) <= HIT) return k;
      }
      const ctr = radialHandle(c.radial, "center");
      if (Math.hypot(px - ctr.x, py - ctr.y) <= HIT) return "radial-move";
    } else if (c.kind === "linear" && c.linear) {
      const p0 = toScreen(c.linear.x0, c.linear.y0);
      const p1 = toScreen(c.linear.x1, c.linear.y1);
      if (Math.hypot(px - p0.x, py - p0.y) <= HIT) return "linear-p0";
      if (Math.hypot(px - p1.x, py - p1.y) <= HIT) return "linear-p1";
    }
    return null;
  }

  function newMaskWith(comp: MaskComponent): string {
    const id = genId("mask");
    const mask: Mask = {
      id,
      name: comp.kind[0].toUpperCase() + comp.kind.slice(1),
      visible: true,
      invert: false,
      opacity: 100,
      adj: defaultMaskAdjustments(),
      panels: [...DEFAULT_MASK_PANELS],
      components: [comp],
    };
    addMask(mask);
    return id;
  }

  // Where a new component lands: a fresh mask, or the selected one.
  function resolveTarget(t: MaskTool): "new" | string {
    if (t.maskAddTarget === "new") return "new";
    if (t.selectedMaskId && masks.some((m) => m.id === t.selectedMaskId)) return t.selectedMaskId;
    return "new";
  }

  // Frame px -> a point across the live frame buffer, which the overlay's
  // `rect` places; a click on the surround beyond it picks nothing. The colour
  // comes back after the user may have opened another photo or edited the
  // component.
  async function pickColour(maskId: string, compId: string, px: number, py: number) {
    if (!bufferRect) return;
    const u = (px - bufferRect.x) / bufferRect.w;
    const v = (py - bufferRect.y) / bufferRect.h;
    if (u < 0 || u > 1 || v < 0 || v > 1) return;
    const photoId = store().photoId;
    const rgb = await api.develop.probeMaskColour(u, v);
    const comp = store().photoId === photoId ? findComponent(maskId, compId) : undefined;
    if (!rgb || !comp) return;
    updateComponent(maskId, compId, {
      colorRange: { ...(comp.colorRange ?? defaultColorRange()), r: rgb[0], g: rgb[1], b: rgb[2] },
    });
    void store().commitEdit("Colour Range Pick");
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    const { x: px, y: py } = frameXY(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    const down = toSource(px, py);
    const t = maskTool();

    // Colour-range eyedropper: probe the scene-linear colour under the cursor
    // into the selected colour-range component, then stop picking.
    if (t.maskColorPicking && selectedMask && selectedComp?.kind === "colorRange") {
      setMaskTool({ maskColorPicking: false });
      void pickColour(selectedMask.id, selectedComp.id, px, py);
      return;
    }

    if (activeTool !== "mask") return;

    // Editing an existing component's handle wins.
    const handle = hitSelectedComponent(px, py);
    if (handle && selectedMask && selectedComp) {
      dragRef.current = { kind: handle, maskId: selectedMask.id, compId: selectedComp.id, downSrc: down };
      return;
    }

    // Otherwise create a new component of the armed tool type.
    const mode = t.maskCompMode;
    if (maskToolType === "brush") {
      const target = resolveTarget(t);
      let maskId: string;
      let compId: string;
      // Extend the *selected* brush component (same mode) so further strokes
      // build on the brush you're working on. Picking Brush from "+ Add
      // Component" deselects first, so painting then starts a separate brush
      // component — this is what lets a mask hold more than one brush.
      const mask = target === "new" ? null : masks.find((m) => m.id === target);
      const sel = mask?.components.find((c) => c.id === t.selectedComponentId) ?? null;
      const existing = sel && sel.kind === "brush" && sel.mode === mode ? sel : null;
      if (existing && mask) {
        maskId = mask.id;
        compId = existing.id;
        setMaskTool({ selectedMaskId: maskId, selectedComponentId: compId });
      } else {
        compId = genId("comp");
        const comp: MaskComponent = { id: compId, kind: "brush", mode, invert: false, brush: { dabs: [], feather: t.brushFeather } };
        if (target === "new") maskId = newMaskWith(comp);
        else {
          maskId = target;
          addComponent(maskId, comp);
        }
        setMaskTool({ maskAddTarget: "current" });
      }
      const dab = { radius: t.brushSize, erase: e.altKey || t.brushErase, feather: t.brushFeather, opacity: t.brushOpacity, flow: t.brushFlow };
      // Shift+click: straight line of dabs from the previous brush point.
      if (e.shiftKey && lastBrushPt.current) {
        const a = lastBrushPt.current;
        const dist = Math.hypot((down.x - a.x) * imageAspect, down.y - a.y);
        const steps = Math.max(1, Math.ceil(dist / (t.brushSize * 0.25)));
        for (let i = 1; i <= steps; i++) {
          const f = i / steps;
          addBrushDab(maskId, compId, {
            x: a.x + (down.x - a.x) * f,
            y: a.y + (down.y - a.y) * f,
            ...dab,
            strokeStart: i === 1 || undefined,
          });
        }
      } else {
        addBrushDab(maskId, compId, { x: down.x, y: down.y, ...dab, strokeStart: true });
      }
      lastBrushPt.current = down;
      dragRef.current = { kind: "brush", maskId, compId, downSrc: down, lastDab: down };
      return;
    }

    // Radial / linear: create a zero-size component and drag it out.
    const target = resolveTarget(t);
    const compId = genId("comp");
    const comp: MaskComponent =
      maskToolType === "radial"
        ? { id: compId, kind: "radial", mode, invert: false, radial: { cx: down.x, cy: down.y, rx: 0.001, ry: 0.001, feather: 0.5, angle: 0 } }
        : { id: compId, kind: "linear", mode, invert: false, linear: { x0: down.x, y0: down.y, x1: down.x, y1: down.y } };
    let maskId: string;
    if (target === "new") maskId = newMaskWith(comp);
    else {
      maskId = target;
      addComponent(maskId, comp);
    }
    setMaskTool({ maskAddTarget: "current" });
    dragRef.current = {
      kind: maskToolType === "radial" ? "create-radial" : "create-linear",
      maskId,
      compId,
      downSrc: down,
      fromCenter: e.altKey,
    };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const { x: px, y: py } = frameXY(e);
    pointer.set({ at: { x: px, y: py, alt: e.altKey } });
    const d = dragRef.current;
    if (!d) {
      // Hover feedback on the selected component's handles.
      if (activeTool === "mask") setHovered(hitSelectedComponent(px, py));
      return;
    }
    const cur = toSource(px, py);
    const shift = e.shiftKey;
    const c = findComponent(d.maskId, d.compId);
    switch (d.kind) {
      case "create-radial": {
        let cx: number, cy: number, rx: number, ry: number;
        if (d.fromCenter) {
          cx = d.downSrc.x;
          cy = d.downSrc.y;
          rx = Math.max(0.001, Math.abs(cur.x - d.downSrc.x));
          ry = Math.max(0.001, Math.abs(cur.y - d.downSrc.y));
        } else {
          cx = (d.downSrc.x + cur.x) / 2;
          cy = (d.downSrc.y + cur.y) / 2;
          rx = Math.max(0.001, Math.abs(cur.x - d.downSrc.x) / 2);
          ry = Math.max(0.001, Math.abs(cur.y - d.downSrc.y) / 2);
        }
        if (shift) {
          // Constrain to a circle (equal radii in screen-proportional space).
          const r = Math.max(rx * imageAspect, ry);
          rx = r / imageAspect;
          ry = r;
        }
        updateComponent(d.maskId, d.compId, { radial: { cx, cy, rx, ry, feather: 0.5, angle: 0 } });
        break;
      }
      case "create-linear": {
        const end = shift ? snapLinear(d.downSrc, cur, imageAspect) : cur;
        updateComponent(d.maskId, d.compId, { linear: { x0: d.downSrc.x, y0: d.downSrc.y, x1: end.x, y1: end.y } });
        break;
      }
      case "radial-move": {
        if (c?.radial) updateComponent(d.maskId, d.compId, { radial: { ...c.radial, cx: cur.x, cy: cur.y } });
        break;
      }
      case "radial-e":
      case "radial-w":
      case "radial-n":
      case "radial-s": {
        if (!c?.radial) break;
        const rr = c.radial;
        const qx = (cur.x - rr.cx) * imageAspect;
        const qy = cur.y - rr.cy;
        const ca = Math.cos(-rr.angle);
        const sa = Math.sin(-rr.angle);
        const lx = ca * qx - sa * qy; // local x (aspect-scaled), along rx axis
        const ly = sa * qx + ca * qy; // local y, along ry axis
        const ra = rr.angle;
        const horiz = d.kind === "radial-e" || d.kind === "radial-w";
        // The dragged edge's new local position along its axis, plus the
        // current radius (in the same local q-space) for that axis.
        const local = horiz ? lx : ly;
        const oldR = horiz ? rr.rx * imageAspect : rr.ry;
        const sign = d.kind === "radial-e" || d.kind === "radial-s" ? 1 : -1;
        let newR: number;
        let cx = rr.cx;
        let cy = rr.cy;
        if (e.altKey) {
          // Resize symmetrically about the centre.
          newR = Math.abs(local);
        } else {
          // Anchor the opposite edge; the centre slides along the axis.
          const anchor = -sign * oldR;
          newR = Math.abs(local - anchor) / 2;
          const cLocal = (local + anchor) / 2;
          // Rotate the local offset (along this axis) back into source-UV.
          const oqx = horiz ? Math.cos(ra) * cLocal : -Math.sin(ra) * cLocal;
          const oqy = horiz ? Math.sin(ra) * cLocal : Math.cos(ra) * cLocal;
          cx = rr.cx + oqx / imageAspect;
          cy = rr.cy + oqy;
        }
        let rx = rr.rx;
        let ry = rr.ry;
        if (horiz) rx = Math.max(0.002, newR / imageAspect);
        else ry = Math.max(0.002, newR);
        if (shift) {
          // Preserve aspect ratio: scale the other axis by the same factor.
          if (horiz && rr.rx > 1e-4) ry = Math.max(0.002, rr.ry * (rx / rr.rx));
          else if (!horiz && rr.ry > 1e-4) rx = Math.max(0.002, rr.rx * (ry / rr.ry));
        }
        updateComponent(d.maskId, d.compId, { radial: { ...rr, rx, ry, cx, cy } });
        break;
      }
      case "radial-rotate": {
        if (!c?.radial) break;
        const qx = (cur.x - c.radial.cx) * imageAspect;
        const qy = cur.y - c.radial.cy;
        let angle = Math.atan2(qy, qx) + Math.PI / 2;
        if (shift) angle = Math.round(angle / SNAP) * SNAP;
        updateComponent(d.maskId, d.compId, { radial: { ...c.radial, angle } });
        break;
      }
      case "linear-p0": {
        if (!c?.linear) break;
        const p = shift ? snapLinear({ x: c.linear.x1, y: c.linear.y1 }, cur, imageAspect) : cur;
        updateComponent(d.maskId, d.compId, { linear: { ...c.linear, x0: p.x, y0: p.y } });
        break;
      }
      case "linear-p1": {
        if (!c?.linear) break;
        const p = shift ? snapLinear({ x: c.linear.x0, y: c.linear.y0 }, cur, imageAspect) : cur;
        updateComponent(d.maskId, d.compId, { linear: { ...c.linear, x1: p.x, y1: p.y } });
        break;
      }
      case "brush": {
        const t = maskTool();
        const last = d.lastDab ?? d.downSrc;
        const dist = Math.hypot((cur.x - last.x) * imageAspect, cur.y - last.y);
        if (dist >= t.brushSize * 0.25) {
          addBrushDab(d.maskId, d.compId, {
            x: cur.x,
            y: cur.y,
            radius: t.brushSize,
            erase: e.altKey || t.brushErase,
            feather: t.brushFeather,
            opacity: t.brushOpacity,
            flow: t.brushFlow,
          });
          d.lastDab = cur;
          lastBrushPt.current = cur;
        }
        break;
      }
    }
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    // A bare click (no real drag) on empty canvas: drop the stray zero-size
    // component and deselect, so clicking away dismisses the mask and its
    // coverage.
    const c = findComponent(d.maskId, d.compId);
    const stray =
      (d.kind === "create-radial" && c?.radial && (c.radial.rx < 0.01 || c.radial.ry < 0.01)) ||
      (d.kind === "create-linear" && c?.linear && Math.hypot(c.linear.x1 - c.linear.x0, c.linear.y1 - c.linear.y0) < 0.01);
    if (stray) {
      removeComponent(d.maskId, d.compId);
      setMaskTool({ selectedMaskId: null, selectedComponentId: null });
      return;
    }
    void store().commitEdit("Mask");
  };

  const Outlines = memoOutlines();
  // Screen px per image-height unit of a dab at the view's centre: the brush
  // ring keeps it while it follows the pointer, so a hover maps nothing.
  const ringScale = React.useMemo(() => {
    const c = toSource(rect.x + rect.w / 2, rect.y + rect.h / 2);
    const d = discOnScreen(toScreen, c.x, c.y, PROBE_RADIUS, imageAspect);
    return { rx: d.rx / PROBE_RADIUS, ry: d.ry / PROBE_RADIUS, angle: d.angle };
  }, [rect, crop, forward, inv, imageAspect]);

  return (
    <div
      data-mask-canvas=""
      style={{ position: "absolute", inset: 0, cursor: api.cursors.resolve("crosshair"), touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => pointer.set({ at: null })}
    >
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {/* Mask components — only while the mask tool is armed. */}
        {activeTool === "mask" && (
          <Outlines
            masks={masks}
            selectedMaskId={selectedMaskId}
            selectedComponentId={selectedComponentId}
            hovered={hovered}
            rect={rect}
            crop={crop}
            forward={forward}
            imageAspect={imageAspect}
          />
        )}
        <ToolCursors pointer={pointer} rect={rect} ringScale={ringScale} />
      </svg>
    </div>
  );
}

interface MaskOutlinesProps {
  masks: Mask[];
  selectedMaskId: string | null;
  selectedComponentId: string | null;
  hovered: HandleId | null;
  rect: Rect;
  crop: CropRect;
  forward: Mat3;
  imageAspect: number;
}

function MaskOutlines({ masks, selectedMaskId, selectedComponentId, hovered, rect, crop, forward, imageAspect }: MaskOutlinesProps) {
  const { toScreen, radialHandle, rotatedEllipsePath } = maskView(rect, crop, forward, imageAspect);
  return (
    <>
      {masks.flatMap((m) =>
        m.components.map((c) => {
          const selComp = c.id === selectedComponentId && m.id === selectedMaskId;
          const sub = c.mode === "subtract";
          const stroke = selComp ? (sub ? COLOR.sub : COLOR.add) : sub ? COLOR.subDim : COLOR.addDim;
          const grip = sub ? COLOR.sub : COLOR.add;
          const key = m.id + ":" + c.id;
          if (c.kind === "radial" && c.radial) {
            const radial = c.radial;
            const ctr = radialHandle(radial, "center");
            const rot = radialHandle(radial, "rotate");
            const big = (h: HandleId) => (hovered === h && selComp ? 6 : 5);
            const sizeHandles = [["radial-e", "e"], ["radial-w", "w"], ["radial-n", "n"], ["radial-s", "s"]] as const;
            return (
              <g key={key}>
                <path
                  d={rotatedEllipsePath(radial)}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={selComp ? 1.8 : 1.4}
                  strokeDasharray={sub ? "5 4" : undefined}
                />
                {selComp && <line x1={ctr.x} y1={ctr.y} x2={rot.x} y2={rot.y} stroke={grip} strokeWidth={1} opacity={0.6} />}
                {selComp && <circle cx={ctr.x} cy={ctr.y} r={big("radial-move")} fill={grip} />}
                {selComp &&
                  sizeHandles.map(([id, w]) => {
                    const h = radialHandle(radial, w);
                    return <circle key={id} cx={h.x} cy={h.y} r={big(id)} fill="#fff" stroke={grip} strokeWidth={1.5} />;
                  })}
                {selComp && <circle cx={rot.x} cy={rot.y} r={big("radial-rotate") + 1} fill={grip} stroke="#fff" strokeWidth={1.5} />}
              </g>
            );
          }
          if (c.kind === "linear" && c.linear) {
            const p0 = toScreen(c.linear.x0, c.linear.y0);
            const p1 = toScreen(c.linear.x1, c.linear.y1);
            const dx = p1.x - p0.x;
            const dy = p1.y - p0.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = (-dy / len) * 400;
            const ny = (dx / len) * 400;
            return (
              <g key={key}>
                <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={stroke} strokeWidth={1.2} />
                <line x1={p0.x - nx} y1={p0.y - ny} x2={p0.x + nx} y2={p0.y + ny} stroke={stroke} strokeWidth={1.2} strokeDasharray="4 4" />
                <line x1={p1.x - nx} y1={p1.y - ny} x2={p1.x + nx} y2={p1.y + ny} stroke={stroke} strokeWidth={1.2} />
                {selComp && <circle cx={p0.x} cy={p0.y} r={hovered === "linear-p0" ? 6 : 5} fill="#fff" stroke={grip} strokeWidth={1.5} />}
                {selComp && <circle cx={p1.x} cy={p1.y} r={hovered === "linear-p1" ? 6 : 5} fill={grip} stroke="#fff" strokeWidth={1.5} />}
              </g>
            );
          }
          return null;
        }),
      )}
    </>
  );
}

let MemoOutlines: ComponentType<MaskOutlinesProps> | null = null;

// Memoised: a redraw of the canvas that changes nothing it shows (the brush
// settings, the list's hover) leaves the outlines alone. Made on first use,
// with the React the host injects.
const memoOutlines = () => (MemoOutlines ??= React.memo(MaskOutlines));

interface ToolCursorsProps {
  pointer: PointerStore;
  rect: Rect;
  ringScale: ScreenDisc;
}

// Re-renders on every pointer move, so it holds only what follows the pointer
// or is cheap to draw.
function ToolCursors({ pointer, rect, ringScale }: ToolCursorsProps) {
  const { at } = React.useSyncExternalStore(pointer.subscribe, pointer.get);
  const { activeTool, maskToolType, brushErase, maskCompMode, brushSize, brushFeather, brushPreview } = useMaskTool();

  const brushing = activeTool === "mask" && maskToolType === "brush";
  const brushRing = brushing ? at : null;
  // Reactive so the cursor ring resizes the instant [ / ] change the size.
  const ring = (x: number, y: number, scale: number, min: number) => ({
    cx: x,
    cy: y,
    rx: Math.max(min, ringScale.rx * brushSize * scale),
    ry: Math.max(min, ringScale.ry * brushSize * scale),
    transform: `rotate(${ringScale.angle} ${x} ${y})`,
  });
  const subErase = at?.alt || brushErase || maskCompMode === "subtract";
  // Centre reference circle shown while a brush slider is dragged.
  const showBrushRef = brushPreview && brushing;
  const refCx = rect.x + rect.w / 2;
  const refCy = rect.y + rect.h / 2;
  const ringColour = subErase ? "#ff6b6b" : "#fff";

  return (
    <>
      {brushRing && (
        <g>
          <ellipse
            {...ring(brushRing.x, brushRing.y, 1, 3)}
            fill="none"
            stroke={ringColour}
            strokeWidth={1.2}
            strokeDasharray={subErase ? "4 3" : undefined}
            opacity={0.9}
          />
          {/* Inner ring shows the feathered core. */}
          <ellipse {...ring(brushRing.x, brushRing.y, 1 - brushFeather, 1)} fill="none" stroke={ringColour} strokeWidth={0.6} opacity={0.4} />
        </g>
      )}
      {/* Centre reference while dragging the brush sliders. */}
      {showBrushRef && (
        <g opacity={0.8}>
          <ellipse {...ring(refCx, refCy, 1, 3)} fill="none" stroke="#fff" strokeWidth={1.2} />
          <ellipse {...ring(refCx, refCy, 1 - brushFeather, 1)} fill="none" stroke="#fff" strokeWidth={0.6} opacity={0.5} />
        </g>
      )}
    </>
  );
}

type BrushSetting = "brushSize" | "brushFeather" | "brushOpacity" | "brushFlow";

// Each brush shortcut's setting, step, range and rounding.
const BRUSH_STEPS: Record<string, { key: BrushSetting; step: number; min: number; max: number; digits: number }> = {
  "brush.smaller": { key: "brushSize", step: -0.01, min: 0.01, max: 0.5, digits: 3 },
  "brush.larger": { key: "brushSize", step: 0.01, min: 0.01, max: 0.5, digits: 3 },
  "brush.featherDown": { key: "brushFeather", step: -0.05, min: 0, max: 1, digits: 2 },
  "brush.featherUp": { key: "brushFeather", step: 0.05, min: 0, max: 1, digits: 2 },
  "brush.opacityDown": { key: "brushOpacity", step: -0.1, min: 0.01, max: 1, digits: 2 },
  "brush.opacityUp": { key: "brushOpacity", step: 0.1, min: 0.01, max: 1, digits: 2 },
  "brush.flowDown": { key: "brushFlow", step: -0.1, min: 0.01, max: 1, digits: 2 },
  "brush.flowUp": { key: "brushFlow", step: 0.1, min: 0.01, max: 1, digits: 2 },
};

// Whether the tool takes `action` now; with `run`, take it. The brush size
// keys size only the armed brush; Delete removes the selected component,
// and the mask with its last one.
function takeAction(action: string, run: boolean): boolean {
  const t = maskTool();
  if (action === "mask.delete") {
    if (!t.selectedMaskId || !t.selectedComponentId) return false;
    if (run) {
      removeComponent(t.selectedMaskId, t.selectedComponentId);
      void api.stores.useDevelopStore.getState().commitEdit("Delete Component");
    }
    return true;
  }
  const s = BRUSH_STEPS[action];
  if (!s) return false;
  if (s.key === "brushSize" && !(t.activeTool === "mask" && t.maskToolType === "brush")) return false;
  if (run) {
    const patch: Partial<MaskTool> = {};
    patch[s.key] = Math.max(s.min, Math.min(s.max, Number((t[s.key] + s.step).toFixed(s.digits))));
    setMaskTool(patch);
  }
  return true;
}

/** The tool held while a mask tool is armed. Develop's brush shortcuts set the
 *  brush, Delete removes the selected component, and Escape leaves the tool
 *  and drops the selection. */
export const MASK_TOOL: CanvasTool = {
  overlay: MaskCanvas,
  zoomable: true,
  onEscape: leaveMaskTool,
  onAction: (action) => takeAction(action, true),
  wants: (action) => takeAction(action, false),
};
