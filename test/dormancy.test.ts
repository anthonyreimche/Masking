// Masking declares no dormantWhen, on purpose. Its block is declarations only:
// core's mask loops, which run no iterations at a mask count of 0, are what
// draw the masks. Core stands in every one of its names while the stage is
// away, so leaving it out would save no measurable shader time, and would cost
// a program rebuild the first time a photo gets a mask.

import { describe, expect, it } from "vitest";
import { masksStage } from "../src/stages";

describe("dormantWhen", () => {
  it.each([1, 2, 3] as const)("is not declared on line %i", (line) => {
    expect(masksStage(line)).not.toHaveProperty("dormantWhen");
  });
});
