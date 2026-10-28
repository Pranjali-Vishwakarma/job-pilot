import { useId, useState, type KeyboardEvent } from 'react'
import { FieldLabel } from './FieldLabel'

interface ChipInputProps {
  label: string
  optional?: boolean
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  suggestions?: string[]
  hint?: string
}

// Type a value and press Enter or comma to add it. Backspace on an empty box removes the last one.
export function ChipInput({ label, optional = false, values, onChange, placeholder, suggestions = [], hint }: ChipInputProps) {
  const [draft, setDraft] = useState('')
  const id = useId()
  const listId = `${id}-suggestions`

  function add(raw: string) {
    const parts = raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    const next = [...values]
    for (const part of parts) {
      if (!next.some((v) => v.toLowerCase() === part.toLowerCase())) next.push(part)
    }
    if (next.length !== values.length) onChange(next)
    setDraft('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      if (draft.trim()) add(draft)
    } else if (event.key === 'Backspace' && !draft && values.length) {
      onChange(values.slice(0, -1))
    }
  }

  const unused = suggestions.filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()))

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id}>
        <FieldLabel text={label} optional={optional} />
      </label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-rule bg-white px-2 py-1.5 focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/15">
        {values.map((value) => (
          <span key={value} className="inline-flex items-center gap-1 rounded bg-ground px-2 py-0.5 text-sm text-ink">
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((v) => v !== value))}
              className="rounded px-0.5 text-muted hover:text-ink"
              aria-label={`Remove ${value}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={values.length ? '' : placeholder}
          list={unused.length ? listId : undefined}
          className="min-w-32 flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted/70"
        />
        {unused.length > 0 && (
          <datalist id={listId}>
            {unused.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
