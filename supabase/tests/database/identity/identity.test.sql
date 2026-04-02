/*
------------------------------------
---- identity/identity.test.sql ----
------------------------------------
Tests for accounts and learners tables.

Test targets:
  - on_auth_user_created trigger (auto-creates accounts row)
  - accounts RLS (SELECT/UPDATE: own account only)
  - learners RLS (SELECT/INSERT/UPDATE: own learners only)
  - learners UNIQUE constraint (display_name per account)

Prerequisites:
  - 000-setup-tests-hooks.sql executed
  - identity schema applied

Run:
  supabase test db
*/

begin;

select plan(17);

-- ============================================
-- Setup: Create test users via auth.users
-- ============================================

-- user1: primary test account
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '11111111-1111-1111-1111-111111111111',
  'user1@test.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"display_name": "Test User 1"}'::jsonb,
  now(), now()
);

-- user2: separate account
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '22222222-2222-2222-2222-222222222222',
  'user2@test.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"display_name": "Test User 2"}'::jsonb,
  now(), now()
);

-- ============================================
-- on_auth_user_created trigger tests
-- ============================================

-- Test 1: accounts row is auto-created when auth.users row is inserted
select is(
  (select count(*)::int from public.accounts where id = '11111111-1111-1111-1111-111111111111'),
  1,
  'accounts row auto-created on auth.users insert'
);

-- Test 2: display_name is set from auth metadata
select is(
  (select display_name from public.accounts where id = '11111111-1111-1111-1111-111111111111'),
  'Test User 1',
  'display_name set from auth metadata'
);

-- ============================================
-- accounts RLS tests
-- ============================================

-- Test 3: authenticated user can see own account
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select is(
  (select count(*)::int from public.accounts),
  1,
  'authenticated user can see own account'
);

reset role;

-- Test 4: authenticated user cannot see other accounts
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select is(
  (select count(*)::int from public.accounts where id = '22222222-2222-2222-2222-222222222222'),
  0,
  'authenticated user cannot see other accounts'
);

reset role;

-- Test 5: user cannot update other accounts (0 rows affected)
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

update public.accounts set display_name = 'Hacked' where id = '22222222-2222-2222-2222-222222222222';

reset role;

select is(
  (select display_name from public.accounts where id = '22222222-2222-2222-2222-222222222222'),
  'Test User 2',
  'user cannot update other accounts'
);

-- Test 6: anonymous user cannot see any accounts
set local role anon;

select is(
  (select count(*)::int from public.accounts),
  0,
  'anonymous user cannot see any accounts'
);

reset role;

-- Test 6: user can update own display_name
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select lives_ok(
  $$update public.accounts set display_name = 'Updated Name' where id = '11111111-1111-1111-1111-111111111111'$$,
  'user can update own display_name'
);

reset role;

-- ============================================
-- learners RLS tests
-- ============================================

-- Setup: create learners for user1
insert into public.learners (id, account_id, display_name)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Taro'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Hanako');

-- Setup: create learner for user2
insert into public.learners (id, account_id, display_name)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Jiro');

-- Test 7: user can see own learners
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select is(
  (select count(*)::int from public.learners),
  2,
  'user can see own learners'
);

reset role;

-- Test 8: user cannot see other users learners
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select is(
  (select count(*)::int from public.learners where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  0,
  'user cannot see other users learners'
);

reset role;

-- Test 9: user can create a learner under own account
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select lives_ok(
  $$insert into public.learners (account_id, display_name) values ('11111111-1111-1111-1111-111111111111', 'Saburo')$$,
  'user can create learner under own account'
);

reset role;

-- Test 10: user cannot create a learner under another account
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select throws_ok(
  $$insert into public.learners (account_id, display_name) values ('22222222-2222-2222-2222-222222222222', 'Intruder')$$,
  '42501',
  null,
  'user cannot create learner under another account'
);

reset role;

-- Test 11: user can update own learners display_name
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select lives_ok(
  $$update public.learners set display_name = 'Taro Updated' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'user can update own learners display_name'
);

reset role;

-- Test 12: user cannot update other users learners (row not visible via RLS)
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- Attempt update — RLS hides the row, so 0 rows affected
update public.learners set display_name = 'Hacked' where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

reset role;

-- Verify as superuser that the name was not changed
select is(
  (select display_name from public.learners where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  'Jiro',
  'user cannot update other users learners'
);

-- Test 13: anonymous user cannot see any learners
set local role anon;

select is(
  (select count(*)::int from public.learners),
  0,
  'anonymous user cannot see any learners'
);

reset role;

-- ============================================
-- learners UNIQUE constraint tests
-- ============================================

-- Test 14: cannot create duplicate learner name within same account
select throws_ok(
  $$insert into public.learners (account_id, display_name) values ('11111111-1111-1111-1111-111111111111', 'Hanako')$$,
  '23505',
  null,
  'cannot create duplicate learner name within same account'
);

-- Test 15: can create same learner name under different account
select lives_ok(
  $$insert into public.learners (account_id, display_name) values ('22222222-2222-2222-2222-222222222222', 'Taro')$$,
  'can create same learner name under different account'
);

-- ============================================
-- on_auth_user_created trigger: fallback display_name
-- ============================================

-- Test 16: display_name falls back to 'User' when metadata is empty
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '33333333-3333-3333-3333-333333333333',
  'noname@test.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{}'::jsonb,
  now(), now()
);

select is(
  (select display_name from public.accounts where id = '33333333-3333-3333-3333-333333333333'),
  'User',
  'display_name falls back to User when metadata is empty'
);

select * from finish();
rollback;
