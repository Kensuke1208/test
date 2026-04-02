/*
------------------------------------
---- practice/attempts.test.sql ----
------------------------------------
Tests for attempts table.

Test targets:
  - RLS: account owner can see own learners' attempts
  - RLS: cannot see other accounts' learners' attempts
  - RLS: authenticated cannot INSERT directly (service_role only)
  - CHECK constraints (target_type, sentence_id, target_word_score)
  - phonemes JSONB storage and retrieval

Prerequisites:
  - 000-setup-tests-hooks.sql executed
  - identity + practice schemas applied

Run:
  supabase test db
*/

begin;

select plan(11);

-- ============================================
-- Setup: users, learners, content, attempts
-- ============================================

-- user1
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '11111111-1111-1111-1111-111111111111',
  'user1@test.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"display_name": "User 1"}'::jsonb,
  now(), now()
);

-- user2
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '22222222-2222-2222-2222-222222222222',
  'user2@test.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"display_name": "User 2"}'::jsonb,
  now(), now()
);

-- learners
insert into public.learners (id, account_id, display_name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Taro'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Jiro');

-- content
insert into public.modules (id, title, display_order)
values ('dd000000-0000-0000-0000-000000000001', 'Test Module', 1);

insert into public.words (id, module_id, text, meaning_ja, display_order)
values ('ee000000-0000-0000-0000-000000000001', 'dd000000-0000-0000-0000-000000000001', 'apple', 'りんご', 1);

insert into public.sentences (id, word_id, text, meaning_ja, display_order)
values ('ff000000-0000-0000-0000-000000000001', 'ee000000-0000-0000-0000-000000000001', 'I eat an apple.', 'りんごを食べます。', 1);

-- attempts (inserted as superuser, simulating service_role)
insert into public.attempts (id, account_id, learner_id, word_id, target_type, score, is_passed, phonemes) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000001', 'word', 85, true,
   '[{"word": "apple", "phone": "ae", "quality_score": 90, "sound_most_like": "ae", "is_correct": true}]'::jsonb);

insert into public.attempts (id, account_id, learner_id, word_id, target_type, score, is_passed, phonemes) values
  ('a0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ee000000-0000-0000-0000-000000000001', 'word', 60, false,
   '[{"word": "apple", "phone": "ae", "quality_score": 60, "sound_most_like": "ah", "is_correct": false}]'::jsonb);

-- ============================================
-- RLS tests
-- ============================================

-- Test 1: user1 can see own learner's attempts
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select is(
  (select count(*)::int from public.attempts),
  1,
  'user can see own learners attempts'
);

reset role;

-- Test 2: user1 cannot see user2's learner's attempts
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select is(
  (select count(*)::int from public.attempts where learner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'user cannot see other accounts learner attempts'
);

reset role;

-- Test 3: anonymous cannot see attempts
set local role anon;

select is(
  (select count(*)::int from public.attempts),
  0,
  'anonymous user cannot see attempts'
);

reset role;

-- Test 4: authenticated user cannot INSERT attempts directly
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select throws_ok(
  $$insert into public.attempts (account_id, learner_id, word_id, target_type, score, is_passed, phonemes)
    values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000001', 'word', 90, true, '[]'::jsonb)$$,
  '42501',
  null,
  'authenticated user cannot INSERT attempts directly'
);

reset role;

-- ============================================
-- CHECK constraint tests
-- ============================================

-- Test 5: target_type must be 'word' or 'sentence'
select throws_ok(
  $$insert into public.attempts (account_id, learner_id, word_id, target_type, score, is_passed, phonemes)
    values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000001', 'invalid', 80, true, '[]'::jsonb)$$,
  '23514',
  null,
  'target_type must be word or sentence'
);

-- Test 6: sentence practice requires sentence_id
select throws_ok(
  $$insert into public.attempts (account_id, learner_id, word_id, target_type, score, is_passed, phonemes)
    values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000001', 'sentence', 80, true, '[]'::jsonb)$$,
  '23514',
  null,
  'sentence practice requires sentence_id'
);

-- Test 7: word practice must not have target_word_score
select throws_ok(
  $$insert into public.attempts (account_id, learner_id, word_id, target_type, score, target_word_score, is_passed, phonemes)
    values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000001', 'word', 80, 85, true, '[]'::jsonb)$$,
  '23514',
  null,
  'word practice must not have target_word_score'
);

-- Test 8: valid sentence practice with sentence_id and target_word_score
select lives_ok(
  $$insert into public.attempts (account_id, learner_id, word_id, sentence_id, target_type, score, target_word_score, is_passed, phonemes)
    values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000001', 'sentence', 80, 85, true, '[]'::jsonb)$$,
  'valid sentence practice with sentence_id and target_word_score'
);

-- ============================================
-- phonemes JSONB tests
-- ============================================

-- Test 9: phonemes JSONB is stored and retrievable
select is(
  (select (phonemes->0->>'phone') from public.attempts where id = 'a0000000-0000-0000-0000-000000000001'),
  'ae',
  'phonemes JSONB is stored and retrievable'
);

-- Test 10: phonemes JSONB preserves word field
select is(
  (select (phonemes->0->>'word') from public.attempts where id = 'a0000000-0000-0000-0000-000000000001'),
  'apple',
  'phonemes JSONB preserves word field'
);

-- Test 11: phonemes JSONB preserves is_correct boolean
select is(
  (select (phonemes->0->>'is_correct')::boolean from public.attempts where id = 'a0000000-0000-0000-0000-000000000001'),
  true,
  'phonemes JSONB preserves is_correct field'
);

select * from finish();
rollback;
