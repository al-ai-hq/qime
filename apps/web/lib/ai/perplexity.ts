import OpenAI from 'openai'
import type { AIProvider, AIProviderRequest, AIProviderResponse } from './types'

export class PerplexityProvider implements AIProvider {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai',
    })
  }

  async query(request: AIProviderRequest): Promise<AIProviderResponse> {
    const start = Date.now()
    try {
      const response = await this.client.chat.completions.create({
        model: 'sonar',
        messages: [{ role: 'user', content: request.prompt }],
      })

      const text = response.choices[0]?.message?.content ?? ''
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

  private extractUrls(response: OpenAI.Chat.Completions.ChatCompletion): { url: string; title?: string }[] {
    // Perplexity returns citations in the response metadata
    const citations = (response as unknown as { citations?: string[] }).citations
    if (!citations) return []
    return citations.map(url => ({ url }))
  }
}
