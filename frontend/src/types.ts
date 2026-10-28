// Shapes returned by the FastAPI backend (see backend/app/models.py).

export type ItemKind =
  | 'education'
  | 'experience'
  | 'project'
  | 'achievement'
  | 'certification'
  | 'activity'

export interface Profile {
  full_name: string
  headline: string
  email: string
  phone: string
  location: string
  linkedin_url: string
  github_url: string
  portfolio_url: string
  summary: string
  updated_at?: string
}

export interface ItemInput {
  kind: ItemKind
  title: string
  organization: string
  role: string
  location: string
  start_date: string | null
  end_date: string | null
  is_current: boolean
  link: string
  description: string
  bullets: string[]
  tags: string[]
  tech: string[]
  sort_order: number
}

export interface Item extends ItemInput {
  id: number
  created_at: string
  updated_at: string
}

export type SkillCategory =
  | 'language'
  | 'framework'
  | 'ml_ai'
  | 'data'
  | 'database'
  | 'cloud_devops'
  | 'tool'
  | 'design'
  | 'soft'
  | 'other'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface SkillInput {
  name: string
  category: SkillCategory
  level: SkillLevel
  notes: string
}

export interface Skill extends SkillInput {
  id: number
  created_at: string
}

export interface ProfileBundle {
  version: number
  profile: Profile
  items: ItemInput[]
  skills: SkillInput[]
}
