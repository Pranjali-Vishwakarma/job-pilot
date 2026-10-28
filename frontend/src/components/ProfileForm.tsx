import { useState, type FormEvent } from 'react'
import type { Profile } from '../types'
import { FieldLabel } from './FieldLabel'

interface ProfileFormProps {
  profile: Profile
  onSave: (profile: Profile) => Promise<void>
}

type Key = Exclude<keyof Profile, 'updated_at' | 'summary'>

const FIELDS: { key: Key; label: string; placeholder: string; type?: string; optional?: boolean }[] = [
  { key: 'full_name', label: 'Full name', placeholder: 'Your name as it should appear' },
  { key: 'headline', label: 'Headline', placeholder: 'AI/ML Engineer, or leave blank', optional: true },
  { key: 'email', label: 'Email', placeholder: 'you@example.com', type: 'email' },
  { key: 'phone', label: 'Phone', placeholder: '+91 …', type: 'tel', optional: true },
  { key: 'location', label: 'Location', placeholder: 'Pune, India' },
  { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/…', type: 'url', optional: true },
  { key: 'github_url', label: 'GitHub', placeholder: 'https://github.com/…', type: 'url', optional: true },
  { key: 'portfolio_url', label: 'Portfolio', placeholder: 'https://…', type: 'url', optional: true },
]

export function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const [draft, setDraft] = useState(profile)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const dirty = FIELDS.some(({ key }) => draft[key] !== profile[key]) || draft.summary !== profile.summary

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSave(draft)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="basics-heading" className="flex flex-col gap-5">
      <header>
        <h1 id="basics-heading" className="font-display text-3xl font-semibold text-ink">
          Basics
        </h1>
        <p className="mt-1 text-sm text-muted">The header of every resume. Fill these once.</p>
      </header>

      <form onSubmit={submit} className="strip flex flex-col gap-5 px-5 py-5 sm:px-6" style={{ borderLeftColor: '#1A2330' }}>
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(({ key, label, placeholder, type, optional }) => (
            <label key={key} className="flex flex-col gap-1.5">
              <FieldLabel text={label} optional={optional} />
              <input
                type={type ?? 'text'}
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                placeholder={placeholder}
                className="field"
              />
            </label>
          ))}
        </div>
        <label className="flex flex-col gap-1.5">
          <FieldLabel text="Summary" optional />
          <span className="text-xs text-muted">
            A default two or three lines about you. Phase 2 can tailor it to each job.
          </span>
          <textarea
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            rows={4}
            className="field resize-y"
          />
        </label>
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex items-center gap-3 border-t border-rule pt-4">
          <button type="submit" disabled={busy || !dirty} className="btn-primary">
            {busy ? 'Saving…' : 'Save basics'}
          </button>
          {!dirty && profile.updated_at && <span className="text-sm text-muted">All changes saved.</span>}
        </div>
      </form>
    </section>
  )
}
