export interface AIProviderRequest {
  prompt: string
  platformId: string
}

export interface AIProviderResponse {
  text: string
  citedUrls: { url: string; title?: string }[]
  durationMs: number
  error?: string
}

export interface AIProvider {
  query(request: AIProviderRequest): Promise<AIProviderResponse>
}
