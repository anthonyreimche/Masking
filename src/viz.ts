// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

/** The mask whose coverage core should tint over the image, or null for none.
 *  Hover wins over selection; the selected mask shows only while its editor is
 *  on the Coverage tab (the Adjust tab deliberately hides the tint). Both ids
 *  are resolved against the current mask list: a stale id — deleted under the
 *  pointer, or orphaned by undo — falls through instead of blanking the
 *  coverage for a live selection. */
export function coverageMaskId(
  masks: readonly { id: string }[],
  hoveredMaskId: string | null,
  selectedMaskId: string | null,
  maskTab: "coverage" | "adjust",
): string | null {
  if (hoveredMaskId && masks.some((m) => m.id === hoveredMaskId)) return hoveredMaskId;
  if (selectedMaskId && maskTab === "coverage" && masks.some((m) => m.id === selectedMaskId)) return selectedMaskId;
  return null;
}
