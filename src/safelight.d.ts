// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The slice of Safelight's extension API this extension touches, mirrored from
// the app's src/extensions/types.ts, src/extensions/develop-host.tsx,
// src/catalog/types.ts, src/state/{develop-store,settings-store}.ts,
// src/state/develop-slices/mask-slice.ts, src/modules/develop/{canvas-tool,
// mask-panels,mask-scope}.ts(x), src/state/accessibility.ts and
// src/ui/components/{Panel,Slider}.tsx.
// Extensions are standalone bundles, so the host's source is not on the type
// path; React types come from @types/react (dev only).

import type { ComponentType, ReactNode } from "react";

/** A release line: the process version its stage text was written for, and
 *  the extension's major version. */
export type Line = 1 | 2 | 3;

export interface StoreApi<T> {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState(): T;
  setState(partial: Partial<T> | ((s: T) => Partial<T>)): void;
  subscribe(listener: (state: T, prev: T) => void): () => void;
}

/** A region of the transformed image, 0 to 1 of the image, y down. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TransformParams {
  perspectiveV: number;
  perspectiveH: number;
  aspect: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  flipH: boolean;
  flipV: boolean;
}

export interface CurvePoint {
  /** 0 to 1 input. */
  x: number;
  /** 0 to 1 output. */
  y: number;
}

export interface ToneCurves {
  /** The master curve, applied to all channels first. */
  rgb: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export type HSLChannel = "red" | "orange" | "yellow" | "green" | "aqua" | "blue" | "purple" | "magenta";
export type HSLValues = Record<HSLChannel, number>;

export interface HSLAdjustments {
  hue: HSLValues;
  saturation: HSLValues;
  luminance: HSLValues;
}

/** A mask's own adjustments: relative strengths, -100 to 100, 0 = none. */
export interface MaskAdjustments {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  saturation: number;
  vibrance: number;
  /** Relative warm (+) / cool (-). */
  temperature: number;
  /** Magenta (+) / green (-). */
  tint: number;
  texture: number;
  clarity: number;
  dehaze: number;
  sharpness: number;
}

/** The geometric tools drawn on the canvas. */
export type MaskType = "linear" | "radial" | "brush";
export type MaskComponentKind = MaskType | "lumRange" | "colorRange";
export type MaskComponentMode = "add" | "subtract" | "intersect";

/** One freehand brush dab, in source UV; radius in image-height units. */
export interface BrushDab {
  x: number;
  y: number;
  radius: number;
  erase: boolean;
  /** 0 to 1 edge softness, captured from the brush at paint time. */
  feather: number;
  /** 0 to 1 coverage ceiling of its stroke; absent = 1. */
  opacity?: number;
  /** 0 to 1 per-dab deposit; absent = 1. */
  flow?: number;
  /** First dab of a pointer stroke. */
  strokeStart?: boolean;
}

/** Linear gradient: the effect ramps 0 to 1 from p0 to p1 (source UV). */
export interface LinearMaskGeo {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Radial, in source UV: centre, per-axis radii, edge feather (0 to 1 of the
 *  radius) and rotation (radians). */
export interface RadialMaskGeo {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  feather: number;
  angle: number;
}

export interface BrushMaskGeo {
  dabs: BrushDab[];
  /** 0 to 1 edge softness of each dab. */
  feather: number;
}

/** Luminance range: luma in [lo, hi], soft ramps at each end, all 0 to 1. */
export interface LumRangeGeo {
  lo: number;
  hi: number;
  loFeather: number;
  hiFeather: number;
}

/** Colour range: closeness to a target colour, stored scene-linear (as the
 *  mask stage sees it); tolerances and edge softness 0 to 1. */
export interface ColorRangeGeo {
  r: number;
  g: number;
  b: number;
  hueRange: number;
  satRange: number;
  smoothness: number;
}

export interface MaskComponent {
  id: string;
  kind: MaskComponentKind;
  mode: MaskComponentMode;
  /** Inverts this component's own coverage before combining. */
  invert: boolean;
  linear?: LinearMaskGeo;
  radial?: RadialMaskGeo;
  brush?: BrushMaskGeo;
  lumRange?: LumRangeGeo;
  colorRange?: ColorRangeGeo;
}

export interface Mask {
  id: string;
  name: string;
  /** False mutes the mask (no effect), still listed. */
  visible: boolean;
  /** Inverts the whole combined coverage. */
  invert: boolean;
  /** 0 to 100 overall strength. */
  opacity: number;
  adj: MaskAdjustments;
  /** The sub-panels it carries (registered panel ids). */
  panels: string[];
  hsl?: HSLAdjustments;
  toneCurve?: ToneCurves;
  /** Extension params, by qualified key. */
  bag?: Record<string, unknown>;
  /** At least one, combined in order. */
  components: MaskComponent[];
}

/** The develop params this extension reads. Core's carry many more fields. */
export interface DevelopParams {
  crop: CropRect;
  /** Degrees, -45 to 45. */
  straighten: number;
  transform: TransformParams;
  masks: Mask[];
  processVersion: number;
}

export interface DevelopStoreState {
  params: DevelopParams;
  /** The open photo, or null. */
  photoId: string | null;
  /** Panels whose preview-off eye is held, by panel id. */
  bypassedPanels: Record<string, boolean>;
  setParam<K extends keyof DevelopParams>(key: K, value: DevelopParams[K]): void;
  /** End a gesture: one undoable history step under `label`. */
  commitEdit(label: string): Promise<void>;
  /** Put `keys` back to their defaults as one undoable step under `label`. */
  resetParams(keys: (keyof DevelopParams)[], label: string): Promise<void>;
  /** Patch a mask; an undefined value drops its field. */
  updateMask(id: string, patch: Partial<Mask>): void;
  updateMaskAdj(id: string, patch: Partial<MaskAdjustments>): void;
  /** Set a sub-panel's values on a mask to their defaults (added, or the mask
   *  reset), or clear them (taken off). */
  seedMaskPanelValues(maskId: string, owns: readonly string[]): void;
  clearMaskPanelValues(maskId: string, owns: readonly string[]): void;
}

export interface SettingsState {
  /** Preferences ▸ Interface scale: the CSS zoom on the app's body. */
  uiScale: number;
}

export interface PanelDockDefault {
  module: "library" | "develop";
  direction: "left" | "right" | "bottom";
  order?: number;
  width?: number;
  height?: number;
}

export interface PanelContribution {
  /** Globally unique, e.g. "core.crop" or "my-ext.fancy-curves". */
  id: string;
  title: string;
  component: ComponentType;
  defaultDock?: PanelDockDefault;
  /** Right-clicking the panel's dock header offers "Reset to defaults". */
  onReset?: () => void;
}

export interface UniformDeclaration {
  key: string;
  glslType: "int" | "float" | "vec4";
  default: number | number[];
  /** An array of this many. */
  length?: number;
  /** The constant the array is declared with (core's MAX_MASKS, MAX_COMPONENTS). */
  size?: string;
}

/** A photo texture's data, as derive returns it. */
export interface StageTextureData {
  data: Uint8Array;
  width: number;
  height: number;
  format: "rgba8";
  /** Bumped when `data` changes. */
  version: number;
}

export type StageValue = number | number[];

export type StageDerive = (params: DevelopParams) => Record<string, StageValue | StageTextureData>;

export interface ProcessingStageContribution {
  id: string;
  name: string;
  phase: "scene-linear";
  priority?: number;
  /** Where in the develop program the block runs (official stages only). */
  anchor?: "masks";
  /** The stage's block in main(); empty: the stage only declares. */
  glsl: string;
  /** Functions main() calls, declared ahead of it. */
  helpers?: string;
  uniforms: UniformDeclaration[];
  /** "photo": a table derive fills per photo. */
  textures?: { key: string; kind: "photo" }[];
  /** The uniforms' values for a photo (official extensions only). */
  derive?: StageDerive;
}

export interface StylesheetContribution {
  id: string;
  css: string;
}

/** The theme's CSS variables as `var(--color-…)` strings. */
export interface UiTokens {
  readonly accent: string;
  readonly surface2: string;
  readonly surface3: string;
  readonly borderSubtle: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly sliderFill: string;
  readonly labelRed: string;
  readonly labelYellow: string;
  readonly labelBlue: string;
}

export interface PanelProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** Double-clicking the track resets to this. */
  defaultValue?: number;
  onChange(value: number): void;
  onCommit?(): void;
}

export interface OverlayRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The develop canvas's mapping, for an overlay. */
export interface DevelopOverlayState {
  /** Where the live frame buffer sits on the canvas: all of the image at fit,
   *  the zoom window once zoomed in; null until first layout. */
  rect: OverlayRect | null;
  /** The region of the transformed image the frame shows; null until first
   *  layout. */
  region: CropRect | null;
  /** The decoded image's width over its height. */
  imageAspect: number;
}

/** An on-image tool holding the develop canvas. */
export interface CanvasTool {
  /** Drawn over the image inside the view; `rect` is the box the frame shows. */
  overlay: ComponentType<{ rect: OverlayRect }>;
  /** Whether zoom and pan still reach the canvas under the overlay. */
  zoomable?: boolean;
  /** Escape was pressed: core lets the tool go after this. */
  onEscape?(): void;
  /** A shortcut's action pressed while the tool is held: whether it took it. */
  onAction?(action: string): boolean;
  /** Whether the tool would take `action` now, without acting. */
  wants?(action: string): boolean;
}

/** A panel that can be added to a mask. */
export interface MaskPanelEntry {
  /** The panel's id: what a mask's `panels` list holds. */
  id: string;
  title: string;
  /** The values the sub-panel owns on a mask. */
  owns: readonly string[];
  component: ComponentType;
  /** Whether it owns an extension's params, which run in the mask only at
   *  the current processing. */
  extensionParams: boolean;
}

export interface SafelightAPI {
  version: 1;
  extensionId: string;
  react: typeof import("react");
  registerPanel(c: PanelContribution): void;
  registerProcessingStage(c: ProcessingStageContribution): void;
  registerStylesheet(c: StylesheetContribution): void;
  components: {
    /** Core's collapsible panel; inside a dock panel of the same title it
     *  draws its content only. */
    Panel: ComponentType<PanelProps>;
    Slider: ComponentType<SliderProps>;
    /** Binds its children (a mask sub-panel's component) to mask `maskId`. */
    MaskScope: ComponentType<{ maskId: string; children: ReactNode }>;
  };
  stores: {
    useDevelopStore: StoreApi<DevelopStoreState>;
    useSettings: StoreApi<SettingsState>;
  };
  develop: {
    /** React hook: the canvas mapping, for an overlay. */
    useDevelopOverlay(): DevelopOverlayState;
    /** Hold the canvas with an on-image tool, or with null let go of it. */
    setCanvasTool(tool: CanvasTool | null): void;
    /** React hook: whether this extension holds the canvas tool. */
    useCanvasToolHeld(): boolean;
    /** The colour a mask's colour range compares at (u, v), 0 to 1 across the
     *  live frame buffer: scene-linear. Null with no frame. */
    probeMaskColour(u: number, v: number): Promise<readonly [number, number, number] | null>;
    /** Tint mask `maskId`'s coverage over the image, or with null none. */
    showMaskCoverage(maskId: string | null): void;
    /** React hook: the panels that can be added to a mask, in their order. */
    useMaskPanels(): MaskPanelEntry[];
    /** React hook: whether the open photo is stored with an older process
     *  version than the current one, where an extension's values in a mask
     *  don't run. */
    useOlderProcessing(): boolean;
  };
  accessibility: {
    /** React hook: whether keyboard canvas editing is on. */
    useKeyboardCanvasEditing(): boolean;
  };
  cursors: {
    /** A cursor token's CSS cursor value, as the theme draws it. */
    resolve(token: string): string;
  };
  ui: { tokens: UiTokens };
}

export interface ExtensionModule {
  activate(api: SafelightAPI): void;
  deactivate?(): void;
}
