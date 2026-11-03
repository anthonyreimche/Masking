// The brush ring shows the disc a dab paints. A dab is a disc in the photo; the
// photo's transform draws it on screen, so with Transform ▸ Aspect +100 (1.5×
// wider, 1/1.5 as tall) the painted disc is an ellipse and the ring must be too.

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { React, initRuntime } from "../src/rt";
import { MaskCanvas } from "../src/MaskCanvas";
import { resetMaskTool, setMaskTool } from "../src/state";
import { fakeApi, type Rig } from "./support/fake-api";

HTMLElement.prototype.setPointerCapture ??= () => {};

const RECT = { x: 0, y: 0, w: 1000, h: 1000 };
const WIDE = 1.5;
const SIZE = 0.08;

let rig: Rig;

function withAspect(aspect: number) {
  const { params } = rig.develop.getState();
  rig.develop.setState({ params: { ...params, transform: { ...params.transform, aspect } } });
}

/** Half-extents on screen of a drawn ring, whatever element draws it. */
function extent(el: Element): { rx: number; ry: number } {
  const n = (name: string) => Number(el.getAttribute(name));
  if (el.tagName === "circle") return { rx: n("r"), ry: n("r") };
  const turn = /rotate\(([-\d.e]+)/.exec(el.getAttribute("transform") ?? "");
  const a = ((turn ? Number(turn[1]) : 0) * Math.PI) / 180;
  const rx = n("rx"), ry = n("ry");
  return { rx: Math.hypot(rx * Math.cos(a), ry * Math.sin(a)), ry: Math.hypot(rx * Math.sin(a), ry * Math.cos(a)) };
}

function hoverRing(): Element {
  render(<MaskCanvas rect={RECT} />);
  const canvas = document.querySelector("[data-mask-canvas]") as HTMLElement;
  fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 500, clientY: 500 });
  const ring = document.querySelector("[data-mask-canvas] svg g > :first-child");
  if (!ring) throw new Error("no brush ring");
  return ring;
}

beforeEach(() => {
  rig = fakeApi();
  rig.overlay.setState({ imageAspect: 1 });
  initRuntime(rig.api);
  resetMaskTool();
  setMaskTool({ activeTool: "mask", maskToolType: "brush", brushSize: SIZE });
});

afterEach(cleanup);

describe("the brush ring", () => {
  it("is the stretched disc a dab paints with Aspect +100", () => {
    withAspect(100);
    const { rx, ry } = extent(hoverRing());
    expect(rx).toBeCloseTo(SIZE * 1000 * WIDE, 0);
    expect(ry).toBeCloseTo((SIZE * 1000) / WIDE, 0);
  });

  it("stays round with no transform", () => {
    withAspect(0);
    const { rx, ry } = extent(hoverRing());
    expect(rx).toBeCloseTo(SIZE * 1000, 0);
    expect(ry).toBeCloseTo(SIZE * 1000, 0);
  });
});
