// A stand-in Safelight API over real React and zustand. The develop store holds
// the crop, straighten, transform, masks and process version the way core's
// does, patches and seeds masks as core's mask actions do, and records every
// write; the canvas tool is kept as core would keep it, one owner at a time.
// Core's Panel draws its children, MaskScope hands its mask id to what it
// draws, and core's Slider is a stub that keeps the props it was last
// rendered with, so a test can drive it the way the real one would. The mask
// colour probe answers with a colour the test sets, at once or when released.
// The official brush hands out the defaults the test asks for, steps without
// holding to a range (core's own tests cover that) and records what it was
// asked; its ring is a stub that keeps the props of each one drawn. Extension
// mask component kinds are held in a list the test sets; maskRasterChannels
// places extension components in order, four to a photo as core does.

import * as React from "react";
import { create } from "zustand";
import type {
  BrushCursorProps,
  BrushSettings,
  ContextMenuProps,
  CanvasTool,
  DevelopOverlayState,
  DevelopParams,
  DevelopStoreState,
  HSLAdjustments,
  Mask,
  MaskAdjustments,
  RegisteredMaskComponentKind,
  MaskPanelEntry,
  PanelContribution,
  PanelProps,
  ProcessingStageContribution,
  SafelightAPI,
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

/** The official brush's defaults as core hands them out. */
export const BRUSH_DEFAULTS: Readonly<BrushSettings> = Object.freeze({ size: 0.08, feather: 0.5, opacity: 1, flow: 1 });

const BRUSH_STEPS: Record<string, { key: keyof BrushSettings; by: number }> = {
  "brush.smaller": { key: "size", by: -0.01 },
  "brush.larger": { key: "size", by: 0.01 },
  "brush.featherDown": { key: "feather", by: -0.05 },
  "brush.featherUp": { key: "feather", by: 0.05 },
  "brush.opacityDown": { key: "opacity", by: -0.1 },
  "brush.opacityUp": { key: "opacity", by: 0.1 },
  "brush.flowDown": { key: "flow", by: -0.1 },
  "brush.flowUp": { key: "flow", by: 0.1 },
};

export interface BrushStepAsked {
  action: string;
  brush: Partial<BrushSettings>;
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
  /** How many times the extension hinted its stages are about to be needed. */
  prewarms(): number;
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
  /** Each brush step the extension asked core for. */
  brushSteps: BrushStepAsked[];
  /** The props of each official brush ring drawn now that draws something. */
  brushCursors(): BrushCursorProps[];
  /** Interface scale as framePoint applies it. */
  setFrameZoom(zoom: number): void;
  /** The props of the core menu open now, or null. */
  menu(): ContextMenuProps | null;
  /** The mask component kinds extensions have registered, as the hook gives them. */
  setKinds(kinds: readonly RegisteredMaskComponentKind[]): void;
  /** Whether the installed extensions have finished starting (true to begin with). */
  setSettled(on: boolean): void;
}

export function fakeApi({
  params = {} as Partial<DevelopParams>,
  brushDefaults = BRUSH_DEFAULTS,
  kindsApi = true,
  settledApi = true,
} = {}): Rig {
  const calls: DevelopCall[] = [];
  const panels: PanelContribution[] = [];
  const stages: ProcessingStageContribution[] = [];
  const stylesheets: StylesheetContribution[] = [];
  const coverage: (string | null)[] = [];
  const probes: { u: number; v: number }[] = [];
  const canvas = create<{ held: { owner: "self" | "other"; tool: CanvasTool } | null }>(() => ({ held: null }));
  const maskPanels = create<{ entries: MaskPanelEntry[] }>(() => ({ entries: [] }));
  const keyboard = create<{ on: boolean }>(() => ({ on: false }));
  const settled = create<{ on: boolean }>(() => ({ on: true }));
  const kinds = create<{ list: readonly RegisteredMaskComponentKind[] }>(() => ({ list: [] }));
  const sliderProps = new Map<number, SliderProps>();
  let nextSlider = 0;
  let probeColour: Rgb | null = [0.42, 0.18, 0.07];
  let holding = false;
  let prewarms = 0;
  let pending: (() => void)[] = [];
  const brushSteps: BrushStepAsked[] = [];
  const cursors = new Map<number, BrushCursorProps>();
  let nextCursor = 0;
  let frameZoom = 1;
  let openMenu: ContextMenuProps | null = null;

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

  function BrushCursor(props: BrushCursorProps) {
    const id = React.useRef(nextCursor++).current;
    cursors.set(id, props);
    React.useEffect(() => () => void cursors.delete(id), [id]);
    return null;
  }

  function stepBrush(action: string, brush: Partial<BrushSettings>) {
    brushSteps.push({ action, brush: { ...brush } });
    const s = BRUSH_STEPS[action];
    const now = s ? brush[s.key] : undefined;
    return s && now !== undefined ? { key: s.key, value: Math.round((now + s.by) * 1000) / 1000 } : null;
  }

  function MaskScope({ maskId, children }: { maskId: string; children: React.ReactNode }) {
    return React.createElement(ScopedMask.Provider, { value: maskId }, children);
  }

  // Core's menu as far as a panel sees it: its items, a choice runs one and
  // closes the menu; Escape, scroll and an outside click call onClose.
  function ContextMenu(props: ContextMenuProps) {
    openMenu = props;
    React.useEffect(() => () => void (openMenu = null), []);
    return React.createElement(
      "div",
      { role: "menu" },
      props.items.map((item, i) =>
        item === "separator"
          ? React.createElement("div", { key: `sep-${i}`, role: "separator" })
          : React.createElement(
              "button",
              {
                key: item.label,
                role: "menuitem",
                disabled: item.disabled,
                title: item.title,
                onClick: () => {
                  item.onClick();
                  props.onClose();
                },
              },
              item.label,
            ),
      ),
    );
  }

  const api: SafelightAPI = {
    version: 1,
    extensionId: "safelight.masks",
    react: React,
    registerPanel: (c) => void panels.push(c),
    registerProcessingStage: (c) => void stages.push(c),
    registerStylesheet: (c) => void stylesheets.push(c),
    components: { Panel, Slider, MaskScope, ContextMenu },
    stores: { useDevelopStore: develop },
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
      ...(kindsApi
        ? {
            useMaskComponentKinds: () => kinds((s) => s.list),
            maskRasterChannels: (masks: readonly Mask[]) => {
              const channels: Record<string, number> = {};
              let next = 0;
              for (const m of masks)
                for (const c of m.components) if (c.kind === "extension") channels[c.id] = next < 4 ? next++ : -1;
              return channels;
            },
          }
        : {}),
      prewarmStages: () => {
        prewarms++;
      },
      brush: { defaults: brushDefaults, actions: Object.keys(BRUSH_STEPS), step: stepBrush },
      BrushCursor,
      framePoint: (el, clientX, clientY) => {
        const r = el.getBoundingClientRect();
        return { x: (clientX - r.left) / frameZoom, y: (clientY - r.top) / frameZoom };
      },
    },
    ...(settledApi ? { extensions: { useSettled: () => settled((s) => s.on) } } : {}),
    accessibility: { useKeyboardCanvasEditing: () => keyboard((s) => s.on) },
    cursors: { resolve: (token) => (token === "crosshair" ? "crosshair" : "default") },
    ui: {
      tokens: TOKENS,
      // Core's kit Button and SegmentedControl, standing in with their look as
      // data so a test can tell them from hand-rolled ones.
      Button: ({ variant = "secondary", size = "md", active = false, full = false, ...rest }) =>
        React.createElement("button", {
          type: "button",
          "data-kit": "button",
          "data-variant": variant,
          "data-size": size,
          "data-active": String(active),
          "data-full": String(full),
          ...rest,
        }),
      SegmentedControl: ({ value, onChange, options, size = "md" }) =>
        React.createElement(
          "div",
          { role: "group", "data-kit": "segmented", "data-size": size },
          options.map((o) =>
            React.createElement(
              "button",
              { key: o.value, type: "button", title: o.title, "aria-pressed": o.value === value, onClick: () => onChange(o.value) },
              o.label,
            ),
          ),
        ),
    },
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
    prewarms: () => prewarms,
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
    brushSteps,
    brushCursors: () => [...cursors.values()].filter((c) => c.at !== null),
    menu: () => openMenu,
    setKinds: (list) => kinds.setState({ list }),
    setSettled: (on) => settled.setState({ on }),
    setFrameZoom: (zoom) => {
      frameZoom = zoom;
    },
  };
}
