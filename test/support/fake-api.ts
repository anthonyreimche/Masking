// A stand-in Safelight API over real React and zustand. The develop store holds
// the crop, straighten, transform, masks and process version the way core's
// does, patches and seeds masks as core's mask actions do, and records every
// write; the canvas tool is kept as core would keep it, one owner at a time.
// Core's Panel draws its children, MaskScope hands its mask id to what it
// draws, and core's Slider is a stub that keeps the props it was last
// rendered with, so a test can drive it the way the real one would. The mask
// colour probe answers with a colour the test sets, at once or when released.

import * as React from "react";
import { create } from "zustand";
import type {
  CanvasTool,
  DevelopOverlayState,
  DevelopParams,
  DevelopStoreState,
  HSLAdjustments,
  Mask,
  MaskAdjustments,
  MaskPanelEntry,
  PanelContribution,
  PanelProps,
  ProcessingStageContribution,
  SafelightAPI,
  SettingsState,
  SliderProps,
  StoreApi,
  StylesheetContribution,
  ToneCurves,
  UiTokens,
} from "../../src/safelight";
import { DEFAULT_CROP, DEFAULT_TRANSFORM } from "../../src/defaults";
import { HSL_CHANNELS, defaultMaskAdjustments } from "../../src/masks";

export type DevelopCall =
  | { setParam: keyof DevelopParams; value: unknown }
  | { commitEdit: string }
  | { resetParams: (keyof DevelopParams)[]; label: string };

export type Rgb = readonly [number, number, number];

export const TOKENS: UiTokens = {
  accent: "var(--color-accent)",
  surface2: "var(--color-surface-2)",
  surface3: "var(--color-surface-3)",
  borderSubtle: "var(--color-border-subtle)",
  textPrimary: "var(--color-text-primary)",
  textSecondary: "var(--color-text-secondary)",
  textMuted: "var(--color-text-muted)",
  sliderFill: "var(--color-slider-fill)",
  labelRed: "var(--color-label-red)",
  labelYellow: "var(--color-label-yellow)",
  labelBlue: "var(--color-label-blue)",
};

/** The process version the fake core calls current. */
export const CURRENT_PROCESS_VERSION = 3;

export const PARAMS: DevelopParams = {
  crop: { ...DEFAULT_CROP },
  straighten: 0,
  transform: { ...DEFAULT_TRANSFORM },
  masks: [],
  processVersion: 3,
};

export function defaultHSL(): HSLAdjustments {
  const zero = () => Object.fromEntries(HSL_CHANNELS.map((ch) => [ch, 0])) as HSLAdjustments["hue"];
  return { hue: zero(), saturation: zero(), luminance: zero() };
}

export function defaultToneCurves(): ToneCurves {
  const line = () => [{ x: 0, y: 0 }, { x: 1, y: 1 }];
  return { rgb: line(), red: line(), green: line(), blue: line() };
}

const ADJ_KEYS = new Set(Object.keys(defaultMaskAdjustments()));

/** The mask id a MaskScope hands to what it draws. */
export const ScopedMask = React.createContext<string | null>(null);

export interface Rig {
  api: SafelightAPI;
  develop: StoreApi<DevelopStoreState>;
  overlay: StoreApi<DevelopOverlayState>;
  calls: DevelopCall[];
  panels: PanelContribution[];
  stages: ProcessingStageContribution[];
  stylesheets: StylesheetContribution[];
  /** Each mask core was asked to tint, in order. */
  coverage: (string | null)[];
  /** Each point the colour probe was asked for. */
  probes: { u: number; v: number }[];
  /** The canvas tool this extension holds, or null. */
  held(): CanvasTool | null;
  /** Another extension takes the canvas. */
  takeCanvas(): void;
  setMaskPanels(entries: MaskPanelEntry[]): void;
  setKeyboardEditing(on: boolean): void;
  /** What the probe answers with. */
  setProbeColour(rgb: Rgb | null): void;
  /** Hold the probe's answers until release(). */
  holdProbes(): void;
  release(): void;
  /** The latest props of each slider drawn in `root`, in document order. */
  sliders(root: ParentNode): SliderProps[];
}

export function fakeApi({ params = {} as Partial<DevelopParams> } = {}): Rig {
  const calls: DevelopCall[] = [];
  const panels: PanelContribution[] = [];
  const stages: ProcessingStageContribution[] = [];
  const stylesheets: StylesheetContribution[] = [];
  const coverage: (string | null)[] = [];
  const probes: { u: number; v: number }[] = [];
  const canvas = create<{ held: { owner: "self" | "other"; tool: CanvasTool } | null }>(() => ({ held: null }));
  const maskPanels = create<{ entries: MaskPanelEntry[] }>(() => ({ entries: [] }));
  const keyboard = create<{ on: boolean }>(() => ({ on: false }));
  const sliderProps = new Map<number, SliderProps>();
  let nextSlider = 0;
  let probeColour: Rgb | null = [0.42, 0.18, 0.07];
  let holding = false;
  let pending: (() => void)[] = [];

  const develop: StoreApi<DevelopStoreState> = create<DevelopStoreState>()((set, get) => {
    const mapMask = (id: string, map: (m: Mask) => Mask) =>
      set((s) => ({ params: { ...s.params, masks: s.params.masks.map((m) => (m.id === id ? map(m) : m)) } }));
    const owned = (maskId: string, owns: readonly string[], seed: boolean) => {
      const adj: Partial<MaskAdjustments> = {};
      const patch: Partial<Mask> = {};
      const bag: Record<string, unknown> = {};
      for (const key of owns) {
        if (ADJ_KEYS.has(key)) adj[key as keyof MaskAdjustments] = 0;
        else if (key === "hsl") patch.hsl = seed ? defaultHSL() : undefined;
        else if (key === "toneCurve") patch.toneCurve = seed ? defaultToneCurves() : undefined;
        else bag[key] = seed ? 1 : undefined;
      }
      get().updateMaskAdj(maskId, adj);
      get().updateMask(maskId, patch);
      mapMask(maskId, (m) => {
        const next: Record<string, unknown> = { ...m.bag };
        for (const [key, value] of Object.entries(bag)) {
          if (value === undefined) delete next[key];
          else next[key] = value;
        }
        const { bag: _, ...rest } = m;
        return Object.keys(next).length > 0 ? { ...rest, bag: next } : rest;
      });
    };
    return {
      params: { ...PARAMS, ...params },
      photoId: "p",
      bypassedPanels: {},
      setParam: (key, value) => {
        calls.push({ setParam: key, value });
        set((s) => ({ params: { ...s.params, [key]: value } }));
      },
      commitEdit: async (label) => {
        calls.push({ commitEdit: label });
      },
      resetParams: async (keys, label) => {
        calls.push({ resetParams: keys, label });
        set({ params: { ...PARAMS } });
      },
      updateMask: (id, patch) =>
        mapMask(id, (m) => {
          const next: Record<string, unknown> = { ...m, ...patch };
          for (const [key, value] of Object.entries(patch)) if (value === undefined) delete next[key];
          return next as unknown as Mask;
        }),
      updateMaskAdj: (id, patch) => mapMask(id, (m) => ({ ...m, adj: { ...m.adj, ...patch } })),
      // An extension key's registered default stands as 1 here.
      seedMaskPanelValues: (maskId, owns) => owned(maskId, owns, true),
      clearMaskPanelValues: (maskId, owns) => owned(maskId, owns, false),
    };
  });
  const settings: StoreApi<SettingsState> = create<SettingsState>()(() => ({ uiScale: 1 }));
  const overlay: StoreApi<DevelopOverlayState> = create<DevelopOverlayState>()(() => ({
    rect: { x: 0, y: 0, w: 1000, h: 1000 },
    region: null,
    imageAspect: 1,
  }));

  function Panel({ children, title }: PanelProps) {
    return React.createElement("section", { "aria-label": title }, children);
  }

  function Slider(props: SliderProps) {
    const id = React.useRef(nextSlider++).current;
    sliderProps.set(id, props);
    return React.createElement("div", { "data-slider": id }, `${props.label} ${props.value}`);
  }

  function MaskScope({ maskId, children }: { maskId: string; children: React.ReactNode }) {
    return React.createElement(ScopedMask.Provider, { value: maskId }, children);
  }

  const api: SafelightAPI = {
    version: 1,
    extensionId: "safelight.masks",
    react: React,
    registerPanel: (c) => void panels.push(c),
    registerProcessingStage: (c) => void stages.push(c),
    registerStylesheet: (c) => void stylesheets.push(c),
    components: { Panel, Slider, MaskScope },
    stores: { useDevelopStore: develop, useSettings: settings },
    develop: {
      useDevelopOverlay: () => overlay(),
      setCanvasTool: (tool) => {
        if (tool) canvas.setState({ held: { owner: "self", tool } });
        else if (canvas.getState().held?.owner === "self") canvas.setState({ held: null });
      },
      useCanvasToolHeld: () => canvas((s) => s.held?.owner === "self"),
      probeMaskColour: (u, v) => {
        probes.push({ u, v });
        return new Promise((resolve) => {
          const answer = () => resolve(probeColour);
          if (holding) pending.push(answer);
          else answer();
        });
      },
      showMaskCoverage: (maskId) => void coverage.push(maskId),
      useMaskPanels: () => maskPanels((s) => s.entries),
      useOlderProcessing: () => develop((s) => s.params.processVersion < CURRENT_PROCESS_VERSION),
    },
    accessibility: { useKeyboardCanvasEditing: () => keyboard((s) => s.on) },
    cursors: { resolve: (token) => (token === "crosshair" ? "crosshair" : "default") },
    ui: { tokens: TOKENS },
  };

  return {
    api,
    develop,
    overlay,
    calls,
    panels,
    stages,
    stylesheets,
    coverage,
    probes,
    held: () => {
      const held = canvas.getState().held;
      return held?.owner === "self" ? held.tool : null;
    },
    takeCanvas: () => canvas.setState({ held: { owner: "other", tool: { overlay: () => null } } }),
    setMaskPanels: (entries) => maskPanels.setState({ entries }),
    setKeyboardEditing: (on) => keyboard.setState({ on }),
    setProbeColour: (rgb) => {
      probeColour = rgb;
    },
    holdProbes: () => {
      holding = true;
    },
    release: () => {
      const answers = pending;
      pending = [];
      for (const answer of answers) answer();
    },
    sliders: (root) =>
      [...root.querySelectorAll("[data-slider]")].map((el) => {
        const props = sliderProps.get(Number(el.getAttribute("data-slider")));
        if (!props) throw new Error("a slider without props");
        return props;
      }),
  };
}
