// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Core's defaults for the params this extension edits.

import type { CropRect, TransformParams } from "./safelight";

export const DEFAULT_CROP: CropRect = { x: 0, y: 0, width: 1, height: 1 };

export const DEFAULT_TRANSFORM: TransformParams = {
  perspectiveV: 0,
  perspectiveH: 0,
  aspect: 0,
  scale: 100,
  offsetX: 0,
  offsetY: 0,
  flipH: false,
  flipV: false,
};
