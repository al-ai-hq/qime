# Qime API Documentation

Base URL: `/api`

All endpoints (except auth) require authentication via Supabase session cookies.

---

## Authentication

### POST /api/auth/signup

Create a new account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "message": "Check your email for the confirmation link."
}
```

### POST /api/auth/login

Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response (200):**
```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "session": { "access_token": "...", "expires_at": 1234567890 }
}
```

### POST /api/auth/logout

Sign out the current user. No request body needed.

**Response (200):**
```json
{ "message": "Logged out successfully" }
```

### GET /api/auth/confirm

Email confirmation callback. Redirects to `/` on success, `/auth/error` on failure.

**Query Parameters:** `token_hash`, `type`

---

## Organizations

### POST /api/organizations

Create a new organization. The creator is automatically added as owner.

**Request Body:**
```json
{
  "name": "Acme Inc",
  "website": "https://acme.com",
  "description": "AI-first company",
  "timezone": "America/New_York"
}
```

**Response (201):** Organization object

### GET /api/organizations

List all organizations the current user belongs to.

**Response (200):** Array of organization objects with `role` field.

### GET /api/organizations/:orgId

Get a single organization.

### PATCH /api/organizations/:orgId

Update organization details.

**Request Body:** Partial organization fields (`name`, `website`, `description`, `timezone`)

### DELETE /api/organizations/:orgId

Delete an organization. Requires `owner` role.

**Response (204):** No content

---

## Organization Settings

### GET /api/organizations/:orgId/settings

Get scheduling settings.

**Response (200):**
```json
{
  "run_frequency": "daily",
  "min_hours_between_runs": 12
}
```

### PATCH /api/organizations/:orgId/settings

Update scheduling settings.

**Request Body:**
```json
{
  "run_frequency": "twice_daily",
  "min_hours_between_runs": 8
}
```

`run_frequency` options: `daily`, `twice_daily`, `weekly`, `every_other_day`

---

## Platforms

### POST /api/organizations/:orgId/platforms

Add an AI platform to the organization.

**Request Body:**
```json
{ "platform_id": "chatgpt" }
```

Platform IDs: `chatgpt`, `gemini`, `perplexity`

**Response (201):** Organization platform object

### GET /api/organizations/:orgId/platforms

List enabled platforms with details from `ai_platforms`.

### DELETE /api/organizations/:orgId/platforms?platform_id=chatgpt

Remove a platform. Pass `platform_id` as query parameter.

**Response (204):** No content

---

## Competitors

### POST /api/organizations/:orgId/competitors

```json
{ "name": "Competitor Inc", "website": "https://competitor.com" }
```

**Response (201):** Competitor object

### GET /api/organizations/:orgId/competitors

List all competitors.

### PATCH /api/organizations/:orgId/competitors/:competitorId

Update competitor fields.

### DELETE /api/organizations/:orgId/competitors/:competitorId

**Response (204):** No content

---

## Topics

### POST /api/organizations/:orgId/topics

```json
{ "name": "Product Comparison" }
```

A "General" topic is auto-created for each organization.

### GET /api/organizations/:orgId/topics

### PATCH /api/organizations/:orgId/topics/:topicId

### DELETE /api/organizations/:orgId/topics/:topicId

---

## Tags

### POST /api/organizations/:orgId/tags

```json
{ "name": "high-priority" }
```

### GET /api/organizations/:orgId/tags

### PATCH /api/organizations/:orgId/tags/:tagId

### DELETE /api/organizations/:orgId/tags/:tagId

---

## Prompts

### POST /api/organizations/:orgId/prompts

```json
{
  "title": "Best CRM tools",
  "prompt_text": "What are the best CRM tools for small businesses?",
  "topic_id": "uuid (optional)",
  "run_frequency_override": "daily (optional)",
  "tag_ids": ["uuid1", "uuid2"]
}
```

Title is limited to 50 characters. Prompt schedules are auto-created for each org platform.

**Response (201):** Prompt object

### GET /api/organizations/:orgId/prompts

**Query Parameters:**
- `topic_id` - filter by topic
- `is_active` - filter by active status (`true`/`false`)

Returns prompts with nested topic name and tags.

### GET /api/organizations/:orgId/prompts/:promptId

### PATCH /api/organizations/:orgId/prompts/:promptId

Supports all fields from create, plus `is_active` boolean.

### DELETE /api/organizations/:orgId/prompts/:promptId

---

## Prompt Runs

### POST /api/organizations/:orgId/prompts/:promptId/run

Manually trigger a prompt run on all configured platforms. Returns results from each platform.

**Response (201):**
```json
{
  "runs": [
    {
      "id": "uuid",
      "prompt_id": "uuid",
      "platform_id": "chatgpt",
      "response_text": "...",
      "brand_mentioned": true,
      "brand_mention_count": 3,
      "brand_sentiment": "positive",
      "competitor_mentions": { "competitor-uuid": 1 },
      "visibility_score": 75,
      "cited_urls": [{ "url": "https://...", "title": "..." }],
      "response_length": 1234,
      "run_duration_ms": 2500,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/organizations/:orgId/prompts/:promptId/runs

List historical runs.

**Query Parameters:**
- `platform_id` - filter by platform
- `limit` - max results (default 50)
- `offset` - pagination offset

**Response (200):**
```json
{ "runs": [...], "total": 100 }
```

### GET /api/organizations/:orgId/prompts/:promptId/runs/:runId

Get a single run with full details.

---

## Error Responses

All errors return:
```json
{ "error": "Error message description" }
```

Common status codes:
- `400` - Validation error
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not an org member)
- `404` - Resource not found
- `409` - Conflict (duplicate unique constraint)
- `500` - Server error
