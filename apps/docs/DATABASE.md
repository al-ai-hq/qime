# Qime Database Schema

Supabase (PostgreSQL) database with Row Level Security (RLS) on all tables.

## Extensions

- `pg_cron` - Scheduled job execution
- `pg_net` - Async HTTP requests from DB
- `moddatetime` - Auto-update `updated_at` timestamps

## Entity Relationships

```
auth.users
  └── profiles (1:1)
        ├── organizations (created_by)
        │     ├── organization_members (many-to-many with profiles)
        │     ├── organization_platforms (many-to-many with ai_platforms)
        │     ├── competitors
        │     ├── topics
        │     ├── tags
        │     ├── prompts
        │     │     ├── prompt_tags (many-to-many with tags)
        │     │     ├── prompt_schedules (per platform)
        │     │     └── prompt_runs (per platform execution)
        │     └── prompt_runs
        └── organization_members

ai_platforms (reference table: chatgpt, gemini, perplexity)
```

## Tables

### profiles
Extends Supabase auth.users. Auto-created via trigger on signup.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | FK to auth.users |
| full_name | text | |
| avatar_url | text, nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated |

### organizations

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | auto-generated |
| name | text, not null | |
| alternate_names | text[], not null | default '{}'; name variants for multi-language detection |
| website | text, nullable | |
| description | text, nullable | |
| timezone | text | default 'UTC' |
| logo_url | text, nullable | |
| run_frequency | text | 'daily', 'twice_daily', 'weekly', 'every_other_day' |
| min_hours_between_runs | int | default 12 |
| created_by | uuid | FK profiles |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated |

### organization_members

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| organization_id | uuid | FK organizations (cascade delete) |
| user_id | uuid | FK profiles (cascade delete) |
| role | text | 'owner', 'admin', 'member' |
| created_at | timestamptz | |

Unique constraint: (organization_id, user_id)

### ai_platforms
Reference table, seeded with 3 rows.

| Column | Type | Notes |
|--------|------|-------|
| id | text, PK | 'chatgpt', 'gemini', 'perplexity' |
| name | text | Display name |
| is_active | bool | default true |

### organization_platforms

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| organization_id | uuid | FK organizations |
| platform_id | text | FK ai_platforms |
| created_at | timestamptz | |

Unique constraint: (organization_id, platform_id)

### competitors

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| organization_id | uuid | FK organizations |
| name | text, not null | |
| alternate_names | text[], not null | default '{}'; name variants for multi-language detection |
| website | text, nullable | |
| logo_url | text, nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated |

### topics

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| organization_id | uuid | FK organizations |
| name | text, not null | |
| created_at | timestamptz | |

Unique constraint: (organization_id, name). A "General" topic is auto-created per org.

### tags

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| organization_id | uuid | FK organizations |
| name | text, not null | |
| created_at | timestamptz | |

Unique constraint: (organization_id, name)

### prompts

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| organization_id | uuid | FK organizations |
| title | varchar(50), not null | |
| prompt_text | text, not null | |
| topic_id | uuid, nullable | FK topics (set null on delete) |
| run_frequency_override | text, nullable | overrides org setting |
| min_hours_between_runs_override | int, nullable | overrides org setting |
| is_active | bool | default true |
| created_by | uuid | FK profiles |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated |

### prompt_tags
Junction table for prompts <-> tags.

| Column | Type | Notes |
|--------|------|-------|
| prompt_id | uuid | FK prompts, PK |
| tag_id | uuid | FK tags, PK |

### prompt_schedules
Tracks next run time per prompt+platform combination.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| prompt_id | uuid | FK prompts |
| platform_id | text | FK ai_platforms |
| last_run_at | timestamptz, nullable | |
| next_run_at | timestamptz | |
| created_at | timestamptz | |

Unique constraint: (prompt_id, platform_id). Auto-created via triggers.

### prompt_runs
Stores each AI query execution result.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| prompt_id | uuid | FK prompts |
| platform_id | text | FK ai_platforms |
| organization_id | uuid | FK organizations |
| response_text | text, nullable | |
| cited_urls | jsonb | default '[]', array of {url, title?} |
| brand_mentioned | bool, nullable | |
| brand_mention_count | int | default 0 |
| brand_sentiment | text, nullable | 'positive', 'neutral', 'negative' |
| competitor_mentions | jsonb | default '{}', {competitor_id: count} |
| response_length | int, nullable | |
| visibility_score | numeric, nullable | 0-100 |
| brand_cited | bool, not null | default false; brand domain in cited URLs |
| mentioned_competitors | jsonb, not null | default '[]'; competitor names by first appearance |
| organization_position | numeric, nullable | 0.0–1.0; brand rank among mentioned companies |
| run_duration_ms | int, nullable | |
| error | text, nullable | |
| created_at | timestamptz | |

## Triggers

1. **on_auth_user_created** - Creates a profile row when a user signs up
2. **on_organization_created** - Creates a "General" topic for new organizations
3. **on_prompt_created** - Creates prompt_schedules for each org platform
4. **on_org_platform_added** - Creates prompt_schedules for all active prompts

## RLS Helper

`is_org_member(org_id)` - Security definer function that checks if the current authenticated user is a member of the given organization. Used by most RLS policies.

## Scheduled Jobs

- `run-scheduled-prompts` - pg_cron job runs every 15 minutes, invokes the Supabase Edge Function to process due prompt schedules.
