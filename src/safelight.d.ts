// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The slice of Safelight's extension API this extension touches, mirrored from
// the app's src/extensions/types.ts, src/extensions/develop-host.tsx,
// src/catalog/types.ts, src/state/develop-store.ts,
// src/state/develop-slices/mask-slice.ts, src/modules/develop/{canvas-tool,
// mask-panels,mask-scope,brush,BrushCursor}.ts(x), src/state/accessibility.ts
// and src/ui/components/{Panel,Slider,ContextMenu}.tsx.
// Extensions are standalone bundles, so the host's source is not on the type
// path; React types come from @types/react (dev only).

import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";

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
export type MaskComponentKind = MaskType | "lumRange" | "colorRange" | "extension";
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

/** What an extension's own component kind keeps: its qualified type
 *  ("{extensionId}.{name}") and the plain-JSON values it chose. */
export interface MaskComponentExtension {
  type: string;
  values: Record<string, unknown>;
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
  extension?: MaskComponentExtension;
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
  /** The modules the panel may be docked in; omitted, every module (Safelight 3.2.8). */
  modules?: readonly string[];
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
  /** "photo": a table derive fills per photo. "dynamic": data core supplies
   *  (line 3's uMaskRasters, the extension components' coverage). */
  textures?: { key: string; kind: "photo" | "dynamic" }[];
  /** The uniforms' values for a photo (official extensions only). */
  derive?: StageDerive;
  /** When the stage changes nothing: uniform key → value. While it holds, the
   *  live view leaves the stage out of a version 2 or later photo's program,
   *  and the first photo that needs it brings it in. Needs Safelight 3.2.1;
   *  older builds ignore it. */
  dormantWhen?: Readonly<Record<string, number>>;
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

export interface BrushSettings {
    size: number;
    feather: number;
    opacity: number;
    flow: number;
}

export type BrushSetting = keyof BrushSettings;

/** The setting a brush shortcut changes and its value after the step, held to
 *  its range; null for an action that isn't a brush shortcut, or one for a
 *  setting `brush` doesn't have, so a tool without flow leaves the flow keys
 *  alone. A canvas tool answers onAction and wants with it. */
declare function stepBrush(action: string, brush: Partial<BrushSettings>): {
    key: BrushSetting;
    value: number;
} | null;

export interface BrushCursorProps {
    /** The pointer in the overlay's layout px (api.develop.framePoint), or
     *  "centre" for the reference ring a size slider shows; null draws nothing. */
    at: {
        x: number;
        y: number;
    } | "centre" | null;
    /** The brush's radius, a share of the photo's height. */
    size: number;
    /** 0 to 1: how much of the radius fades. */
    feather: number;
    /** An erasing (subtracting) brush, drawn red and dashed. */
    erase?: boolean;
}

declare function BrushCursor({ at, size, feather, erase }: BrushCursorProps): import("react").JSX.Element | null;

export interface ContextMenuItem {
    label: string;
    /** A small glyph before the label (about 14 px); decorative, so the label
     *  alone names the item. Needs Safelight 3.2.7. */
    icon?: ReactNode;
    onClick: () => void;
    /** Render in the red danger colour (e.g. Remove). */
    danger?: boolean;
    disabled?: boolean;
    /** A tooltip on the item, the reason it is disabled, say. */
    title?: string;
}

/** A horizontal divider between groups of items. */
export type ContextMenuEntry = ContextMenuItem | "separator";

export interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuEntry[];
    onClose: () => void;
}

/** A click on the photo, in source UV, with the modifiers held. */
export interface MaskComponentPoint {
  u: number;
  v: number;
  alt: boolean;
  shift: boolean;
}

export interface MaskComponentControlsProps {
  values: Record<string, unknown>;
  setValues(patch: Record<string, unknown>): void;
  commit(label: string): void;
}

/** A kind of mask component an extension offers (Safelight 3.2.8). */
export interface RegisteredMaskComponentKind {
  /** "{extensionId}.{name}". */
  type: string;
  owner: string;
  name: string;
  label: string;
  icon?: string;
  commitLabel?: string;
  generation: number;
  create(): Record<string, unknown>;
  onPoint?(values: Record<string, unknown>, p: MaskComponentPoint): Record<string, unknown> | null;
  markers?(values: Record<string, unknown>): { u: number; v: number; subtract?: boolean }[];
  Controls?: ComponentType<MaskComponentControlsProps>;
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
    /** The right-click menu core surfaces use, placed at client `x`/`y` and
     *  kept in the viewport. Closes on an outside click, Escape, scroll, or
     *  choosing an item. */
    ContextMenu: (props: ContextMenuProps) => import("react").JSX.Element;
  };
  stores: {
    useDevelopStore: StoreApi<DevelopStoreState>;
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
    /** React hook: the mask component kinds extensions have registered, in
     *  the order they came. Needs Safelight 3.2.8. */
    useMaskComponentKinds?(): readonly RegisteredMaskComponentKind[];
    /** The raster channel (0 to 3) each extension component of `masks` is
     *  packed into, by component id; the fifth and later get -1. Needs
     *  Safelight 3.2.8. */
    maskRasterChannels?(masks: readonly Mask[]): Record<string, number>;
    /** A hint that this extension's stages are about to be needed: the live
     *  view starts building, in the background, the program with them in.
     *  Needs Safelight 3.2.4. */
    prewarmStages?(): void;
    /** The official brush every painting tool shares: Masking's. A tool holds
     *  its own settings and starts them from `defaults` (size is a radius as a
     *  share of the photo's height, as a BrushDab's; feather, opacity and flow
     *  run 0 to 1). `actions` are the rebindable brush shortcuts' keybinding
     *  ids ([ and ] size, Shift+[ and Shift+] feather, comma and period
     *  opacity, Shift+comma and Shift+period flow), which core hands only to the
     *  held canvas tool: answer CanvasTool.onAction and wants with `step`,
     *  passing the settings the tool has. It returns the setting a shortcut
     *  changes and its new value, held to its range, or null for one the tool
     *  doesn't have, which core then leaves alone. Needs Safelight 3.2.7. */
    brush: {
        defaults: Readonly<BrushSettings>;
        actions: readonly string[];
        step: typeof stepBrush;
    };
    /** The official brush ring, for a canvas tool's overlay: the brush's edge
     *  and its feathered core at `at` (overlay layout px, from framePoint; or
     *  "centre", the reference a size slider shows while dragged), sized as a
     *  dab paints in the photo through any crop, zoom or Perspective; red and
     *  dashed for an erasing brush. It draws around the crosshair cursor, as
     *  Masking's brush does. Needs Safelight 3.2.7. */
    BrushCursor: typeof BrushCursor;
    /** The pointer in `el`'s layout px: the space an overlay's `rect`, the
     *  mapping helpers and CSS left/top use. Interface scale zooms the page,
     *  so clientX minus the element's left is off by the zoom. Needs Safelight
     *  3.2.7. */
    framePoint(el: Element, clientX: number, clientY: number): {
        x: number;
        y: number;
    };
  };
  /** Needs Safelight 3.2.8. */
  extensions?: {
    /** React hook: true once the installed extensions have finished starting at launch. */
    useSettled(): boolean;
  };
  accessibility: {
    /** React hook: whether keyboard canvas editing is on. */
    useKeyboardCanvasEditing(): boolean;
  };
  cursors: {
    /** A cursor token's CSS cursor value, as the theme draws it. */
    resolve(token: string): string;
  };
  ui: {
    tokens: UiTokens;
    /** Core's button, in the app's look. */
    Button: ComponentType<ButtonProps>;
    /** Core's row of mutually exclusive choices. */
    SegmentedControl: ComponentType<SegmentedControlProps>;
  };
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  /** Render as the selected/active state (accent fill), overriding the variant. */
  active?: boolean;
  /** Stretch to the container width. */
  full?: boolean;
}

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  title?: string;
}

export interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  size?: "sm" | "md";
}

export interface ExtensionModule {
  activate(api: SafelightAPI): void;
  deactivate?(): void;
}
