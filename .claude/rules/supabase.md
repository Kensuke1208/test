---
paths:
  - "supabase/**"
---

# Supabase Workflow

## Schema Changes

1. Edit the schema file in `supabase/schemas/`
2. Run `npx supabase db reset` to apply
3. Run `npx supabase db diff -f <descriptive_name>` to generate migration
4. Run `npx supabase test db` to verify

## security_invoker on Views

Supabase CLI does not capture `security_invoker` in `db diff` ([#3973](https://github.com/supabase/cli/issues/3973)).

- In schema files: comment out `alter view ... set (security_invoker = true)` with a note
- Create a separate manual migration: `npx supabase migration new <name>_set_views_invoker`
- Write the `alter view` statements in the manual migration file

## Migration Naming

- Domain-scoped: `<domain>_init` (e.g., `identity_init`, `practice_init`)
- Fixes: `<domain>_<description>` (e.g., `practice_set_views_invoker`)
- Do not hand-edit auto-generated migrations

## Threshold Sync

Pass threshold (80) is hardcoded in two places that must stay in sync:
- `supabase/schemas/22_practice_views.sql` (SQL view)
- `src/lib/score.ts` (frontend constant `PASS_THRESHOLD`)
