# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BidLevel is an AI-powered SaaS tool that helps construction general contractors compare subcontractor bids. It automates bid leveling by extracting scope items from documents (PDF, Excel, Word), normalizing data across bids, identifying scope gaps, and generating recommendations using GPT-4o.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Architecture

**Tech Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Shadcn/ui, Supabase (auth + PostgreSQL), OpenAI GPT-4o

**Path Alias**: `@/*` maps to `./src/*`

### Directory Structure

- `/src/app/api/` - API routes (auth, document upload, analysis, PDF export)
- `/src/app/(auth)/` - Auth pages (login, callback) - public routes
- `/src/app/(dashboard)/` - Protected routes (dashboard, compare wizard, settings)
- `/src/components/ui/` - Shadcn/ui primitives
- `/src/components/` - Feature components organized by domain (auth, dashboard, compare, settings, landing)
- `/src/lib/ai/` - AI integration (analyzer, OpenAI client, document processors, prompts)
- `/src/lib/supabase/` - Supabase clients (browser, server, middleware)
- `/src/lib/utils/` - Constants, encryption (AES-256-GCM), formatting helpers
- `/src/types/` - TypeScript domain types
- `/supabase/schema.sql` - Database schema with RLS policies

### Key Patterns

**AI Analysis Pipeline** (three-step process in `/lib/ai/`):
1. Extract scope items from each document (`prompts/extraction.ts`)
2. Normalize items across bids, identify gaps (`prompts/normalization.ts`)
3. Generate recommendation with confidence scores (`prompts/recommendation.ts`)

**Authentication**: Magic link via Supabase Auth. Middleware (`src/middleware.ts`) protects `/dashboard/*`, `/compare/*`, `/settings/*` routes.

**API Route Pattern**: Always verify auth with `supabase.auth.getUser()`, then verify resource ownership via user_id before operations.

**API Key Management**: Users can provide their own OpenAI key (stored encrypted) or use app's key during 30-day trial.

### Database Tables (Supabase)

- `profiles` - User data, trial tracking, encrypted API keys
- `projects` - Bid comparison projects with status enum
- `bid_documents` - Uploaded files with processing status
- `extracted_items` - Normalized scope items with confidence scores
- `comparison_results` - Final analysis with recommendations

All tables have RLS policies enforcing user-only access.

### Important Constants (`/lib/utils/constants.ts`)

```typescript
TRIAL_DURATION_DAYS = 30
MAX_FILE_SIZE = 25MB
MIN_BIDS = 2, MAX_BIDS = 5
OPENAI_MODEL = 'gpt-4o'
CONFIDENCE_THRESHOLD_LOW = 0.6
CONFIDENCE_THRESHOLD_MEDIUM = 0.8
```

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `ENCRYPTION_SECRET` (32-byte hex for API key encryption)
