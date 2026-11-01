// The mask edits: what each writes to the photo's masks (whole, through
// setParam) and what it selects, hovers or drops, driven through the fake
// develop store. Ported from core's mask-slice tests.

import { beforeEach, describe, expect, it } from "vitest";
import { initRuntime } from "../src/rt";
import type { BrushDab, Mask, MaskComponent } from "../src/safelight";
import { DEFAULT_MASK_PANELS, MAX_MASKS, defaultLumRange, defaultMaskAdjustments } from "../src/masks";
import {
  addBrushDab,
  addComponent,
  addMask,
  addRangeComponent,
  cycleComponentMode,
  maskTool,
  removeComponent,
  removeMask,
  renameMask,
  resetMaskTool,
  setMaskTool,
  updateComponent,
} from "../src/state";
import { defaultHSL, defaultToneCurves, fakeApi, type Rig } from "./support/fake-api";

let rig: Rig;
const masks = () => rig.develop.getState().params.masks;
const store = () => rig.develop.getState();

beforeEach(() => {
  rig = fakeApi();
  initRuntime(rig.api);
  resetMaskTool();
});

describe("addRangeComponent", () => {
  it("creates a new mask when none is selected", () => {
    addRangeComponent("lumRange");
    expect(masks()).toHaveLength(1);
    expect(masks()[0].name).toBe("Luminance");
    expect(masks()[0].components).toHaveLength(1);
    expect(masks()[0].components[0].kind).toBe("lumRange");
    expect(masks()[0].components[0].mode).toBe("add");
    expect(maskTool().selectedMaskId).toBe(masks()[0].id);
  });

  it("appends an intersect component to the selected mask", () => {
    addRangeComponent("lumRange"); // creates + selects a mask
    addRangeComponent("colorRange"); // confines the same mask
    expect(masks()).toHaveLength(1);
    expect(masks()[0].components).toHaveLength(2);
    expect(masks()[0].components[1].kind).toBe("colorRange");
    expect(masks()[0].components[1].mode).toBe("intersect");
  });

  it("writes the masks whole, never in place", () => {
    addRangeComponent("lumRange");
    const before = masks();
    addRangeComponent("colorRange");
    expect(before[0].components).toHaveLength(1);
    expect(rig.calls.every((c) => !("setParam" in c) || c.setParam === "masks")).toBe(true);
  });
});

describe("component edits", () => {
  it("addComponent appends to a mask and selects it", () => {
    addRangeComponent("lumRange");
    const maskId = masks()[0].id;
    const extra: MaskComponent = { id: "extra-comp", kind: "lumRange", mode: "subtract", invert: false, lumRange: defaultLumRange() };
    addComponent(maskId, extra);
    expect(masks()[0].components).toHaveLength(2);
    expect(maskTool().selectedComponentId).toBe("extra-comp");
  });

  it("cycleComponentMode cycles add -> subtract -> intersect -> add", () => {
    addRangeComponent("lumRange");
    const mask = masks()[0];
    const compId = mask.components[0].id;
    const modeNow = () => masks()[0].components[0].mode;
    expect(modeNow()).toBe("add");
    cycleComponentMode(mask.id, compId);
    expect(modeNow()).toBe("subtract");
    cycleComponentMode(mask.id, compId);
    expect(modeNow()).toBe("intersect");
    cycleComponentMode(mask.id, compId);
    expect(modeNow()).toBe("add");
  });

  it("removeComponent drops a component, and removing the last drops the mask", () => {
    addRangeComponent("lumRange");
    addRangeComponent("colorRange"); // same mask, 2 components
    const mask = masks()[0];
    const [c0, c1] = mask.components;

    removeComponent(mask.id, c0.id);
    expect(masks()).toHaveLength(1);
    expect(masks()[0].components).toHaveLength(1);

    removeComponent(mask.id, c1.id);
    expect(masks()).toHaveLength(0);
    expect(maskTool().selectedMaskId).toBeNull();
    expect(maskTool().selectedComponentId).toBeNull();
  });
});

describe("mask edits", () => {
  it("renameMask sets the name", () => {
    addRangeComponent("lumRange");
    renameMask(masks()[0].id, "Sky");
    expect(masks()[0].name).toBe("Sky");
  });

  it("removeMask removes it and clears selection", () => {
    addRangeComponent("lumRange");
    removeMask(masks()[0].id);
    expect(masks()).toHaveLength(0);
    expect(maskTool().selectedMaskId).toBeNull();
  });

  // The row's delete button removes the mask while the pointer is inside the
  // row that set hoveredMaskId; the row unmounts and mouseleave never fires.
  // The dead id must go or it shadows the selected mask's coverage until the
  // next row hover.
  it("removeMask clears a hover pointing at the removed mask", () => {
    addRangeComponent("lumRange");
    const id = masks()[0].id;
    setMaskTool({ hoveredMaskId: id });
    removeMask(id);
    expect(maskTool().hoveredMaskId).toBeNull();
  });

  it("removeMask keeps a hover pointing at another mask", () => {
    addRangeComponent("lumRange");
    const first = masks()[0].id;
    setMaskTool({ selectedMaskId: null });
    addRangeComponent("lumRange");
    const second = masks()[1].id;
    setMaskTool({ hoveredMaskId: first });
    removeMask(second);
    expect(maskTool().hoveredMaskId).toBe(first);
  });

  it("removeComponent dropping the whole mask clears a hover on it", () => {
    addRangeComponent("lumRange");
    const mask = masks()[0];
    setMaskTool({ hoveredMaskId: mask.id });
    removeComponent(mask.id, mask.components[0].id);
    expect(masks()).toHaveLength(0);
    expect(maskTool().hoveredMaskId).toBeNull();
  });

  it(`caps masks at MAX_MASKS (${MAX_MASKS})`, () => {
    for (let i = 0; i < 20; i++) {
      setMaskTool({ selectedMaskId: null }); // force a new mask each time
      addRangeComponent("lumRange");
    }
    expect(masks()).toHaveLength(16);
  });
});

describe("core's mask actions, as the panel uses them", () => {
  it("updateMask patches fields, and updateMaskAdj merges adjustments", () => {
    addRangeComponent("lumRange");
    const id = masks()[0].id;
    store().updateMask(id, { visible: false, opacity: 42 });
    store().updateMaskAdj(id, { exposure: 0.7 });
    expect(masks()[0]).toMatchObject({ visible: false, opacity: 42 });
    expect(masks()[0].adj.exposure).toBe(0.7);
    expect(masks()[0].adj.contrast).toBe(0);
  });

  it("seeds owned blocks with defaults, and clears them and owned adjustments", () => {
    addRangeComponent("lumRange");
    const id = masks()[0].id;
    store().updateMaskAdj(id, { exposure: 50, tint: -20 });
    store().seedMaskPanelValues(id, ["hsl", "toneCurve", "teststage.amount"]);
    expect(masks()[0]).toMatchObject({ hsl: defaultHSL(), toneCurve: defaultToneCurves(), bag: { "teststage.amount": 1 } });

    store().clearMaskPanelValues(id, ["exposure", "hsl", "toneCurve", "teststage.amount"]);
    const m = masks()[0];
    expect(m.adj.exposure).toBe(0);
    expect(m.adj.tint).toBe(-20); // not owned by the removed sub-panel
    expect(m.hsl).toBeUndefined();
    expect(m.toneCurve).toBeUndefined();
    expect(m.bag).toBeUndefined();
  });
});

describe("addBrushDab", () => {
  const dab: BrushDab = { x: 0.5, y: 0.5, radius: 0.05, erase: false, feather: 0.5 };

  it("appends a dab to a brush component", () => {
    addRangeComponent("lumRange");
    const mask = masks()[0];
    const compId = mask.components[0].id;
    // Give the component a brush geometry so dabs can land on it.
    updateComponent(mask.id, compId, { brush: { dabs: [], feather: 0.5 } });
    addBrushDab(mask.id, compId, dab);
    expect(masks()[0].components[0].brush?.dabs).toHaveLength(1);
  });

  it("is a no-op on a component with no brush geometry", () => {
    addRangeComponent("lumRange"); // lumRange component, no brush
    const mask = masks()[0];
    addBrushDab(mask.id, mask.components[0].id, dab);
    expect(masks()[0].components[0].brush).toBeUndefined();
  });
});

describe("maskTab on creation", () => {
  const radialComp = (id: string): MaskComponent => ({
    id,
    kind: "radial",
    mode: "add",
    invert: false,
    radial: { cx: 0.5, cy: 0.5, rx: 0.2, ry: 0.2, feather: 0.5, angle: 0 },
  });
  const mask = (id: string): Mask => ({
    id,
    name: "Radial",
    visible: true,
    invert: false,
    opacity: 100,
    adj: defaultMaskAdjustments(),
    panels: [...DEFAULT_MASK_PANELS],
    components: [radialComp(`${id}-c0`)],
  });

  it("addMask opens the new mask on the Coverage tab, its last component selected", () => {
    setMaskTool({ maskTab: "adjust" });
    addMask(mask("m1"));
    expect(maskTool()).toMatchObject({ maskTab: "coverage", selectedMaskId: "m1", selectedComponentId: "m1-c0" });
  });

  it("addMask at the mask cap leaves the tab alone", () => {
    for (let i = 0; i < 16; i++) addMask(mask(`m${i}`));
    setMaskTool({ maskTab: "adjust" });
    addMask(mask("m-over"));
    expect(masks()).toHaveLength(16);
    expect(maskTool().maskTab).toBe("adjust");
  });

  it("addComponent keeps the Adjust tab (drawing into an existing mask)", () => {
    addMask(mask("m1"));
    setMaskTool({ maskTab: "adjust" });
    addComponent("m1", radialComp("c1"));
    expect(maskTool().maskTab).toBe("adjust");
  });

  it("addBrushDab keeps the Adjust tab (painting the selected brush)", () => {
    addMask(mask("m1"));
    addComponent("m1", { id: "b1", kind: "brush", mode: "add", invert: false, brush: { dabs: [], feather: 0.5 } });
    setMaskTool({ maskTab: "adjust" });
    addBrushDab("m1", "b1", { x: 0.5, y: 0.5, radius: 0.05, erase: false, feather: 0.5 });
    expect(maskTool().maskTab).toBe("adjust");
  });
});
