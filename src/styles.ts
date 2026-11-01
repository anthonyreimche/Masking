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
  menuAnchor: `${P}-menu-anchor`,
  create: `${P}-create`,
  head: `${P}-head`,
  hint: `${P}-hint`,
  done: `${P}-done`,
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
  tabs: `${P}-tabs`,
  tab: `${P}-tab`,
  section: `${P}-section`,
  mode: `${P}-mode`,
  add: `${P}-add`,
  subtract: `${P}-subtract`,
  intersect: `${P}-intersect`,
  icon: `${P}-icon`,
  addComponent: `${P}-add-component`,
  caption: `${P}-caption`,
  reset: `${P}-reset`,
  card: `${P}-card`,
  cardHead: `${P}-card-head`,
  note: `${P}-note`,
  noteText: `${P}-note-text`,
  dim: `${P}-dim`,
  panels: `${P}-panels`,
  addPanel: `${P}-add-panel`,
  catcher: `${P}-catcher`,
  menu: `${P}-menu`,
  item: `${P}-item`,
  itemIcon: `${P}-item-icon`,
  divider: `${P}-divider`,
  controls: `${P}-controls`,
  ranges: `${P}-ranges`,
  fields: `${P}-fields`,
  field: `${P}-field`,
  fieldLabel: `${P}-field-label`,
  fieldInput: `${P}-field-input`,
  pick: `${P}-pick`,
  swatch: `${P}-swatch`,
} as const;

const tint = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;

export function masksCss(t: UiTokens): string {
  return `
:where(.${cls.panel} > :not(:last-child)) { margin-block: 0 0.5rem; }
:where(.${cls.menuAnchor}) { position: relative; }
:where(.${cls.create}) { display: flex; width: 100%; align-items: center; justify-content: center; gap: 0.25rem; border-radius: 0.25rem; background-color: ${t.surface2}; padding: 0.375rem 0.5rem; font-size: 11px; color: ${t.textSecondary}; }
:where(.${cls.create}:hover) { color: ${t.textPrimary}; }
:where(.${cls.create}:disabled) { cursor: default; opacity: 0.4; }
:where(.${cls.head}) { display: flex; align-items: center; justify-content: space-between; }
:where(.${cls.hint}) { font-size: 10px; color: ${t.textMuted}; }
:where(.${cls.done}) { border-radius: 0.25rem; background-color: ${t.surface2}; padding: 0.125rem 0.375rem; font-size: 11px; color: ${t.textSecondary}; }
:where(.${cls.done}:hover) { color: ${t.textPrimary}; }
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
:where(.${cls.tabs}) { display: flex; gap: 0.25rem; border-radius: 0.25rem; background-color: ${t.surface2}; padding: 0.125rem; }
:where(.${cls.tab}) { flex: 1 1 0%; border-radius: 0.25rem; padding: 0.25rem 0.5rem; font-size: 11px; text-transform: capitalize; color: ${t.textSecondary}; }
:where(.${cls.tab}:hover) { color: ${t.textPrimary}; }
:where(.${cls.tab}.${cls.on}) { background-color: ${tint(t.accent, 30)}; color: ${t.textPrimary}; }
:where(.${cls.section} > :not(:last-child)) { margin-block: 0 0.375rem; }
:where(.${cls.mode}) { width: 1rem; flex-shrink: 0; border-radius: 0.25rem; text-align: center; font-weight: 700; }
:where(.${cls.mode}.${cls.add}) { color: ${t.accent}; }
:where(.${cls.mode}.${cls.subtract}) { color: ${t.labelYellow}; }
:where(.${cls.mode}.${cls.intersect}) { color: ${t.labelBlue}; }
:where(.${cls.icon}) { width: 0.75rem; flex-shrink: 0; text-align: center; color: ${t.textMuted}; }
:where(.${cls.addComponent}) { display: flex; width: 100%; align-items: center; justify-content: center; gap: 0.25rem; border-radius: 0.25rem; background-color: ${t.surface2}; padding: 0.25rem 0.5rem; font-size: 10px; color: ${t.textSecondary}; }
:where(.${cls.addComponent}:hover) { color: ${t.textPrimary}; }
:where(.${cls.caption}) { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: ${t.textMuted}; }
:where(.${cls.reset}) { border-radius: 0.25rem; padding: 0 0.25rem; font-size: 10px; color: ${t.textMuted}; }
:where(.${cls.reset}:hover) { color: ${t.textPrimary}; }
:where(.${cls.card}) { border-radius: 0.25rem; background-color: ${tint(t.surface2, 40)}; padding: 0.375rem; }
:where(.${cls.cardHead}) { margin-bottom: 0.25rem; display: flex; align-items: center; justify-content: space-between; }
:where(.${cls.note}) { display: flex; align-items: center; justify-content: space-between; }
:where(.${cls.noteText}) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; color: ${t.textMuted}; }
:where(.${cls.dim}) { opacity: 0.7; }
:where(.${cls.panels}) { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; }
:where(.${cls.addPanel}) { border-radius: 0.25rem; background-color: ${t.surface2}; padding: 0.125rem 0.375rem; font-size: 10px; color: ${t.textSecondary}; }
:where(.${cls.addPanel}:hover) { color: ${t.textPrimary}; }
:where(.${cls.addPanel}:disabled) { cursor: default; opacity: 0.4; }
:where(.${cls.catcher}) { position: fixed; inset: 0; z-index: 10; }
:where(.${cls.menu}) { position: absolute; left: 0; right: 0; top: 100%; z-index: 20; margin-top: 0.125rem; border-radius: 0.25rem; border: 1px solid ${t.borderSubtle}; background-color: ${t.surface3}; padding: 0.25rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
:where(.${cls.menu} > :not(:last-child)) { margin-block: 0 0.125rem; }
:where(.${cls.item}) { display: flex; width: 100%; align-items: center; gap: 0.375rem; border-radius: 0.25rem; padding: 0.25rem 0.375rem; text-align: left; font-size: 11px; color: ${t.textSecondary}; }
:where(.${cls.item}:hover) { background-color: ${t.surface2}; color: ${t.textPrimary}; }
:where(.${cls.itemIcon}) { width: 0.75rem; text-align: center; color: ${t.textMuted}; }
:where(.${cls.divider}) { margin-block: 0.125rem; border-top: 1px solid ${t.borderSubtle}; }
:where(.${cls.controls}) { border-radius: 0.25rem; background-color: ${tint(t.surface2, 40)}; padding: 0.375rem; }
:where(.${cls.controls} > :not(:last-child)) { margin-block: 0 0.25rem; }
:where(.${cls.ranges}) { border-radius: 0.25rem; background-color: ${tint(t.surface2, 40)}; padding: 0.375rem; }
:where(.${cls.ranges} > :not(:last-child)) { margin-block: 0 0.125rem; }
:where(.${cls.fields}) { display: flex; flex-wrap: wrap; column-gap: 0.5rem; row-gap: 0.25rem; }
:where(.${cls.field}) { display: flex; align-items: center; gap: 0.25rem; font-size: 10px; color: ${t.textMuted}; }
:where(.${cls.fieldLabel}) { user-select: none; }
:where(.${cls.fieldInput}) { width: 2.75rem; border-radius: 0.25rem; background-color: ${t.surface2}; padding: 0 0.25rem; text-align: right; font-variant-numeric: tabular-nums; color: ${t.textPrimary}; outline: none; }
:where(.${cls.fieldInput}:focus) { background-color: ${t.surface3}; }
:where(.${cls.pick}) { display: flex; align-items: center; gap: 0.25rem; border-radius: 0.25rem; border: 1px solid ${t.borderSubtle}; padding: 0.125rem 0.375rem; font-size: 10px; color: ${t.textSecondary}; }
:where(.${cls.pick}:hover) { color: ${t.textPrimary}; }
:where(.${cls.pick}.${cls.on}) { border-color: ${t.accent}; color: ${t.accent}; }
:where(.${cls.swatch}) { height: 0.625rem; width: 0.625rem; border-radius: 0.125rem; }
html.sl-larger-text .${cls.hint}, html.sl-larger-text .${cls.addComponent}, html.sl-larger-text .${cls.caption}, html.sl-larger-text .${cls.reset}, html.sl-larger-text .${cls.noteText}, html.sl-larger-text .${cls.addPanel}, html.sl-larger-text .${cls.field}, html.sl-larger-text .${cls.pick} { font-size: 12px !important; }
html.sl-larger-text .${cls.create}, html.sl-larger-text .${cls.done}, html.sl-larger-text .${cls.erase}, html.sl-larger-text .${cls.row}, html.sl-larger-text .${cls.rename}, html.sl-larger-text .${cls.tab}, html.sl-larger-text .${cls.item} { font-size: 13px !important; line-height: 1.45 !important; }
html.sl-larger-text .${cls.caption} { text-transform: none !important; letter-spacing: normal !important; }
`;
}
