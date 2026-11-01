// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The Develop "Masking" panel: making masks, the photo's masks as layer rows,
// and the selected mask's editor — its components on the Coverage tab, its
// amount and adjustment sub-panels on the Adjust tab. Until Safelight 3.2.0
// it was core's built-in.

import type { MouseEvent as ReactMouseEvent } from "react";
import { React, api } from "./rt";
import type { Mask, MaskComponent, MaskComponentKind, MaskComponentMode, MaskPanelEntry, MaskType } from "./safelight";
import { MAX_MASKS, defaultMaskAdjustments } from "./masks";
import {
  addRangeComponent,
  cycleComponentMode,
  leaveMaskTool,
  removeComponent,
  removeMask,
  renameMask,
  setMaskTool,
  updateComponent,
  useMaskTool,
  type MaskTool,
} from "./state";
import { cls } from "./styles";

/** Core's name for the action that moves a photo to the current processing. */
const UPDATE_PROCESSING_LABEL = "Update processing";

// Tools that create a component by dragging on the canvas.
const GEO_TOOLS: { type: MaskType; label: string }[] = [
  { type: "radial", label: "Radial" },
  { type: "linear", label: "Linear" },
  { type: "brush", label: "Brush" },
];
// Parametric ranges: created instantly (no canvas drag).
const RANGE_TOOLS: { kind: "lumRange" | "colorRange"; label: string }[] = [
  { kind: "lumRange", label: "Luminance Range" },
  { kind: "colorRange", label: "Color Range" },
];

const KIND_ICON: Record<MaskComponentKind, string> = {
  radial: "◯",
  linear: "▤",
  brush: "✎",
  lumRange: "◐",
  colorRange: "⬤",
};
const KIND_LABEL: Record<MaskComponentKind, string> = {
  radial: "Radial",
  linear: "Linear",
  brush: "Brush",
  lumRange: "Luminance",
  colorRange: "Color",
};

// Mode chip glyph + colour. add = union, subtract = carve, intersect = confine.
const MODE_GLYPH: Record<MaskComponentMode, string> = {
  add: "+",
  subtract: "−",
  intersect: "∩",
};
const MODE_CLASS: Record<MaskComponentMode, string> = {
  add: cls.add,
  subtract: cls.subtract,
  intersect: cls.intersect,
};
const MODE_TITLE: Record<MaskComponentMode, string> = {
  add: "Add (union) — click to cycle",
  subtract: "Subtract (carve) — click to cycle",
  intersect: "Intersect (confine) — click to cycle",
};

const on = (yes: boolean) => (yes ? ` ${cls.on}` : "");

// One active sub-panel card: header (title + remove) around the panel's
// per-mask component, which talks to the mask through the surrounding scope.
function MaskSubPanel({ def, onRemove }: { def: MaskPanelEntry; onRemove: () => void }) {
  const Body = def.component;
  return (
    <div className={cls.card}>
      <div className={cls.cardHead}>
        <span className={cls.caption}>{def.title}</span>
        <button type="button" onClick={onRemove} title={`Remove ${def.title} (resets its values)`} className={cls.remove}>
          ×
        </button>
      </div>
      <Body />
    </div>
  );
}

export function MasksPanel() {
  const { Panel, Slider, MaskScope } = api.components;
  const useDevelopStore = api.stores.useDevelopStore;
  const masks = useDevelopStore((s) => s.params.masks);
  const commitEdit = useDevelopStore((s) => s.commitEdit);
  const updateMask = useDevelopStore((s) => s.updateMask);
  const updateMaskAdj = useDevelopStore((s) => s.updateMaskAdj);
  const seedMaskPanelValues = useDevelopStore((s) => s.seedMaskPanelValues);
  const clearMaskPanelValues = useDevelopStore((s) => s.clearMaskPanelValues);
  // An extension's values run its stage inside the mask only at the current
  // processing; a photo with older processing renders as it always has.
  const olderProcessing = api.develop.useOlderProcessing();
  const panelDefs = api.develop.useMaskPanels();
  const held = api.develop.useCanvasToolHeld();
  const tool = useMaskTool();
  const { activeTool, maskToolType, maskCompMode, selectedMaskId, selectedComponentId, maskTab: tab } = tool;

  const masking = activeTool === "mask";
  // Another tool took the canvas: the mask tool is left.
  React.useEffect(() => {
    if (masking && !held) setMaskTool({ activeTool: "none" });
  }, [masking, held]);

  // addMask no-ops at the cap, so the "Create Mask" entry point is disabled
  // there — otherwise a range mask would push an empty "New Mask" history entry.
  const atMaskCap = masks.length >= MAX_MASKS;
  const selected = masks.find((m) => m.id === selectedMaskId) ?? null;
  const selectedComp = selected?.components.find((c) => c.id === selectedComponentId) ?? null;

  const [addOpen, setAddOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [renaming, setRenaming] = React.useState<{ id: string; value: string } | null>(null);

  // Arm a geometric tool to extend the selected mask (or start fresh if none).
  const armTool = (t: MaskType, mode: MaskComponentMode) =>
    setMaskTool({ maskToolType: t, maskCompMode: mode, maskAddTarget: selected ? "current" : "new", activeTool: "mask" });

  // Start a brand-new mask with a geometric tool (drag on canvas to draw).
  const newMaskTool = (t: MaskType) =>
    setMaskTool({ selectedMaskId: null, maskToolType: t, maskCompMode: "add", maskAddTarget: "new", activeTool: "mask" });

  // "Create Mask" menu: a fresh mask of any kind.
  const createMask = (kind: MaskComponentKind) => {
    setCreateOpen(false);
    setMaskTool({ maskTab: "coverage" });
    if (kind === "lumRange" || kind === "colorRange") {
      setMaskTool({ selectedMaskId: null });
      addRangeComponent(kind);
      void commitEdit("New Mask");
    } else {
      newMaskTool(kind);
    }
  };

  // "+ Add Component" menu: append a component to the selected mask.
  const addToSelected = (kind: MaskComponentKind) => {
    setAddOpen(false);
    if (kind === "lumRange" || kind === "colorRange") {
      addRangeComponent(kind);
      void commitEdit("Add Component");
    } else {
      // Deselect first so the next stroke starts a fresh component instead of
      // extending the selected one — this is how a mask gets multiple brushes.
      // Draw in "add" mode; the per-row mode chip flips it to subtract/intersect.
      setMaskTool({ selectedComponentId: null });
      armTool(kind, "add");
    }
  };

  const notApplied = (def: MaskPanelEntry): boolean => olderProcessing && def.extensionParams;
  const activeDefs = selected ? panelDefs.filter((d) => selected.panels.includes(d.id)) : [];
  // Ids with no panel that can be added to a mask (the owning extension is
  // disabled or gone). Kept in the list — with values preserved — so they
  // survive a round-trip; shown as removable placeholders.
  const orphanedIds = selected ? selected.panels.filter((id) => !panelDefs.some((d) => d.id === id)) : [];

  const resetAdj = () => {
    if (!selected) return;
    // Blanket-reset the core adjustments (covers legacy stragglers whose
    // sub-panel was removed), then re-seed each active sub-panel's defaults.
    // Orphaned sub-panels keep their values: their owner isn't here to ask.
    updateMaskAdj(selected.id, defaultMaskAdjustments());
    for (const def of activeDefs) seedMaskPanelValues(selected.id, def.owns);
    void commitEdit("Mask Reset");
  };
  const addPanel = (def: MaskPanelEntry) => {
    if (!selected) return;
    seedMaskPanelValues(selected.id, def.owns);
    updateMask(selected.id, { panels: [...selected.panels, def.id] });
    void commitEdit("Add Mask Panel");
  };
  const removePanel = (id: string) => {
    if (!selected) return;
    const def = panelDefs.find((d) => d.id === id);
    if (def) clearMaskPanelValues(selected.id, def.owns);
    updateMask(selected.id, { panels: selected.panels.filter((p) => p !== id) });
    void commitEdit("Remove Mask Panel");
  };

  const availablePanels = selected ? panelDefs.filter((d) => !selected.panels.includes(d.id)) : [];

  const editComp = (m: Mask, c: MaskComponent) => {
    setMaskTool({ selectedMaskId: m.id, selectedComponentId: c.id });
    if (c.kind === "radial" || c.kind === "linear" || c.kind === "brush") {
      setMaskTool({
        maskToolType: c.kind,
        maskCompMode: c.mode === "subtract" ? "subtract" : "add",
        maskAddTarget: "current",
        activeTool: "mask",
      });
    }
  };

  // Distinct component kinds in a mask, for the list-row icon summary.
  const kindSummary = (m: Mask): MaskComponentKind[] => {
    const seen: MaskComponentKind[] = [];
    for (const c of m.components) if (!seen.includes(c.kind)) seen.push(c.kind);
    return seen;
  };

  // Clicking empty panel space (not a row/button, which sit on child elements)
  // deselects the current mask, collapsing its editor.
  const deselectOnBackground = (e: ReactMouseEvent) => {
    if (e.target !== e.currentTarget) return;
    setMaskTool({ selectedMaskId: null, selectedComponentId: null, hoveredMaskId: null });
  };

  const brushSlider = (label: string, key: "brushSize" | "brushFeather" | "brushOpacity" | "brushFlow", min: number, defaultValue: number) => (
    <Slider
      label={label}
      value={Math.round(tool[key] * 100)}
      min={min}
      max={key === "brushSize" ? 50 : 100}
      step={1}
      defaultValue={defaultValue}
      onChange={(v) => {
        const patch: Partial<MaskTool> = { brushPreview: true };
        patch[key] = v / 100;
        setMaskTool(patch);
      }}
      onCommit={() => setMaskTool({ brushPreview: false })}
    />
  );

  return (
    <Panel title="Masking" defaultOpen>
      <div className={cls.panel} onClick={deselectOnBackground}>
        {/* Create new mask */}
        <div className={cls.menuAnchor}>
          <button
            type="button"
            onClick={() => {
              setCreateOpen((v) => !v);
              setAddOpen(false);
            }}
            disabled={atMaskCap}
            title={atMaskCap ? `Mask limit reached (${MAX_MASKS})` : undefined}
            className={cls.create}
          >
            + Create Mask ▾
          </button>
          {createOpen && <ToolMenu onPick={(k) => createMask(k)} onClose={() => setCreateOpen(false)} />}
        </div>

        <div className={cls.head}>
          <span className={cls.hint}>
            {masking
              ? maskToolType === "brush"
                ? `Paint to ${maskCompMode === "subtract" ? "subtract" : "add"}`
                : `Drag to ${maskCompMode === "subtract" ? "subtract" : "add"} a ${maskToolType}`
              : `${masks.length}/${MAX_MASKS} masks`}
          </span>
          {masking && (
            <button type="button" onClick={leaveMaskTool} className={cls.done}>
              Done
            </button>
          )}
        </div>

        {/* Brush settings — available while the brush tool is armed, including
            before the first stroke of a new brush mask. */}
        {masking && maskToolType === "brush" && (
          <div className={cls.brush}>
            {brushSlider("Size", "brushSize", 1, 8)}
            {brushSlider("Feather", "brushFeather", 0, 50)}
            {brushSlider("Opacity", "brushOpacity", 1, 100)}
            {brushSlider("Flow", "brushFlow", 1, 100)}
            <label className={cls.erase}>
              <input
                type="checkbox"
                checked={tool.brushErase}
                onChange={(e) => setMaskTool({ brushErase: e.target.checked })}
                style={{ accentColor: api.ui.tokens.sliderFill }}
              />
              Erase
              <span className={cls.muted}>· Alt erase · [ ] size · ⇧ feather · , . opacity · ⇧, ⇧. flow</span>
            </label>
          </div>
        )}

        {/* Mask list (layer rows) */}
        {masks.length > 0 && (
          <div className={cls.list} onClick={deselectOnBackground}>
            {masks.map((m) => {
              const visible = m.visible !== false;
              return (
                <div
                  key={m.id}
                  onClick={() =>
                    setMaskTool({ selectedMaskId: m.id, selectedComponentId: m.components[0]?.id ?? null, maskTab: "coverage" })
                  }
                  onMouseEnter={() => setMaskTool({ hoveredMaskId: m.id })}
                  onMouseLeave={() => setMaskTool({ hoveredMaskId: null })}
                  className={cls.row + on(m.id === selectedMaskId) + (visible ? "" : ` ${cls.off}`)}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateMask(m.id, { visible: !visible });
                      void commitEdit("Mask Visibility");
                    }}
                    // Hovering the visibility toggle shouldn't preview coverage.
                    onMouseEnter={() => setMaskTool({ hoveredMaskId: null })}
                    onMouseLeave={() => setMaskTool({ hoveredMaskId: m.id })}
                    title={visible ? "Hide" : "Show"}
                    className={cls.eye + (visible ? "" : ` ${cls.hidden}`)}
                  >
                    {visible ? "◉" : "○"}
                  </button>
                  <span className={cls.kinds}>{kindSummary(m).map((k) => KIND_ICON[k]).join(" ")}</span>
                  {renaming?.id === m.id ? (
                    <input
                      autoFocus
                      value={renaming.value}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setRenaming({ id: m.id, value: e.target.value })}
                      onBlur={() => {
                        const v = renaming.value.trim();
                        if (v) renameMask(m.id, v);
                        setRenaming(null);
                        void commitEdit("Rename Mask");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      className={cls.rename}
                    />
                  ) : (
                    <span
                      className={cls.name}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setRenaming({ id: m.id, value: m.name });
                      }}
                    >
                      {m.name}
                      <span className={cls.muted}> ({m.components.length})</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateMask(m.id, { invert: !m.invert });
                      void commitEdit("Mask Invert");
                    }}
                    title="Invert whole mask"
                    className={`${cls.invert} ${cls.reveal}${on(m.invert)}`}
                  >
                    ⊘
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMask(m.id);
                      void commitEdit("Delete Mask");
                    }}
                    title="Delete mask"
                    aria-label="Delete mask"
                    className={`${cls.remove} ${cls.reveal}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected mask editor: Coverage / Adjust tabs */}
        {selected && (
          <div className={cls.editor}>
            <div className={cls.tabs}>
              {(["coverage", "adjust"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setMaskTool({ maskTab: t })} className={cls.tab + on(tab === t)}>
                  {t}
                </button>
              ))}
            </div>

            {tab === "coverage" ? (
              <div className={cls.section}>
                {/* Component stack */}
                <div className={cls.list}>
                  {selected.components.map((c) => (
                    <div key={c.id} onClick={() => editComp(selected, c)} className={cls.row + on(c.id === selectedComponentId)}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cycleComponentMode(selected.id, c.id);
                          void commitEdit("Component Mode");
                        }}
                        title={MODE_TITLE[c.mode]}
                        className={`${cls.mode} ${MODE_CLASS[c.mode]}`}
                      >
                        {MODE_GLYPH[c.mode]}
                      </button>
                      <span className={cls.icon}>{KIND_ICON[c.kind]}</span>
                      <span className={cls.name}>{KIND_LABEL[c.kind]}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateComponent(selected.id, c.id, { invert: !c.invert });
                          void commitEdit("Component Invert");
                        }}
                        title="Invert this component"
                        className={cls.invert + on(c.invert)}
                      >
                        ⊘
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeComponent(selected.id, c.id);
                          void commitEdit("Delete Component");
                        }}
                        title="Delete component"
                        aria-label="Delete component"
                        className={cls.remove}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add component to this mask */}
                <div className={cls.menuAnchor}>
                  <button
                    type="button"
                    onClick={() => {
                      setAddOpen((v) => !v);
                      setCreateOpen(false);
                    }}
                    className={cls.addComponent}
                  >
                    + Add Component ▾
                  </button>
                  {addOpen && <ToolMenu onPick={(k) => addToSelected(k)} onClose={() => setAddOpen(false)} />}
                </div>

                {/* Selected-component geometry / range controls */}
                {selectedComp && <ComponentControls key={selectedComp.id} maskId={selected.id} comp={selectedComp} />}
              </div>
            ) : (
              <div className={cls.section}>
                <div className={cls.head}>
                  <span className={cls.caption}>Amount</span>
                  <button type="button" onClick={resetAdj} title="Reset this mask's adjustments" className={cls.reset}>
                    Reset
                  </button>
                </div>
                <Slider
                  label="Opacity"
                  value={selected.opacity}
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={100}
                  onChange={(v) => updateMask(selected.id, { opacity: v })}
                  onCommit={() => void commitEdit("Mask Amount")}
                />

                {/* Keyed by mask: a sub-panel's own state (a field mid-edit, a
                    listener it attached) belongs to the mask it mounted for. */}
                <MaskScope key={selected.id} maskId={selected.id}>
                  {activeDefs
                    .filter((def) => !notApplied(def))
                    .map((def) => (
                      <MaskSubPanel key={def.id} def={def} onRemove={() => removePanel(def.id)} />
                    ))}
                </MaskScope>

                {activeDefs.filter(notApplied).map((def) => (
                  <div key={def.id} className={`${cls.card} ${cls.note}`}>
                    <span className={cls.noteText}>
                      {def.title} <span className={cls.dim}>(needs {UPDATE_PROCESSING_LABEL})</span>
                    </span>
                    <button type="button" onClick={() => removePanel(def.id)} title={`Remove ${def.title} (resets its values)`} className={cls.remove}>
                      ×
                    </button>
                  </div>
                ))}

                {orphanedIds.map((id) => (
                  <div key={id} className={`${cls.card} ${cls.note}`}>
                    <span className={cls.noteText}>
                      {id} <span className={cls.dim}>(not installed)</span>
                    </span>
                    <button type="button" onClick={() => removePanel(id)} title={`Remove ${id}`} className={cls.remove}>
                      ×
                    </button>
                  </div>
                ))}

                {availablePanels.length > 0 && (
                  <div className={cls.panels}>
                    <span className={cls.hint}>Adjust:</span>
                    {availablePanels.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => addPanel(d)}
                        disabled={notApplied(d)}
                        title={
                          notApplied(d)
                            ? `${d.title} in a mask needs the current processing: use ${UPDATE_PROCESSING_LABEL} on this photo first`
                            : undefined
                        }
                        className={cls.addPanel}
                      >
                        + {d.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

// Dropdown listing every component kind (geometric + parametric ranges).
function ToolMenu({ onPick, onClose }: { onPick: (kind: MaskComponentKind) => void; onClose: () => void }) {
  return (
    <>
      {/* Click-away catcher. */}
      <div className={cls.catcher} onClick={onClose} />
      <div className={cls.menu}>
        {GEO_TOOLS.map((t) => (
          <button key={t.type} type="button" onClick={() => onPick(t.type)} className={cls.item}>
            <span className={cls.itemIcon}>{KIND_ICON[t.type]}</span>
            {t.label}
          </button>
        ))}
        <div className={cls.divider} />
        {RANGE_TOOLS.map((t) => (
          <button key={t.kind} type="button" onClick={() => onPick(t.kind)} className={cls.item}>
            <span className={cls.itemIcon}>{KIND_ICON[t.kind]}</span>
            {t.label}
          </button>
        ))}
      </div>
    </>
  );
}

// A compact numeric geometry field (UV stored 0..1, edited as a percentage):
// the non-drag, keyboard path for radial and linear masks (WCAG 2.1.1 /
// 2.5.7), shown with Keyboard canvas editing on.
const uvToPct = (v: number) => Math.round(v * 100);

interface GeoFieldProps {
  label: string;
  title: string;
  value: number;
  onChange: (v: number) => void;
  onCommit: () => void;
}

function GeoField({ label, title, value, onChange, onCommit }: GeoFieldProps) {
  return (
    <label className={cls.field} title={title}>
      <span className={cls.fieldLabel}>{label}</span>
      <input
        type="number"
        value={value}
        aria-label={title}
        onChange={(e) => {
          if (e.target.value !== "") onChange(Number(e.target.value));
        }}
        onBlur={onCommit}
        className={cls.fieldInput}
      />
    </label>
  );
}

// Geometry / range controls for the selected component.
function ComponentControls({ maskId, comp }: { maskId: string; comp: MaskComponent }) {
  const { Slider } = api.components;
  const commitEdit = api.stores.useDevelopStore((s) => s.commitEdit);
  const { maskColorPicking } = useMaskTool();
  // Numeric geometry fields are the keyboard/non-drag path — gated like the tone
  // curve's number row, so they only show with "Keyboard canvas editing" on.
  const kbd = api.accessibility.useKeyboardCanvasEditing();
  const commitGeo = () => void commitEdit("Mask Geometry");

  if (comp.kind === "radial" && comp.radial) {
    const r = comp.radial;
    const setR = (patch: Partial<typeof r>) => updateComponent(maskId, comp.id, { radial: { ...r, ...patch } });
    return (
      <div className={cls.controls}>
        {kbd && (
          <>
            <span className={cls.caption}>Geometry</span>
            <div className={cls.fields}>
              <GeoField label="X" title="Centre X (%)" value={uvToPct(r.cx)} onChange={(v) => setR({ cx: v / 100 })} onCommit={commitGeo} />
              <GeoField label="Y" title="Centre Y (%)" value={uvToPct(r.cy)} onChange={(v) => setR({ cy: v / 100 })} onCommit={commitGeo} />
              <GeoField label="W" title="Radius X (%)" value={uvToPct(r.rx)} onChange={(v) => setR({ rx: Math.max(0, v / 100) })} onCommit={commitGeo} />
              <GeoField label="H" title="Radius Y (%)" value={uvToPct(r.ry)} onChange={(v) => setR({ ry: Math.max(0, v / 100) })} onCommit={commitGeo} />
              <GeoField label="∠" title="Angle (degrees)" value={Math.round((r.angle * 180) / Math.PI)} onChange={(v) => setR({ angle: (v * Math.PI) / 180 })} onCommit={commitGeo} />
            </div>
          </>
        )}
        <Slider
          label="Feather"
          value={Math.round(r.feather * 100)}
          min={0}
          max={100}
          step={1}
          defaultValue={50}
          onChange={(v) => setR({ feather: v / 100 })}
          onCommit={() => void commitEdit("Mask Feather")}
        />
      </div>
    );
  }

  if (comp.kind === "linear" && comp.linear) {
    // Linear masks have only the numeric geometry here, so the whole section is
    // the keyboard/non-drag path — hidden unless "Keyboard canvas editing" is on.
    if (!kbd) return null;
    const g = comp.linear;
    const setG = (patch: Partial<typeof g>) => updateComponent(maskId, comp.id, { linear: { ...g, ...patch } });
    return (
      <div className={cls.controls}>
        <span className={cls.caption}>Geometry</span>
        <div className={cls.fields}>
          <GeoField label="X1" title="Start X (%)" value={uvToPct(g.x0)} onChange={(v) => setG({ x0: v / 100 })} onCommit={commitGeo} />
          <GeoField label="Y1" title="Start Y (%)" value={uvToPct(g.y0)} onChange={(v) => setG({ y0: v / 100 })} onCommit={commitGeo} />
          <GeoField label="X2" title="End X (%)" value={uvToPct(g.x1)} onChange={(v) => setG({ x1: v / 100 })} onCommit={commitGeo} />
          <GeoField label="Y2" title="End Y (%)" value={uvToPct(g.y1)} onChange={(v) => setG({ y1: v / 100 })} onCommit={commitGeo} />
        </div>
      </div>
    );
  }

  if (comp.kind === "lumRange" && comp.lumRange) {
    const g = comp.lumRange;
    const set = (patch: Partial<typeof g>) => updateComponent(maskId, comp.id, { lumRange: { ...g, ...patch } });
    const commit = () => void commitEdit("Lum Range");
    return (
      <div className={cls.ranges}>
        <span className={cls.caption}>Luminance range</span>
        <Slider label="Low" value={uvToPct(g.lo)} min={0} max={100} step={1} defaultValue={0} onChange={(v) => set({ lo: Math.min(v / 100, g.hi) })} onCommit={commit} />
        <Slider label="High" value={uvToPct(g.hi)} min={0} max={100} step={1} defaultValue={100} onChange={(v) => set({ hi: Math.max(v / 100, g.lo) })} onCommit={commit} />
        <Slider label="Low Falloff" value={uvToPct(g.loFeather)} min={0} max={100} step={1} defaultValue={10} onChange={(v) => set({ loFeather: v / 100 })} onCommit={commit} />
        <Slider label="High Falloff" value={uvToPct(g.hiFeather)} min={0} max={100} step={1} defaultValue={10} onChange={(v) => set({ hiFeather: v / 100 })} onCommit={commit} />
      </div>
    );
  }

  if (comp.kind === "colorRange" && comp.colorRange) {
    const g = comp.colorRange;
    const set = (patch: Partial<typeof g>) => updateComponent(maskId, comp.id, { colorRange: { ...g, ...patch } });
    const commit = () => void commitEdit("Color Range");
    // Approximate display swatch from the stored linear target.
    const lin2srgb = (v: number) => Math.round((v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255);
    const swatch = `rgb(${lin2srgb(g.r)}, ${lin2srgb(g.g)}, ${lin2srgb(g.b)})`;
    return (
      <div className={cls.ranges}>
        <div className={cls.head}>
          <span className={cls.caption}>Color range</span>
          <button
            type="button"
            onClick={() => setMaskTool({ activeTool: "mask", maskColorPicking: !maskColorPicking })}
            title="Pick a target colour from the image"
            className={cls.pick + on(maskColorPicking)}
          >
            <span className={cls.swatch} style={{ backgroundColor: swatch }} />
            Pick
          </button>
        </div>
        <Slider label="Hue Range" value={uvToPct(g.hueRange)} min={0} max={100} step={1} defaultValue={15} onChange={(v) => set({ hueRange: v / 100 })} onCommit={commit} />
        <Slider label="Sat Range" value={uvToPct(g.satRange)} min={0} max={100} step={1} defaultValue={30} onChange={(v) => set({ satRange: v / 100 })} onCommit={commit} />
        <Slider label="Smoothness" value={uvToPct(g.smoothness)} min={0} max={100} step={1} defaultValue={25} onChange={(v) => set({ smoothness: v / 100 })} onCommit={commit} />
      </div>
    );
  }

  return null;
}
