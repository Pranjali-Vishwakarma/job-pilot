import { useRef, useState, type FormEvent } from 'react'
import { SKILL_CATEGORIES, SKILL_LEVELS } from '../kinds'
import type { Skill, SkillCategory, SkillInput, SkillLevel } from '../types'

interface SkillsSectionProps {
  skills: Skill[]
  techInEntries: string[]
  onCreate: (skill: SkillInput) => Promise<void>
  onUpdate: (id: number, changes: Partial<SkillInput>) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function SkillsSection({ skills, techInEntries, onCreate, onUpdate, onDelete }: SkillsSectionProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<SkillCategory>('language')
  const [level, setLevel] = useState<SkillLevel>('intermediate')
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  const known = new Set(skills.map((s) => s.name.toLowerCase()))
  const missing = techInEntries.filter((t) => !known.has(t.toLowerCase()))

  async function add(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setError('')
    try {
      await onCreate({ name: name.trim(), category, level, notes: '' })
      setName('')
      nameRef.current?.focus()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function run(action: Promise<void>) {
    setError('')
    try {
      await action
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const groups = SKILL_CATEGORIES.map((c) => ({ ...c, skills: skills.filter((s) => s.category === c.id) })).filter(
    (g) => g.skills.length > 0,
  )

  return (
    <section aria-labelledby="skills-heading" className="flex flex-col gap-5">
      <header>
        <h1 id="skills-heading" className="font-display text-3xl font-semibold text-ink">
          Skills
        </h1>
        <p className="mt-1 text-sm text-muted">
          {skills.length
            ? `${skills.length} skills. Phase 3 compares these with each job description.`
            : 'List what you can do. Phase 3 compares these with each job description.'}
        </p>
      </header>

      <form
        onSubmit={add}
        className="strip flex flex-wrap items-end gap-3 px-5 py-4 sm:px-6"
        style={{ borderLeftColor: '#1A2330' }}
      >
        <label className="flex min-w-48 flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Skill</span>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="PyTorch"
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as SkillCategory)} className="field">
            {SKILL_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Level</span>
          <select value={level} onChange={(e) => setLevel(e.target.value as SkillLevel)} className="field">
            {SKILL_LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!name.trim()} className="btn-primary">
          Add skill
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {missing.length > 0 && (
        <div className="rounded-md border border-rule bg-white/60 px-5 py-4 sm:px-6">
          <p className="text-sm text-ink">Used in your entries but not listed as skills yet:</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {missing.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setName(t)
                  nameRef.current?.focus()
                }}
                className="rounded border border-rule bg-white px-2 py-1 text-sm text-ink hover:border-ink/50"
              >
                + {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">{group.label}</h2>
          <ul className="strip divide-y divide-rule" style={{ borderLeftColor: '#5A6778' }}>
            {group.skills.map((skill) => (
              <li key={skill.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 sm:px-6">
                <span className="min-w-32 flex-1 text-ink">{skill.name}</span>
                <select
                  value={skill.level}
                  onChange={(e) => run(onUpdate(skill.id, { level: e.target.value as SkillLevel }))}
                  aria-label={`Level for ${skill.name}`}
                  className="field py-1 text-sm"
                >
                  {SKILL_LEVELS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <select
                  value={skill.category}
                  onChange={(e) => run(onUpdate(skill.id, { category: e.target.value as SkillCategory }))}
                  aria-label={`Category for ${skill.name}`}
                  className="field py-1 text-sm"
                >
                  {SKILL_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => run(onDelete(skill.id))}
                  className="icon-btn hover:text-danger"
                  aria-label={`Remove ${skill.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
