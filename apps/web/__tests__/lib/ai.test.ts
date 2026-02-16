import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getProvider } from '@/lib/ai/index'
import { StubProvider } from '@/lib/ai/stub'

describe('getProvider', () => {
  const originalEnv = process.env.USE_AI_STUBS

  beforeEach(() => {
    process.env.USE_AI_STUBS = 'true'
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.USE_AI_STUBS = originalEnv
    } else {
      delete process.env.USE_AI_STUBS
    }
  })

  it('returns a provider for chatgpt', () => {
    const provider = getProvider('chatgpt')
    expect(provider).toBeDefined()
    expect(typeof provider.query).toBe('function')
  })

  it('returns a StubProvider for chatgpt when USE_AI_STUBS is true', () => {
    const provider = getProvider('chatgpt')
    expect(provider).toBeInstanceOf(StubProvider)
  })

  it('returns a provider for gemini', () => {
    const provider = getProvider('gemini')
    expect(provider).toBeDefined()
    expect(typeof provider.query).toBe('function')
  })

  it('returns a provider for perplexity', () => {
    const provider = getProvider('perplexity')
    expect(provider).toBeDefined()
    expect(typeof provider.query).toBe('function')
  })

  it('throws an error for an unknown platform', () => {
    expect(() => getProvider('unknown')).toThrowError('Unknown platform: unknown')
  })
})

describe('StubProvider', () => {
  it('returns a valid response shape', async () => {
    const provider = new StubProvider()
    const response = await provider.query({ prompt: 'test', platformId: 'chatgpt' })

    expect(response).toBeDefined()
    expect(typeof response.text).toBe('string')
    expect(response.text.length).toBeGreaterThan(0)
    expect(Array.isArray(response.citedUrls)).toBe(true)
    expect(response.citedUrls.length).toBeGreaterThan(0)
    expect(typeof response.durationMs).toBe('number')
    expect(response.durationMs).toBeGreaterThan(0)
  })

  it('returns citedUrls with url and optional title', async () => {
    const provider = new StubProvider()
    const response = await provider.query({ prompt: 'test', platformId: 'chatgpt' })

    for (const cited of response.citedUrls) {
      expect(typeof cited.url).toBe('string')
      expect(cited.url).toMatch(/^https?:\/\//)
    }
  })

  it('returns text content for different platform IDs', async () => {
    const provider = new StubProvider()

    const chatgptResponse = await provider.query({ prompt: 'test', platformId: 'chatgpt' })
    const geminiResponse = await provider.query({ prompt: 'test', platformId: 'gemini' })
    const perplexityResponse = await provider.query({ prompt: 'test', platformId: 'perplexity' })

    expect(chatgptResponse.text.length).toBeGreaterThan(0)
    expect(geminiResponse.text.length).toBeGreaterThan(0)
    expect(perplexityResponse.text.length).toBeGreaterThan(0)
  })
})
