import type { AIProvider } from './types'
import { ChatGPTProvider } from './chatgpt'
import { GeminiProvider } from './gemini'
import { PerplexityProvider } from './perplexity'
import { StubProvider } from './stub'

export type { AIProvider, AIProviderRequest, AIProviderResponse } from './types'

const useStubs = () => process.env.USE_AI_STUBS === 'true'

const providers: Record<string, () => AIProvider> = {
  chatgpt: () => useStubs() ? new StubProvider() : new ChatGPTProvider(),
  gemini: () => useStubs() ? new StubProvider() : new GeminiProvider(),
  perplexity: () => useStubs() ? new StubProvider() : new PerplexityProvider(),
}

export function getProvider(platformId: string): AIProvider {
  const factory = providers[platformId]
  if (!factory) throw new Error(`Unknown platform: ${platformId}`)
  return factory()
}
