// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Core's mask constants and defaults (src/catalog/types.ts), which the masks a
// photo stores are made from.

import type {
  ColorRangeGeo,
  HSLAdjustments,
  LumRangeGeo,
  MaskAdjustments,
} from "./safelight";

/** The most masks a photo draws, and components across all of them: the
 *  program's capacities (MAX_MASKS, MAX_COMPONENTS). */
export const MAX_MASKS = 16;
export const MAX_MASK_COMPONENTS = 24;
/** Brush components the coverage atlas holds: one per RGBA channel. */
export const MAX_BRUSH_MASKS = 4;

export const HSL_CHANNELS = ["red", "orange", "yellow", "green", "aqua", "blue", "purple", "magenta"] as const;

/** The sub-panels a new mask carries. */
export const DEFAULT_MASK_PANELS: string[] = ["core.basic"];

export function defaultMaskAdjustments(): MaskAdjustments {
  return {
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    saturation: 0,
    vibrance: 0,
    temperature: 0,
    tint: 0,
    texture: 0,
    clarity: 0,
    dehaze: 0,
    sharpness: 0,
  };
}

export function defaultLumRange(): LumRangeGeo {
  return { lo: 0.0, hi: 1.0, loFeather: 0.1, hiFeather: 0.1 };
}

export function defaultColorRange(): ColorRangeGeo {
  // Neutral mid-grey target until the user picks a colour.
  return { r: 0.18, g: 0.18, b: 0.18, hueRange: 0.15, satRange: 0.3, smoothness: 0.25 };
}

export function isDefaultHSL(h: HSLAdjustments): boolean {
  return (["hue", "saturation", "luminance"] as const).every((b) => HSL_CHANNELS.every((ch) => h[b][ch] === 0));
}

/** Whether a mask's adjustments include any applied in display space (mask
 *  stage 2), which version 2 skips at identity. */
export function maskHasDisplayAdjustments(a: MaskAdjustments): boolean {
  return (
    a.contrast !== 0 || a.saturation !== 0 || a.vibrance !== 0 ||
    a.whites !== 0 || a.blacks !== 0 || a.clarity !== 0 ||
    a.sharpness !== 0 || a.texture !== 0 || a.dehaze !== 0
  );
}
