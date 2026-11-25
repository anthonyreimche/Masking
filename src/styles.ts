// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The look core gave the Masking panel with Tailwind utilities, as plain CSS
// (the app's Tailwind build never scans an extension). `:where()` drops every
// rule to zero specificity, so a stylesheet that restyles the panel or its
// buttons wins over them. The `html.sl-larger-text` rules repeat core's
// Accessibility rule for small text.

import type { UiTokens } from "./safelight";

const P = "safelight-masks";

export const cls = {
  panel: `${P}-panel`,
  head: `${P}-head`,
  hint: `${P}-hint`,
  brush: `${P}-brush`,
  erase: `${P}-erase`,
  muted: `${P}-muted`,
  list: `${P}-list`,
  row: `${P}-row`,
  on: `${P}-on`,
  off: `${P}-off`,
  eye: `${P}-eye`,
  hidden: `${P}-hidden`,
  kinds: `${P}-kinds`,
  rename: `${P}-rename`,
  name: `${P}-name`,
  invert: `${P}-invert`,
  reveal: `${P}-reveal`,
  remove: `${P}-remove`,
  editor: `${P}-editor`,
  section: `${P}-section`,
  mode: `${P}-mode`,
  add: `${P}-add`,
  subtract: `${P}-subtract`,
  intersect: `${P}-intersect`,
  icon: `${P}-icon`,
  caption: `${P}-caption`,
  card: `${P}-card`,
  cardHead: `${P}-card-head`,
  note: `${P}-note`,
  noteText: `${P}-note-text`,
  dim: `${P}-dim`,
  panels: `${P}-panels`,
  controls: `${P}-controls`,
  ranges: `${P}-ranges`,
  fields: `${P}-fields`,
  field: `${P}-field`,
  fieldLabel: `${P}-field-label`,
  fieldInput: `${P}-field-input`,
  swatch: `${P}-swatch`,
} as const;

const tint = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;

export function masksCss(t: UiTokens): string {
  return `
:where(.${cls.panel} > :not(:last-child)) { margin-block: 0 0.5rem; }
:where(.${cls.head}) { display: flex; align-items: center; justify-content: space-between; }
:where(.${cls.hint}) { font-size: 10px; color: ${t.textMuted}; }
:where(.${cls.brush}) { border-radius: 0.25rem; background-color: ${tint(t.surface2, 50)}; padding: 0.375rem; }
:where(.${cls.brush} > :not(:last-child)) { margin-block: 0 0.125rem; }
:where(.${cls.erase}) { display: flex; align-items: center; gap: 0.375rem; padding: 0 0.125rem; font-size: 11px; color: ${t.textSecondary}; }
:where(.${cls.muted}) { color: ${t.textMuted}; }
:where(.${cls.list} > :not(:last-child)) { margin-block: 0 0.125rem; }
:where(.${cls.row}) { display: flex; cursor: pointer; align-items: center; gap: 0.375rem; border-radius: 0.25rem; padding: 0.25rem 0.375rem; font-size: 11px; color: ${t.textSecondary}; }
:where(.${cls.row}:hover) { background-color: ${t.surface2}; }
:where(.${cls.row}.${cls.on}) { background-color: ${tint(t.accent, 20)}; color: ${t.textPrimary}; }
:where(.${cls.row}.${cls.off}) { opacity: 0.5; }
:where(.${cls.eye}) { flex-shrink: 0; border-radius: 0.25rem; padding: 0 0.125rem; color: ${t.textMuted}; }
:where(.${cls.eye}.${cls.hidden}) { color: ${tint(t.textMuted, 40)}; }
:where(.${cls.eye}:hover) { color: ${t.textPrimary}; }
:where(.${cls.kinds}) { flex-shrink: 0; color: ${t.textMuted}; }
:where(.${cls.rename}) { min-width: 0; flex: 1 1 0%; border-radius: 0.25rem; background-color: ${t.surface3}; padding: 0 0.25rem; font-size: 11px; color: ${t.textPrimary}; outline: none; }
:where(.${cls.name}) { flex: 1 1 0%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where(.${cls.invert}) { border-radius: 0.25rem; padding: 0 0.25rem; color: ${t.textMuted}; }
:where(.${cls.invert}:hover) { color: ${t.textPrimary}; }
:where(.${cls.invert}.${cls.on}) { color: ${t.accent}; }
:where(.${cls.remove}) { border-radius: 0.25rem; padding: 0 0.25rem; color: ${t.textMuted}; }
:where(.${cls.remove}:hover) { color: ${t.labelRed}; }
:where(.${cls.reveal}:not(.${cls.on})) { opacity: 0; }
:where(.${cls.row}:hover .${cls.reveal}) { opacity: 1; }
:where(.${cls.editor}) { border-top: 1px solid ${t.borderSubtle}; padding-top: 0.5rem; }
:where(.${cls.editor} > :not(:last-child)) { margin-block: 0 0.5rem; }
:where(.${cls.section} > :not(:last-child)) { margin-block: 0 0.375rem; }
:where(.${cls.mode}) { width: 1rem; flex-shrink: 0; border-radius: 0.25rem; text-align: center; font-weight: 700; }
:where(.${cls.mode}.${cls.add}) { color: ${t.accent}; }
:where(.${cls.mode}.${cls.subtract}) { color: ${t.labelYellow}; }
:where(.${cls.mode}.${cls.intersect}) { color: ${t.labelBlue}; }
:where(.${cls.icon}) { width: 0.75rem; flex-shrink: 0; text-align: center; color: ${t.textMuted}; }
:where(.${cls.caption}) { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: ${t.textMuted}; }
:where(.${cls.card}) { border-radius: 0.25rem; background-color: ${tint(t.surface2, 40)}; padding: 0.375rem; }
:where(.${cls.cardHead}) { margin-bottom: 0.25rem; display: flex; align-items: center; justify-content: space-between; }
:where(.${cls.note}) { display: flex; align-items: center; justify-content: space-between; }
:where(.${cls.noteText}) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; color: ${t.textMuted}; }
:where(.${cls.dim}) { opacity: 0.7; }
:where(.${cls.panels}) { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; }
:where(.${cls.controls}) { border-radius: 0.25rem; background-color: ${tint(t.surface2, 40)}; padding: 0.375rem; }
:where(.${cls.controls} > :not(:last-child)) { margin-block: 0 0.25rem; }
:where(.${cls.ranges}) { border-radius: 0.25rem; background-color: ${tint(t.surface2, 40)}; padding: 0.375rem; }
:where(.${cls.ranges} > :not(:last-child)) { margin-block: 0 0.125rem; }
:where(.${cls.fields}) { display: flex; flex-wrap: wrap; column-gap: 0.5rem; row-gap: 0.25rem; }
:where(.${cls.field}) { display: flex; align-items: center; gap: 0.25rem; font-size: 10px; color: ${t.textMuted}; }
:where(.${cls.fieldLabel}) { user-select: none; }
:where(.${cls.fieldInput}) { width: 2.75rem; border-radius: 0.25rem; background-color: ${t.surface2}; padding: 0 0.25rem; text-align: right; font-variant-numeric: tabular-nums; color: ${t.textPrimary}; outline: none; }
:where(.${cls.fieldInput}:focus) { background-color: ${t.surface3}; }
:where(.${cls.swatch}) { height: 0.625rem; width: 0.625rem; border-radius: 0.125rem; }
html.sl-larger-text .${cls.hint}, html.sl-larger-text .${cls.caption}, html.sl-larger-text .${cls.noteText}, html.sl-larger-text .${cls.field} { font-size: 12px !important; }
html.sl-larger-text .${cls.erase}, html.sl-larger-text .${cls.row}, html.sl-larger-text .${cls.rename} { font-size: 13px !important; line-height: 1.45 !important; }
html.sl-larger-text .${cls.caption} { text-transform: none !important; letter-spacing: normal !important; }
`;
}
