// What activate() registers, the stage that declares the masks (its text
// pinned by the hashes core holds for each line), the coverage core is asked
// to tint, the panel and the canvas tool: drawing, painting, editing handles,
// and the shortcuts and Escape core hands the tool.

import { createHash } from "node:crypto";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LINE, PANEL_ID, STYLESHEET_ID, activate, deactivate } from "../src/index";
import { React } from "../src/rt";
import type { DevelopParams, Line, Mask, MaskComponent, MaskPanelEntry, ProcessingStageContribution } from "../src/safelight";
import { DEFAULT_MASK_PANELS, MAX_MASKS, defaultColorRange, defaultLumRange, defaultMaskAdjustments } from "../src/masks";
import { MasksPanel } from "../src/MasksPanel";
import { MASK_TOOL, MaskCanvas } from "../src/MaskCanvas";
import { STAGE_ID, masksStage } from "../src/stages";
import { maskTool, setMaskTool } from "../src/state";
import { ScopedMask, fakeApi, type Rig } from "./support/fake-api";

// jsdom has no pointer capture.
HTMLElement.prototype.setPointerCapture ??= () => {};

/** core's ESSENTIAL_LINE_HASHES for safelight.masks.coverage. */
const LINE_HASHES: Record<Line, string> = {
  1: "19474e2690a267a8dd81dbc3a248c6831f990c9673629fb9842cb27368d92fbc",
  2: "84c45658aa749f02ef686b98dda4249aed77bce8383c9763d3b712f462d15667",
  3: "84c45658aa749f02ef686b98dda4249aed77bce8383c9763d3b712f462d15667",
};

type StageText = ProcessingStageContribution & { defines?: Record<string, number>; patch?: unknown };

/** What a line's hash covers, as the app's stageText writes it. */
const stageText = (s: StageText): string =>
  JSON.stringify([
    s.id, s.phase, s.priority ?? null, s.anchor ?? null, s.glsl, s.helpers ?? null, s.uniforms, s.textures ?? null,
    ...(s.defines ? [s.defines, s.patch ?? null] : []),
  ]);

const comp = (over: Partial<MaskComponent> = {}): MaskComponent => ({
  id: "c1",
  kind: "radial",
  mode: "add",
  invert: false,
  radial: { cx: 0.5, cy: 0.5, rx: 0.2, ry: 0.2, feather: 0.5, angle: 0 },
  ...over,
});

const mask = (over: Partial<Mask> = {}): Mask => ({
  id: "m1",
  name: "Mask 1",
  visible: true,
  invert: false,
  opacity: 100,
  adj: defaultMaskAdjustments(),
  panels: [...DEFAULT_MASK_PANELS],
  components: [comp()],
  ...over,
});

let rig: Rig;
const params = () => rig.develop.getState().params;
const masks = () => params().masks;
const setParams = (over: Partial<DevelopParams>) => rig.develop.setState({ params: { ...params(), ...over } });
const labels = () => rig.calls.flatMap((c) => ("commitEdit" in c ? [c.commitEdit] : []));
const RECT = { x: 0, y: 0, w: 1000, h: 1000 };

beforeEach(() => {
  rig = fakeApi();
  activate(rig.api);
});

afterEach(() => {
  deactivate();
  cleanup();
});

describe("activate", () => {
  it("registers the Masking panel, as core's core.masks did, and this line's stage", () => {
    expect(PANEL_ID).toBe("core.masks");
    expect(rig.panels).toEqual([
      {
        id: "core.masks",
        title: "Masking",
        component: MasksPanel,
        defaultDock: { module: "develop", direction: "left", order: 0, width: 240, height: 240 },
        onReset: expect.any(Function),
      },
    ]);
    expect(rig.stylesheets.map((s) => s.id)).toEqual([STYLESHEET_ID]);
    expect(rig.stages.map((s) => s.id)).toEqual([STAGE_ID]);
    expect(stageText(rig.stages[0])).toBe(stageText(masksStage(LINE)));
  });

  it("removes every mask as one step on reset, dropping the selection", () => {
    setParams({ masks: [mask()] });
    setMaskTool({ selectedMaskId: "m1", selectedComponentId: "c1" });
    rig.calls.length = 0;
    rig.panels[0].onReset?.();
    expect(rig.calls).toEqual([{ resetParams: ["masks"], label: "Reset Masking" }]);
    expect(maskTool()).toMatchObject({ selectedMaskId: null, selectedComponentId: null });
  });

  it("holds the canvas while the mask tool is armed, and lets go when it is left", () => {
    act(() => setMaskTool({ activeTool: "mask" }));
    expect(rig.held()).toBe(MASK_TOOL);
    act(() => setMaskTool({ activeTool: "none" }));
    expect(rig.held()).toBeNull();
  });

  it("leaves the tool, the selection, the hover and the eyedropper when another photo opens", () => {
    setParams({ masks: [mask()] });
    setMaskTool({ activeTool: "mask", selectedMaskId: "m1", selectedComponentId: "c1", hoveredMaskId: "m1", maskColorPicking: true });
    act(() => rig.develop.setState({ photoId: "q" }));
    expect(rig.held()).toBeNull();
    expect(maskTool()).toMatchObject({
      activeTool: "none",
      selectedMaskId: null,
      selectedComponentId: null,
      hoveredMaskId: null,
      maskColorPicking: false,
    });
  });
});

describe("the coverage core tints", () => {
  beforeEach(() => setParams({ masks: [mask(), mask({ id: "m2" })] }));

  it("is the hovered mask, else the selected one on the Coverage tab", () => {
    setMaskTool({ selectedMaskId: "m1" });
    setMaskTool({ hoveredMaskId: "m2" });
    setMaskTool({ hoveredMaskId: null });
    setMaskTool({ maskTab: "adjust" });
    expect(rig.coverage).toEqual(["m1", "m2", "m1", null]);
  });

  it("follows the masks: a selected mask removed by undo shows none", () => {
    setMaskTool({ selectedMaskId: "m2" });
    setParams({ masks: [mask()] });
    expect(rig.coverage).toEqual(["m2", null]);
  });

  it("is cleared when the extension goes", () => {
    setMaskTool({ selectedMaskId: "m1" });
    deactivate();
    expect(rig.coverage).toEqual(["m1", null]);
  });
});

describe("the stage", () => {
  it.each([1, 2, 3] as const)("holds line %i as core's copy does", (line) => {
    expect(createHash("sha256").update(stageText(masksStage(line))).digest("hex")).toBe(LINE_HASHES[line]);
  });
});

describe("the panel", () => {
  const button = (name: string) => screen.getByRole("button", { name });
  // A menu item's name runs its icon into its label.
  const item = (label: string) => screen.getByRole("button", { name: new RegExp(`${label}$`) });
  const draw = () => render(<MasksPanel />);

  it("arms a geometric tool for a new mask from Create Mask", () => {
    setParams({ masks: [mask()] });
    setMaskTool({ selectedMaskId: "m1", maskTab: "adjust" });
    draw();
    fireEvent.click(button("+ Create Mask ▾"));
    fireEvent.click(item("Radial"));
    expect(maskTool()).toMatchObject({
      activeTool: "mask",
      maskToolType: "radial",
      maskCompMode: "add",
      maskAddTarget: "new",
      selectedMaskId: null,
      maskTab: "coverage",
    });
    expect(rig.held()).toBe(MASK_TOOL);
    expect(screen.getByText("Drag to add a radial")).toBeTruthy();
  });

  it("makes a range mask at once from Create Mask, as one step", () => {
    draw();
    fireEvent.click(button("+ Create Mask ▾"));
    fireEvent.click(item("Luminance Range"));
    expect(masks()).toHaveLength(1);
    expect(masks()[0]).toMatchObject({ name: "Luminance", components: [{ kind: "lumRange", mode: "add" }] });
    expect(maskTool().selectedMaskId).toBe(masks()[0].id);
    expect(labels()).toEqual(["New Mask"]);
    expect(screen.getByText("Luminance range")).toBeTruthy();
  });

  it("can't make a mask past the cap, and says why", () => {
    setParams({ masks: Array.from({ length: MAX_MASKS }, (_, i) => mask({ id: `m${i}` })) });
    draw();
    expect(button("+ Create Mask ▾")).toHaveProperty("disabled", true);
    expect(button("+ Create Mask ▾").getAttribute("title")).toBe("Mask limit reached (16)");
    expect(screen.getByText("16/16 masks")).toBeTruthy();
  });

  it("lists the masks: a click selects one on Coverage, hovering shows its coverage, the eye doesn't", () => {
    setParams({ masks: [mask({ components: [comp(), comp({ id: "c2", kind: "brush", radial: undefined, brush: { dabs: [], feather: 0.5 } })] })] });
    setMaskTool({ maskTab: "adjust" });
    draw();
    const row = screen.getByText("Mask 1").closest("div") as HTMLElement;
    expect(screen.getByText("◯ ✎")).toBeTruthy();
    expect(screen.getByText("(2)")).toBeTruthy();
    fireEvent.click(row);
    expect(maskTool()).toMatchObject({ selectedMaskId: "m1", selectedComponentId: "c1", maskTab: "coverage" });
    fireEvent.mouseEnter(row);
    expect(maskTool().hoveredMaskId).toBe("m1");
    // React reads entering and leaving a child from the mouseout it crosses.
    const eye = screen.getByTitle("Hide");
    fireEvent.mouseOut(row, { relatedTarget: eye });
    expect(maskTool().hoveredMaskId).toBeNull();
    fireEvent.mouseOut(eye, { relatedTarget: row });
    expect(maskTool().hoveredMaskId).toBe("m1");
  });

  it("hides, inverts and deletes a mask from its row, each as one step", () => {
    setParams({ masks: [mask(), mask({ id: "m2", name: "Mask 2" })] });
    setMaskTool({ selectedMaskId: "m2", selectedComponentId: "c1", hoveredMaskId: "m2" });
    draw();
    fireEvent.click(screen.getAllByTitle("Hide")[0]);
    expect(masks()[0].visible).toBe(false);
    expect(screen.getByTitle("Show")).toBeTruthy();
    fireEvent.click(screen.getAllByTitle("Invert whole mask")[0]);
    expect(masks()[0].invert).toBe(true);
    fireEvent.click(screen.getAllByRole("button", { name: "Delete mask" })[1]);
    expect(masks().map((m) => m.id)).toEqual(["m1"]);
    expect(maskTool()).toMatchObject({ selectedMaskId: null, selectedComponentId: null, hoveredMaskId: null });
    expect(labels()).toEqual(["Mask Visibility", "Mask Invert", "Delete Mask"]);
  });

  it("renames a mask from a double-click on its name", () => {
    setParams({ masks: [mask()] });
    draw();
    fireEvent.doubleClick(screen.getByText("Mask 1"));
    const input = screen.getByDisplayValue("Mask 1");
    fireEvent.change(input, { target: { value: "  Sky  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.blur(input);
    expect(masks()[0].name).toBe("Sky");
    expect(labels()).toEqual(["Rename Mask"]);
  });

  it("deselects on a click in the panel's empty space", () => {
    setParams({ masks: [mask()] });
    setMaskTool({ selectedMaskId: "m1", selectedComponentId: "c1", hoveredMaskId: "m1" });
    const { container } = draw();
    fireEvent.click(container.querySelector("section > div") as HTMLElement);
    expect(maskTool()).toMatchObject({ selectedMaskId: null, selectedComponentId: null, hoveredMaskId: null });
  });

  it("shows the brush settings while the brush is armed, the slider dragged showing the brush", () => {
    setMaskTool({ activeTool: "mask", maskToolType: "brush" });
    const { container } = draw();
    expect(screen.getByText("Paint to add")).toBeTruthy();
    const [size, feather, opacity, flow] = rig.sliders(container);
    expect([size.value, feather.value, opacity.value, flow.value]).toEqual([8, 50, 100, 100]);
    act(() => size.onChange(20));
    expect(maskTool()).toMatchObject({ brushSize: 0.2, brushPreview: true });
    act(() => size.onCommit?.());
    act(() => flow.onChange(40));
    expect(maskTool()).toMatchObject({ brushFlow: 0.4, brushPreview: true });
    act(() => flow.onCommit?.());
    fireEvent.click(screen.getByRole("checkbox"));
    expect(maskTool()).toMatchObject({ brushPreview: false, brushErase: true });
    expect(rig.calls).toEqual([]);
  });

  it("leaves the tool with Done, dropping the selection and hover", () => {
    setParams({ masks: [mask()] });
    setMaskTool({ activeTool: "mask", selectedMaskId: "m1", selectedComponentId: "c1", hoveredMaskId: "m1" });
    draw();
    fireEvent.click(button("Done"));
    expect(maskTool()).toMatchObject({ activeTool: "none", selectedMaskId: null, selectedComponentId: null, hoveredMaskId: null });
    expect(rig.held()).toBeNull();
    expect(screen.getByText("1/16 masks")).toBeTruthy();
  });

  it("treats the tool as left when another tool takes the canvas", () => {
    act(() => setMaskTool({ activeTool: "mask" }));
    draw();
    act(() => rig.takeCanvas());
    expect(maskTool().activeTool).toBe("none");
  });

  describe("the Coverage tab", () => {
    beforeEach(() => {
      setParams({
        masks: [mask({ components: [comp(), comp({ id: "c2", kind: "lumRange", radial: undefined, lumRange: defaultLumRange() })] })],
      });
      setMaskTool({ selectedMaskId: "m1", selectedComponentId: "c1" });
    });

    it("cycles, inverts and deletes a component, each as one step", () => {
      draw();
      fireEvent.click(screen.getAllByTitle("Add (union) — click to cycle")[0]);
      expect(masks()[0].components[0].mode).toBe("subtract");
      expect(screen.getByTitle("Subtract (carve) — click to cycle")).toBeTruthy();
      fireEvent.click(screen.getAllByTitle("Invert this component")[1]);
      expect(masks()[0].components[1].invert).toBe(true);
      fireEvent.click(screen.getAllByRole("button", { name: "Delete component" })[0]);
      expect(masks()[0].components.map((c) => c.id)).toEqual(["c2"]);
      expect(maskTool().selectedComponentId).toBeNull();
      expect(labels()).toEqual(["Component Mode", "Component Invert", "Delete Component"]);
    });

    it("edits a geometric component on the canvas from its row", () => {
      setParams({ masks: [mask({ components: [comp(), comp({ id: "c3", mode: "subtract", kind: "linear", radial: undefined, linear: { x0: 0, y0: 0, x1: 1, y1: 1 } })] })] });
      draw();
      fireEvent.click(screen.getByText("Linear"));
      expect(maskTool()).toMatchObject({
        selectedComponentId: "c3",
        activeTool: "mask",
        maskToolType: "linear",
        maskCompMode: "subtract",
        maskAddTarget: "current",
      });
    });

    it("arms a fresh brush for the mask from Add Component", () => {
      draw();
      fireEvent.click(button("+ Add Component ▾"));
      fireEvent.click(item("Brush"));
      expect(maskTool()).toMatchObject({
        selectedMaskId: "m1",
        selectedComponentId: null,
        activeTool: "mask",
        maskToolType: "brush",
        maskCompMode: "add",
        maskAddTarget: "current",
      });
    });

    it("adds a colour range to the mask as an intersect, as one step", () => {
      draw();
      fireEvent.click(button("+ Add Component ▾"));
      fireEvent.click(item("Colour Range"));
      expect(masks()[0].components.map((c) => [c.kind, c.mode])).toEqual([
        ["radial", "add"],
        ["lumRange", "add"],
        ["colorRange", "intersect"],
      ]);
      expect(labels()).toEqual(["Add Component"]);
    });

    it("feathers a radial, its geometry typed only with keyboard canvas editing on", () => {
      const { container } = draw();
      expect(screen.queryByLabelText("Centre X (%)")).toBeNull();
      const [feather] = rig.sliders(container);
      act(() => feather.onChange(20));
      act(() => feather.onCommit?.());
      expect(masks()[0].components[0].radial?.feather).toBe(0.2);
      act(() => rig.setKeyboardEditing(true));
      const x = screen.getByLabelText("Centre X (%)");
      fireEvent.change(x, { target: { value: "30" } });
      fireEvent.change(screen.getByLabelText("Radius X (%)"), { target: { value: "-5" } });
      fireEvent.change(screen.getByLabelText("Angle (degrees)"), { target: { value: "90" } });
      fireEvent.blur(x);
      expect(masks()[0].components[0].radial).toMatchObject({ cx: 0.3, rx: 0 });
      expect(masks()[0].components[0].radial?.angle).toBeCloseTo(Math.PI / 2);
      expect(labels()).toEqual(["Mask Feather", "Mask Geometry"]);
    });

    it("keeps a luminance range's low end below its high end", () => {
      setMaskTool({ selectedComponentId: "c2" });
      const { container } = draw();
      act(() => rig.sliders(container)[1].onChange(40));
      act(() => rig.sliders(container)[0].onChange(70));
      act(() => rig.sliders(container)[0].onCommit?.());
      expect(masks()[0].components[1].lumRange).toMatchObject({ lo: 0.4, hi: 0.4 });
      expect(labels()).toEqual(["Lum Range"]);
    });

    it("turns the colour range eyedropper on with the mask tool, and off again", () => {
      setParams({ masks: [mask({ components: [comp({ kind: "colorRange", radial: undefined, colorRange: defaultColorRange() })] })] });
      draw();
      fireEvent.click(screen.getByTitle("Pick a target colour from the image"));
      expect(maskTool()).toMatchObject({ activeTool: "mask", maskColorPicking: true });
      expect(rig.held()).toBe(MASK_TOOL);
      fireEvent.click(screen.getByTitle("Pick a target colour from the image"));
      expect(maskTool().maskColorPicking).toBe(false);
    });
  });

  describe("the Adjust tab", () => {
    const Gain = () => <span>gain {String(masks().find((m) => m.id === React.useContext(ScopedMask))?.bag?.["acme.gain.amount"])}</span>;
    const Basic = () => <span>basic for {React.useContext(ScopedMask)}</span>;
    const BASIC: MaskPanelEntry = { id: "core.basic", title: "Basic", owns: ["exposure", "contrast"], component: Basic, extensionParams: false };
    const CURVE: MaskPanelEntry = { id: "core.curve", title: "Tone Curve", owns: ["toneCurve"], component: () => null, extensionParams: false };
    const GAIN: MaskPanelEntry = { id: "acme.gain-panel", title: "Gain", owns: ["acme.gain.amount"], component: Gain, extensionParams: true };

    beforeEach(() => {
      rig.setMaskPanels([BASIC, CURVE, GAIN]);
      setParams({ masks: [mask()] });
      setMaskTool({ selectedMaskId: "m1", maskTab: "adjust" });
    });

    it("draws each sub-panel the mask carries in the mask's scope, and offers the rest", () => {
      draw();
      expect(screen.getByText("basic for m1")).toBeTruthy();
      expect(screen.getByText("Adjust:")).toBeTruthy();
      const offered = screen.getByText("Adjust:").parentElement as HTMLElement;
      expect([...offered.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["+ Tone Curve", "+ Gain"]);
    });

    it("sets the mask's opacity as one step", () => {
      const { container } = draw();
      const [opacity] = rig.sliders(container);
      act(() => opacity.onChange(40));
      act(() => opacity.onCommit?.());
      expect(masks()[0].opacity).toBe(40);
      expect(labels()).toEqual(["Mask Amount"]);
    });

    it("adds a sub-panel, seeding its values, and removes one, clearing them", () => {
      draw();
      fireEvent.click(button("+ Tone Curve"));
      expect(masks()[0].panels).toEqual(["core.basic", "core.curve"]);
      expect(masks()[0].toneCurve).toBeDefined();
      fireEvent.click(screen.getByTitle("Remove Tone Curve (resets its values)"));
      expect(masks()[0].panels).toEqual(["core.basic"]);
      expect(masks()[0].toneCurve).toBeUndefined();
      expect(labels()).toEqual(["Add Mask Panel", "Remove Mask Panel"]);
    });

    it("resets the mask's adjustments and re-seeds its sub-panels as one step", () => {
      setParams({ masks: [mask({ adj: { ...defaultMaskAdjustments(), exposure: 40, clarity: 20 } })] });
      draw();
      fireEvent.click(button("Reset"));
      expect(masks()[0].adj).toEqual(defaultMaskAdjustments());
      expect(labels()).toEqual(["Mask Reset"]);
    });

    it("keeps a sub-panel nothing offers any more, removable", () => {
      setParams({ masks: [mask({ panels: ["core.basic", "gone.panel"] })] });
      draw();
      expect(screen.getByText("(not installed)")).toBeTruthy();
      fireEvent.click(screen.getByTitle("Remove gone.panel"));
      expect(masks()[0].panels).toEqual(["core.basic"]);
    });

    describe("an extension's sub-panel", () => {
      it("adds to a mask on a photo at the current processing, seeding the mask's values", () => {
        draw();
        fireEvent.click(button("+ Gain"));
        expect(masks()[0].panels).toEqual(["core.basic", "acme.gain-panel"]);
        expect(masks()[0].bag).toEqual({ "acme.gain.amount": 1 });
        expect(screen.getByText("gain 1")).toBeTruthy();
      });

      // A sub-panel's own state (a field being typed in, a listener it
      // attached) belongs to the mask it was mounted for.
      it("mounts afresh for each mask selected", () => {
        let mounts = 0;
        function Counted() {
          React.useEffect(() => void mounts++, []);
          return <span>scope {React.useContext(ScopedMask)}</span>;
        }
        rig.setMaskPanels([{ ...GAIN, component: Counted }]);
        setParams({ masks: [mask({ panels: ["acme.gain-panel"] }), mask({ id: "m2", panels: ["acme.gain-panel"] })] });
        draw();
        expect(screen.getByText("scope m1")).toBeTruthy();
        act(() => setMaskTool({ selectedMaskId: "m2" }));
        expect(screen.getByText("scope m2")).toBeTruthy();
        expect(mounts).toBe(2);
      });

      it("can't be added on a photo with older processing, and says why", () => {
        setParams({ processVersion: 2 });
        draw();
        expect(button("+ Gain")).toHaveProperty("disabled", true);
        expect(button("+ Gain").getAttribute("title")).toBe(
          "Gain in a mask needs the current processing: use Update processing on this photo first",
        );
        expect(button("+ Tone Curve")).toHaveProperty("disabled", false);
      });

      it("shows one a photo with older processing already has as not applied, and removable", () => {
        setParams({ processVersion: 2, masks: [mask({ panels: ["acme.gain-panel"], bag: { "acme.gain.amount": 2 } })] });
        draw();
        expect(screen.queryByText("gain 2")).toBeNull();
        expect(screen.getByText(/needs Update processing/)).toBeTruthy();
        fireEvent.click(screen.getByTitle("Remove Gain (resets its values)"));
        expect(masks()[0].panels).toEqual([]);
        expect(masks()[0].bag).toBeUndefined();
      });
    });
  });
});

describe("the canvas tool", () => {
  const canvas = () => document.querySelector("[data-mask-canvas]") as HTMLElement;
  const draw = () => render(<MaskCanvas rect={RECT} />);
  const down = (x: number, y: number, init: object = {}) =>
    fireEvent.pointerDown(canvas(), { pointerId: 1, button: 0, clientX: x, clientY: y, ...init });
  const move = (x: number, y: number, init: object = {}) =>
    fireEvent.pointerMove(canvas(), { pointerId: 1, clientX: x, clientY: y, ...init });
  const up = () => fireEvent.pointerUp(canvas(), { pointerId: 1 });

  beforeEach(() => act(() => setMaskTool({ activeTool: "mask" })));

  it("draws a radial out from its corner into a new mask, as one step", () => {
    draw();
    down(400, 400);
    move(600, 500);
    up();
    expect(masks()).toHaveLength(1);
    const [made] = masks();
    expect(made).toMatchObject({ name: "Radial", panels: DEFAULT_MASK_PANELS, opacity: 100 });
    expect(made.components[0].radial).toMatchObject({ feather: 0.5, angle: 0 });
    const r = made.components[0].radial!;
    expect([r.cx, r.cy, r.rx, r.ry].map((v) => Number(v.toFixed(6)))).toEqual([0.5, 0.45, 0.1, 0.05]);
    expect(maskTool()).toMatchObject({ selectedMaskId: made.id, selectedComponentId: made.components[0].id, maskAddTarget: "current" });
    expect(labels()).toEqual(["Mask"]);
  });

  it("draws a circle about its centre with Shift and Alt", () => {
    draw();
    down(500, 500, { altKey: true });
    move(600, 550, { altKey: true, shiftKey: true });
    up();
    const r = masks()[0].components[0].radial!;
    expect([r.cx, r.cy]).toEqual([0.5, 0.5]);
    expect(r.rx).toBeCloseTo(0.1);
    expect(r.ry).toBeCloseTo(0.1);
  });

  it("drops a bare click's stray component and its new mask, deselecting, with no step", () => {
    draw();
    down(400, 400);
    up();
    expect(masks()).toEqual([]);
    expect(maskTool()).toMatchObject({ selectedMaskId: null, selectedComponentId: null });
    expect(labels()).toEqual([]);
  });

  it("draws a linear gradient, snapped to 45° with Shift, into the selected mask", () => {
    setParams({ masks: [mask()] });
    setMaskTool({ maskToolType: "linear", maskAddTarget: "current", selectedMaskId: "m1", selectedComponentId: null });
    draw();
    down(100, 100);
    move(300, 290, { shiftKey: true });
    up();
    expect(masks()).toHaveLength(1);
    const added = masks()[0].components[1];
    expect(added.kind).toBe("linear");
    expect(added.linear!.x0).toBeCloseTo(0.1);
    expect(added.linear!.x1 - added.linear!.x0).toBeCloseTo(added.linear!.y1 - added.linear!.y0);
    expect(maskTool().selectedComponentId).toBe(added.id);
  });

  it("paints a brush stroke into a new brush mask, with the brush's settings", () => {
    setMaskTool({ maskToolType: "brush", brushSize: 0.04, brushFeather: 0.3, brushOpacity: 0.8, brushFlow: 0.6 });
    draw();
    down(300, 500);
    move(305, 500);
    move(400, 500);
    up();
    const brush = masks()[0].components[0];
    expect(masks()[0].name).toBe("Brush");
    expect(brush.brush?.feather).toBe(0.3);
    expect(brush.brush?.dabs.map((d) => d.x)).toEqual([0.3, 0.4]);
    expect(brush.brush?.dabs[0]).toEqual({ x: 0.3, y: 0.5, radius: 0.04, erase: false, feather: 0.3, opacity: 0.8, flow: 0.6, strokeStart: true });
    expect(labels()).toEqual(["Mask"]);
  });

  it("extends the selected brush with the next stroke, erasing under Alt", () => {
    setMaskTool({ maskToolType: "brush" });
    draw();
    down(300, 500);
    up();
    down(600, 500, { altKey: true });
    up();
    expect(masks()).toHaveLength(1);
    expect(masks()[0].components).toHaveLength(1);
    expect(masks()[0].components[0].brush?.dabs.map((d) => d.erase)).toEqual([false, true]);
  });

  it("starts a separate brush once the component is deselected", () => {
    setMaskTool({ maskToolType: "brush" });
    draw();
    down(300, 500);
    up();
    act(() => setMaskTool({ selectedComponentId: null }));
    down(600, 500);
    up();
    expect(masks()).toHaveLength(1);
    expect(masks()[0].components).toHaveLength(2);
  });

  it("paints a straight line of dabs from the last brush point with Shift", () => {
    setMaskTool({ maskToolType: "brush", brushSize: 0.08 });
    draw();
    down(100, 500);
    up();
    down(300, 500, { shiftKey: true });
    up();
    const dabs = masks()[0].components[0].brush!.dabs;
    expect(dabs).toHaveLength(1 + 10);
    expect(dabs[1].strokeStart).toBe(true);
    expect(dabs[2].strokeStart).toBeUndefined();
    expect(dabs[10].x).toBeCloseTo(0.3);
  });

  it("moves, sizes and turns the selected radial by its handles", () => {
    setParams({ masks: [mask()] });
    setMaskTool({ selectedMaskId: "m1", selectedComponentId: "c1" });
    draw();
    down(700, 500); // east handle
    move(800, 500);
    up();
    let r = masks()[0].components[0].radial!;
    expect(r.rx).toBeCloseTo(0.25);
    expect(r.cx).toBeCloseTo(0.55);
    down(550, 500); // centre
    move(500, 400);
    up();
    r = masks()[0].components[0].radial!;
    expect([r.cx, r.cy]).toEqual([0.5, 0.4]);
    down(500, 400 - 260); // rotate handle, above the top edge
    move(700, 400, { shiftKey: true });
    up();
    expect(masks()[0].components[0].radial!.angle).toBeCloseTo(Math.PI / 2);
    expect(labels()).toEqual(["Mask", "Mask", "Mask"]);
  });

  it("draws nothing while the tool isn't armed", () => {
    act(() => setMaskTool({ activeTool: "none" }));
    draw();
    down(400, 400);
    move(600, 500);
    up();
    expect(masks()).toEqual([]);
  });

  describe("shortcuts", () => {
    it("sizes only the armed brush with Develop's brush size keys", () => {
      setMaskTool({ maskToolType: "radial" });
      expect(MASK_TOOL.wants?.("brush.larger")).toBe(false);
      expect(MASK_TOOL.onAction?.("brush.larger")).toBe(false);
      setMaskTool({ maskToolType: "brush", brushSize: 0.08 });
      expect(MASK_TOOL.wants?.("brush.larger")).toBe(true);
      expect(maskTool().brushSize).toBe(0.08);
      expect(MASK_TOOL.onAction?.("brush.larger")).toBe(true);
      expect(maskTool().brushSize).toBe(0.09);
      setMaskTool({ brushSize: 0.5 });
      MASK_TOOL.onAction?.("brush.larger");
      expect(maskTool().brushSize).toBe(0.5);
      setMaskTool({ brushSize: 0.015 });
      MASK_TOOL.onAction?.("brush.smaller");
      expect(maskTool().brushSize).toBe(0.01);
    });

    it("steps feather, opacity and flow within their ranges", () => {
      setMaskTool({ maskToolType: "brush", brushFeather: 0.5, brushOpacity: 0.95, brushFlow: 0.05 });
      expect(MASK_TOOL.onAction?.("brush.featherUp")).toBe(true);
      expect(MASK_TOOL.onAction?.("brush.opacityUp")).toBe(true);
      expect(MASK_TOOL.onAction?.("brush.flowDown")).toBe(true);
      expect(maskTool()).toMatchObject({ brushFeather: 0.55, brushOpacity: 1, brushFlow: 0.01 });
      setMaskTool({ brushFeather: 0.02 });
      MASK_TOOL.onAction?.("brush.featherDown");
      MASK_TOOL.onAction?.("brush.opacityDown");
      MASK_TOOL.onAction?.("brush.flowUp");
      expect(maskTool()).toMatchObject({ brushFeather: 0, brushOpacity: 0.9, brushFlow: 0.11 });
    });

    it("deletes the selected component with Delete, the mask with its last, as one step", () => {
      setParams({ masks: [mask({ components: [comp(), comp({ id: "c2" })] })] });
      setMaskTool({ selectedMaskId: "m1", selectedComponentId: null });
      expect(MASK_TOOL.wants?.("mask.delete")).toBe(false);
      expect(MASK_TOOL.onAction?.("mask.delete")).toBe(false);
      setMaskTool({ selectedComponentId: "c2" });
      expect(MASK_TOOL.wants?.("mask.delete")).toBe(true);
      expect(masks()[0].components).toHaveLength(2);
      expect(MASK_TOOL.onAction?.("mask.delete")).toBe(true);
      expect(masks()[0].components.map((c) => c.id)).toEqual(["c1"]);
      setMaskTool({ selectedComponentId: "c1" });
      MASK_TOOL.onAction?.("mask.delete");
      expect(masks()).toEqual([]);
      expect(maskTool().selectedMaskId).toBeNull();
      expect(labels()).toEqual(["Delete Component", "Delete Component"]);
    });

    it("leaves every other action to core", () => {
      setMaskTool({ maskToolType: "brush" });
      expect(MASK_TOOL.wants?.("develop.toggleClipping")).toBe(false);
      expect(MASK_TOOL.onAction?.("develop.toggleClipping")).toBe(false);
    });
  });

  it("leaves the tool and drops the selection and hover on Escape", () => {
    setParams({ masks: [mask()] });
    setMaskTool({ selectedMaskId: "m1", selectedComponentId: "c1", hoveredMaskId: "m1" });
    MASK_TOOL.onEscape?.();
    expect(maskTool()).toMatchObject({ activeTool: "none", selectedMaskId: null, selectedComponentId: null, hoveredMaskId: null });
    expect(rig.held()).toBeNull();
  });
});
