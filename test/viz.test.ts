// The mask whose coverage core tints: hover wins, else the selected mask when
// its editor is on the Coverage tab. Ids can go stale (undo, delete-under-
// pointer races) — a stale id must fall through instead of blanking the tint.

import { describe, expect, it } from "vitest";
import { coverageMaskId } from "../src/viz";

const masks = [{ id: "a" }, { id: "b" }];

describe("coverageMaskId", () => {
  it("prefers the hovered mask, on either tab", () => {
    expect(coverageMaskId(masks, "b", "a", "coverage")).toBe("b");
    expect(coverageMaskId(masks, "b", null, "adjust")).toBe("b");
  });

  it("falls back to the selected mask when the hovered id is stale", () => {
    expect(coverageMaskId(masks, "gone", "a", "coverage")).toBe("a");
  });

  it("shows the selected mask only on the Coverage tab", () => {
    expect(coverageMaskId(masks, null, "a", "coverage")).toBe("a");
    expect(coverageMaskId(masks, null, "a", "adjust")).toBeNull();
  });

  it("resolves to none when every id is stale or absent", () => {
    expect(coverageMaskId(masks, "gone", "gone-too", "coverage")).toBeNull();
    expect(coverageMaskId(masks, null, null, "coverage")).toBeNull();
    expect(coverageMaskId([], "a", "a", "coverage")).toBeNull();
  });
});
