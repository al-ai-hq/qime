# Qime Web App

AI visibility monitoring platform built with Next.js 16, React 19, and Supabase.

## Prerequisites

- Node.js 20+
- npm
- Supabase project (see environment variables below)

## Setup

1. Install dependencies:
```bash
cd apps/web
npm install
```

2. Copy `.env.local` and fill in your keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

OPENAI_API_KEY=your-openai-key
GOOGLE_AI_API_KEY=your-google-ai-key
PERPLEXITY_API_KEY=your-perplexity-key

USE_AI_STUBS=true
```

Set `USE_AI_STUBS=true` during development to use mock AI responses instead of real API calls.

3. Run the dev server:
```bash
npm run dev
```

Open http://localhost:3000.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build (includes TypeScript check)
npm start        # Start production server
npm run lint     # Run ESLint
```

## Testing

Tests are written with [Vitest](https://vitest.dev/) and are located in `__tests__/`.

### Running Tests

```bash
# Run all tests once
npx vitest run

# Run tests in watch mode (re-runs on file changes)
npx vitest

# Run a specific test file
npx vitest run __tests__/lib/metrics.test.ts

# Run tests matching a pattern
npx vitest run -t "brand mention"
```

### Test Structure

```
__tests__/
├── setup.ts              # Environment variables and global mocks (next/headers)
├── helpers.ts            # Mock Supabase client, mock user, mock request factories
├── lib/
│   ├── metrics.test.ts   # Visibility score computation (19 tests)
│   ├── scheduling.test.ts # Run scheduling utilities (15 tests)
│   └── ai.test.ts        # AI provider factory and stub (8 tests)
└── api/
    ├── auth.test.ts       # Signup, login routes (7 tests)
    ├── organizations.test.ts # Org CRUD routes (5 tests)
    ├── prompts.test.ts    # Prompt CRUD routes (6 tests)
    └── prompt-runs.test.ts # Prompt execution routes (5 tests)
```

- **Unit tests** (`__tests__/lib/`): Test library functions directly (metrics, scheduling, AI providers)
- **Integration tests** (`__tests__/api/`): Mock Supabase client, import route handlers, call with `Request` objects

### Writing Tests

API route tests follow this pattern:

1. Mock `@/lib/supabase/server` to return a mock Supabase client
2. Import the route handler (e.g., `POST`, `GET`)
3. Create a `Request` object with the appropriate method/body
4. Call the handler with `{ params: Promise.resolve({ orgId: '...' }) }` (Next.js 16 async params)
5. Assert on the response status and JSON body

See `__tests__/helpers.ts` for reusable mock factories.

## Project Structure

```
apps/web/
├── app/
│   ├── api/           # API routes (auth, organizations, prompts, etc.)
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page
├── lib/
│   ├── supabase/      # Supabase client utilities (browser, server, admin)
│   ├── ai/            # AI provider integrations (ChatGPT, Gemini, Perplexity, stub)
│   ├── metrics/       # Visibility score computation
│   ├── scheduling/    # Run scheduling utilities
│   ├── validators/    # Zod request validation schemas
│   └── api/           # Shared API helpers (auth, validation)
├── __tests__/         # Vitest test suites
├── middleware.ts       # Auth token refresh middleware
└── vitest.config.ts   # Test configuration
```

## Architecture

- **Backend**: Next.js App Router API routes with Supabase (PostgreSQL + Auth + RLS)
- **AI Integrations**: ChatGPT (OpenAI), Gemini (Google), Perplexity - with stub fallback
- **Scheduling**: pg_cron triggers a Supabase Edge Function every 15 minutes to run due prompts
- **Security**: Row Level Security on all tables, org membership checks on all endpoints

See `apps/docs/API.md` for API documentation and `apps/docs/DATABASE.md` for schema details.
