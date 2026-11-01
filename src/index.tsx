// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Registers the Develop "Masking" panel, its canvas tool and the stage that
// declares the masks. It was core's built-in `core.masks` until Safelight
// 3.2.0 and keeps that panel id, so saved layouts keep it where it was.

import { MASK_TOOL } from "./MaskCanvas";
import { MasksPanel } from "./MasksPanel";
import { api, initRuntime } from "./rt";
import type { Line, SafelightAPI } from "./safelight";
import { maskTool, resetMaskTool, setMaskTool, subscribeMaskTool } from "./state";
import { masksStage } from "./stages";
import { masksCss } from "./styles";
import { coverageMaskId } from "./viz";

export const PANEL_ID = "core.masks";
export const STYLESHEET_ID = "safelight.masks.styles";

/** The release line: this release's major version (vite.config.ts). */
export const LINE = __SAFELIGHT_LINE__ as Line;

let stop: (() => void)[] = [];

export function activate(host: SafelightAPI): void {
  initRuntime(host);
  resetMaskTool();
  host.registerStylesheet({ id: STYLESHEET_ID, css: masksCss(host.ui.tokens) });
  host.registerProcessingStage(masksStage(LINE));
  host.registerPanel({
    id: PANEL_ID,
    title: "Masking",
    component: MasksPanel,
    defaultDock: { module: "develop", direction: "left", order: 0, width: 240, height: 240 },
    onReset: () => {
      setMaskTool({ selectedMaskId: null, selectedComponentId: null, hoveredMaskId: null });
      void host.stores.useDevelopStore.getState().resetParams(["masks"], "Reset Masking");
    },
  });
  for (const s of stop) s();
  const develop = host.stores.useDevelopStore;
  // An armed mask tool holds the canvas; leaving it lets go.
  let armed = false;
  const followTool = () => {
    const next = maskTool().activeTool === "mask";
    if (next === armed) return;
    armed = next;
    host.develop.setCanvasTool(next ? MASK_TOOL : null);
  };
  // Core tints the coverage of the mask the panel points at: hovered in the
  // list, or selected while its editor is on Coverage.
  let shown: string | null = null;
  const followCoverage = () => {
    const t = maskTool();
    const id = coverageMaskId(develop.getState().params.masks, t.hoveredMaskId, t.selectedMaskId, t.maskTab);
    if (id === shown) return;
    shown = id;
    host.develop.showMaskCoverage(id);
  };
  stop = [
    subscribeMaskTool(followTool),
    subscribeMaskTool(followCoverage),
    develop.subscribe(followCoverage),
    // Another photo: its masks aren't the ones selected, and the tool is left.
    develop.subscribe((s, prev) => {
      if (s.photoId === prev.photoId) return;
      setMaskTool({
        activeTool: "none",
        selectedMaskId: null,
        selectedComponentId: null,
        hoveredMaskId: null,
        maskColorPicking: false,
      });
    }),
  ];
}

export function deactivate(): void {
  for (const s of stop) s();
  stop = [];
  resetMaskTool();
  api.develop.setCanvasTool(null);
  api.develop.showMaskCoverage(null);
}
