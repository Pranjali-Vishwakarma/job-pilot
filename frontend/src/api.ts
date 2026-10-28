// Small typed wrapper around the backend API.
// Vite proxies /api to http://localhost:8000 in development (see vite.config.ts).

import type { Item, ItemInput, Profile, ProfileBundle, Skill, SkillInput } from './types'

export class ApiError extends Error {}

interface ValidationIssue {
  loc?: (string | number)[]
  msg?: string
}

function describeError(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return (detail as ValidationIssue[])
      .map((issue) => {
        const field = issue.loc?.filter((part) => part !== 'body').join('.')
        const message = (issue.msg ?? 'Invalid value').replace(/^Value error, /, '')
        return field ? `${field}: ${message}` : message
      })
      .join('; ')
  }
  if (status === 0) return 'Cannot reach the backend. Is it running on port 8000?'
  return `Request failed with status ${status}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch {
    throw new ApiError(describeError(0, null))
  }
  if (response.status === 204) return undefined as T
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(describeError(response.status, body))
  return body as T
}

const json = (data: unknown) => JSON.stringify(data)

export const api = {
  getProfile: () => request<Profile>('/profile'),
  saveProfile: (profile: Profile) => request<Profile>('/profile', { method: 'PUT', body: json(profile) }),

  listItems: () => request<Item[]>('/items'),
  createItem: (item: ItemInput) => request<Item>('/items', { method: 'POST', body: json(item) }),
  updateItem: (id: number, changes: Partial<ItemInput>) =>
    request<Item>(`/items/${id}`, { method: 'PATCH', body: json(changes) }),
  deleteItem: (id: number) => request<void>(`/items/${id}`, { method: 'DELETE' }),

  listSkills: () => request<Skill[]>('/skills'),
  createSkill: (skill: SkillInput) => request<Skill>('/skills', { method: 'POST', body: json(skill) }),
  updateSkill: (id: number, changes: Partial<SkillInput>) =>
    request<Skill>(`/skills/${id}`, { method: 'PATCH', body: json(changes) }),
  deleteSkill: (id: number) => request<void>(`/skills/${id}`, { method: 'DELETE' }),

  exportAll: () => request<ProfileBundle>('/export'),
  importAll: (bundle: ProfileBundle) =>
    request<{ items: number; skills: number }>('/import', { method: 'POST', body: json(bundle) }),
}
