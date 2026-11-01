// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The masks, as the develop program draws them. Until Safelight 3.2.0 their
// uniforms were core's own. Core keeps the mask maths and main()'s two mask
// loops, which combine each mask's components into its coverage and apply its
// adjustments; this stage declares what those read (the masks' and the
// components' uniforms, the curve table and compCoverage) at the program's
// masks anchor, and writes nothing into main() itself. Core bakes the brush
// components into its coverage atlas, first and in order, so each takes the
// channel of its place among them. While this extension is away core reads
// no masks.

import { buildMaskCurveLUT, isDefaultToneCurves } from "./curve";
import { HSL_CHANNELS, MAX_MASKS, MAX_MASK_COMPONENTS, isDefaultHSL, maskHasDisplayAdjustments } from "./masks";
import type { Line, MaskAdjustments, MaskComponent, ProcessingStageContribution, UniformDeclaration } from "./safelight";

export const STAGE_ID = "safelight.masks.coverage";

/** Masking's masks: declarations only, at the masks anchor, for main()'s two
 *  mask loops and the mask maths core keeps. Line 1 lacks version 2's flag
 *  for a mask's display adjustments. */
const MASK_HELPERS = `// Coverage of one component (0..1), before add/subtract combine. px is the
// current pixel's working (scene-linear) colour and pxL its luma — used by the
// parametric range masks (luminance / colour).
float compCoverage(int i, vec2 uv, vec3 px, float pxL) {
  int type = uCompType[i];
  vec4 gA = uCompGeoA[i];
  vec4 gB = uCompGeoB[i];
  float m = 0.0;
  if (type == 0) {
    // Linear gradient: ramp 0->1 projected onto the drag direction.
    vec2 p0 = gA.xy;
    vec2 p1 = gA.zw;
    vec2 dir = p1 - p0;
    float len2 = max(dot(dir, dir), 1e-6);
    m = clamp(dot(uv - p0, dir) / len2, 0.0, 1.0);
  } else if (type == 1) {
    // Radial: 1 inside, feathered to 0 at the edge, in screen-proportional space.
    vec2 ctr = gA.xy;
    vec2 rad = max(gA.zw, vec2(1e-4));
    float feather = gB.x;
    float ang = gB.y;
    vec2 q = vec2((uv.x - ctr.x) * uImageAspect, uv.y - ctr.y);
    float ca = cos(ang);
    float sa = sin(ang);
    vec2 qr = vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y);
    vec2 radS = vec2(rad.x * uImageAspect, rad.y);
    float d = length(qr / radS);
    m = 1.0 - smoothstep(1.0 - feather, 1.0, d);
  } else if (type == 3) {
    // Luminance range: 1 inside [lo,hi], soft ramps of width loF/hiF at the ends.
    float lo = gA.x;
    float hi = gA.y;
    float loF = max(gA.z, 1e-4);
    float hiF = max(gA.w, 1e-4);
    float lower = smoothstep(lo - loF, lo, pxL);
    float upper = 1.0 - smoothstep(hi, hi + hiF, pxL);
    m = lower * upper;
  } else if (type == 4) {
    // Colour range: closeness to a target colour, measured in hue + chroma.
    vec3 tgt = gA.xyz;
    float hueRange = max(gA.w, 1e-3);
    float satRange = max(gB.x, 1e-3);
    float smth = gB.y;
    // Compare in a tone-normalized chroma space so exposure differences along
    // the same hue don't break the match. Direction of the colour vector ~ hue,
    // its length relative to luma ~ saturation.
    float tL = max(luma(tgt), 1e-4);
    vec3 pd = px - vec3(pxL);
    vec3 td = tgt - vec3(tL);
    float pLen = length(pd);
    float tLen = length(td);
    float hueDist = 1.0 - (dot(pd, td) / max(pLen * tLen, 1e-4)); // 0 = same hue
    float satDist = abs(pLen / max(pxL, 1e-3) - tLen / tL);       // chroma mismatch
    float hueM = 1.0 - smoothstep(hueRange, hueRange + smth + 1e-3, hueDist);
    float satM = 1.0 - smoothstep(satRange, satRange + smth + 1e-3, satDist);
    // Near-neutral target/pixel have no meaningful hue — fall back to chroma only.
    float chromaW = smoothstep(0.01, 0.05, tLen);
    m = mix(satM, hueM * satM, chromaW);
  } else {
    // Brush: prebaked coverage from the atlas channel. ch < 0 marks a brush with
    // no atlas slot (beyond the 4 the RGBA atlas holds) — it contributes nothing
    // rather than borrowing channel 0's coverage.
    vec4 cov = texture(uMaskTex, uv);
    int ch = uCompBrushCh[i];
    m = ch < 0 ? 0.0 : (ch == 0 ? cov.r : (ch == 1 ? cov.g : (ch == 2 ? cov.b : cov.a)));
  }
  if (uCompInvert[i] == 1) m = 1.0 - m;
  return clamp(m, 0.0, 1.0);
}`;

const ints = (key: string, size: string, length: number): UniformDeclaration => ({
  key,
  glslType: "int",
  length,
  size,
  default: new Array(length).fill(0),
});
const vec4s = (key: string, size: string, length: number): UniformDeclaration => ({
  key,
  glslType: "vec4",
  length,
  size,
  default: new Array(length * 4).fill(0),
});

/** `values`, zero-filled to `length`. */
const padded = (values: number[], length: number): number[] => [...values, ...new Array(length - values.length).fill(0)];

/** A component's shape in the program: its type and two vec4s of geometry. */
function componentGeometry(c: MaskComponent): { type: number; a: number[]; b: number[] } {
  if (c.kind === "linear" && c.linear) return { type: 0, a: [c.linear.x0, c.linear.y0, c.linear.x1, c.linear.y1], b: [0, 0, 0, 0] };
  if (c.kind === "radial" && c.radial)
    return { type: 1, a: [c.radial.cx, c.radial.cy, c.radial.rx, c.radial.ry], b: [c.radial.feather, c.radial.angle, 0, 0] };
  if (c.kind === "lumRange" && c.lumRange) {
    const lr = c.lumRange;
    return { type: 3, a: [lr.lo, lr.hi, lr.loFeather, lr.hiFeather], b: [0, 0, 0, 0] };
  }
  if (c.kind === "colorRange" && c.colorRange) {
    const cr = c.colorRange;
    return { type: 4, a: [cr.r, cr.g, cr.b, cr.hueRange], b: [cr.satRange, cr.smoothness, 0, 0] };
  }
  const type = c.kind === "linear" ? 0 : c.kind === "radial" ? 1 : c.kind === "lumRange" ? 3 : c.kind === "colorRange" ? 4 : 2;
  return { type, a: [0, 0, 0, 0], b: [0, 0, 0, 0] };
}

let maskCurveVersion = 0;

/** The stage of release line `line`. */
export const masksStage = (line: Line): ProcessingStageContribution => ({
  id: STAGE_ID,
  name: "Masking",
  phase: "scene-linear",
  anchor: "masks",
  glsl: "",
  helpers: MASK_HELPERS,
  uniforms: [
    { key: "uMaskCount", glslType: "int", default: 0 },
    ints("uMaskInvert", "MAX_MASKS", MAX_MASKS),
    { key: "uMaskOpacity", glslType: "float", length: MAX_MASKS, size: "MAX_MASKS", default: new Array(MAX_MASKS).fill(0) },
    { key: "uCompCount", glslType: "int", default: 0 },
    ints("uCompMaskIdx", "MAX_COMPONENTS", MAX_MASK_COMPONENTS),
    ints("uCompMode", "MAX_COMPONENTS", MAX_MASK_COMPONENTS),
    ints("uCompType", "MAX_COMPONENTS", MAX_MASK_COMPONENTS),
    ints("uCompInvert", "MAX_COMPONENTS", MAX_MASK_COMPONENTS),
    ints("uCompBrushCh", "MAX_COMPONENTS", MAX_MASK_COMPONENTS),
    vec4s("uCompGeoA", "MAX_COMPONENTS", MAX_MASK_COMPONENTS),
    vec4s("uCompGeoB", "MAX_COMPONENTS", MAX_MASK_COMPONENTS),
    vec4s("uMaskAdj0", "MAX_MASKS", MAX_MASKS),
    vec4s("uMaskAdj1", "MAX_MASKS", MAX_MASKS),
    vec4s("uMaskAdj2", "MAX_MASKS", MAX_MASKS),
    vec4s("uMaskAdj3", "MAX_MASKS", MAX_MASKS),
    ints("uMaskHasHsl", "MAX_MASKS", MAX_MASKS),
    vec4s("uMaskHsl", "MAX_MASKS * 6", MAX_MASKS * 6),
    ints("uMaskHasCurve", "MAX_MASKS", MAX_MASKS),
    ...(line === 1 ? [] : [ints("uMaskHasDisplay", "MAX_MASKS", MAX_MASKS)]),
  ],
  textures: [{ key: "uMaskCurves", kind: "photo" }],
  derive: ({ masks: all }) => {
    const masks = all.slice(0, MAX_MASKS);
    // The brush atlas holds the masks' brush components first, in order, one
    // channel each up to four (renderer.ts updateMaskTexture).
    const brushChannel = new Map<string, number>();
    for (const m of all) {
      for (const c of m.components) {
        if (c.kind === "brush" && c.brush && brushChannel.size < 4) brushChannel.set(c.id, brushChannel.size);
      }
    }
    const comps: { mi: number; c: MaskComponent }[] = [];
    masks.forEach((m, mi) => {
      for (const c of m.components) if (comps.length < MAX_MASK_COMPONENTS) comps.push({ mi, c });
    });
    const shapes = comps.map(({ c }) => componentGeometry(c));
    const hsl = new Array(MAX_MASKS * 24).fill(0);
    masks.forEach((m, i) => {
      if (!m.hsl || isDefaultHSL(m.hsl)) return;
      HSL_CHANNELS.forEach((ch, b) => {
        hsl[i * 24 + b] = m.hsl!.hue[ch] / 100;
        hsl[i * 24 + 8 + b] = m.hsl!.saturation[ch] / 100;
        hsl[i * 24 + 16 + b] = m.hsl!.luminance[ch] / 100;
      });
    });
    // Each mask's curve in its row; the rest stay identity, unread.
    const curves = new Uint8Array(256 * MAX_MASKS * 4);
    for (let row = 0; row < MAX_MASKS; row++) {
      for (let i = 0; i < 256; i++) curves.set([i, i, i, 255], (row * 256 + i) * 4);
    }
    const hasCurve = masks.map((m, i) => {
      if (!m.toneCurve || isDefaultToneCurves(m.toneCurve)) return 0;
      buildMaskCurveLUT(m.toneCurve, curves, i * 256 * 4);
      return 1;
    });
    const adj = (pick: (a: MaskAdjustments) => number[]) =>
      padded(masks.flatMap((m) => pick(m.adj)), MAX_MASKS * 4);
    return {
      uMaskCount: masks.length,
      uMaskInvert: padded(masks.map((m) => (m.invert ? 1 : 0)), MAX_MASKS),
      // Hidden masks apply nothing but still compute coverage, for the view.
      uMaskOpacity: padded(masks.map((m) => (m.visible === false ? 0 : m.opacity / 100)), MAX_MASKS),
      uCompCount: comps.length,
      uCompMaskIdx: padded(comps.map(({ mi }) => mi), MAX_MASK_COMPONENTS),
      uCompMode: padded(comps.map(({ c }) => (c.mode === "subtract" ? 1 : c.mode === "intersect" ? 2 : 0)), MAX_MASK_COMPONENTS),
      uCompType: padded(shapes.map((g) => g.type), MAX_MASK_COMPONENTS),
      uCompInvert: padded(comps.map(({ c }) => (c.invert ? 1 : 0)), MAX_MASK_COMPONENTS),
      uCompBrushCh: padded(comps.map(({ c }) => brushChannel.get(c.id) ?? -1), MAX_MASK_COMPONENTS),
      uCompGeoA: padded(shapes.flatMap((g) => g.a), MAX_MASK_COMPONENTS * 4),
      uCompGeoB: padded(shapes.flatMap((g) => g.b), MAX_MASK_COMPONENTS * 4),
      uMaskAdj0: adj((a) => [a.exposure, a.contrast, a.highlights, a.shadows]),
      uMaskAdj1: adj((a) => [a.saturation, a.temperature, a.tint, a.clarity]),
      uMaskAdj2: adj((a) => [a.sharpness, a.whites, a.blacks, a.vibrance]),
      uMaskAdj3: adj((a) => [a.texture, a.dehaze, 0, 0]),
      uMaskHasHsl: padded(masks.map((m) => (m.hsl && !isDefaultHSL(m.hsl) ? 1 : 0)), MAX_MASKS),
      uMaskHsl: hsl,
      uMaskHasCurve: padded(hasCurve, MAX_MASKS),
      uMaskCurves: { data: curves, width: 256, height: MAX_MASKS, format: "rgba8", version: ++maskCurveVersion },
      ...(line === 1 ? {} : { uMaskHasDisplay: padded(masks.map((m) => (maskHasDisplayAdjustments(m.adj) ? 1 : 0)), MAX_MASKS) }),
    };
  },
});
