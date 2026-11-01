# Masking for Safelight

The Develop **Masking** panel: local adjustments, confined to the parts of
the photo you choose with brush, linear, radial, luminance range and colour
range masks.

- **+ Create Mask** starts a mask. **Radial** and **Linear** are drawn by
  dragging on the photo; **Brush** is painted. **Luminance Range** and
  **Color Range** are made at once, from the photo's tones or colours.
- Drag a radial from corner to corner, or from its centre with Alt; Shift
  keeps it a circle. Shift snaps a linear gradient to 0, 45 or 90°.
- A selected radial has handles: the centre moves it, the side handles size
  it (Alt about its centre, Shift keeping its shape), and the top handle
  turns it (Shift in 15° steps). A linear gradient's ends drag.
- While painting, **Size**, **Feather**, **Opacity** and **Flow** set the
  brush, and the brush shows at the middle of the photo while you drag them.
  **Erase**, or holding Alt, takes coverage away; Shift+click paints a
  straight line from the last brush point.
- Develop's brush shortcuts set the brush while it is on: `[` and `]` its
  size, Shift+`[` and Shift+`]` its feather, `,` and `.` its opacity, and
  Shift+`,` and Shift+`.` its flow (by default). Delete removes the selected
  component, and the mask with its last one.
- The list shows each mask: hovering it shows its coverage over the photo,
  the eye hides it, ⊘ inverts it, × deletes it, a double-click renames it and
  a click selects it.
- A selected mask's **Coverage** tab lists its components. The chip in front
  of each cycles how it combines: added, subtracted or intersected. **+ Add
  Component** adds another; a range added to a mask confines it. The
  selected component's settings show below: a radial's feather, a range's
  low and high ends and falloff, a colour range's hue and saturation range,
  and **Pick** to take its colour from the photo. With Keyboard canvas
  editing on, radials and linear gradients can be placed by number.
- The **Adjust** tab sets the mask's opacity and holds the panels that
  adjust inside it. **Adjust:** adds one, × removes it, and **Reset** sets
  them all back. A panel from an extension adjusts inside a mask only on
  photos at the current processing; on others it says to use **Update
  processing** first.
- **Done** or Escape turns the tool off.

Right-click the panel's header and choose **Reset to defaults** to remove
every mask as one step.

Until Safelight 3.2.0 this panel was built in. It keeps the built-in panel's
id (`core.masks`), so layouts saved before then keep it where it was. While
Masking is off or uninstalled, photos show without their masks, and Develop
says so for photos that had them.

## Development

```bash
npm install
npm run typecheck
npm run build    # dist/index.js, the file Safelight loads
npm test         # vitest; the bundle checks read dist/, so build first
npm run check    # all three, in that order
```
