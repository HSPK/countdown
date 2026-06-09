import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useChipPresets } from '../store/chipPresets'
import {
  DATE_ANCHORS,
  RELATIVE_UNITS,
  newAbsolutePreset,
  newRelativePreset,
  resolveAbsolute,
  type AbsolutePreset,
  type DateAnchor,
  type RelativePreset,
  type RelativeUnit,
} from '../lib/chipResolver'
import { useT } from '../lib/i18n'
import { formatHM, pad } from '../lib/time'
import { useEscToClose } from '../hooks/useEscToClose'
import { useSaveShortcut } from '../hooks/useSaveShortcut'
import { IconPlus, IconX, IconChevronRight } from './Icons'

type Editing =
  | { kind: 'relative'; value: RelativePreset; isNew: boolean }
  | { kind: 'absolute'; value: AbsolutePreset; isNew: boolean }
  | null

function chipLabel(t: ReturnType<typeof useT>, p: { labelKey?: string; label: string }): string {
  return p.labelKey ? t(p.labelKey) : p.label
}

function unitLabel(t: ReturnType<typeof useT>, u: RelativeUnit): string {
  return t(`chips.unit.${u}`)
}

function anchorLabel(t: ReturnType<typeof useT>, a: DateAnchor): string {
  return t(`chips.anchor.${a}`)
}

export function PresetEditor() {
  const t = useT()
  const relative = useChipPresets((s) => s.relative)
  const absolute = useChipPresets((s) => s.absolute)
  const addRelative = useChipPresets((s) => s.addRelative)
  const updateRelative = useChipPresets((s) => s.updateRelative)
  const removeRelative = useChipPresets((s) => s.removeRelative)
  const addAbsolute = useChipPresets((s) => s.addAbsolute)
  const updateAbsolute = useChipPresets((s) => s.updateAbsolute)
  const removeAbsolute = useChipPresets((s) => s.removeAbsolute)
  const resetAll = useChipPresets((s) => s.resetAll)

  const [editing, setEditing] = useState<Editing>(null)

  /* Preview "now" used to render absolute chip times so the user sees a
     concrete resolved HH:MM, just like the composer chips. */
  const previewNow = new Date()

  const startEditRelative = (p: RelativePreset) =>
    setEditing({ kind: 'relative', value: { ...p }, isNew: false })
  const startEditAbsolute = (p: AbsolutePreset) =>
    setEditing({ kind: 'absolute', value: { ...p }, isNew: false })
  const startAddRelative = () =>
    setEditing({ kind: 'relative', value: newRelativePreset(), isNew: true })
  const startAddAbsolute = () =>
    setEditing({ kind: 'absolute', value: newAbsolutePreset(), isNew: true })

  const save = (next: Editing) => {
    if (!next) return
    if (next.kind === 'relative') {
      if (next.isNew) addRelative(next.value)
      else updateRelative(next.value.id, next.value)
    } else {
      if (next.isNew) addAbsolute(next.value)
      else updateAbsolute(next.value.id, next.value)
    }
    setEditing(null)
  }

  return (
    <div className="preset-editor">
      <PresetGroup
        title={t('composer.section.relative')}
        empty={relative.length === 0 ? t('chips.empty.relative') : null}
      >
        {relative.map((p) => (
          <PresetRow
            key={p.id}
            leading={`+${p.amount}${unitShort(p.unit)}`}
            title={chipLabel(t, p)}
            sub={`${p.amount} ${unitLabel(t, p.unit)}`}
            onEdit={() => startEditRelative(p)}
            onDelete={() => removeRelative(p.id)}
            deleteLabel={t('chips.delete')}
          />
        ))}
        <AddRow label={t('chips.add')} onClick={startAddRelative} />
      </PresetGroup>

      <PresetGroup
        title={t('composer.section.absolute')}
        empty={absolute.length === 0 ? t('chips.empty.absolute') : null}
      >
        {absolute.map((p) => {
          const ts = resolveAbsolute(p, previewNow)
          return (
            <PresetRow
              key={p.id}
              leading={formatHM(ts)}
              title={chipLabel(t, p)}
              sub={`${anchorLabel(t, p.anchor)} · ${pad(p.hour)}:${pad(p.minute)}`}
              onEdit={() => startEditAbsolute(p)}
              onDelete={() => removeAbsolute(p.id)}
              deleteLabel={t('chips.delete')}
            />
          )
        })}
        <AddRow label={t('chips.add')} onClick={startAddAbsolute} />
      </PresetGroup>

      <button
        type="button"
        className="preset-reset"
        onClick={() => {
          if (confirm(t('chips.reset.confirm'))) resetAll()
        }}
      >
        {t('chips.reset')}
      </button>

      {editing && (
        <ChipEditModal
          state={editing}
          onChange={setEditing}
          onSave={() => save(editing)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function unitShort(u: RelativeUnit): string {
  return u === 'min' ? 'm' : u === 'hour' ? 'h' : 'd'
}

function PresetGroup({
  title, empty, children,
}: {
  title: string
  empty: string | null
  children: React.ReactNode
}) {
  return (
    <section className="preset-group">
      <h3 className="hig-section__cap">{title}</h3>
      <div className="hig-group">
        {empty && <div className="preset-group__empty">{empty}</div>}
        {children}
      </div>
    </section>
  )
}

function PresetRow({
  leading, title, sub, onEdit, onDelete, deleteLabel,
}: {
  leading: string
  title: string
  sub?: string
  onEdit: () => void
  onDelete: () => void
  deleteLabel: string
}) {
  return (
    <div className="preset-row">
      <button
        type="button"
        className="preset-row__delete"
        aria-label={deleteLabel}
        title={deleteLabel}
        onClick={onDelete}
      >
        <span className="preset-row__delete-dot" aria-hidden />
      </button>
      <button
        type="button"
        className="preset-row__main"
        onClick={onEdit}
      >
        <span className="preset-row__leading">{leading}</span>
        <span className="preset-row__body">
          <span className="preset-row__title">{title}</span>
          {sub && <span className="preset-row__sub">{sub}</span>}
        </span>
        <IconChevronRight width={14} height={14} className="preset-row__chev" />
      </button>
    </div>
  )
}

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="preset-row preset-row--add" onClick={onClick}>
      <span className="preset-row__add-icon" aria-hidden>
        <IconPlus width={14} height={14} />
      </span>
      <span className="preset-row__add-label">{label}</span>
    </button>
  )
}

/* ────────────── Edit modal (sheet) ────────────── */

function ChipEditModal({
  state, onChange, onSave, onClose,
}: {
  state: NonNullable<Editing>
  onChange: (s: Editing) => void
  onSave: () => void
  onClose: () => void
}) {
  const t = useT()

  useEscToClose(onClose)
  useSaveShortcut(onSave)

  const labelValue = state.value.labelKey ? t(state.value.labelKey) : state.value.label
  /* If a user edits a built-in's content we drop the labelKey so their
     custom label sticks; the i18n string is no longer "the truth". */
  const updateLabel = (s: string) => {
    if (state.kind === 'relative') {
      onChange({ ...state, value: { ...state.value, label: s, labelKey: undefined } })
    } else {
      onChange({ ...state, value: { ...state.value, label: s, labelKey: undefined } })
    }
  }

  const setRelative = (patch: Partial<RelativePreset>) => {
    if (state.kind !== 'relative') return
    const merged = { ...state.value, ...patch, labelKey: undefined }
    onChange({ ...state, value: merged })
  }
  const setAbsolute = (patch: Partial<AbsolutePreset>) => {
    if (state.kind !== 'absolute') return
    const merged = { ...state.value, ...patch, labelKey: undefined }
    onChange({ ...state, value: merged })
  }

  const isValid = (() => {
    if (!state.value.label.trim()) return false
    if (state.kind === 'relative') {
      return state.value.amount > 0 && Number.isFinite(state.value.amount)
    }
    return state.value.hour >= 0 && state.value.hour <= 23
        && state.value.minute >= 0 && state.value.minute <= 59
  })()

  return createPortal(
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal modal--sheet">
        <header className="modal__header">
          <h2 className="modal__h2">
            {state.isNew ? t('chips.add.title') : t('chips.edit.title')}
          </h2>
          <button className="modal__close" aria-label={t('edit.close')} onClick={onClose}>
            <IconX width={16} height={16} />
          </button>
        </header>

        <div className="modal__body">
          <div className="edit__field">
            <label className="edit__label">{t('chips.label')}</label>
            <input
              className="edit__input"
              autoFocus
              value={labelValue}
              onChange={(e) => updateLabel(e.target.value)}
              placeholder={t('chips.label.hint')}
            />
          </div>

          {state.kind === 'relative' ? (
            <>
              <div className="edit__field">
                <label className="edit__label">{t('chips.amount')}</label>
                <input
                  className="edit__input edit__input--narrow"
                  type="number"
                  min={1}
                  step={1}
                  value={state.value.amount}
                  onChange={(e) => setRelative({ amount: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                />
              </div>
              <div className="edit__field">
                <label className="edit__label">{t('chips.unit')}</label>
                <div className="edit__segmented">
                  {RELATIVE_UNITS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      className="edit__seg-btn"
                      aria-pressed={state.value.amount !== undefined && state.value.unit === u}
                      onClick={() => setRelative({ unit: u })}
                    >
                      {unitLabel(t, u)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="edit__field">
                <label className="edit__label">{t('chips.anchor')}</label>
                <div className="edit__segmented edit__segmented--wrap">
                  {DATE_ANCHORS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      className="edit__seg-btn"
                      aria-pressed={state.value.anchor === a}
                      onClick={() => setAbsolute({ anchor: a })}
                    >
                      {anchorLabel(t, a)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="edit__field">
                <label className="edit__label">{t('chips.time')}</label>
                <div className="chip-time-row">
                  <input
                    className="edit__input edit__input--narrow"
                    type="number" min={0} max={23} step={1}
                    value={state.value.hour}
                    onChange={(e) => setAbsolute({
                      hour: Math.min(23, Math.max(0, Math.floor(Number(e.target.value) || 0))),
                    })}
                  />
                  <span className="chip-time-row__sep">:</span>
                  <input
                    className="edit__input edit__input--narrow"
                    type="number" min={0} max={59} step={1}
                    value={state.value.minute}
                    onChange={(e) => setAbsolute({
                      minute: Math.min(59, Math.max(0, Math.floor(Number(e.target.value) || 0))),
                    })}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="modal__footer">
          <span className="modal__hint">{t('edit.save.hint')}</span>
          <div className="modal__footer-actions">
            <button className="btn" onClick={onClose}>{t('edit.cancel')}</button>
            <button className="btn btn--primary" onClick={onSave} disabled={!isValid}>
              {t('edit.save')}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
