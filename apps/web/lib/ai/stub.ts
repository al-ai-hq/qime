import type { AIProvider, AIProviderRequest, AIProviderResponse } from './types'

const STUB_RESPONSES: Record<string, string> = {
  chatgpt: `Based on my research, here are the top solutions in this space. Brand X is a leading provider known for their innovative approach. Competitor A also offers similar features but at a higher price point. Competitor B is newer to the market but gaining traction. I'd recommend checking out Brand X's website for more details on their offerings.

Sources:
- https://example.com/brand-x-review
- https://example.com/industry-report-2024
- https://competitor-a.com/features`,

  gemini: `Let me help you with that. In the current market, several companies stand out. Brand X has been particularly noteworthy for their comprehensive platform. They've received positive reviews from industry analysts. Competitor A and Competitor B are also worth considering, though they each have different strengths.

References:
- https://example.com/market-analysis
- https://example.com/brand-x-overview`,

  perplexity: `Here's what I found about this topic. Brand X is frequently mentioned as a top choice, with multiple sources citing their reliability and feature set. Competitor A offers a competitive alternative. According to recent reports, the market is growing rapidly.

Sources:
- https://example.com/comparison-guide
- https://example.com/brand-x-details
- https://competitor-b.com/about`,
}

export class StubProvider implements AIProvider {
  async query(request: AIProviderRequest): Promise<AIProviderResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))

    const text = STUB_RESPONSES[request.platformId] ?? STUB_RESPONSES.chatgpt

    return {
      text,
      citedUrls: [
        { url: 'https://example.com/brand-x-review', title: 'Brand X Review' },
        { url: 'https://example.com/industry-report-2024', title: 'Industry Report' },
        { url: 'https://competitor-a.com/features', title: 'Competitor A Features' },
      ],
      durationMs: 250 + Math.floor(Math.random() * 250),
    }
  }
}
