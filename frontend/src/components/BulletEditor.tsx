import { FieldLabel } from './FieldLabel'

interface BulletEditorProps {
  label: string
  hint: string
  bullets: string[]
  onChange: (bullets: string[]) => void
}

const SOFT_LIMIT = 200 // longer bullets usually wrap past two lines on a resume

export function BulletEditor({ label, hint, bullets, onChange }: BulletEditorProps) {
  const rows = bullets.length ? bullets : ['']

  function update(index: number, value: string) {
    onChange(rows.map((b, i) => (i === index ? value : b)))
  }

  function move(index: number, by: -1 | 1) {
    const next = [...rows]
    const target = index + by
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1">
        <FieldLabel text={label} optional />
      </legend>
      <p className="text-xs text-muted">{hint}</p>
      <ol className="flex flex-col gap-2">
        {rows.map((bullet, index) => (
          <li key={index} className="flex items-start gap-2">
            <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-muted" />
            <div className="flex flex-1 flex-col">
              <textarea
                value={bullet}
                onChange={(e) => update(index, e.target.value)}
                rows={2}
                aria-label={`${label} ${index + 1}`}
                className="field resize-y"
              />
              {bullet.length > SOFT_LIMIT && (
                <span className="mt-1 text-xs text-warn">
                  {bullet.length} characters. Consider splitting or tightening it.
                </span>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-0.5 pt-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="icon-btn"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === rows.length - 1}
                className="icon-btn"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
                className="icon-btn hover:text-danger"
                aria-label="Remove bullet"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => onChange([...rows, ''])} className="btn-quiet self-start">
        Add bullet
      </button>
    </fieldset>
  )
}
