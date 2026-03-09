import { GoogleGenAI } from '@google/genai'
import type { AIProvider, AIProviderRequest, AIProviderResponse } from './types'

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI

  constructor() {
    this.client = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })
  }

  async query(request: AIProviderRequest): Promise<AIProviderResponse> {
    const start = Date.now()
    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: request.prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      })

      const text = response.text ?? ''
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
        error: error instanceof Error ? error.message : 'Gemini API error',
      }
    }
  }

  private extractUrls(response: { candidates?: Array<{ groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> } }> }): { url: string; title?: string }[] {
    const urls: { url: string; title?: string }[] = []
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata
    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          urls.push({ url: chunk.web.uri, title: chunk.web.title })
        }
      }
    }
    return urls
  }
}
