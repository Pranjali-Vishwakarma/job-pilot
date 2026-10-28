import { useState, type FormEvent } from 'react'
import type { KindConfig } from '../kinds'
import type { ItemInput } from '../types'
import { BulletEditor } from './BulletEditor'
import { ChipInput } from './ChipInput'
import { FieldLabel } from './FieldLabel'

interface ItemEditorProps {
  config: KindConfig
  initial: ItemInput
  techSuggestions: string[]
  isNew: boolean
  onSave: (item: ItemInput) => Promise<void>
  onCancel: () => void
  onDelete?: () => Promise<void>
}

export function ItemEditor({ config, initial, techSuggestions, isNew, onSave, onCancel, onDelete }: ItemEditorProps) {
  const [item, setItem] = useState<ItemInput>(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const set = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) => setItem((prev) => ({ ...prev, [key]: value }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!item.title.trim()) {
      setError(`${config.title.label} is required.`)
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSave({ ...item, bullets: item.bullets.map((b) => b.trim()).filter(Boolean) })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  async function remove() {
    if (!onDelete) return
    setBusy(true)
    try {
      await onDelete()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  const text = (key: 'organization' | 'role' | 'location' | 'link' | 'description') => {
    const field = config.fields[key]
    if (!field) return null
    return (
      <label className="flex flex-col gap-1.5">
        <FieldLabel text={field.label} optional />
        <input
          value={item[key]}
          onChange={(e) => set(key, e.target.value)}
          placeholder={field.placeholder}
          type={key === 'link' ? 'url' : 'text'}
          className="field"
        />
      </label>
    )
  }

  const startLabel = config.dates === 'single' ? 'Date' : config.dates === 'issued' ? 'Issued' : 'Start'
  const endLabel = config.dates === 'issued' ? 'Expires' : 'End'

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-5 border-t border-rule bg-white px-5 pt-5 pb-5 sm:px-6"
      aria-label={isNew ? `New ${config.singular}` : `Edit ${initial.title}`}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">{config.title.label}</span>
        <input
          value={item.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={config.title.placeholder}
          className="field text-base font-semibold"
          autoFocus={isNew}
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        {text('organization')}
        {text('role')}
        {text('location')}
        {text('link')}
      </div>

      {text('description')}

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5">
          <FieldLabel text={startLabel} optional />
          <input
            type="month"
            value={item.start_date ?? ''}
            onChange={(e) => set('start_date', e.target.value || null)}
            className="field w-44"
          />
        </label>
        {config.dates !== 'single' && (
          <label className="flex flex-col gap-1.5">
            <FieldLabel text={endLabel} optional />
            <input
              type="month"
              value={item.end_date ?? ''}
              onChange={(e) => set('end_date', e.target.value || null)}
              disabled={item.is_current}
              className="field w-44 disabled:bg-ground disabled:text-muted"
            />
          </label>
        )}
        {config.currentLabel && (
          <label className="flex items-center gap-2 pb-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={item.is_current}
              onChange={(e) => {
                set('is_current', e.target.checked)
                if (e.target.checked) set('end_date', null)
              }}
              className="size-4 accent-ink"
            />
            {config.currentLabel}
          </label>
        )}
      </div>

      {config.showBullets && (
        <BulletEditor
          label={config.bulletsLabel}
          hint={config.bulletsHint}
          bullets={item.bullets}
          onChange={(bullets) => set('bullets', bullets)}
        />
      )}

      {config.showTech && (
        <ChipInput
          label="Tech used"
          optional
          values={item.tech}
          onChange={(tech) => set('tech', tech)}
          placeholder="Python, PyTorch, FastAPI"
          suggestions={techSuggestions}
          hint="Press Enter or comma after each one."
        />
      )}

      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-4">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Saving…' : isNew ? `Add ${config.singular}` : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="btn-quiet">
          Cancel
        </button>
        {onDelete && (
          <div className="ml-auto flex items-center gap-2">
            {confirmingDelete ? (
              <>
                <span className="text-sm text-muted">Delete this entry?</span>
                <button type="button" onClick={remove} disabled={busy} className="btn-danger">
                  Delete
                </button>
                <button type="button" onClick={() => setConfirmingDelete(false)} className="btn-quiet">
                  Keep
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmingDelete(true)} className="btn-quiet hover:text-danger">
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  )
}
