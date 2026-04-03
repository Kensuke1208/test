/*
------------------------------------
---- practice/views.test.sql ----
------------------------------------
Tests for v_learner_phoneme_stats, v_word_mastery, and v_module_progress views.

Test targets:
  - v_learner_phoneme_stats: accuracy calculation, most_common_mistake
  - v_word_mastery: score (min of step bests), steps_total, steps_cleared, mastered
  - v_module_progress: mastered_words, completed
  - RLS: views only show own account's data

Prerequisites:
  - 000-setup-tests-hooks.sql executed
  - identity + practice schemas applied

Run:
  supabase test db
*/

begin;

select plan(20);

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

-- module with 2 words
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

-- apple: word practice score 85
insert into public.attempts (account_id, learner_id, word_id, target_type, score, phonemes) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000001', 'word', 85,
   '[{"word":"apple","phone":"ae","quality_score":90,"sound_most_like":"ae","is_correct":true},
     {"word":"apple","phone":"p","quality_score":85,"sound_most_like":"p","is_correct":true},
     {"word":"apple","phone":"l","quality_score":40,"sound_most_like":"r","is_correct":false}]'::jsonb);

-- apple: sentence 1 score 80
insert into public.attempts (account_id, learner_id, word_id, sentence_id, target_type, score, target_word_score, phonemes) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000001', 'sentence', 80, 85,
   '[{"word":"apple","phone":"ae","quality_score":85,"sound_most_like":"ae","is_correct":true}]'::jsonb);

-- apple: sentence 2 NOT attempted (contributes 0 to score)

-- river: word practice score 90
insert into public.attempts (account_id, learner_id, word_id, target_type, score, phonemes) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000002', 'word', 90,
   '[{"word":"river","phone":"r","quality_score":50,"sound_most_like":"l","is_correct":false},
     {"word":"river","phone":"r","quality_score":45,"sound_most_like":"l","is_correct":false}]'::jsonb);

-- river: sentence 1 score 82
insert into public.attempts (account_id, learner_id, word_id, sentence_id, target_type, score, target_word_score, phonemes) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000002', 'ff000000-0000-0000-0000-000000000003', 'sentence', 82, 88,
   '[{"word":"river","phone":"r","quality_score":80,"sound_most_like":"r","is_correct":true}]'::jsonb);

-- ============================================
-- v_learner_phoneme_stats tests
-- ============================================

-- Test 1: phoneme stats exist for Taro
select ok(
  (select count(*) > 0 from public.v_learner_phoneme_stats where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'phoneme stats exist for learner'
);

-- Test 2: 'l' phoneme has 1 error
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

-- Test 4: 'ae' phoneme accuracy is 1.00 (all correct)
select is(
  (select accuracy from public.v_learner_phoneme_stats
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and phone = 'ae'),
  1.00::numeric,
  'ae phoneme accuracy is 1.00 (all correct)'
);

-- ============================================
-- v_word_mastery tests
-- ============================================

-- Test 5: apple score is 0 (sentence 2 unattempted → min is 0)
select is(
  (select score from public.v_word_mastery
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and word_id = 'ee000000-0000-0000-0000-000000000001'),
  0,
  'apple score is 0 (unattempted sentence drags min to 0)'
);

-- Test 6: apple steps_total is 3 (word + 2 sentences)
select is(
  (select steps_total from public.v_word_mastery
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and word_id = 'ee000000-0000-0000-0000-000000000001'),
  3,
  'apple steps_total is 3 (word + 2 sentences)'
);

-- Test 7: apple steps_cleared is 2 (word 85 + sentence1 80, sentence2 unattempted)
select is(
  (select steps_cleared from public.v_word_mastery
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and word_id = 'ee000000-0000-0000-0000-000000000001'),
  2,
  'apple steps_cleared is 2 (word + sentence1 cleared, sentence2 not)'
);

-- Test 8: apple is not mastered (sentence 2 unattempted)
select is(
  (select mastered from public.v_word_mastery
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and word_id = 'ee000000-0000-0000-0000-000000000001'),
  false,
  'apple not mastered (unattempted sentence)'
);

-- Test 9: river score is 82 (MIN of word 90, sentence 82)
select is(
  (select score from public.v_word_mastery
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and word_id = 'ee000000-0000-0000-0000-000000000002'),
  82,
  'river score is 82 (min of 90 and 82)'
);

-- Test 10: river is mastered (all steps >= 80)
select is(
  (select mastered from public.v_word_mastery
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and word_id = 'ee000000-0000-0000-0000-000000000002'),
  true,
  'river is mastered (all steps >= 80)'
);

-- Complete apple sentence 2 with score 85
insert into public.attempts (account_id, learner_id, word_id, sentence_id, target_type, score, target_word_score, phonemes) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ee000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000002', 'sentence', 85, 90,
   '[{"word":"apple","phone":"ae","quality_score":90,"sound_most_like":"ae","is_correct":true}]'::jsonb);

-- Test 11: apple is now mastered (all steps cleared)
select is(
  (select mastered from public.v_word_mastery
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and word_id = 'ee000000-0000-0000-0000-000000000001'),
  true,
  'apple mastered after completing sentence 2'
);

-- Test 12: apple score is now 80 (min of 85, 80, 85)
select is(
  (select score from public.v_word_mastery
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and word_id = 'ee000000-0000-0000-0000-000000000001'),
  80,
  'apple score is 80 (min of word 85, sentence1 80, sentence2 85)'
);

-- ============================================
-- v_word_mastery: sentence-only attempt (unlocked progression)
-- ============================================

-- Insert a sentence-only attempt for Jiro (no word practice)
insert into public.attempts (account_id, learner_id, word_id, sentence_id, target_type, score, target_word_score, phonemes) values
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ee000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000001', 'sentence', 90, 92,
   '[{"word":"apple","phone":"ae","quality_score":90,"sound_most_like":"ae","is_correct":true}]'::jsonb);

-- Test 13: sentence-only attempt creates a v_word_mastery row
select ok(
  (select count(*) > 0 from public.v_word_mastery
   where learner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and word_id = 'ee000000-0000-0000-0000-000000000001'),
  'sentence-only attempt creates v_word_mastery row'
);

-- Test 14: sentence-only is not mastered (word step is 0)
select is(
  (select mastered from public.v_word_mastery
   where learner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and word_id = 'ee000000-0000-0000-0000-000000000001'),
  false,
  'sentence-only attempt: not mastered (word step = 0)'
);

-- ============================================
-- v_module_progress tests
-- ============================================

-- Test 15: mastered_words is 2 (apple + river both mastered for Taro)
select is(
  (select mastered_words from public.v_module_progress
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and module_id = 'dd000000-0000-0000-0000-000000000001'),
  2,
  'mastered_words is 2 (apple + river mastered)'
);

-- Test 16: module is completed
select is(
  (select completed from public.v_module_progress
   where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and module_id = 'dd000000-0000-0000-0000-000000000001'),
  true,
  'module completed (all words mastered)'
);

-- ============================================
-- RLS tests: views respect account boundary
-- ============================================

-- Test 17: user1 can see own data via v_word_mastery
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select ok(
  (select count(*) > 0 from public.v_word_mastery),
  'user1 can see own learner data via v_word_mastery'
);

reset role;

-- Test 18: user2 cannot see user1 data via v_word_mastery
set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.v_word_mastery where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'user2 cannot see user1 learner data via v_word_mastery'
);

reset role;

-- Test 19: user2 cannot see user1 data via v_learner_phoneme_stats
set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*)::int from public.v_learner_phoneme_stats where learner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'user2 cannot see user1 data via v_learner_phoneme_stats'
);

reset role;

-- Test 20: user2 cannot see user1 data via v_module_progress
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
