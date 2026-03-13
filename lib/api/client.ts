import type {
  Organization,
  OrganizationMember,
  OrganizationPlatform,
  Competitor,
  Topic,
  Tag,
  Prompt,
  PromptRun,
  AggregateMetrics,
  OrgSettings,
} from '@/lib/types'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (res.status === 204) return undefined as T
  const data = await res.json()
  if (!res.ok) throw new ApiError(res.status, data.error || 'Request failed')
  return data
}

// Auth
export const api = {
  auth: {
    signup: (body: { email: string; password: string; full_name?: string }) =>
      request<{ user: { id: string; email: string } }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      request<{ user: { id: string; email: string } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    logout: () =>
      request<void>('/api/auth/logout', { method: 'POST' }),
  },

  orgs: {
    list: () =>
      request<{ organizations: Organization[] }>('/api/organizations'),
    create: (body: { name: string; website?: string; description?: string; timezone?: string }) =>
      request<{ organization: Organization }>('/api/organizations', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    get: (orgId: string) =>
      request<{ organization: Organization }>(`/api/organizations/${orgId}`),
    update: (orgId: string, body: Partial<Organization>) =>
      request<{ organization: Organization }>(`/api/organizations/${orgId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (orgId: string) =>
      request<void>(`/api/organizations/${orgId}`, { method: 'DELETE' }),
  },

  platforms: {
    list: (orgId: string) =>
      request<{ platforms: OrganizationPlatform[] }>(`/api/organizations/${orgId}/platforms`),
    add: (orgId: string, platformId: string) =>
      request<{ platform: OrganizationPlatform }>(`/api/organizations/${orgId}/platforms`, {
        method: 'POST',
        body: JSON.stringify({ platform_id: platformId }),
      }),
    remove: (orgId: string, platformId: string) =>
      request<void>(`/api/organizations/${orgId}/platforms`, {
        method: 'DELETE',
        body: JSON.stringify({ platform_id: platformId }),
      }),
  },

  competitors: {
    list: (orgId: string) =>
      request<{ competitors: Competitor[] }>(`/api/organizations/${orgId}/competitors`),
    create: (orgId: string, body: { name: string; alternate_names?: string[]; website?: string }) =>
      request<{ competitor: Competitor }>(`/api/organizations/${orgId}/competitors`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (orgId: string, competitorId: string, body: Partial<Competitor>) =>
      request<{ competitor: Competitor }>(`/api/organizations/${orgId}/competitors/${competitorId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (orgId: string, competitorId: string) =>
      request<void>(`/api/organizations/${orgId}/competitors/${competitorId}`, {
        method: 'DELETE',
      }),
  },

  topics: {
    list: (orgId: string) =>
      request<{ topics: Topic[] }>(`/api/organizations/${orgId}/topics`),
    create: (orgId: string, body: { name: string }) =>
      request<{ topic: Topic }>(`/api/organizations/${orgId}/topics`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (orgId: string, topicId: string, body: { name: string }) =>
      request<{ topic: Topic }>(`/api/organizations/${orgId}/topics/${topicId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (orgId: string, topicId: string) =>
      request<void>(`/api/organizations/${orgId}/topics/${topicId}`, {
        method: 'DELETE',
      }),
  },

  tags: {
    list: (orgId: string) =>
      request<{ tags: Tag[] }>(`/api/organizations/${orgId}/tags`),
    create: (orgId: string, body: { name: string }) =>
      request<{ tag: Tag }>(`/api/organizations/${orgId}/tags`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (orgId: string, tagId: string, body: { name: string }) =>
      request<{ tag: Tag }>(`/api/organizations/${orgId}/tags/${tagId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (orgId: string, tagId: string) =>
      request<void>(`/api/organizations/${orgId}/tags/${tagId}`, {
        method: 'DELETE',
      }),
  },

  prompts: {
    list: (orgId: string) =>
      request<{ prompts: Prompt[] }>(`/api/organizations/${orgId}/prompts`),
    create: (orgId: string, body: {
      title: string; prompt_text: string; topic_id?: string;
      tag_ids?: string[]; run_frequency_override?: string | null;
      min_hours_between_runs_override?: number | null;
    }) =>
      request<{ prompt: Prompt }>(`/api/organizations/${orgId}/prompts`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    get: (orgId: string, promptId: string) =>
      request<{ prompt: Prompt }>(`/api/organizations/${orgId}/prompts/${promptId}`),
    update: (orgId: string, promptId: string, body: Partial<Prompt> & { tag_ids?: string[] }) =>
      request<{ prompt: Prompt }>(`/api/organizations/${orgId}/prompts/${promptId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (orgId: string, promptId: string) =>
      request<void>(`/api/organizations/${orgId}/prompts/${promptId}`, {
        method: 'DELETE',
      }),
    run: (orgId: string, promptId: string) =>
      request<{ runs: PromptRun[] }>(`/api/organizations/${orgId}/prompts/${promptId}/run`, {
        method: 'POST',
      }),
    runs: (orgId: string, promptId: string) =>
      request<{ runs: PromptRun[] }>(`/api/organizations/${orgId}/prompts/${promptId}/runs`),
  },

  metrics: {
    get: (orgId: string, params?: { platform?: string; tag_id?: string; topic_id?: string; start_date?: string; end_date?: string }) => {
      const searchParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => { if (v) searchParams.set(k, v) })
      }
      const qs = searchParams.toString()
      return request<{ metrics: AggregateMetrics }>(`/api/organizations/${orgId}/metrics${qs ? `?${qs}` : ''}`)
    },
  },

  settings: {
    get: (orgId: string) =>
      request<{ settings: OrgSettings }>(`/api/organizations/${orgId}/settings`),
    update: (orgId: string, body: Partial<OrgSettings>) =>
      request<{ settings: OrgSettings }>(`/api/organizations/${orgId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },

  members: {
    list: (orgId: string) =>
      request<{ members: OrganizationMember[] }>(`/api/organizations/${orgId}/members`),
    invite: (orgId: string, email: string) =>
      request<{ member: OrganizationMember }>(`/api/organizations/${orgId}/members/invite`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },
}

export { ApiError }
