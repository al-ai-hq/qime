import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getProvider } from '@/lib/ai/index'
import { StubProvider } from '@/lib/ai/stub'

const mockGenerateContent = vi.fn()
const mockPerplexityCreate = vi.fn()

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = { generateContent: mockGenerateContent }
      constructor(public config: { apiKey: string }) {}
    },
  }
})

vi.mock('@perplexity-ai/perplexity_ai', () => {
  return {
    default: class {
      chat = { completions: { create: mockPerplexityCreate } }
      constructor(public config: { apiKey?: string }) {}
    },
  }
})

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

describe('GeminiProvider', () => {
  let originalStubs: string | undefined
  let originalApiKey: string | undefined

  beforeEach(() => {
    originalStubs = process.env.USE_AI_STUBS
    originalApiKey = process.env.GOOGLE_AI_API_KEY
    delete process.env.USE_AI_STUBS
    process.env.GOOGLE_AI_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    if (originalStubs !== undefined) {
      process.env.USE_AI_STUBS = originalStubs
    } else {
      delete process.env.USE_AI_STUBS
    }
    if (originalApiKey !== undefined) {
      process.env.GOOGLE_AI_API_KEY = originalApiKey
    } else {
      delete process.env.GOOGLE_AI_API_KEY
    }
    vi.restoreAllMocks()
  })

  it('instantiates GoogleGenAI with apiKey object and calls models.generateContent', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'Gemini response text',
      candidates: [{
        groundingMetadata: {
          groundingChunks: [
            { web: { uri: 'https://example.com', title: 'Example' } },
          ],
        },
      }],
    })

    const { GeminiProvider } = await import('@/lib/ai/gemini')
    const provider = new GeminiProvider()
    const result = await provider.query({ prompt: 'test prompt', platformId: 'gemini' })

    // Verify models.generateContent called with correct params
    expect(mockGenerateContent).toHaveBeenCalledWith({
      model: 'gemini-3-flash-preview',
      contents: 'test prompt',
      config: {
        tools: [{ googleSearch: {} }],
      },
    })

    // Verify response.text is used as a property (not a method call)
    expect(result.text).toBe('Gemini response text')

    // Verify grounding metadata extraction
    expect(result.citedUrls).toEqual([
      { url: 'https://example.com', title: 'Example' },
    ])
    expect(typeof result.durationMs).toBe('number')
    expect(result.error).toBeUndefined()
  })

  it('handles errors gracefully', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API failure'))

    const { GeminiProvider } = await import('@/lib/ai/gemini')
    const provider = new GeminiProvider()
    const result = await provider.query({ prompt: 'test', platformId: 'gemini' })

    expect(result.text).toBe('')
    expect(result.citedUrls).toEqual([])
    expect(result.error).toBe('API failure')
  })
})

describe('PerplexityProvider', () => {
  let originalStubs: string | undefined
  let originalApiKey: string | undefined

  beforeEach(() => {
    originalStubs = process.env.USE_AI_STUBS
    originalApiKey = process.env.PERPLEXITY_API_KEY
    delete process.env.USE_AI_STUBS
    process.env.PERPLEXITY_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    if (originalStubs !== undefined) {
      process.env.USE_AI_STUBS = originalStubs
    } else {
      delete process.env.USE_AI_STUBS
    }
    if (originalApiKey !== undefined) {
      process.env.PERPLEXITY_API_KEY = originalApiKey
    } else {
      delete process.env.PERPLEXITY_API_KEY
    }
    vi.restoreAllMocks()
  })

  it('calls chat.completions.create with sonar-pro model and returns response', async () => {
    mockPerplexityCreate.mockResolvedValue({
      choices: [{ message: { content: 'Perplexity response text' } }],
      citations: ['https://example.com', 'https://docs.example.com'],
    })

    const { PerplexityProvider } = await import('@/lib/ai/perplexity')
    const provider = new PerplexityProvider()
    const result = await provider.query({ prompt: 'test prompt', platformId: 'perplexity' })

    expect(mockPerplexityCreate).toHaveBeenCalledWith({
      model: 'sonar-pro',
      messages: [{ role: 'user', content: 'test prompt' }],
    })

    expect(result.text).toBe('Perplexity response text')
    expect(result.citedUrls).toEqual([
      { url: 'https://example.com' },
      { url: 'https://docs.example.com' },
    ])
    expect(typeof result.durationMs).toBe('number')
    expect(result.error).toBeUndefined()
  })

  it('handles responses without citations', async () => {
    mockPerplexityCreate.mockResolvedValue({
      choices: [{ message: { content: 'Response without citations' } }],
    })

    const { PerplexityProvider } = await import('@/lib/ai/perplexity')
    const provider = new PerplexityProvider()
    const result = await provider.query({ prompt: 'test', platformId: 'perplexity' })

    expect(result.text).toBe('Response without citations')
    expect(result.citedUrls).toEqual([])
  })

  it('handles errors gracefully', async () => {
    mockPerplexityCreate.mockRejectedValue(new Error('Perplexity API failure'))

    const { PerplexityProvider } = await import('@/lib/ai/perplexity')
    const provider = new PerplexityProvider()
    const result = await provider.query({ prompt: 'test', platformId: 'perplexity' })

    expect(result.text).toBe('')
    expect(result.citedUrls).toEqual([])
    expect(result.error).toBe('Perplexity API failure')
  })
})
