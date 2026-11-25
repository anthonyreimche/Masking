// Mask component kinds extensions register (Safelight 3.2.8): the entries they
// add to the Create Mask and Add Component menus, the click tool they arm, the
// component a click makes or extends, the markers drawn for it, its row and
// its own controls.

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { React, initRuntime } from "../src/rt";
import type { Mask, MaskComponent, MaskComponentControlsProps, MaskComponentPoint, RegisteredMaskComponentKind } from "../src/safelight";
import { DEFAULT_MASK_PANELS, MAX_MASKS, defaultMaskAdjustments } from "../src/masks";
import { MasksPanel } from "../src/MasksPanel";
import { MASK_TOOL, MaskCanvas } from "../src/MaskCanvas";
import { addExtensionComponent, maskTool, resetMaskTool, setMaskTool, updateExtensionValues } from "../src/state";
import { fakeApi, PARAMS, type Rig } from "./support/fake-api";

HTMLElement.prototype.setPointerCapture ??= () => {};

interface Seed {
  u: number;
  v: number;
  subtract: boolean;
}

const seedsOf = (values: Record<string, unknown>) => (values.seeds as Seed[] | undefined) ?? [];

const points: MaskComponentPoint[] = [];

function Controls({ values, setValues, commit }: MaskComponentControlsProps) {
  return (
    <div>
      <span>tolerance {String(values.tolerance)}</span>
      <button type="button" onClick={() => setValues({ tolerance: 40 })}>
        set
      </button>
      <button type="button" onClick={() => commit("Tolerance")}>
        done
      </button>
    </div>
  );
}

const FUZZY: RegisteredMaskComponentKind = {
  type: "fuzzy-select.fuzzy",
  owner: "fuzzy-select",
  name: "fuzzy",
  label: "Fuzzy Select",
  icon: "✦",
  commitLabel: "Fuzzy Select Point",
  generation: 0,
  create: () => ({ seeds: [], tolerance: 15 }),
  onPoint: (values, p) => {
    points.push(p);
    return { ...values, seeds: [...seedsOf(values), { u: p.u, v: p.v, subtract: p.alt }] };
  },
  markers: (values) => seedsOf(values).map((s) => ({ u: s.u, v: s.v, subtract: s.subtract })),
  Controls,
};

const extComp = (id: string, over: Partial<MaskComponent> = {}): MaskComponent => ({
  id,
  kind: "extension",
  mode: "add",
  invert: false,
  extension: { type: FUZZY.type, values: { seeds: [], tolerance: 15 } },
  ...over,
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

const RECT = { x: 0, y: 0, w: 1000, h: 1000 };

let rig: Rig;
const masks = () => rig.develop.getState().params.masks;
const setMasks = (next: Mask[]) => rig.develop.setState({ params: { ...PARAMS, masks: next } });
const labels = () => rig.calls.flatMap((c) => ("commitEdit" in c ? [c.commitEdit] : []));

function boot(options: Parameters<typeof fakeApi>[0] = {}, kinds: readonly RegisteredMaskComponentKind[] = [FUZZY]) {
  rig = fakeApi(options);
  rig.setKinds(kinds);
  initRuntime(rig.api);
  rig.api.develop.setCanvasTool(MASK_TOOL);
  resetMaskTool();
}

beforeEach(() => {
  points.length = 0;
  boot();
});

afterEach(cleanup);

const button = (name: string) => screen.getByRole("button", { name });
const item = (label: string) => screen.getByRole("menuitem", { name: label });

const clickAt = (canvas: Element, x: number, y: number, init: Record<string, unknown> = {}) => {
  fireEvent.pointerDown(canvas, { pointerId: 1, button: 0, clientX: x, clientY: y, ...init });
  fireEvent.pointerUp(canvas, { pointerId: 1 });
};

function canvas() {
  const { container } = render(<MaskCanvas rect={RECT} />);
  const el = container.firstElementChild;
  if (!el) throw new Error("MaskCanvas rendered nothing");
  return { el, container };
}

describe("the menus", () => {
  it("list a registered kind after a separator, with its icon", () => {
    render(<MasksPanel />);
    fireEvent.click(button("+ Create Mask ▾"));
    expect(screen.getAllByRole("menuitem").map((b) => b.textContent)).toEqual([
      "Radial",
      "Linear",
      "Brush",
      "Luminance Range",
      "Colour Range",
      "Fuzzy Select",
    ]);
    expect(screen.getAllByRole("separator")).toHaveLength(2);
    const items = rig.menu()!.items.filter((i) => i !== "separator");
    expect(items[items.length - 1].icon).toBe("✦");
  });

  it("give a kind with no icon a glyph of its own", () => {
    boot({}, [{ ...FUZZY, icon: undefined }]);
    render(<MasksPanel />);
    fireEvent.click(button("+ Create Mask ▾"));
    const items = rig.menu()!.items.filter((i) => i !== "separator");
    expect(typeof items[items.length - 1].icon).toBe("string");
    expect(items[items.length - 1].icon).not.toBe("");
  });

  it("have no extension section on a Safelight without kinds", () => {
    boot({ kindsApi: false });
    render(<MasksPanel />);
    fireEvent.click(button("+ Create Mask ▾"));
    expect(screen.getAllByRole("menuitem")).toHaveLength(5);
    expect(screen.getAllByRole("separator")).toHaveLength(1);
  });

  it("disable the entry at four extension components, saying why", () => {
    setMasks([mask("m1", [extComp("a"), extComp("b")]), mask("m2", [extComp("c"), extComp("d")])]);
    render(<MasksPanel />);
    fireEvent.click(button("+ Create Mask ▾"));
    expect(item("Fuzzy Select")).toHaveProperty("disabled", true);
    expect(item("Fuzzy Select").getAttribute("title")).toMatch(/4/);
    expect(item("Radial")).toHaveProperty("disabled", false);
  });

  it("offer the entry on a photo with the second processing", () => {
    rig.develop.setState({ params: { ...PARAMS, processVersion: 2 } });
    render(<MasksPanel />);
    fireEvent.click(button("+ Create Mask ▾"));
    expect(item("Fuzzy Select")).toHaveProperty("disabled", false);
  });

  it("disable the entry on a photo with the first processing, saying why", () => {
    rig.develop.setState({ params: { ...PARAMS, processVersion: 1 } });
    render(<MasksPanel />);
    fireEvent.click(button("+ Create Mask ▾"));
    expect(item("Fuzzy Select")).toHaveProperty("disabled", true);
    expect(item("Fuzzy Select").getAttribute("title")).toMatch(/Update processing/);
  });

  it("arm a click tool for a new mask from Create Mask", () => {
    render(<MasksPanel />);
    fireEvent.click(button("+ Create Mask ▾"));
    fireEvent.click(item("Fuzzy Select"));
    expect(maskTool()).toMatchObject({
      activeTool: "mask",
      maskToolType: FUZZY.type,
      maskAddTarget: "new",
      selectedMaskId: null,
    });
    expect(rig.held()).not.toBeNull();
    expect(masks()).toEqual([]);
  });

  it("arm it to extend the selected mask from Add Component, starting a component of its own", () => {
    setMasks([mask("m1", [extComp("a")])]);
    setMaskTool({ selectedMaskId: "m1", selectedComponentId: "a" });
    render(<MasksPanel />);
    fireEvent.click(button("+ Add Component ▾"));
    fireEvent.click(item("Fuzzy Select"));
    expect(maskTool()).toMatchObject({
      activeTool: "mask",
      maskToolType: FUZZY.type,
      maskAddTarget: "current",
      selectedMaskId: "m1",
      selectedComponentId: null,
    });
  });

  it("arm the kind again when its row is clicked", () => {
    setMasks([mask("m1", [extComp("a", { mode: "subtract" })])]);
    setMaskTool({ selectedMaskId: "m1" });
    render(<MasksPanel />);
    fireEvent.click(screen.getByText("Fuzzy Select"));
    expect(maskTool()).toMatchObject({
      activeTool: "mask",
      maskToolType: FUZZY.type,
      maskAddTarget: "current",
      maskCompMode: "subtract",
      selectedComponentId: "a",
    });
  });
});

describe("a click with a kind armed", () => {
  const arm = (over: Partial<ReturnType<typeof maskTool>> = {}) =>
    setMaskTool({ activeTool: "mask", maskToolType: FUZZY.type, maskAddTarget: "new", ...over });

  it("makes a mask named by the kind, with the values its onPoint gave, as one step", () => {
    arm();
    const { el } = canvas();
    clickAt(el, 250, 600);
    expect(masks()).toHaveLength(1);
    const [m] = masks();
    expect(m.name).toBe("Fuzzy Select");
    expect(m.components).toHaveLength(1);
    const [c] = m.components;
    expect(c).toMatchObject({ kind: "extension", mode: "add", invert: false });
    expect(c.extension?.type).toBe(FUZZY.type);
    expect(c.extension?.values.tolerance).toBe(15);
    const [seed] = seedsOf(c.extension?.values ?? {});
    expect(seed.u).toBeCloseTo(0.25);
    expect(seed.v).toBeCloseTo(0.6);
    expect(labels()).toEqual(["Fuzzy Select Point"]);
    expect(maskTool()).toMatchObject({ selectedMaskId: m.id, selectedComponentId: c.id, maskAddTarget: "current" });
  });

  it("commits under the kind's label when it has no commit label", () => {
    boot({}, [{ ...FUZZY, commitLabel: undefined }]);
    arm();
    clickAt(canvas().el, 500, 500);
    expect(labels()).toEqual(["Fuzzy Select"]);
  });

  it("hands onPoint the modifiers held", () => {
    arm();
    clickAt(canvas().el, 500, 500, { altKey: true, shiftKey: true });
    expect(points).toEqual([{ u: 0.5, v: 0.5, alt: true, shift: true }]);
  });

  it("ignores a click off the image", () => {
    arm();
    const { el } = canvas();
    clickAt(el, 1200, 500);
    clickAt(el, 500, -40);
    expect(masks()).toEqual([]);
    expect(labels()).toEqual([]);
    expect(points).toEqual([]);
  });

  it("adds a seed to the selected component of the same kind, not a new one", () => {
    setMasks([mask("m1", [extComp("a")])]);
    arm({ maskAddTarget: "current", selectedMaskId: "m1", selectedComponentId: "a" });
    const { el } = canvas();
    clickAt(el, 100, 100);
    clickAt(el, 900, 900, { altKey: true });
    expect(masks()).toHaveLength(1);
    expect(masks()[0].components).toHaveLength(1);
    const seeds = seedsOf(masks()[0].components[0].extension?.values ?? {});
    expect(seeds.map((s) => s.subtract)).toEqual([false, true]);
    expect(labels()).toEqual(["Fuzzy Select Point", "Fuzzy Select Point"]);
  });

  it("leaves the component and the history alone when onPoint answers null", () => {
    boot({}, [{ ...FUZZY, onPoint: () => null }]);
    setMasks([mask("m1", [extComp("a")])]);
    arm({ maskAddTarget: "current", selectedMaskId: "m1", selectedComponentId: "a" });
    const before = masks();
    clickAt(canvas().el, 100, 100);
    expect(masks()).toEqual(before);
    expect(labels()).toEqual([]);
  });

  it("starts a component with create() when onPoint answers null for a new one", () => {
    boot({}, [{ ...FUZZY, onPoint: () => null }]);
    arm();
    clickAt(canvas().el, 100, 100);
    expect(masks()[0].components[0].extension?.values).toEqual({ seeds: [], tolerance: 15 });
  });

  it("adds a component to the selected mask in the armed mode when the selection is another kind", () => {
    setMasks([mask("m1", [{ id: "r", kind: "radial", mode: "add", invert: false, radial: { cx: 0.5, cy: 0.5, rx: 0.2, ry: 0.2, feather: 0.5, angle: 0 } }])]);
    arm({ maskAddTarget: "current", selectedMaskId: "m1", selectedComponentId: null, maskCompMode: "subtract" });
    clickAt(canvas().el, 500, 500);
    expect(masks()).toHaveLength(1);
    expect(masks()[0].components.map((c) => [c.kind, c.mode])).toEqual([
      ["radial", "add"],
      ["extension", "subtract"],
    ]);
  });

  it("makes nothing at the cap of four extension components", () => {
    setMasks([mask("m1", [extComp("a"), extComp("b"), extComp("c"), extComp("d")])]);
    arm({ maskAddTarget: "current", selectedMaskId: "m1", selectedComponentId: null });
    clickAt(canvas().el, 500, 500);
    expect(masks()[0].components).toHaveLength(4);
    expect(labels()).toEqual([]);
  });

  it("does nothing for a kind that is no longer registered", () => {
    boot({}, []);
    arm();
    clickAt(canvas().el, 500, 500);
    expect(masks()).toEqual([]);
    expect(labels()).toEqual([]);
  });

  it("leaves brush, radial and linear drawing as it was", () => {
    setMaskTool({ activeTool: "mask", maskToolType: "radial", maskAddTarget: "new" });
    const { el } = canvas();
    fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 200, clientY: 200 });
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 600, clientY: 600 });
    fireEvent.pointerUp(el, { pointerId: 1 });
    expect(masks()[0].components[0].kind).toBe("radial");
    expect(labels()).toEqual(["Mask"]);
  });
});

describe("markers", () => {
  it("draw the selected extension component's points, subtractions in the subtract colour", () => {
    const withSeeds = extComp("a", {
      extension: {
        type: FUZZY.type,
        values: {
          seeds: [
            { u: 0.25, v: 0.5, subtract: false },
            { u: 0.75, v: 0.5, subtract: true },
          ],
        },
      },
    });
    setMasks([mask("m1", [withSeeds])]);
    setMaskTool({ activeTool: "mask", maskToolType: FUZZY.type, selectedMaskId: "m1", selectedComponentId: "a" });
    const { container } = canvas();
    const dots = [...container.querySelectorAll("circle[data-marker]")];
    expect(dots).toHaveLength(2);
    expect(dots.map((d) => [d.getAttribute("cx"), d.getAttribute("cy")])).toEqual([
      ["250", "500"],
      ["750", "500"],
    ]);
    expect(dots[0].getAttribute("stroke")).not.toBe(dots[1].getAttribute("stroke"));
  });

  it("draw none for an unselected component", () => {
    const withSeed = extComp("a", { extension: { type: FUZZY.type, values: { seeds: [{ u: 0.5, v: 0.5, subtract: false }] } } });
    setMasks([mask("m1", [withSeed])]);
    setMaskTool({ activeTool: "mask", maskToolType: FUZZY.type, selectedMaskId: "m1", selectedComponentId: null });
    const { container } = canvas();
    expect(container.querySelectorAll("circle[data-marker]")).toHaveLength(0);
  });
});

describe("rows", () => {
  it("show a registered kind's icon and label, in the list and the mask's summary", () => {
    setMasks([mask("m1", [extComp("a")])]);
    setMaskTool({ selectedMaskId: "m1" });
    const { container } = render(<MasksPanel />);
    expect(screen.getAllByText("Fuzzy Select").length).toBeGreaterThan(0);
    expect(container.textContent).toContain("✦");
  });

  it("show a kind nobody registered as not installed, with its type to hover", () => {
    boot({}, []);
    setMasks([mask("m1", [extComp("a")])]);
    setMaskTool({ selectedMaskId: "m1" });
    render(<MasksPanel />);
    const row = screen.getByText(/not installed/);
    expect(row.getAttribute("title")).toContain(FUZZY.type);
  });

  it("show a kind not yet registered by its name, not as missing, until extensions have started", () => {
    boot({}, []);
    rig.setSettled(false);
    setMasks([mask("m1", [extComp("a")])]);
    setMaskTool({ selectedMaskId: "m1" });
    render(<MasksPanel />);
    expect(screen.queryByText(/not installed/)).toBeNull();
    expect(screen.getByText("fuzzy")).toBeTruthy();
    act(() => rig.setSettled(true));
    expect(screen.getByText(/not installed/)).toBeTruthy();
  });

  it("call it not installed at once on a Safelight that doesn't say when extensions settle", () => {
    boot({ settledApi: false }, []);
    setMasks([mask("m1", [extComp("a")])]);
    setMaskTool({ selectedMaskId: "m1" });
    render(<MasksPanel />);
    expect(screen.getByText(/not installed/)).toBeTruthy();
  });

  it("keep the icons of the built-in kinds", () => {
    setMasks([mask("m1", [{ id: "r", kind: "lumRange", mode: "add", invert: false }])]);
    setMaskTool({ selectedMaskId: "m1" });
    render(<MasksPanel />);
    expect(screen.getAllByText("Luminance").length).toBeGreaterThan(0);
  });
});

describe("controls", () => {
  const select = () => {
    setMasks([mask("m1", [extComp("a")])]);
    setMaskTool({ selectedMaskId: "m1", selectedComponentId: "a" });
    return render(<MasksPanel />);
  };

  it("draw the kind's panel with the component's values", () => {
    select();
    expect(screen.getByText("tolerance 15")).toBeTruthy();
  });

  it("merge setValues into the values without a history step", () => {
    select();
    fireEvent.click(button("set"));
    expect(masks()[0].components[0].extension?.values).toEqual({ seeds: [], tolerance: 40 });
    expect(labels()).toEqual([]);
    expect(screen.getByText("tolerance 40")).toBeTruthy();
  });

  it("commit under the label the panel gives", () => {
    select();
    fireEvent.click(button("done"));
    expect(labels()).toEqual(["Tolerance"]);
  });

  it("draw nothing, and log once, when the panel throws", () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    function Broken(): never {
      throw new Error("boom");
    }
    boot({}, [{ ...FUZZY, Controls: Broken }]);
    const { rerender } = select();
    expect(screen.queryByText(/tolerance/)).toBeNull();
    expect(button("+ Add Component ▾")).toBeTruthy();
    rerender(<MasksPanel />);
    const ours = warn.mock.calls.filter((c) => String(c[0]).includes("Fuzzy Select"));
    expect(ours).toHaveLength(1);
    warn.mockRestore();
  });

  it("draw nothing for a kind with no panel", () => {
    boot({}, [{ ...FUZZY, Controls: undefined }]);
    select();
    expect(screen.queryByText(/tolerance/)).toBeNull();
  });
});

describe("the state edits", () => {
  it("add a component to a new mask named by the label, or to an existing one", () => {
    const made = addExtensionComponent("new", { type: FUZZY.type, values: { n: 1 } }, "Fuzzy Select", "add");
    expect(made).not.toBeNull();
    expect(masks()[0]).toMatchObject({ name: "Fuzzy Select" });
    const more = addExtensionComponent(made!.maskId, { type: FUZZY.type, values: { n: 2 } }, "Fuzzy Select", "subtract");
    expect(masks()[0].components.map((c) => [c.mode, c.extension?.values.n])).toEqual([
      ["add", 1],
      ["subtract", 2],
    ]);
    expect(maskTool()).toMatchObject({ selectedMaskId: made!.maskId, selectedComponentId: more!.compId });
  });

  it("refuse a fifth extension component and a seventeenth mask", () => {
    setMasks([mask("m1", [extComp("a"), extComp("b"), extComp("c"), extComp("d")])]);
    expect(addExtensionComponent("m1", { type: FUZZY.type, values: {} }, "Fuzzy Select", "add")).toBeNull();
    expect(addExtensionComponent("new", { type: FUZZY.type, values: {} }, "Fuzzy Select", "add")).toBeNull();
    setMasks(Array.from({ length: MAX_MASKS }, (_, i) => mask(`x${i}`, [])));
    expect(addExtensionComponent("new", { type: FUZZY.type, values: {} }, "Fuzzy Select", "add")).toBeNull();
  });

  it("merge a patch into a component's values and keep its type", () => {
    setMasks([mask("m1", [extComp("a")])]);
    act(() => updateExtensionValues("m1", "a", { tolerance: 3 }));
    expect(masks()[0].components[0].extension).toEqual({ type: FUZZY.type, values: { seeds: [], tolerance: 3 } });
  });

  it("leave a component that is not an extension one alone", () => {
    const radial: MaskComponent = { id: "r", kind: "radial", mode: "add", invert: false };
    setMasks([mask("m1", [radial])]);
    updateExtensionValues("m1", "r", { x: 1 });
    expect(masks()[0].components[0]).toEqual(radial);
  });
});
