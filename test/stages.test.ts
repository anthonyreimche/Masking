// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// An extension's mask component (Safelight 3.2.8) at line 3: its coverage is a
// channel of the raster core packs for the photo (uMaskRasters), inversion
// included, so the program reads it as it is. Lines 1 and 2 never read one.

import { describe, expect, it } from "vitest";
import type { DevelopParams, Mask, MaskComponent } from "../src/safelight";
import { DEFAULT_CROP, DEFAULT_TRANSFORM } from "../src/defaults";
import { DEFAULT_MASK_PANELS, defaultMaskAdjustments } from "../src/masks";
import { masksStage, rasterChannels } from "../src/stages";

const fuzzy = (id: string, over: Partial<MaskComponent> = {}): MaskComponent => ({
  id,
  kind: "extension",
  mode: "add",
  invert: false,
  extension: { type: "fuzzy-select.fuzzy", values: { seeds: [] } },
  ...over,
});

const brush = (id: string): MaskComponent => ({
  id,
  kind: "brush",
  mode: "add",
  invert: false,
  brush: { dabs: [], feather: 0.5 },
});

const mask = (id: string, components: MaskComponent[]): Mask => ({
  id,
  name: id,
  visible: true,
  invert: false,
  opacity: 100,
  adj: defaultMaskAdjustments(),
  panels: [...DEFAULT_MASK_PANELS],
  components,
});

const params = (masks: Mask[]): DevelopParams => ({
  crop: { ...DEFAULT_CROP },
  straighten: 0,
  transform: { ...DEFAULT_TRANSFORM },
  masks,
  processVersion: 3,
});

const derived = (line: 1 | 2 | 3, masks: Mask[]) => {
  const values = masksStage(line).derive?.(params(masks)) ?? {};
  const ints = (key: string) => values[key] as number[];
  return { type: ints("uCompType"), ch: ints("uCompBrushCh"), invert: ints("uCompInvert") };
};

describe("the raster channels", () => {
  it("go to extension components by their place among them across masks, the fifth and later none", () => {
    const masks = [
      mask("m1", [fuzzy("a"), brush("b1"), fuzzy("b")]),
      mask("m2", [fuzzy("c"), fuzzy("d"), fuzzy("e")]),
    ];
    expect(rasterChannels(masks)).toEqual({ a: 0, b: 1, c: 2, d: 3, e: -1 });
  });

  it("skip a component marked extension without its values", () => {
    expect(rasterChannels([mask("m1", [{ ...fuzzy("a"), extension: undefined }, fuzzy("b")])])).toEqual({ b: 0 });
  });
});

describe("line 3", () => {
  const stage = masksStage(3);

  it("declares the raster core feeds", () => {
    expect(stage.textures).toContainEqual({ key: "uMaskRasters", kind: "dynamic" });
  });

  it("reads an extension component's channel of the raster, nothing where none is held", () => {
    expect(stage.helpers).toContain("} else if (type == 5) {");
    expect(stage.helpers).toMatch(/textureLod\(uMaskRasters, uv, 0\.0\)/);
    expect(stage.helpers).toMatch(/textureSize\(uMaskRasters, 0\)\.x < 2/);
  });

  it("draws an extension component from its channel, the brush atlas keeping its own", () => {
    const got = derived(3, [mask("m1", [brush("b1"), fuzzy("a"), brush("b2"), fuzzy("b")])]);
    expect(got.type.slice(0, 4)).toEqual([2, 5, 2, 5]);
    expect(got.ch.slice(0, 4)).toEqual([0, 0, 1, 1]);
  });

  it("leaves an extension component's inversion to the raster, which holds it", () => {
    const got = derived(3, [mask("m1", [fuzzy("a", { invert: true }), { ...brush("b1"), invert: true }])]);
    expect(got.invert.slice(0, 2)).toEqual([0, 1]);
  });

  it("gives the fifth extension component no channel", () => {
    const comps = ["a", "b", "c", "d", "e"].map((id) => fuzzy(id, { invert: true }));
    const got = derived(3, [mask("m1", comps)]);
    expect(got.type.slice(0, 5)).toEqual([5, 5, 5, 5, 5]);
    expect(got.ch.slice(0, 5)).toEqual([0, 1, 2, 3, -1]);
    expect(got.invert.slice(0, 5)).toEqual([0, 0, 0, 0, 0]);
  });
});

describe.each([1, 2] as const)("line %i", (line) => {
  const stage = masksStage(line);

  it("declares no raster and reads none", () => {
    expect(stage.textures).toEqual([{ key: "uMaskCurves", kind: "photo" }]);
    expect(stage.helpers).not.toContain("uMaskRasters");
    expect(stage.helpers).not.toContain("type == 5");
  });

  it("draws an extension component as a brush with no channel, never inverted", () => {
    const got = derived(line, [mask("m1", [fuzzy("a", { invert: true }), brush("b1")])]);
    expect(got.type.slice(0, 2)).toEqual([2, 2]);
    expect(got.ch.slice(0, 2)).toEqual([-1, 0]);
    expect(got.invert.slice(0, 2)).toEqual([0, 0]);
  });
});
