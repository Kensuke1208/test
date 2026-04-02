/*
------------------------------------
---- practice/views.test.sql ----
------------------------------------
Tests for v_learner_phoneme_stats, v_word_mastery, and v_module_progress views.

Test targets:
  - v_learner_phoneme_stats: accuracy calculation, most_common_mistake
  - v_word_mastery: word_passed, all_sentences_passed, unattempted sentences
  - v_module_progress: mastered_words, is_completed, completed_at
  - RLS: views only show own account's data

Prerequisites:
  - 000-setup-tests-hooks.sql executed
  - identity + practice schemas applied

Run:
  supabase test db
*/

begin;

select plan(17);

-- ============================================
-- Setup: users, learners, content
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

-- module with 2 words (simplified from 10 for testing)
insert into public.modules (id, title, display_order)
values ('dd000000-0000-0000-0000-000000000001', 'Test Module', 1);

insert into public.words (id, module_id, text, meaning_ja, display_order) values
  ('ee000000-0000-0000-0000-000000000001', 'dd000000-0000-0000-0000-000000000001', 'apple', 'りんご', 1),
  ('ee000000-0000-0000-0000-000000000002', 'dd000000-0000-0000-0000-000000000001', 'river', '川', 2);

-- apple has 2 sentences, river has 1
insert into public.sentences (id, word_id, text, meaning_ja, display_order) values
  ('ff000000-0000-0000-0000-000000000001', 'ee000000-0000-0000-0000-000000000001', 'I eat an apple.', 'りんごを食べます。', 1),
  ('ff000000-0000-0000-0000-000000000002', 'ee000000-0000-0000-0000-000000000001', 'This apple is red.', 'このりんごは赤いです。', 2),
  ('ff000000-0000-0000-0000-000000000003', 'ee000000-0000-0000-0000-000000000002', 'The river is long.', 'その川は長いです。', 1);

-- ============================================
-- Setup: attempts for Taro (user1's learner)
-- ============================================

-- apple: word practice passed
insert into public.attempts (learner_id, word_id, target_type, score, is_passed, phonemes) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000001', 'word', 85, true,
   '[{"word":"apple","phone":"ae","quality_score":90,"sound_most_like":"ae","is_correct":true},
     {"word":"apple","phone":"p","quality_score":85,"sound_most_like":"p","is_correct":true},
     {"word":"apple","phone":"l","quality_score":40,"sound_most_like":"r","is_correct":false}]'::jsonb);

-- apple: sentence 1 passed
insert into public.attempts (learner_id, word_id, sentence_id, target_type, score, target_word_score, is_passed, phonemes) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000001', 'sentence', 80, 85, true,
   '[{"word":"apple","phone":"ae","quality_score":85,"sound_most_like":"ae","is_correct":true}]'::jsonb);

-- apple: sentence 2 NOT attempted (should make all_sentences_passed = false)

-- river: word practice passed
insert into public.attempts (learner_id, word_id, target_type, score, is_passed, phonemes) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000002', 'word', 90, true,
   '[{"word":"river","phone":"r","quality_score":50,"sound_most_like":"l","is_correct":false},
     {"word":"river","phone":"r","quality_score":45,"sound_most_like":"l","is_correct":false}]'::jsonb);

-- river: sentence 1 passed
insert into public.attempts (learner_id, word_id, sentence_id, target_type, score, target_word_score, is_passed, phonemes) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000002', 'ff000000-0000-0000-0000-000000000003', 'sentence', 82, 88, true,
   '[{"word":"river","phone":"r","quality_score":80,"sound_most_like":"r","is_correct":true}]'::jsonb);

-- ============================================
-- v_learner_phoneme_stats tests
-- ============================================

-- Test 1: phoneme stats exist for Taro
select ok(
  (select count(*) > 0 from public.v_learner_phoneme_stats where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'phoneme stats exist for learner'
);

-- Test 2: 'l' phoneme has 1 total, 0 correct, 1 error
select is(
  (select error_count from public.v_learner_phoneme_stats
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and phone = 'l'),
  1,
  'l phoneme has 1 error'
);

-- Test 3: 'l' phoneme most_common_mistake is 'r'
select is(
  (select most_common_mistake from public.v_learner_phoneme_stats
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and phone = 'l'),
  'r',
  'l phoneme most_common_mistake is r'
);

-- Test 4: 'r' phoneme has errors (from river attempts)
select ok(
  (select error_count > 0 from public.v_learner_phoneme_stats
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and phone = 'r'),
  'r phoneme has errors'
);

-- Test 5: accuracy is calculated correctly for 'ae' (all correct)
select is(
  (select accuracy from public.v_learner_phoneme_stats
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and phone = 'ae'),
  1.00::numeric,
  'ae phoneme accuracy is 1.00 (all correct)'
);

-- ============================================
-- v_word_mastery tests
-- ============================================

-- Test 6: apple word_passed is true
select is(
  (select word_passed from public.v_word_mastery
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and word_id = 'ee000000-0000-0000-0000-000000000001'),
  true,
  'apple word_passed is true'
);

-- Test 7: apple all_sentences_passed is false (sentence 2 unattempted)
select is(
  (select all_sentences_passed from public.v_word_mastery
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and word_id = 'ee000000-0000-0000-0000-000000000001'),
  false,
  'apple all_sentences_passed is false (sentence 2 unattempted)'
);

-- Test 8: apple is_mastered is false (not all sentences passed)
select is(
  (select is_mastered from public.v_word_mastery
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and word_id = 'ee000000-0000-0000-0000-000000000001'),
  false,
  'apple is_mastered is false'
);

-- Test 9: river is_mastered is true (word + all sentences passed)
select is(
  (select is_mastered from public.v_word_mastery
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and word_id = 'ee000000-0000-0000-0000-000000000002'),
  true,
  'river is_mastered is true'
);

-- ============================================
-- v_module_progress tests
-- ============================================

-- Test 10: mastered_words is 1 (river only, apple not yet)
select is(
  (select mastered_words from public.v_module_progress
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and module_id = 'dd000000-0000-0000-0000-000000000001'),
  1,
  'mastered_words is 1 (river only)'
);

-- Test 11: is_completed is false (1/2 words mastered)
select is(
  (select is_completed from public.v_module_progress
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and module_id = 'dd000000-0000-0000-0000-000000000001'),
  false,
  'is_completed is false (1/2 words mastered)'
);

-- Complete apple by passing sentence 2
insert into public.attempts (learner_id, word_id, sentence_id, target_type, score, target_word_score, is_passed, phonemes) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000002', 'sentence', 85, 90, true,
   '[{"word":"apple","phone":"ae","quality_score":90,"sound_most_like":"ae","is_correct":true}]'::jsonb);

-- Test 12: apple is now mastered (all sentences passed)
select is(
  (select is_mastered from public.v_word_mastery
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and word_id = 'ee000000-0000-0000-0000-000000000001'),
  true,
  'apple is_mastered after completing sentence 2'
);

-- Test 13: module is now completed (2/2 words mastered)
select is(
  (select is_completed from public.v_module_progress
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and module_id = 'dd000000-0000-0000-0000-000000000001'),
  true,
  'module is_completed when all words mastered'
);

-- ============================================
-- RLS tests: views respect account boundary
-- ============================================

-- Test 16: user1 can see own data via v_word_mastery
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select ok(
  (select count(*) > 0 from public.v_word_mastery),
  'user1 can see own learner data via v_word_mastery'
);

reset role;

-- Test 17: user2 cannot see user1 data via v_word_mastery
set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.v_word_mastery where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'user2 cannot see user1 learner data via v_word_mastery'
);

reset role;

-- Test 18: user2 cannot see user1 data via v_learner_phoneme_stats
set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.v_learner_phoneme_stats where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'user2 cannot see user1 data via v_learner_phoneme_stats'
);

reset role;

-- Test 19: user2 cannot see user1 data via v_module_progress
set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.v_module_progress where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'user2 cannot see user1 data via v_module_progress'
);

reset role;

select * from finish();
rollback;
