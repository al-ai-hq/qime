import Perplexity from '@perplexity-ai/perplexity_ai'
import type { AIProvider, AIProviderRequest, AIProviderResponse } from './types'

export class PerplexityProvider implements AIProvider {
  private client: Perplexity

  constructor() {
    this.client = new Perplexity({
      apiKey: process.env.PERPLEXITY_API_KEY,
    })
  }

  async query(request: AIProviderRequest): Promise<AIProviderResponse> {
    const start = Date.now()
    try {
      const response = await this.client.chat.completions.create({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: request.prompt }],
      })

      const content = response.choices?.[0]?.message?.content
      const text = typeof content === 'string' ? content : ''
      const citedUrls = this.extractUrls(response)

      return {
        text,
        citedUrls,
        durationMs: Date.now() - start,
      }
    } catch (error) {
      return {
        text: '',
        citedUrls: [],
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Perplexity API error',
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractUrls(response: any): { url: string; title?: string }[] {
    // Perplexity returns citations in the response metadata
    const citations = (response as unknown as { citations?: string[] }).citations
    if (!citations) return []
    return citations.map(url => ({ url }))
  }
}
