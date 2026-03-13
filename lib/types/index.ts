export interface User {
  id: string
  email: string
  full_name?: string
}

export interface Organization {
  id: string
  name: string
  alternate_names?: string[]
  website?: string
  description?: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
  user_email?: string
  full_name?: string
}

export interface AIPlatform {
  id: string
  name: string
  slug: string
}

export interface OrganizationPlatform {
  id: string
  organization_id: string
  platform_id: string
  ai_platforms?: AIPlatform
}

export interface Competitor {
  id: string
  organization_id: string
  name: string
  alternate_names?: string[]
  website?: string
  created_at: string
}

export interface Topic {
  id: string
  organization_id: string
  name: string
  created_at: string
}

export interface Tag {
  id: string
  organization_id: string
  name: string
  created_at: string
}

export interface Prompt {
  id: string
  organization_id: string
  title: string
  prompt_text: string
  topic_id?: string
  is_active: boolean
  run_frequency_override?: string | null
  min_hours_between_runs_override?: number | null
  created_at: string
  updated_at: string
  topics?: Topic
  prompt_tags?: { tag_id: string; tags?: Tag }[]
  prompt_schedules?: PromptSchedule[]
}

export interface PromptSchedule {
  id: string
  prompt_id: string
  next_run_at?: string
  last_run_at?: string
}

export interface PromptRun {
  id: string
  prompt_id: string
  platform_id: string
  response_text: string
  cited_urls: { url: string; title?: string }[]
  brand_mentioned: boolean
  brand_mention_count: number
  brand_sentiment?: string
  brand_cited: boolean
  competitor_mentions: Record<string, number>
  organization_position?: number
  visibility_score: number
  response_length: number
  duration_ms: number
  created_at: string
  error?: string
}

export interface AggregateMetrics {
  mention_frequency: number
  citation_frequency: number
  sentiment_score: number
  visibility_score: number
  total_runs: number
}

export interface OrgSettings {
  run_frequency: string
  min_hours_between_runs: number
}
