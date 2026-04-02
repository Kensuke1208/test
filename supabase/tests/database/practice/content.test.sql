/*
------------------------------------
---- practice/content.test.sql ----
------------------------------------
Tests for modules, words, and sentences tables.

Test targets:
  - RLS: authenticated can SELECT, cannot INSERT/UPDATE/DELETE
  - RLS: anonymous cannot SELECT
  - words UNIQUE constraint (module_id + text)
  - FK integrity (words → modules, sentences → words)

Prerequisites:
  - 000-setup-tests-hooks.sql executed
  - identity + practice schemas applied

Run:
  supabase test db
*/

begin;

select plan(10);

-- ============================================
-- Setup
-- ============================================

-- Create auth user for RLS testing
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '11111111-1111-1111-1111-111111111111',
  'user@test.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"display_name": "Test User"}'::jsonb,
  now(), now()
);

-- Seed content (as superuser, bypassing RLS)
insert into public.modules (id, title, display_order)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Module', 1);

insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'apple', 'りんご', 1);

insert into public.sentences (id, word_id, text, meaning_ja, display_order)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'I eat an apple.', 'りんごを食べます。', 1);

-- ============================================
-- RLS: authenticated can SELECT
-- ============================================

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- Test 1: can read the test module
select is(
  (select title from public.modules where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Test Module',
  'authenticated user can read modules'
);

-- Test 2: can read the test module specifically
select is(
  (select count(*)::int from public.modules where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'authenticated user can read specific module'
);

-- Test 3: can read sentences for test word
select is(
  (select count(*)::int from public.sentences where word_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  1,
  'authenticated user can read sentences'
);

reset role;

-- ============================================
-- RLS: anonymous cannot SELECT
-- ============================================

set local role anon;

-- Test 4: anonymous cannot read modules
select is(
  (select count(*)::int from public.modules),
  0,
  'anonymous user cannot read modules'
);

-- Test 5: anonymous cannot read words
select is(
  (select count(*)::int from public.words),
  0,
  'anonymous user cannot read words'
);

-- Test 6: anonymous cannot read sentences
select is(
  (select count(*)::int from public.sentences),
  0,
  'anonymous user cannot read sentences'
);

reset role;

-- ============================================
-- RLS: authenticated cannot INSERT
-- ============================================

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- Test 7: cannot insert modules
select throws_ok(
  $$insert into public.modules (title, display_order) values ('Hacked Module', 99)$$,
  '42501',
  null,
  'authenticated user cannot insert modules'
);

-- Test 8: cannot insert words
select throws_ok(
  $$insert into public.words (module_id, text, meaning_ja, display_order) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'hack', 'ハック', 99)$$,
  '42501',
  null,
  'authenticated user cannot insert words'
);

reset role;

-- ============================================
-- UNIQUE constraint: words (module_id + text)
-- ============================================

-- Test 9: cannot insert duplicate word in same module
select throws_ok(
  $$insert into public.words (module_id, text, meaning_ja, display_order) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'apple', 'リンゴ', 2)$$,
  '23505',
  null,
  'cannot insert duplicate word in same module'
);

-- ============================================
-- FK integrity: cascade delete
-- ============================================

-- Test 10: deleting module cascades to words and sentences
delete from public.modules where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select is(
  (select count(*)::int from public.words where module_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'deleting module cascades to words'
);

select * from finish();
rollback;
