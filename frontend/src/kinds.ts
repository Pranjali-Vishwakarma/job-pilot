// How each kind of entry is labelled in the editor.
// Every kind shares the same stored fields; this decides which ones show and what they're called.

import type { ItemInput, ItemKind, SkillCategory, SkillLevel } from './types'

type TextField = 'organization' | 'role' | 'location' | 'link' | 'description'

export interface KindConfig {
  kind: ItemKind
  label: string // section name
  singular: string // for "Add …" buttons
  band: string // strip colour
  title: { label: string; placeholder: string }
  fields: Partial<Record<TextField, { label: string; placeholder: string }>>
  dates: 'range' | 'single' | 'issued'
  currentLabel?: string // when set, offers an "ongoing" checkbox
  showBullets: boolean
  bulletsLabel: string
  bulletsHint: string
  showTech: boolean
  empty: string
}

export const KINDS: KindConfig[] = [
  {
    kind: 'experience',
    label: 'Experience',
    singular: 'experience',
    band: '#C8962A',
    title: { label: 'Job title', placeholder: 'Machine Learning Intern' },
    fields: {
      organization: { label: 'Company', placeholder: 'Acme Analytics' },
      role: { label: 'Team or department', placeholder: 'Data Science team' },
      location: { label: 'Location', placeholder: 'Pune (hybrid)' },
      link: { label: 'Link', placeholder: 'Company or project page' },
    },
    dates: 'range',
    currentLabel: 'I work here now',
    showBullets: true,
    bulletsLabel: 'What you did',
    bulletsHint: 'Start with a verb and add a number where you can: “Cut inference time 40% by …”',
    showTech: true,
    empty: 'Add internships, part-time roles and freelance work.',
  },
  {
    kind: 'project',
    label: 'Projects',
    singular: 'project',
    band: '#3F8F5B',
    title: { label: 'Project name', placeholder: 'Visual RAG image search' },
    fields: {
      organization: { label: 'Context', placeholder: 'Course project, hackathon, personal' },
      role: { label: 'Your role', placeholder: 'ML lead in a team of 4' },
      link: { label: 'Repo or demo link', placeholder: 'https://github.com/…' },
      description: { label: 'One-line summary', placeholder: 'What it does, in one sentence' },
    },
    dates: 'range',
    currentLabel: 'Still working on it',
    showBullets: true,
    bulletsLabel: 'Highlights',
    bulletsHint: 'What you built, how, and what it achieved. One idea per bullet.',
    showTech: true,
    empty: 'Add course projects, hackathon builds and personal projects.',
  },
  {
    kind: 'education',
    label: 'Education',
    singular: 'education',
    band: '#5B7FB3',
    title: { label: 'Degree', placeholder: 'B.Tech in Artificial Intelligence and Machine Learning' },
    fields: {
      organization: { label: 'Institution', placeholder: 'Symbiosis Institute of Technology' },
      role: { label: 'Grade', placeholder: 'CGPA 8.9 / 10' },
      location: { label: 'Location', placeholder: 'Pune' },
    },
    dates: 'range',
    currentLabel: 'Currently studying',
    showBullets: false,
    bulletsLabel: 'Highlights',
    bulletsHint: 'Relevant coursework, honours, thesis topic.',
    showTech: false,
    empty: 'Add your degree and school results.',
  },
  {
    kind: 'achievement',
    label: 'Achievements',
    singular: 'achievement',
    band: '#B5546F',
    title: { label: 'Achievement', placeholder: 'Winner, Smart India Hackathon' },
    fields: {
      organization: { label: 'Event or awarding body', placeholder: 'Ministry of Education' },
      role: { label: 'Result', placeholder: '1st of 120 teams' },
      link: { label: 'Link', placeholder: 'Certificate or announcement' },
    },
    dates: 'single',
    showBullets: true,
    bulletsLabel: 'Details',
    bulletsHint: 'What you did to earn it, if it is worth a line.',
    showTech: true,
    empty: 'Add hackathon results, awards, rankings and publications.',
  },
  {
    kind: 'certification',
    label: 'Certifications',
    singular: 'certification',
    band: '#7D68B8',
    title: { label: 'Certificate', placeholder: 'AWS Certified Cloud Practitioner' },
    fields: {
      organization: { label: 'Issuer', placeholder: 'Amazon Web Services' },
      role: { label: 'Credential ID', placeholder: 'Optional' },
      link: { label: 'Credential link', placeholder: 'https://…' },
    },
    dates: 'issued',
    showBullets: true,
    bulletsLabel: 'Notes',
    bulletsHint: 'Optional. Usually a certificate needs no bullets.',
    showTech: true,
    empty: 'Add courses and certificates you have completed.',
  },
  {
    kind: 'activity',
    label: 'Leadership & activities',
    singular: 'activity',
    band: '#2E8A94',
    title: { label: 'Position', placeholder: 'Coordinator' },
    fields: {
      organization: { label: 'Club or organisation', placeholder: 'Student club' },
      location: { label: 'Location', placeholder: 'Pune' },
    },
    dates: 'range',
    currentLabel: 'Still in this role',
    showBullets: true,
    bulletsLabel: 'What you did',
    bulletsHint: 'Scale and outcome help: “Ran auditions for 200+ applicants”.',
    showTech: false,
    empty: 'Add club roles, volunteering and events you organised.',
  },
]

export const KIND_BY_ID = Object.fromEntries(KINDS.map((k) => [k.kind, k])) as Record<ItemKind, KindConfig>

export const SKILL_CATEGORIES: { id: SkillCategory; label: string }[] = [
  { id: 'language', label: 'Programming languages' },
  { id: 'ml_ai', label: 'AI and ML' },
  { id: 'framework', label: 'Frameworks and libraries' },
  { id: 'data', label: 'Data' },
  { id: 'database', label: 'Databases' },
  { id: 'cloud_devops', label: 'Cloud, DevOps and MLOps' },
  { id: 'tool', label: 'Tools' },
  { id: 'design', label: 'Design and UI/UX' },
  { id: 'soft', label: 'Soft skills' },
  { id: 'other', label: 'Other' },
]

export const SKILL_LEVELS: { id: SkillLevel; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'expert', label: 'Expert' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatMonth(value: string | null): string {
  if (!value) return ''
  const [year, month] = value.split('-')
  return `${MONTHS[Number(month) - 1] ?? ''} ${year}`.trim()
}

export function formatDates(
  start: string | null,
  end: string | null,
  isCurrent: boolean,
  style: KindConfig['dates'],
): string {
  if (style === 'single') return formatMonth(start)
  if (style === 'issued') return [formatMonth(start), end ? `expires ${formatMonth(end)}` : ''].filter(Boolean).join(', ')
  const from = formatMonth(start)
  const to = isCurrent ? 'Present' : formatMonth(end)
  if (from && to) return from === to ? from : `${from} – ${to}`
  return from || to
}

export function emptyItem(config: KindConfig): ItemInput {
  return {
    kind: config.kind,
    title: '',
    organization: '',
    role: '',
    location: '',
    start_date: null,
    end_date: null,
    is_current: false,
    link: '',
    description: '',
    bullets: [],
    tags: [],
    tech: [],
    sort_order: 0,
  }
}
