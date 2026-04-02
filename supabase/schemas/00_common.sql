-- ============================================
-- Common: Internal Schema & Shared Functions
-- ============================================
-- 1. Internal schema
-- 2. internal.handle_updated_at()

-- ============================================
-- 1. Internal schema
-- ============================================
-- Schema for internal functions not exposed via the API

create schema if not exists internal;

comment on schema internal is 'Internal functions not exposed to API';

-- ============================================
-- 2. Shared functions
-- ============================================

-- internal.handle_updated_at: Auto-update updated_at on row modification
create or replace function internal.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

comment on function internal.handle_updated_at() is 'Auto-update updated_at column on row update';
