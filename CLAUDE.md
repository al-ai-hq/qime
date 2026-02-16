# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Qime is a platform that helps brands monitor, measure, and improve their visibility in AI-powered search engines and chatbots (ChatGPT, Perplexity, Gemini, Google AI Overviews/SGE).

## Repository Structure

Monorepo with apps under `apps/`:
- `apps/web/` — Main Next.js 16 web application (React 19, TypeScript, Tailwind CSS v4)
- `apps/docs/` — Documentation (`API.md`, `DATABASE.md`)

### Web App Structure (`apps/web/`)

```
apps/web/
├── app/
│   ├── api/
│   │   ├── auth/              # signup, login, logout, confirm routes
│   │   └── organizations/     # CRUD + nested resources
│   │       └── [orgId]/
│   │           ├── platforms/      # AI platform selection
│   │           ├── competitors/    # Competitor management
│   │           ├── topics/         # Topic categorization
│   │           ├── tags/           # Tag management
│   │           ├── prompts/        # Prompt CRUD
│   │           │   └── [promptId]/
│   │           │       ├── run/    # Manual prompt execution
│   │           │       └── runs/   # Run history
│   │           └── settings/       # Org scheduling settings
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── supabase/       # client.ts (browser), server.ts (SSR), admin.ts (service role)
│   ├── ai/             # AI provider integrations + stub + factory
│   ├── metrics/        # Visibility score computation from AI responses
│   ├── scheduling/     # Next-run-at calculation helpers
│   ├── validators/     # Zod schemas for all request validation
│   └── api/            # Shared helpers (auth check, validation, org membership)
├── __tests__/
│   ├── setup.ts        # Vitest setup (env vars, mocks)
│   ├── helpers.ts      # Test utilities (mock Supabase client, mock user)
│   ├── lib/            # Unit tests (metrics, scheduling, AI providers)
│   └── api/            # Integration tests (auth, orgs, prompts, runs)
├── middleware.ts        # Supabase auth token refresh
└── vitest.config.ts    # Vitest configuration with path aliases
```

## Development Commands

All commands run from `apps/web/`:

```bash
cd apps/web
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (includes TypeScript check)
npm start            # Start production server
npm run lint         # Run ESLint
npx vitest run       # Run all tests once
npx vitest           # Run tests in watch mode
npx vitest run __tests__/lib/metrics.test.ts   # Run a specific test file
```

## Testing Requirements

**Every development task MUST include tests. A task is NOT considered complete until all tests pass.**

- **Test framework**: Vitest (configured in `vitest.config.ts`)
- **Test location**: `apps/web/__tests__/` mirroring the source structure
  - `__tests__/lib/` — Unit tests for library code (metrics, scheduling, AI providers, validators)
  - `__tests__/api/` — Integration tests for API routes (mock Supabase client, call handlers directly)
- **Setup file**: `__tests__/setup.ts` — Sets test env vars and mocks `next/headers`
- **Helpers**: `__tests__/helpers.ts` — Mock Supabase client factory, mock user/request creators
- **Test pattern for API routes**: Mock `@/lib/supabase/server`, import route handler, call with `Request` object and `{ params: Promise.resolve({...}) }` for Next.js 16 async params
- **Verification**: Run `npx vitest run` — all tests must pass. Then run `npm run build` — must compile with no TypeScript errors.

## Architecture

- **Next.js App Router** with file-based routing under `apps/web/app/`
- **TypeScript** with strict mode enabled; path alias `@/*` maps to project root
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **Supabase** for database (PostgreSQL), auth, and RLS — clients in `lib/supabase/`
- **Zod** for request validation — schemas in `lib/validators/`
- **AI Providers**: ChatGPT (OpenAI), Gemini (Google), Perplexity — with stub fallback via `USE_AI_STUBS=true`
- **Scheduling**: pg_cron + Supabase Edge Function (`run-scheduled-prompts`) every 15 minutes
- **ESLint** flat config with `next/core-web-vitals` and `next/typescript` rules
- **Package manager**: npm

## Key Conventions

- All API routes use shared helpers from `lib/api/helpers.ts` (`getAuthenticatedUser`, `checkOrgMembership`, `validateBody`, `jsonError`)
- All org-scoped endpoints check membership before proceeding (401 for unauth, 403 for non-member)
- Next.js 16 route params are `Promise`-based: `{ params }: { params: Promise<{ orgId: string }> }` — must `await params`
- Database has RLS on all tables; `is_org_member()` SQL function used in policies
- Unique constraint violations return 409 with descriptive error messages
