// Masking is dormant while a photo has no masks. Its block is declarations
// only, and core stands in every one of its names while the stage is away, so
// the frame is the same without it. Leaving it out saves the shader compiler
// the mask loops and the mask maths: 2.7 s down to 1.1 s for an unedited
// photo's program on Direct3D 11 (measured 2026-11-14). The first photo with a
// mask builds the program with it, which arming the mask tool starts early.

import { describe, expect, it } from "vitest";
import type { DevelopParams, Mask } from "../src/safelight";
import { DEFAULT_CROP, DEFAULT_TRANSFORM } from "../src/defaults";
import { DEFAULT_MASK_PANELS, MAX_MASKS, defaultMaskAdjustments } from "../src/masks";
import { masksStage } from "../src/stages";

const mask = (over: Partial<Mask> = {}): Mask => ({
  id: "m1",
  name: "Mask 1",
  visible: true,
  invert: false,
  opacity: 100,
  adj: defaultMaskAdjustments(),
  panels: [...DEFAULT_MASK_PANELS],
  components: [],
  ...over,
});

const params = (masks: Mask[]): DevelopParams => ({
  crop: { ...DEFAULT_CROP },
  straighten: 0,
  transform: { ...DEFAULT_TRANSFORM },
  masks,
  processVersion: 3,
});

describe.each([1, 2, 3] as const)("line %i", (line) => {
  const stage = masksStage(line);
  const count = (masks: Mask[]) => stage.derive?.(params(masks)).uMaskCount;

  it("is dormant while the mask count is 0", () => {
    expect(stage.dormantWhen).toEqual({ uMaskCount: 0 });
  });

  it("names a single int uniform the stage declares, resting at 0", () => {
    const declared = stage.uniforms.find((u) => u.key === "uMaskCount");
    expect(declared).toMatchObject({ glslType: "int", default: 0 });
    expect(declared).not.toHaveProperty("length");
  });

  it("counts no masks on a photo without any", () => {
    expect(count([])).toBe(0);
  });

  it("wakes for any mask, a hidden or empty one included, whose coverage the view can show", () => {
    expect(count([mask()])).toBe(1);
    expect(count([mask({ visible: false })])).toBe(1);
    expect(count([mask({ opacity: 0 })])).toBe(1);
  });

  it("counts at most the masks the program holds", () => {
    const many = Array.from({ length: MAX_MASKS + 3 }, (_, i) => mask({ id: `m${i}` }));
    expect(count(many)).toBe(MAX_MASKS);
  });
});
