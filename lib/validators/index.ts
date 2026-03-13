import { z } from 'zod'

// Auth
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1).max(100).optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Organizations
export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(200),
  alternate_names: z.array(z.string().min(1).max(200)).max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(1000).optional(),
  timezone: z.string().default('UTC'),
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  alternate_names: z.array(z.string().min(1).max(200)).max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(1000).optional(),
  timezone: z.string().optional(),
})

export const updateOrgSettingsSchema = z.object({
  run_frequency: z.enum(['daily', 'twice_daily', 'weekly', 'every_other_day']).optional(),
  min_hours_between_runs: z.number().int().min(1).max(168).optional(),
})

// Platforms
export const addPlatformSchema = z.object({
  platform_id: z.enum(['chatgpt', 'gemini', 'perplexity']),
})

// Competitors
export const createCompetitorSchema = z.object({
  name: z.string().min(1).max(200),
  alternate_names: z.array(z.string().min(1).max(200)).max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
})

export const updateCompetitorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  alternate_names: z.array(z.string().min(1).max(200)).max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
})

// Topics
export const createTopicSchema = z.object({
  name: z.string().min(1).max(100),
})

export const updateTopicSchema = z.object({
  name: z.string().min(1).max(100),
})

// Tags
export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
})

export const updateTagSchema = z.object({
  name: z.string().min(1).max(50),
})

// Prompts
export const createPromptSchema = z.object({
  title: z.string().min(1).max(50),
  prompt_text: z.string().min(1).max(5000),
  topic_id: z.string().uuid().optional(),
  run_frequency_override: z.enum(['daily', 'twice_daily', 'weekly', 'every_other_day']).nullable().optional(),
  min_hours_between_runs_override: z.number().int().min(1).max(168).nullable().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
})

export const updatePromptSchema = z.object({
  title: z.string().min(1).max(50).optional(),
  prompt_text: z.string().min(1).max(5000).optional(),
  topic_id: z.string().uuid().nullable().optional(),
  run_frequency_override: z.enum(['daily', 'twice_daily', 'weekly', 'every_other_day']).nullable().optional(),
  min_hours_between_runs_override: z.number().int().min(1).max(168).nullable().optional(),
  is_active: z.boolean().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
})
