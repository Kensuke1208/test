# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Eigo — English pronunciation practice app for Japanese elementary school students (grades 5-6). Records pronunciation, evaluates via Speechace API, and provides phoneme-level feedback. Built with React + Supabase.

## Commands

```bash
# Frontend
npm run dev          # Vite dev server
npm run build        # TypeScript check + Vite build
npm run test         # vitest run
npm run test:watch   # vitest watch mode
npm run lint         # oxlint
npm run fmt          # oxfmt --write src/

# Supabase (local)
npx supabase start                                          # Start local Supabase
npx supabase db reset                                       # Apply schemas + migrations + seed
npx supabase test db                                        # Run pgTAP tests
npx supabase db diff -f <name>                              # Generate migration from schema changes
npx supabase functions serve --env-file supabase/.env.local # Serve Edge Functions locally
npx supabase db lint --local                                # Lint SQL functions
```

## Architecture

**Frontend**: React 19 + TypeScript 6 + Vite 8. SPA (no SSR). Tailwind CSS v4 via Vite plugin. React Router for routing, TanStack Query for server state, Zustand for client state (learner selection persisted to localStorage). Radix UI for accessible primitives.

**Backend**: Supabase (PostgreSQL 17 + Auth + Edge Functions). RLS enforces "account owner sees only their learners' data." `account_id` is denormalized in `attempts` for JOIN-free RLS.

**Edge Functions**: Hono framework on Deno. Each function has its own `deno.json` (not shared). Shared code in `supabase/functions/_shared/`. Currently one function: `score-pronunciation` (Speechace API proxy).

**Data flow**: Browser records audio → Edge Function → Speechace API → score + phonemes JSONB → stored in `attempts` → aggregated by views (`v_word_mastery`, `v_module_progress`, `v_learner_phoneme_stats`).

## Key Design Decisions

- **Netflix-style accounts**: Auth user = account. Learners are profiles under an account (kids don't have email). Table: `accounts` (1:1 auth.users) → `learners` (many per account).
- **Score as source of truth**: No `is_passed` column. Mastery derived dynamically from `score >= 80` in views. Threshold hardcoded in `supabase/schemas/22_practice_views.sql` and `src/lib/score.ts` (must be kept in sync).
- **JSONB phonemes**: Each attempt stores full Speechace phoneme data as JSONB (not normalized rows). Views aggregate by expanding JSONB.
- **Unlocked progression**: Learners can attempt any step (word/sentence) in any order. Mastery = all steps with best score >= 80.
- **`security_invoker`**: Views need manual migration for `security_invoker = true` (Supabase CLI bug [#3973](https://github.com/supabase/cli/issues/3973)). Schema files have it commented out; applied via separate migration.

## Conventions

- **Commit messages**: English only. Include why (motivation), not just what. Short bullet list. No file name lists.
- **Code comments**: Native English only (no Japanese in code).
- **UI text**: Japanese with grade-school kanji (教育漢字). No middle/high school kanji.
- **Specs**: `docs/specs/` organized by domain. Each domain has `database.md`, optional `edge-functions.md`, and `pages/` for frontend specs.
- **DB schemas**: Numbered files in `supabase/schemas/` (00_, 10_, 20_...). Each file contains table + indexes + RLS + triggers in one file per domain.
- **Tests**: pgTAP for database (`supabase/tests/database/`), vitest for frontend (`src/test/`).

## Environment Variables

- **`.env.local`** (frontend): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **`supabase/.env.local`** (Edge Functions): `SPEECHACE_API_KEY`, `SPEECHACE_API_URL`

## Current State

Phase 0 (specs + DB + foundation) complete. Phase 1 (core practice flow) in progress. See `docs/dev.md` for full roadmap. Auth is intentionally bypassed (`verify_jwt = false`, `/dev/practice` route) until Phase 2.
