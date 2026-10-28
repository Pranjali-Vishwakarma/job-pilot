import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api'
import { ItemSection } from './components/ItemSection'
import { ProfileForm } from './components/ProfileForm'
import { SkillsSection } from './components/SkillsSection'
import { KINDS, KIND_BY_ID } from './kinds'
import type { Item, ItemKind, Profile, ProfileBundle, Skill } from './types'

type SectionId = 'basics' | ItemKind | 'skills'

const SECTION_IDS: SectionId[] = ['basics', ...KINDS.map((k) => k.kind), 'skills']

function sectionFromHash(): SectionId {
  const id = window.location.hash.slice(1) as SectionId
  return SECTION_IDS.includes(id) ? id : 'basics'
}

export default function App() {
  const [section, setSection] = useState<SectionId>(sectionFromHash)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const fetchAll = () => Promise.all([api.getProfile(), api.listItems(), api.listSkills()])

  const apply = useCallback(([p, i, s]: [Profile, Item[], Skill[]]) => {
    setProfile(p)
    setItems(i)
    setSkills(s)
    setLoadError('')
  }, [])

  const showLoadError = (e: unknown) => setLoadError(e instanceof Error ? e.message : String(e))

  // Used by "Try again" and after an import.
  const load = async () => {
    try {
      apply(await fetchAll())
    } catch (e) {
      showLoadError(e)
    }
  }

  // Initial load. The flag ignores a response that arrives after the component unmounts.
  useEffect(() => {
    let active = true
    fetchAll()
      .then((data) => active && apply(data))
      .catch((e: unknown) => active && setLoadError(e instanceof Error ? e.message : String(e)))
    return () => {
      active = false
    }
  }, [apply])

  useEffect(() => {
    const onHash = () => setSection(sectionFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const go = (id: SectionId) => {
    window.location.hash = id
    setSection(id)
  }

  // Tech named in any entry, used for suggestions in the editors and the skills page.
  const techInEntries = useMemo(() => {
    const seen = new Map<string, string>()
    for (const item of items) for (const t of item.tech) if (!seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t)
    return [...seen.values()].sort((a, b) => a.localeCompare(b))
  }, [items])

  const techSuggestions = useMemo(() => {
    const all = new Map<string, string>()
    for (const t of [...skills.map((s) => s.name), ...techInEntries]) all.set(t.toLowerCase(), t)
    return [...all.values()].sort((a, b) => a.localeCompare(b))
  }, [skills, techInEntries])

  const refreshItems = async () => setItems(await api.listItems())

  async function exportAll() {
    const bundle = await api.exportAll()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `jobpilot-profile-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setNotice('Profile exported.')
  }

  async function importAll(file: File) {
    try {
      const bundle = JSON.parse(await file.text()) as ProfileBundle
      if (!window.confirm('Importing replaces your whole profile with the contents of this file. Continue?')) return
      const result = await api.importAll(bundle)
      await load()
      setNotice(`Imported ${result.items} entries and ${result.skills} skills.`)
    } catch (e) {
      setNotice(`Import failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const counts: Record<SectionId, number | null> = {
    basics: null,
    skills: skills.length,
    ...Object.fromEntries(KINDS.map((k) => [k.kind, items.filter((i) => i.kind === k.kind).length])),
  } as Record<SectionId, number | null>

  const labelFor = (id: SectionId) => (id === 'basics' ? 'Basics' : id === 'skills' ? 'Skills' : KIND_BY_ID[id].label)
  const bandFor = (id: SectionId) => (id === 'basics' || id === 'skills' ? '#1A2330' : KIND_BY_ID[id].band)

  return (
    <div className="min-h-screen bg-ground text-ink">
      <header className="border-b border-rule bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="font-display text-xl font-bold tracking-tight">
            JobPilot <span className="font-normal text-muted">Profile</span>
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => importRef.current?.click()} className="btn-quiet">
              Import
            </button>
            <button type="button" onClick={() => void exportAll()} className="btn-quiet">
              Export
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void importAll(file)
                e.target.value = ''
              }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:gap-10 md:py-10">
        <nav aria-label="Profile sections" className="md:w-56 md:shrink-0">
          <label className="md:hidden">
            <span className="sr-only">Section</span>
            <select value={section} onChange={(e) => go(e.target.value as SectionId)} className="field w-full">
              {SECTION_IDS.map((id) => (
                <option key={id} value={id}>
                  {labelFor(id)}
                  {counts[id] !== null ? ` (${counts[id]})` : ''}
                </option>
              ))}
            </select>
          </label>
          <ul className="hidden flex-col gap-0.5 md:sticky md:top-6 md:flex">
            {SECTION_IDS.map((id) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={section === id ? 'page' : undefined}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink/80 hover:bg-white hover:text-ink aria-[current=page]:bg-white aria-[current=page]:font-semibold aria-[current=page]:text-ink"
                >
                  <span aria-hidden className="h-4 w-1 rounded-full" style={{ background: bandFor(id) }} />
                  <span className="flex-1">{labelFor(id)}</span>
                  {counts[id] !== null && <span className="text-xs text-muted tabular-nums">{counts[id]}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 md:max-w-3xl">
          {loadError ? (
            <div role="alert" className="strip px-6 py-5" style={{ borderLeftColor: '#B3412F' }}>
              <p className="font-semibold">Could not load your profile.</p>
              <p className="mt-1 text-sm text-muted">{loadError}</p>
              <p className="mt-3 text-sm text-muted">
                Start the backend with <code className="rounded bg-ground px-1">uv run uvicorn main:app --reload</code>{' '}
                in the backend folder, then try again.
              </p>
              <button type="button" onClick={() => void load()} className="btn-primary mt-4">
                Try again
              </button>
            </div>
          ) : !profile ? (
            <p className="text-sm text-muted">Loading your profile…</p>
          ) : section === 'basics' ? (
            <ProfileForm
              key={profile.updated_at}
              profile={profile}
              onSave={async (p) => {
                setProfile(await api.saveProfile(p))
                setNotice('Basics saved.')
              }}
            />
          ) : section === 'skills' ? (
            <SkillsSection
              skills={skills}
              techInEntries={techInEntries}
              onCreate={async (s) => {
                await api.createSkill(s)
                setSkills(await api.listSkills())
              }}
              onUpdate={async (id, changes) => {
                await api.updateSkill(id, changes)
                setSkills(await api.listSkills())
              }}
              onDelete={async (id) => {
                await api.deleteSkill(id)
                setSkills(await api.listSkills())
              }}
            />
          ) : (
            <ItemSection
              key={section}
              config={KIND_BY_ID[section]}
              items={items.filter((i) => i.kind === section)}
              techSuggestions={techSuggestions}
              onCreate={async (item) => {
                await api.createItem(item)
                await refreshItems()
                setNotice(`${KIND_BY_ID[section].singular[0].toUpperCase()}${KIND_BY_ID[section].singular.slice(1)} added.`)
              }}
              onUpdate={async (id, item) => {
                await api.updateItem(id, item)
                await refreshItems()
                setNotice('Changes saved.')
              }}
              onDelete={async (id) => {
                await api.deleteItem(id)
                await refreshItems()
                setNotice('Entry deleted.')
              }}
            />
          )}
        </main>
      </div>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
        {notice && (
          <p className="pointer-events-auto rounded-md bg-ink px-4 py-2.5 text-sm text-white shadow-lg">{notice}</p>
        )}
      </div>
    </div>
  )
}
