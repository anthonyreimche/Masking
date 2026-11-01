// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The mask tool's view state, never part of the edit: the armed tool and what
// it draws, the selection and hover, the editor's tab and the brush settings.
// Masks themselves live in the photo's params; the edits below write them
// there, whole, and select what they make. None of them commits: commitEdit
// ends a gesture for undo, and the panel or the canvas calls it.

import { React, api } from "./rt";
import type { BrushDab, Mask, MaskComponent, MaskComponentMode, MaskType } from "./safelight";
import { DEFAULT_MASK_PANELS, MAX_MASKS, defaultColorRange, defaultLumRange, defaultMaskAdjustments } from "./masks";

export interface MaskTool {
  activeTool: "none" | "mask";
  maskToolType: MaskType;
  /** Whether the next created component adds or subtracts. */
  maskCompMode: MaskComponentMode;
  /** Start a fresh mask, or extend the selected one. */
  maskAddTarget: "new" | "current";
  selectedMaskId: string | null;
  /** The component being edited on the canvas. */
  selectedComponentId: string | null;
  /** The mask hovered in the panel's list, whose coverage shows. */
  hoveredMaskId: string | null;
  /** The selected mask's editor tab; Adjust hides the coverage. */
  maskTab: "coverage" | "adjust";
  /** A brush Size, Feather, Opacity or Flow slider is being dragged. */
  brushPreview: boolean;
  /** Image-height fraction. */
  brushSize: number;
  /** 0 to 1. */
  brushFeather: number;
  /** 0 to 1 coverage ceiling. */
  brushOpacity: number;
  /** 0 to 1 per-dab deposit. */
  brushFlow: number;
  brushErase: boolean;
  /** The colour range eyedropper is waiting for a click on the image. */
  maskColorPicking: boolean;
}

const INITIAL: MaskTool = {
  activeTool: "none",
  maskToolType: "radial",
  maskCompMode: "add",
  maskAddTarget: "new",
  selectedMaskId: null,
  selectedComponentId: null,
  hoveredMaskId: null,
  maskTab: "coverage",
  brushPreview: false,
  brushSize: 0.08,
  brushFeather: 0.5,
  brushOpacity: 1,
  brushFlow: 1,
  brushErase: false,
  maskColorPicking: false,
};

let tool: MaskTool = INITIAL;
const listeners = new Set<() => void>();

export const maskTool = (): MaskTool => tool;

export function setMaskTool(partial: Partial<MaskTool>): void {
  tool = { ...tool, ...partial };
  for (const listener of listeners) listener();
}

export const resetMaskTool = () => setMaskTool(INITIAL);

export const subscribeMaskTool = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

/** React hook: the mask tool's state. */
export const useMaskTool = (): MaskTool => React.useSyncExternalStore(subscribeMaskTool, maskTool);

/** Leave the tool and drop the selection, so the list collapses and the
 *  coverage clears. */
export const leaveMaskTool = () =>
  setMaskTool({ activeTool: "none", selectedMaskId: null, selectedComponentId: null, hoveredMaskId: null });

let idSeq = 0;
export const genId = (p: string) => `${p}-${Date.now().toString(36)}-${idSeq++}`;

const masks = (): Mask[] => api.stores.useDevelopStore.getState().params.masks;
const setMasks = (next: Mask[]) => api.stores.useDevelopStore.getState().setParam("masks", next);

const mapComponents = (maskId: string, map: (components: MaskComponent[]) => MaskComponent[]) =>
  setMasks(masks().map((m) => (m.id === maskId ? { ...m, components: map(m.components) } : m)));

export function findComponent(maskId: string, compId: string): MaskComponent | undefined {
  return masks().find((m) => m.id === maskId)?.components.find((c) => c.id === compId);
}

/** Add `mask`, select it and its last component, and open it on Coverage so
 *  its coverage shows while drawing. A photo holds at most MAX_MASKS. */
export function addMask(mask: Mask): void {
  if (masks().length >= MAX_MASKS) return;
  setMasks([...masks(), mask]);
  setMaskTool({
    selectedMaskId: mask.id,
    selectedComponentId: mask.components[mask.components.length - 1]?.id ?? null,
    maskTab: "coverage",
  });
}

/** Append `comp` to mask `maskId` and select it; the tab stays as it is. */
export function addComponent(maskId: string, comp: MaskComponent): void {
  mapComponents(maskId, (components) => [...components, comp]);
  setMaskTool({ selectedMaskId: maskId, selectedComponentId: comp.id });
}

export function updateComponent(maskId: string, compId: string, patch: Partial<MaskComponent>): void {
  mapComponents(maskId, (components) => components.map((c) => (c.id === compId ? { ...c, ...patch } : c)));
}

/** Remove a component; removing the last one removes the whole mask. */
export function removeComponent(maskId: string, compId: string): void {
  const next: Mask[] = [];
  for (const m of masks()) {
    if (m.id !== maskId) {
      next.push(m);
      continue;
    }
    const components = m.components.filter((c) => c.id !== compId);
    if (components.length > 0) next.push({ ...m, components });
  }
  setMasks(next);
  const maskGone = !next.some((m) => m.id === maskId);
  setMaskTool({
    selectedMaskId: maskGone ? null : tool.selectedMaskId,
    selectedComponentId: tool.selectedComponentId === compId ? null : tool.selectedComponentId,
    // A hover on the removed mask outlives its list row (deleting from the row
    // means mouseleave never fires), and a stale id would shadow the selected
    // mask's coverage: drop it like the selection.
    hoveredMaskId: maskGone && tool.hoveredMaskId === maskId ? null : tool.hoveredMaskId,
  });
}

/** Cycle a component's combine mode: add, subtract, intersect, add. */
export function cycleComponentMode(maskId: string, compId: string): void {
  mapComponents(maskId, (components) =>
    components.map((c) => {
      if (c.id !== compId) return c;
      const mode: MaskComponentMode = c.mode === "add" ? "subtract" : c.mode === "subtract" ? "intersect" : "add";
      return { ...c, mode };
    }),
  );
}

/** Add a parametric range component: to the selected mask, as an intersect
 *  when it has components already, or as a new mask of its own. Ranges have no
 *  canvas gesture, so they are made here rather than on the canvas. */
export function addRangeComponent(kind: "lumRange" | "colorRange"): void {
  const geo = kind === "lumRange" ? { lumRange: defaultLumRange() } : { colorRange: defaultColorRange() };
  const sel = masks().find((m) => m.id === tool.selectedMaskId) ?? null;
  if (sel) {
    // Range masks are usually used to confine an existing region.
    const mode: MaskComponentMode = sel.components.length > 0 ? "intersect" : "add";
    addComponent(sel.id, { id: genId("comp"), kind, mode, invert: false, ...geo });
    return;
  }
  addMask({
    id: genId("mask"),
    name: kind === "lumRange" ? "Luminance" : "Color",
    visible: true,
    invert: false,
    opacity: 100,
    adj: defaultMaskAdjustments(),
    panels: [...DEFAULT_MASK_PANELS],
    components: [{ id: genId("comp"), kind, mode: "add", invert: false, ...geo }],
  });
}

/** Append a dab to a brush component; a component with no brush takes none. */
export function addBrushDab(maskId: string, compId: string, dab: BrushDab): void {
  mapComponents(maskId, (components) =>
    components.map((c) => (c.id === compId && c.brush ? { ...c, brush: { ...c.brush, dabs: [...c.brush.dabs, dab] } } : c)),
  );
}

export const renameMask = (id: string, name: string) => api.stores.useDevelopStore.getState().updateMask(id, { name });

/** Remove the mask, and the selection and hover with it. */
export function removeMask(id: string): void {
  setMasks(masks().filter((m) => m.id !== id));
  setMaskTool({
    selectedMaskId: tool.selectedMaskId === id ? null : tool.selectedMaskId,
    selectedComponentId: tool.selectedMaskId === id ? null : tool.selectedComponentId,
    hoveredMaskId: tool.hoveredMaskId === id ? null : tool.hoveredMaskId,
  });
}
