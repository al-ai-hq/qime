# Frontend Redesign — Design Spec

**Date:** 2026-03-26
**Approach:** Full page rewrites — every page component rewritten from scratch, same file paths and API layer preserved

---

## 1. Design System Foundation

### CSS Custom Properties

Replace the current HSL-based light theme in `globals.css` with the full token set:

**Surfaces:**
| Token | Hex | Usage |
|---|---|---|
| `--surface-chrome` | `#121214` | Sidebar, top bar, persistent shell |
| `--surface-page` | `#1A1A1E` | Main content area background |
| `--surface-card` | `#1F1F24` | Cards, panels, chart containers |
| `--surface-active` | `#28282E` | Active sidebar item, selected run |

**Borders:**
| Token | Hex | Usage |
|---|---|---|
| `--border-primary` | `#2A2A2E` | Card/panel edges, chart outlines |
| `--border-subtle` | `#242428` | Sidebar dividers, input strokes, section separators |
| `--border-chrome` | `#303036` | Top bar bottom edge, pill outlines |

**Accent:**
| Token | Value | Usage |
|---|---|---|
| `--accent-primary` | `#F0522A` | CTAs, active nav, chart primary, metric icons |
| `--accent-subtle` | `rgba(240,82,42,0.08)` | Active nav bg, hover states |
| `--accent-muted` | `rgba(240,82,42,0.14)` | Tag/badge fills, selected filters |
| `--accent-wash` | `rgba(240,82,42,0.06)` | Chart area gradients |

**Text Hierarchy:**
| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#F2F2F2` | Page titles, hero metrics |
| `--text-secondary` | `#D0D0D0` | Card titles, emphasis text |
| `--text-body` | `#A0A0A6` | Body text, descriptions, legends |
| `--text-muted` | `#8A8A90` | Subtitles, timestamps, axis labels |
| `--text-label` | `#70707A` | Section group headers, sidebar labels |
| `--text-hint` | `#606068` | Footer text, disabled states |

**Data Visualization:**
| Token | Hex | Usage |
|---|---|---|
| `--data-series-1` | `#F0522A` | Primary data series |
| `--data-series-2` | `#C43828` | Secondary (deep red) |
| `--data-series-3` | `#F07A3A` | Tertiary (warm orange) |
| `--data-series-4` | `#D44E2E` | Fourth (mid-red) |
| `--data-series-5` | `#F09A50` | Fifth (soft amber) |

**Semantic:**
| Token | Hex | Usage |
|---|---|---|
| `--semantic-positive` | `#4EC49A` | Growth, success, up deltas |
| `--semantic-negative` | `#E24040` | Decline, error, down deltas |

**Interactive States:**
| Token | Value | Usage |
|---|---|---|
| `--hover-surface` | `rgba(255,255,255,0.04)` | Card hover, row hover, nav item hover |
| `--focus-ring` | `#F0522A` | Keyboard focus, 2px outline offset |

### Typography

Replace Geist with Inter (Google Fonts). Type scale:

| Role | Size/Weight | Token usage |
|---|---|---|
| Hero metrics | 28px / 700 | `--text-primary` |
| Page titles | 20px / 600 | `--text-primary` |
| Section headings | 16px / 600 | `--text-secondary` |
| Card titles | 14px / 600 | `--text-secondary` |
| Body text | 14px / 400 | `--text-body` |
| Labels / small | 12-13px / 400-500 | `--text-muted` |
| Sidebar group labels | 11px / 600 uppercase | `--text-label` |

### UI Component Rewrites

All `components/ui/*` rewritten to use new tokens:

- **Button**: red-orange primary, ghost variant hover uses `--hover-surface`, destructive uses `--semantic-negative`
- **Card**: `--surface-card` bg, `--border-primary` stroke, 12px radius
- **Input/Textarea**: `--surface-card` bg, `--border-subtle` stroke, `--text-primary` value, `--text-muted` placeholder, `--accent-primary` focus ring
- **Select**: same input styling + dropdown panel in `--surface-card` with `--border-primary`
- **Dialog**: `rgba(0,0,0,0.6)` backdrop, `--surface-card` panel, `--border-primary` stroke, 16px radius
- **Badge**: `--accent-muted` bg for default, `--surface-page` bg for secondary
- **Table**: `--surface-card` bg, `--border-subtle` row dividers, `--hover-surface` row hover
- **Switch**: `--border-primary` track off, `--accent-primary` track on
- **Tabs**: `--text-muted` inactive, `--text-primary` active with `--accent-primary` underline
- **Tooltip**: `--surface-chrome` bg, `--text-secondary` text, `--border-chrome` stroke
- **Skeleton**: `--surface-active` animated shimmer
- **Sheet**: slide-out drawer, `--surface-chrome` bg, `--border-primary` edge

### Design Rules

- `#FFFFFF` is never used as a text color — ceiling is `--text-primary` (`#F2F2F2`)
- No text color below `#606068`
- No gradients on surfaces (chart area fills are the sole exception)
- No cool-toned chart colors (blue, teal, purple)
- No additional accent colors beyond red-orange
- Orange/red-orange should not exceed 20-25% of any screen's visual area
- All neutrals carry a faint cool undertone (blue channel 2-4pts higher than R/G)
- Borders never more than two stops lighter than their background

---

## 2. App Shell

### Sidebar (`components/layout/sidebar.tsx`)

- Fixed left column, 240px wide, `--surface-chrome` bg
- Logo: "Q." with dot in `--accent-primary`, top-left
- Nav grouped into 3 sections with `--text-label` uppercase headers:
  - **Overview**: Dashboard
  - **Monitoring**: Prompts, Competitors
  - **Configuration**: Settings
- Active item: `--surface-active` bg, 2px left border in `--accent-primary`, `--text-primary` text
- Inactive items: `--text-muted`, hover gets `--hover-surface`
- Footer: user avatar (initials in `--text-body` on `--border-primary` bg circle), name in `--text-secondary`, email in `--text-label`
- Icons: Lucide, 18px per item

### Top Bar (`components/layout/top-bar.tsx`)

- `--surface-chrome` bg, `--border-chrome` bottom border, 56px height
- Left: page title (dynamic per route, `--text-primary` 16px/600) + search bar (`--surface-card` bg, `--border-primary` stroke, `--text-muted` placeholder)
- Right: date range selector pill (`--surface-card` bg, `--border-primary` stroke) + contextual primary CTA button

### Mobile Nav (`components/layout/mobile-nav.tsx`)

- Replaces current bottom tab bar with hamburger drawer
- Hamburger icon in top bar left side, visible below `md` breakpoint
- Slide-out drawer from left, 280px wide, animated
- Same nav structure as desktop sidebar
- Overlay backdrop: `rgba(0,0,0,0.5)`

### Org Layout (`app/(app)/[orgId]/layout.tsx`)

- Desktop: `grid-cols-[240px_1fr]`
- Mobile: single column, sidebar hidden, hamburger triggers drawer

---

## 3. Dashboard

**Route:** `app/(app)/[orgId]/page.tsx`

### Metric Cards Row

5 cards in responsive grid: `grid-cols-2` mobile → `grid-cols-3` tablet → `grid-cols-5` desktop

Each card structure:
- `--surface-card` bg, `--border-primary` stroke, 12px radius, 18px/20px padding
- Icon (Lucide, `--accent-primary`) + label (`--text-muted`, 12px)
- Value (`--text-primary`, 28px/700)
- Delta: arrow icon + value in `--semantic-positive` or `--semantic-negative` + period in `--text-label`

Metrics:
1. Visibility Score (Eye icon)
2. Mention Rate (MessageSquare icon)
3. Citation Rate (Link icon)
4. Share of Voice (Globe icon) — **new**
5. Total Runs (BarChart3 icon)

### Chart Panels

Reusable `ChartPanel` component: `--surface-card` bg, `--border-primary` stroke, 12px radius, 20px padding. Header: title in `--text-secondary` + period pill.

2-column grid + 1 full-width row:

1. **Visibility Score Trend** (top-left): Recharts `AreaChart`, `--accent-primary` stroke, area fill `--accent-wash` gradient, `--border-primary` grid lines, `--text-muted` axis labels
2. **Share of Voice** (top-right): Recharts `PieChart` donut variant, center label with brand %, legend alongside with colored dots. Uses data series colors based on competitor count
3. **Platform Breakdown** (bottom-left): Recharts `BarChart`, one bar per platform, data series colors, `--text-muted` labels
4. **Competitor Comparison** (bottom-right): Multi-line chart, your brand solid `--accent-primary`, competitors dashed in series 2-4, legend below
5. **Mention & Citation Trends** (full-width): Two-line chart spanning both columns, toggle pills in header

### Share of Voice — New Metric

**Definition:** The proportion of AI recommendations that each brand captures relative to competitors. Quantifies mention frequency relative to competitor mention frequency in the same domain.

**Computation** (`lib/metrics/`):
- For each prompt run, count mentions of your brand vs each competitor in the AI response
- Name matching: case-insensitive substring match against the org name, its `alternate_names`, and each competitor's name — reuses the same matching logic as the existing mention rate computation
- Aggregate across all runs in the selected period
- Calculate: `brand_mentions / (brand_mentions + sum(competitor_mentions))` per brand
- Return as percentage per brand, sorted descending

**Storage:** Computed alongside existing metrics in prompt_runs results.

**API:** Returned as part of dashboard metrics endpoint aggregation.

**Documentation:** Add to `docs/METRICS.md` with definition, formula, and interpretation guidance.

---

## 4. Prompts Pages

### Prompts List (`app/(app)/[orgId]/prompts/page.tsx`)

- Page header: "Prompts" + "+ New Prompt" red-orange CTA
- Filter bar: search input + platform dropdown + status pills (All / Active / Paused)
  - Active pill: `--accent-muted` bg, `--accent-primary` text
  - Inactive pill: `--border-chrome` stroke, `--text-muted` text
- Prompt cards in a vertical list (not table):
  - `--surface-card` bg, `--border-primary` stroke, 12px radius
  - Left: prompt text in `--text-secondary`, platform badges below (`--accent-muted` bg pills with platform icons)
  - Right: visibility score (large `--text-primary`), delta below, last run timestamp in `--text-muted`
  - Hover: `--hover-surface` overlay
  - Click → prompt detail

### New/Edit Prompt (`prompts/new/page.tsx`, `prompts/[promptId]/edit/page.tsx`)

- Single-column form, max-width 640px, centered
- Form card: `--surface-card` bg, sections separated by `--border-subtle`
- Fields: prompt text (textarea), platform multi-select, topic select, tags multi-select
- Input styling per foundation spec
- Actions: "Save" primary + "Cancel" ghost

### Prompt Detail (`prompts/[promptId]/page.tsx`) — Split View

- Header: prompt text in `--text-primary`, platform badges, topic/tag pills, edit (ghost) + "Run Now" (primary) buttons
- Split view — `grid-cols-[320px_1fr]` desktop, stacked mobile:
  - **Left panel**: scrollable run list — date (`--text-muted`), platform icon, score badge (color-coded), status dot
  - Active run: `--surface-active` bg, `--accent-primary` left border
  - **Right panel**: selected run detail — AI response via `react-markdown`, citations highlighted with `--accent-muted` bg inline, scoring breakdown mini-table, metadata footer in `--text-hint`

---

## 5. Competitors Page

**Route:** `app/(app)/[orgId]/competitors/page.tsx`

- Page header: "Competitors" + "+ Add Competitor" red-orange CTA
- Card grid: `grid-cols-1` mobile → `grid-cols-2` tablet → `grid-cols-3` desktop
- Each card: `--surface-card` bg, `--border-primary` stroke, 12px radius
  - Competitor name in `--text-secondary` 16px/600, website in `--text-muted`
  - Mini Share of Voice bar: horizontal, `--accent-primary` for your brand, series 2 for theirs, `--surface-page` bg track
  - Stats row: mention rate + citation rate in `--text-body`, deltas with semantic colors
  - Edit/delete ghost icon buttons top-right, visible on hover only
  - Hover: `--hover-surface` overlay

### Add/Edit Competitor Dialog

- Radix dialog, `rgba(0,0,0,0.6)` backdrop
- Panel: `--surface-card` bg, `--border-primary` stroke, 16px radius, max-width 480px
- Fields: name (required), website URL (optional), description textarea (optional)
- Actions: "Save" primary + "Cancel" ghost

---

## 6. Settings Page

**Route:** `app/(app)/[orgId]/settings/page.tsx` — Single scrollable page

- Page header: "Settings"
- Sections separated by `--border-subtle` dividers, 32px vertical spacing

### General
- "General" header in `--text-secondary` 16px/600
- Fields (max-width 640px): org name, website, description, alternate names, timezone select
- "Save Changes" primary button

### Scheduling
- "Scheduling" header + subtitle in `--text-muted`
- Frequency select, time slot, enabled/disabled switch
- Next run indicator: pill in `--surface-page` with `--text-muted`

### AI Platforms
- "AI Platforms" header
- Platform cards grid (`grid-cols-2` mobile, `grid-cols-3` desktop): icon + name + toggle switch
- Enabled: `--accent-subtle` bg tint, `--accent-primary` left border
- Disabled: `--surface-card` bg, `--text-muted` text, dimmed icon

### Topics
- "Topics" header + "+ Add Topic" ghost button
- Pill list: `--accent-muted` bg, `--text-body` text, "x" remove button
- Inline input to add

### Tags
- Same pattern as Topics

### Members
- "Members" header + "Invite Member" primary button
- Member rows: avatar (initials), name in `--text-secondary`, email in `--text-muted`, role badge ("Admin" in `--accent-muted` / "Member" in `--surface-page`), remove button (hover-visible ghost)
- Invite: inline expandable row — email + role select + "Send Invite" button

---

## 7. Auth Pages & Setup Flow

### Auth Layout (`app/(auth)/layout.tsx`)

- Full-screen `--surface-page` background
- Centered card: `--surface-card` bg, `--border-primary` stroke, 16px radius, max-width 400px
- Logo above card: "Q." with accent dot, centered
- Subtle ambient glow: `rgba(240,82,42,0.04)` radial gradient on page bg (not card)

### Login (`app/(auth)/login/page.tsx`)

- Title: "Welcome back" in `--text-primary` 20px/600
- Subtitle: "Sign in to your account" in `--text-muted`
- Fields: email, password
- "Sign in" full-width primary button
- Footer: "Contact your administrator for access" in `--text-hint`

### Signup (`app/(auth)/signup/page.tsx`)

- Title: "Create admin account"
- Subtitle: "Set up the first account for your organization" in `--text-muted`
- Fields: full name, email (pre-filled/disabled, `--text-muted`), password
- "Create account" full-width primary button
- Loading state: text swap + reduced opacity

### Set Password (`app/(auth)/set-password/page.tsx`)

- Title: "Set your password"
- Fields: password + confirm password
- Primary button

### Setup (`app/(app)/setup/page.tsx`)

- Centered card, max-width 560px (wider than auth)
- Title: "Set up your organization"
- Fields: org name, website, description, timezone
- "Continue" primary button → platform selection

### Platform Selection (`app/(app)/setup/platforms/page.tsx`)

- Title: "Select AI platforms to monitor"
- Platform card grid with toggles (same component as settings)
- "Complete Setup" primary button, disabled until at least one selected
- On completion: redirect to dashboard

### No Access (`app/(app)/no-access/page.tsx`)

- Centered card with lock icon (`--text-muted`), "No Access" title, explanation in `--text-body`

---

## 8. Shared Components

### Reusable across pages

- **ChartPanel**: card wrapper for all charts (title, period pill, content slot)
- **MetricCard**: metric display with icon, value, delta
- **DeltaIndicator**: arrow + value + period text, auto-colored by positive/negative
- **PlatformBadge**: small pill with platform icon and name
- **FilterPills**: toggle pill group for filtering (used in prompts list)
- **PageHeader**: title + optional CTA button + optional subtitle

### Existing components retained (restyled)

- **Logo** (`components/shared/logo.tsx`): updated to "Q." with accent dot
- **EmptyState** (`components/shared/empty-state.tsx`): restyled with new tokens
- **ConfirmDialog** (`components/shared/confirm-dialog.tsx`): restyled with new tokens

---

## 9. Technical Notes

- **Routing unchanged**: all file paths under `app/` remain the same
- **API layer unchanged**: all `app/api/` routes untouched
- **Data fetching unchanged**: Server Components for data, Client Components for interactivity
- **State management unchanged**: UserContext + OrgContext via React Context
- **Libraries retained**: Recharts (charts), Radix UI (primitives), Lucide (icons), Sonner (toasts), react-markdown, date-fns, clsx + tailwind-merge
- **Library changes**: Geist fonts removed, Inter added via Google Fonts
- **Sonner toasts**: restyle to match — `--surface-card` bg, `--border-primary` stroke, `--text-secondary` text
- **Tailwind v4**: continues using `@theme inline` for mapping CSS custom properties
