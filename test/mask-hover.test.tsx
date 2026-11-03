// Hovering the mask tool over a photo moves only the cursor ring: a pointer
// move must not map the masks' outlines again, and neither may a redraw for
// another reason when the masks and the view are unchanged. Outline renders
// are counted by the work every one does and the ring never does: mapping an
// image point to the screen (`mat3Apply`, spied pass-through).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/transform", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/transform")>();
  return { ...real, mat3Apply: vi.fn(real.mat3Apply) };
});

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { React, initRuntime } from "../src/rt";
import type { Mask, OverlayRect } from "../src/safelight";
import { DEFAULT_MASK_PANELS, defaultMaskAdjustments } from "../src/masks";
import { MaskCanvas } from "../src/MaskCanvas";
import { resetMaskTool, setMaskTool } from "../src/state";
import { mat3Apply } from "../src/transform";
import { fakeApi, type Rig } from "./support/fake-api";

HTMLElement.prototype.setPointerCapture ??= () => {};

const mapped = vi.mocked(mat3Apply);
const MASKS = 6;

// The canvas hands out a fresh rect on each of its renders, with the same
// numbers.
const view = (): OverlayRect => ({ x: 40, y: 30, w: 1000, h: 750 });

function radialMask(i = 1): Mask {
  return {
    id: `mask-${i}`,
    name: "Radial",
    visible: true,
    invert: false,
    opacity: 100,
    adj: defaultMaskAdjustments(),
    panels: [...DEFAULT_MASK_PANELS],
    components: [
      {
        id: `comp-${i}`,
        kind: "radial",
        mode: "add",
        invert: false,
        radial: { cx: 0.5, cy: 0.5, rx: 0.2, ry: 0.2, feather: 0.5, angle: 0 },
      },
    ],
  };
}

let rig: Rig;

function seed(masks: Mask[] = Array.from({ length: MASKS }, (_, i) => radialMask(i + 1))): Mask[] {
  rig.develop.setState({ params: { ...rig.develop.getState().params, masks } });
  return masks;
}

function renderCanvas(rect: OverlayRect = view()) {
  const result = render(<MaskCanvas rect={rect} />);
  const canvas = result.container.firstElementChild;
  if (!canvas) throw new Error("MaskCanvas rendered nothing");
  return {
    canvas,
    rerender: (next: OverlayRect) => result.rerender(<MaskCanvas rect={next} />),
    circles: () => [...result.container.querySelectorAll("circle")],
    rings: () => [...result.container.querySelectorAll("ellipse")],
    paths: () => [...result.container.querySelectorAll("path")].map((p) => p.getAttribute("d")),
  };
}

// jsdom lays nothing out, so the canvas sits at the origin and client
// coordinates are canvas coordinates.
const hover = (canvas: Element, x: number, y: number, altKey = false) =>
  fireEvent.pointerMove(canvas, { pointerId: 1, clientX: x, clientY: y, altKey });

beforeEach(() => {
  rig = fakeApi();
  rig.overlay.setState({ imageAspect: 4 / 3 });
  initRuntime(rig.api);
  resetMaskTool();
  mapped.mockClear();
});

afterEach(cleanup);

describe("hover", () => {
  it("shows the subtract ring under Alt and keeps it on the pointer", () => {
    setMaskTool({ activeTool: "mask", maskToolType: "brush", brushSize: 0.08 });
    const { canvas, rings } = renderCanvas();

    hover(canvas, 400, 300);
    expect(rings()[0].getAttribute("stroke")).toBe("#fff");

    hover(canvas, 420, 310, true);
    const [outer, inner] = rings();
    expect(outer.getAttribute("stroke")).toBe("#ff6b6b");
    expect(outer.getAttribute("stroke-dasharray")).toBe("4 3");
    expect(inner.getAttribute("stroke")).toBe("#ff6b6b");
    expect([outer.getAttribute("cx"), outer.getAttribute("cy")]).toEqual(["420", "310"]);
    expect(Number(outer.getAttribute("rx"))).toBeCloseTo(60);
    expect(Number(outer.getAttribute("ry"))).toBeCloseTo(60);
  });

  it("moves the brush ring without mapping any outline again", () => {
    seed();
    setMaskTool({ activeTool: "mask", maskToolType: "brush" });
    const { canvas } = renderCanvas();
    expect(mapped).toHaveBeenCalled();
    mapped.mockClear();

    for (let k = 0; k < 10; k++) hover(canvas, 100 + 20 * k, 200 + 10 * k);

    expect(mapped).not.toHaveBeenCalled();
  });

  it("maps only the selected component's handles while it hit-tests them", () => {
    const masks = seed();
    setMaskTool({ activeTool: "mask", maskToolType: "radial", selectedMaskId: masks[0].id, selectedComponentId: masks[0].components[0].id });
    const { canvas } = renderCanvas();
    mapped.mockClear();

    for (let k = 0; k < 10; k++) hover(canvas, 100 + 20 * k, 200 + 10 * k);

    expect(mapped.mock.calls.length).toBeLessThanOrEqual(6 * 10);
  });

  it("grows the handle under the pointer on the selected component", () => {
    const [mask] = seed([radialMask()]);
    setMaskTool({ activeTool: "mask", maskToolType: "radial", selectedMaskId: mask.id, selectedComponentId: mask.components[0].id });
    const { canvas, circles } = renderCanvas();
    const eastHandle = () => circles().find((c) => c.getAttribute("cx") === "740" && c.getAttribute("cy") === "405");
    expect(eastHandle()?.getAttribute("r")).toBe("5");

    hover(canvas, 742, 404);

    expect(eastHandle()?.getAttribute("r")).toBe("6");
  });

  it("drops the ring when the pointer leaves", () => {
    setMaskTool({ activeTool: "mask", maskToolType: "brush" });
    const { canvas, rings } = renderCanvas();
    hover(canvas, 300, 300);
    expect(rings()).toHaveLength(2);

    fireEvent.pointerLeave(canvas);

    expect(rings()).toHaveLength(0);
  });
});

describe("outlines", () => {
  it("are left alone by a redraw that changes nothing they show", () => {
    seed();
    setMaskTool({ activeTool: "mask", maskToolType: "brush" });
    renderCanvas();
    mapped.mockClear();

    act(() => setMaskTool({ brushSize: 0.2, hoveredMaskId: "mask-2" }));

    expect(mapped).not.toHaveBeenCalled();
  });

  it("are left alone for a fresh view with the same numbers", () => {
    seed();
    setMaskTool({ activeTool: "mask" });
    const { rerender, paths } = renderCanvas();
    const before = paths();
    mapped.mockClear();

    rerender(view());

    expect(mapped).not.toHaveBeenCalled();
    expect(paths()).toEqual(before);
  });

  const changes: [string, (rerender: (r: OverlayRect) => void) => void][] = [
    ["zoom", (rerender) => rerender({ ...view(), w: 2000, h: 1500 })],
    ["crop", () => rig.overlay.setState({ region: { x: 0.1, y: 0, width: 0.9, height: 1 } })],
    [
      "transform",
      () => {
        const { params } = rig.develop.getState();
        rig.develop.setState({ params: { ...params, transform: { ...params.transform, offsetX: 10 } } });
      },
    ],
  ];
  it.each(changes)("are mapped again after a %s change", (_, change) => {
    seed();
    setMaskTool({ activeTool: "mask" });
    const { rerender, paths } = renderCanvas();
    const before = paths();
    mapped.mockClear();

    act(() => change(rerender));

    expect(mapped.mock.calls.length).toBeGreaterThanOrEqual(MASKS * 49);
    expect(paths()).not.toEqual(before);
  });

  it("show only while the mask tool is armed", () => {
    seed();
    const { paths } = renderCanvas();
    expect(paths()).toEqual([]);
  });
});
