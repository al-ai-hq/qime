# Qime Metrics

Qime uses a two-tier metrics model to measure brand visibility across AI search engines.

- **First-order metrics** are computed from a single prompt run (one AI response).
- **Second-order metrics** are aggregated across multiple runs over time.

## First-Order Metrics (Per-Run)

Computed by `computeMetrics` in `apps/web/lib/metrics/compute.ts`. Each metric is stored on the `prompt_runs` row.

### brand_mentioned

`boolean` — Whether the brand name appears in the AI response. Case-insensitive substring match.

### brand_mention_count

`integer` — Number of times the brand name appears in the response. Non-overlapping, case-insensitive.

### brand_sentiment

`'neutral' | null` — `'neutral'` when the brand is mentioned, `null` when it is not. Reserved for future per-run sentiment analysis.

### brand_cited

`boolean` — Whether the brand's domain appears in any URL the AI cited as a source. The hostname is extracted from the organization's `website` field and matched against cited URL hostnames. `false` if the organization has no website configured.

### mentioned_competitors

`string[]` (JSON array) — Names of competitors that appear in the response, ordered by their first occurrence position. Only competitors configured for the organization are checked.

### organization_position

`number | null` — The brand's positional rank among all mentioned companies (brand + competitors) in the response.

**Calculation:**

1. Find the first-occurrence index of the brand and each competitor in the response text.
2. Collect all companies that appear at least once. Sort by first-occurrence index.
3. If fewer than 2 companies are mentioned, or the brand is not mentioned, return `null`.
4. The brand is at rank `r` (0-indexed) out of `n` total companies:

```
position = 1.0 - 0.75 * (r / (n - 1))
```

| Position | Score |
|----------|-------|
| First (r=0) | 1.0 |
| Last (r=n-1) | 0.25 |
| Middle | Linearly interpolated |

### competitor_mentions

`Record<string, number>` (JSON object) — Map of competitor ID to mention count. Only competitors with at least one mention are included.

### cited_urls

`{ url: string; title?: string }[]` (JSON array) — URLs cited by the AI in its response, as returned by the provider.

### response_length

`integer` — Character length of the raw AI response text.

### visibility_score

`number` (0-100) — A weighted per-run score summarizing overall brand visibility. Broken down as:

| Component | Points | Condition |
|-----------|--------|-----------|
| Brand mentioned | 15 | Brand appears at least once |
| Mention depth | 0-15 | +5 per mention, capped at 15 |
| Sentiment | 5-25 | positive=25, neutral=15, negative=5 |
| Brand URL cited | 20 | Brand domain in cited sources |
| Competitor dilution | 0-15 | Fewer competitors mentioned = higher score. `round((1 - competitorsFound / totalCompetitors) * 15)`. Full 15 if no competitors are configured. |
| Citation presence | 0-10 | +3 per cited URL, capped at 10 |

Total is clamped to [0, 100].

---

## Second-Order Metrics (Aggregate)

Computed by `computeAggregateMetrics` in `apps/web/lib/metrics/aggregate.ts`. These are calculated on-demand from a set of runs, filtered by date range, platform, tags, or topics.

Available via `GET /api/organizations/[orgId]/metrics`.

### mention_frequency

`number` (0.0-1.0) — Fraction of runs where the brand was mentioned.

```
mention_frequency = runs_with_brand_mentioned / total_runs
```

### citation_frequency

`number` (0.0-1.0) — Fraction of runs where the brand's domain was cited.

```
citation_frequency = runs_with_brand_cited / total_runs
```

### sentiment_score

`number` (0.0-1.0) — Average sentiment across runs that have a sentiment value. Runs with `null` sentiment (brand not mentioned) are excluded from the average.

| Sentiment | Value |
|-----------|-------|
| positive | 1.0 |
| neutral | 0.5 |
| negative | 0.0 |

Returns 0 if no runs have a sentiment value.

### visibility_score

`number` (0.0-1.0) — Weighted composite of the other aggregate metrics.

```
visibility_score = 0.5 * mention_frequency + 0.3 * citation_frequency + 0.2 * sentiment_score
```

### total_runs

`integer` — Number of runs included in the aggregation.

### share_of_voice

`ShareOfVoice` object — The proportion of total AI mentions captured by each brand in the competitive set.

**Calculation:**

1. For each run, sum `brand_mention_count` (the brand's mentions) and each value in `competitor_mentions` (competitor mention counts).
2. Aggregate across all runs in the filter window.
3. Divide each brand's total mentions by the grand total.

```
brand_share = total_brand_mentions / (total_brand_mentions + sum(all_competitor_mentions))
competitor_share[id] = total_competitor_mentions[id] / grand_total
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `brand_share` | number (0.0-1.0) | Brand's proportion of all mentions |
| `competitor_shares` | Record<string, number> | Each competitor's share, keyed by ID |
| `competitor_names` | Record<string, string> | Competitor ID to name mapping |
| `total_mentions` | integer | Grand total of all brand + competitor mentions |

Returns all zeros when no runs exist or no brands are mentioned.

**Interpretation:** A `brand_share` of 0.38 means your brand captures 38% of all AI recommendations in your competitive set. Track this over time to measure whether your share is growing or shrinking relative to competitors.

---

## API Reference

### `GET /api/organizations/[orgId]/metrics`

Returns aggregate metrics for an organization's prompt runs.

**Query parameters** (all optional):

| Parameter | Description |
|-----------|-------------|
| `start_date` | ISO date string. Only include runs on or after this date. |
| `end_date` | ISO date string. Only include runs on or before this date. |
| `platform_id` | Comma-separated platform IDs (e.g. `chatgpt,gemini`). |
| `tag_id` | Comma-separated tag UUIDs. Filters to prompts with any of these tags. |
| `topic_id` | Comma-separated topic UUIDs. Filters to prompts with any of these topics. |

**Response:**

```json
{
  "metrics": {
    "mention_frequency": 0.75,
    "citation_frequency": 0.33,
    "sentiment_score": 0.5,
    "visibility_score": 0.575,
    "total_runs": 12,
    "share_of_voice": {
      "brand_share": 0.45,
      "competitor_shares": { "comp-1-uuid": 0.35, "comp-2-uuid": 0.20 },
      "competitor_names": { "comp-1-uuid": "Competitor A", "comp-2-uuid": "Competitor B" },
      "total_mentions": 47
    }
  }
}
```

## Source Files

| File | Description |
|------|-------------|
| `apps/web/lib/metrics/compute.ts` | First-order metric computation |
| `apps/web/lib/metrics/aggregate.ts` | Second-order metric aggregation |
| `apps/web/lib/metrics/share-of-voice.ts` | Share of Voice computation |
| `apps/web/app/api/organizations/[orgId]/metrics/route.ts` | Aggregate metrics endpoint |
