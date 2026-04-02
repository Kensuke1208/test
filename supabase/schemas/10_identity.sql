-- ============================================
-- Identity Domain: Accounts & Learners
-- ============================================
-- 1. accounts table
-- 2. learners table
-- 3. Indexes
-- 4. Trigger function: internal.handle_new_user()
-- 5. RLS policies
-- 6. Triggers

-- ============================================
-- 1. accounts table
-- ============================================
-- 1:1 with auth.users. Stores account-level info (display name, future billing).

create table public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.accounts is 'User accounts, synced from auth.users on signup';
comment on column public.accounts.display_name is 'Account display name (set on signup, user-editable)';

-- ============================================
-- 2. learners table
-- ============================================
-- Netflix-style profiles under an account. Each learner has separate practice history.

create table public.learners (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learners_unique_name unique (account_id, display_name)
);

comment on table public.learners is 'Learner profiles within an account (Netflix model)';
comment on column public.learners.account_id is 'Owning account (FK to accounts.id)';
comment on column public.learners.display_name is 'Learner display name, unique within account';

-- ============================================
-- 3. Indexes
-- ============================================

create index learners_account_id_idx
  on public.learners (account_id);

-- ============================================
-- 4. Trigger function: internal.handle_new_user()
-- ============================================
-- Auto-create an accounts row when a new auth.users row is inserted.

create or replace function internal.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
begin
  v_display_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'name',
    ''
  )), '');

  insert into public.accounts (id, display_name, created_at)
  values (
    new.id,
    coalesce(v_display_name, 'User'),
    new.created_at
  );

  return new;
end;
$$;

comment on function internal.handle_new_user() is 'Create accounts row on auth.users insert';

-- ============================================
-- 5. RLS policies
-- ============================================

alter table public.accounts enable row level security;
alter table public.learners enable row level security;

-- accounts: owner can read their own account
create policy accounts_select_own on public.accounts
  for select to authenticated
  using (id = auth.uid());

-- accounts: owner can update their own display_name
create policy accounts_update_own on public.accounts
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- learners: owner can read their own learners
create policy learners_select_own on public.learners
  for select to authenticated
  using (account_id = auth.uid());

-- learners: owner can create learners under their account
create policy learners_insert_own on public.learners
  for insert to authenticated
  with check (account_id = auth.uid());

-- learners: owner can update their own learners
create policy learners_update_own on public.learners
  for update to authenticated
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

-- ============================================
-- 6. Triggers
-- ============================================

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function internal.handle_new_user();

create trigger on_accounts_update
  before update on public.accounts
  for each row
  execute function internal.handle_updated_at();

create trigger on_learners_update
  before update on public.learners
  for each row
  execute function internal.handle_updated_at();
