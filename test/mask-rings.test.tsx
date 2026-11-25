// The brush ring is the official one core draws (api.develop.BrushCursor),
// which sizes it as a dab paints through the photo's transform. The canvas
// hands it the pointer as core's framePoint places it, the brush's size and
// feather, whether the brush erases, and the centre while a slider is dragged.

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { React, initRuntime } from "../src/rt";
import { MaskCanvas } from "../src/MaskCanvas";
import { resetMaskTool, setMaskTool } from "../src/state";
import { fakeApi, type Rig } from "./support/fake-api";

HTMLElement.prototype.setPointerCapture ??= () => {};

const RECT = { x: 0, y: 0, w: 1000, h: 1000 };

let rig: Rig;

function canvas(): HTMLElement {
  render(<MaskCanvas rect={RECT} />);
  return document.querySelector("[data-mask-canvas]") as HTMLElement;
}

// jsdom lays nothing out, so the canvas sits at the origin and client
// coordinates are canvas coordinates.
const hover = (el: Element, x: number, y: number, altKey = false) =>
  fireEvent.pointerMove(el, { pointerId: 1, clientX: x, clientY: y, altKey });

beforeEach(() => {
  rig = fakeApi();
  initRuntime(rig.api);
  resetMaskTool();
  setMaskTool({ activeTool: "mask", maskToolType: "brush", brushSize: 0.12, brushFeather: 0.3 });
});

afterEach(cleanup);

describe("the brush ring", () => {
  it("is the official ring at the pointer, with the brush's size and feather", () => {
    hover(canvas(), 400, 300);
    expect(rig.brushCursors()).toEqual([{ at: { x: 400, y: 300 }, size: 0.12, feather: 0.3, erase: false }]);
  });

  it("follows the pointer as core's framePoint places it under Interface scale", () => {
    rig.setFrameZoom(2);
    hover(canvas(), 400, 300);
    expect(rig.brushCursors()[0].at).toEqual({ x: 200, y: 150 });
  });

  it("erases under Alt, with Erase on, and for a subtracting brush", () => {
    const el = canvas();
    hover(el, 400, 300, true);
    expect(rig.brushCursors()[0].erase).toBe(true);
    hover(el, 400, 300);
    expect(rig.brushCursors()[0].erase).toBe(false);
    act(() => setMaskTool({ brushErase: true }));
    expect(rig.brushCursors()[0].erase).toBe(true);
    act(() => setMaskTool({ brushErase: false, maskCompMode: "subtract" }));
    expect(rig.brushCursors()[0].erase).toBe(true);
  });

  it("shows the reference at the centre too while a brush slider is dragged", () => {
    const el = canvas();
    act(() => setMaskTool({ brushPreview: true }));
    expect(rig.brushCursors()).toEqual([{ at: "centre", size: 0.12, feather: 0.3 }]);
    hover(el, 400, 300);
    expect(rig.brushCursors().map((c) => c.at)).toEqual(expect.arrayContaining([{ x: 400, y: 300 }, "centre"]));
  });

  it("is drawn only while the brush is armed", () => {
    act(() => setMaskTool({ maskToolType: "radial", brushPreview: true }));
    hover(canvas(), 400, 300);
    expect(rig.brushCursors()).toEqual([]);
  });

  it("goes when the pointer leaves", () => {
    const el = canvas();
    hover(el, 400, 300);
    fireEvent.pointerLeave(el);
    expect(rig.brushCursors()).toEqual([]);
  });

  it("keeps the crosshair cursor under the ring", () => {
    expect(canvas().style.cursor).toBe("crosshair");
  });
});
