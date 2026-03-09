import OpenAI from 'openai'
import type { AIProvider, AIProviderRequest, AIProviderResponse } from './types'

export class ChatGPTProvider implements AIProvider {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async query(request: AIProviderRequest): Promise<AIProviderResponse> {
    const start = Date.now()
    try {
      const response = await this.client.responses.create({
        model: 'gpt-5.4',
        tools: [{ type: 'web_search' }],
        input: request.prompt,
      })

      const text = response.output_text
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
        error: error instanceof Error ? error.message : 'ChatGPT API error',
      }
    }
  }

  private extractUrls(response: OpenAI.Responses.Response): { url: string; title?: string }[] {
    const urls: { url: string; title?: string }[] = []
    for (const item of response.output) {
      if (item.type === 'web_search_call') continue
      if (item.type === 'message') {
        for (const content of item.content) {
          if (content.type === 'output_text' && content.annotations) {
            for (const annotation of content.annotations) {
              if (annotation.type === 'url_citation') {
                urls.push({ url: annotation.url, title: annotation.title })
              }
            }
          }
        }
      }
    }
    return urls
  }
}
