// The Colour Range eyedropper asks core for the scene-linear colour under the
// cursor. The canvas's pointer is in frame px, and core wants a point across
// the live frame buffer, so a click maps through the rect where that buffer is
// placed: all of the image at fit, only the zoom window once zoomed in.

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { React, initRuntime } from "../src/rt";
import type { Mask } from "../src/safelight";
import { DEFAULT_MASK_PANELS, defaultColorRange, defaultMaskAdjustments } from "../src/masks";
import { MaskCanvas } from "../src/MaskCanvas";
import { maskTool, resetMaskTool, setMaskTool, updateComponent } from "../src/state";
import { fakeApi, PARAMS, type Rig, type Rgb } from "./support/fake-api";

HTMLElement.prototype.setPointerCapture ??= () => {};

const SCENE_COLOUR: Rgb = [0.42, 0.18, 0.07];
// The photo zoomed in: the frame shows part of the image, and the buffer holds
// the window that fills the 1000×800 frame.
const FRAME = { x: 0, y: 0, w: 1000, h: 800 };
const WINDOW_RECT = { x: 0, y: 0, w: 1000, h: 800 };

function colourRangeMask(): Mask {
  return {
    id: "mask-1",
    name: "Colour",
    visible: true,
    invert: false,
    opacity: 100,
    adj: defaultMaskAdjustments(),
    panels: [...DEFAULT_MASK_PANELS],
    components: [{ id: "comp-1", kind: "colorRange", mode: "add", invert: false, colorRange: defaultColorRange() }],
  };
}

let rig: Rig;

function pickingColour() {
  rig.develop.setState({ photoId: "a", params: { ...PARAMS, masks: [colourRangeMask()] } });
  rig.overlay.setState({ rect: WINDOW_RECT, region: { x: 0.1, y: 0.1, width: 0.3, height: 0.4 }, imageAspect: 1.5 });
  setMaskTool({ activeTool: "mask", maskColorPicking: true, selectedMaskId: "mask-1", selectedComponentId: "comp-1" });
  const { container } = render(<MaskCanvas rect={FRAME} />);
  const canvas = container.firstElementChild;
  if (!canvas) throw new Error("MaskCanvas rendered nothing");
  return canvas;
}

// jsdom lays nothing out, so the canvas sits at the origin and client
// coordinates are frame coordinates.
const click = (canvas: Element, x: number, y: number) =>
  fireEvent.pointerDown(canvas, { pointerId: 1, button: 0, clientX: x, clientY: y });

const target = () => {
  const { colorRange } = rig.develop.getState().params.masks[0].components[0];
  return colorRange && [colorRange.r, colorRange.g, colorRange.b];
};

const labels = () => rig.calls.flatMap((c) => ("commitEdit" in c ? [c.commitEdit] : []));

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

beforeEach(() => {
  rig = fakeApi();
  rig.setProbeColour(SCENE_COLOUR);
  initRuntime(rig.api);
  resetMaskTool();
});

afterEach(cleanup);

describe("Colour Range eyedropper", () => {
  it("asks for the mask colour at the click's place across the frame buffer", async () => {
    click(pickingColour(), 250, 600);
    await settle();

    expect(rig.probes).toHaveLength(1);
    expect(rig.probes[0].u).toBeCloseTo(0.25);
    expect(rig.probes[0].v).toBeCloseTo(0.75);
  });

  it("stores the colour it was given as the component's target, as one step", async () => {
    click(pickingColour(), 250, 600);
    await settle();

    expect(target()).toEqual(SCENE_COLOUR);
    expect(labels()).toEqual(["Colour Range Pick"]);
    expect(maskTool().maskColorPicking).toBe(false);
    expect(rig.develop.getState().params.masks).toHaveLength(1);
  });

  it("picks nothing from the surround beyond the frame buffer, and stops picking", async () => {
    const canvas = pickingColour();
    const before = target();

    click(canvas, 1100, 600);
    await settle();

    expect(rig.probes).toEqual([]);
    expect(target()).toEqual(before);
    expect(maskTool().maskColorPicking).toBe(false);
  });

  // The colour comes back after the user has moved on.
  describe("when the colour comes back late", () => {
    beforeEach(() => rig.holdProbes());

    const answer = async () => {
      act(() => rig.release());
      await settle();
    };

    it("leaves the photo opened meanwhile alone", async () => {
      click(pickingColour(), 250, 600);
      // Its mask carries the same ids, as one synced from the first does.
      act(() => rig.develop.setState({ photoId: "b", params: { ...PARAMS, masks: [colourRangeMask()] } }));

      await answer();

      const { r, g, b } = defaultColorRange();
      expect(target()).toEqual([r, g, b]);
      expect(labels()).not.toContain("Colour Range Pick");
    });

    it("keeps what was changed on the component meanwhile", async () => {
      click(pickingColour(), 250, 600);
      act(() => updateComponent("mask-1", "comp-1", { colorRange: { ...defaultColorRange(), hueRange: 0.4 } }));

      await answer();

      expect(target()).toEqual(SCENE_COLOUR);
      expect(rig.develop.getState().params.masks[0].components[0].colorRange?.hueRange).toBe(0.4);
    });

    it("drops it once the component is gone", async () => {
      click(pickingColour(), 250, 600);
      act(() => rig.develop.setState({ params: { ...PARAMS, masks: [] } }));

      await answer();

      expect(rig.develop.getState().params.masks).toEqual([]);
      expect(labels()).not.toContain("Colour Range Pick");
    });
  });
});
