-- ============================================
-- Practice Domain: Views
-- ============================================
-- 1. v_learner_phoneme_stats
-- 2. v_word_mastery
-- 3. v_module_progress

-- ============================================
-- 1. v_learner_phoneme_stats
-- ============================================
-- Aggregates phoneme accuracy per learner by expanding attempts.phonemes JSONB.
-- Used by learner dashboard (practice recommendations) and parent dashboard (weak point summary).

create or replace view public.v_learner_phoneme_stats as
with expanded as (
  select
    a.learner_id,
    p.value->>'phone' as phone,
    (p.value->>'quality_score')::integer as quality_score,
    p.value->>'sound_most_like' as sound_most_like,
    (p.value->>'is_correct')::boolean as is_correct
  from public.attempts a,
    jsonb_array_elements(a.phonemes) as p(value)
),
stats as (
  select
    learner_id,
    phone,
    count(*) as total_count,
    count(*) filter (where is_correct) as correct_count,
    count(*) filter (where not is_correct) as error_count
  from expanded
  group by learner_id, phone
),
mistakes as (
  select distinct on (learner_id, phone)
    learner_id,
    phone,
    sound_most_like as most_common_mistake
  from expanded
  where not is_correct
  group by learner_id, phone, sound_most_like
  order by learner_id, phone, count(*) desc
)
select
  s.learner_id,
  s.phone,
  s.total_count::integer,
  s.correct_count::integer,
  s.error_count::integer,
  round(s.correct_count::numeric / s.total_count, 2) as accuracy,
  m.most_common_mistake
from stats s
left join mistakes m
  on s.learner_id = m.learner_id and s.phone = m.phone;

-- alter view public.v_learner_phoneme_stats set (security_invoker = true);
-- Note: security_invoker is not captured by db diff. Applied via manual migration.
comment on view public.v_learner_phoneme_stats is 'Per-learner phoneme accuracy stats, aggregated from attempts.phonemes JSONB';

-- ============================================
-- 2. v_word_mastery
-- ============================================
-- Score-based word mastery. Score is the minimum best score across all steps
-- (word practice + each sentence). Unattempted steps contribute 0.
-- Mastered when all steps have score >= 80 (threshold).
-- NOTE: Threshold 80 is also defined in src/lib/score.ts (PASS_THRESHOLD).

create or replace view public.v_word_mastery as
with attempted_words as (
  select distinct learner_id, word_id
  from public.attempts
),
word_step_best as (
  select learner_id, word_id, max(score) as step_best
  from public.attempts
  where target_type = 'word'
  group by learner_id, word_id
),
sentence_step_best as (
  select learner_id, word_id, sentence_id, max(score) as step_best
  from public.attempts
  where target_type = 'sentence'
  group by learner_id, word_id, sentence_id
),
all_steps as (
  -- Word step
  select
    aw.learner_id,
    aw.word_id,
    'word'::text as step_type,
    null::uuid as sentence_id,
    coalesce(wb.step_best, 0) as step_best
  from attempted_words aw
  left join word_step_best wb
    on wb.learner_id = aw.learner_id and wb.word_id = aw.word_id

  union all

  -- Sentence steps (all sentences for the word, including unattempted)
  select
    aw.learner_id,
    aw.word_id,
    'sentence'::text as step_type,
    s.id as sentence_id,
    coalesce(sb.step_best, 0) as step_best
  from attempted_words aw
  join public.sentences s on s.word_id = aw.word_id
  left join sentence_step_best sb
    on sb.learner_id = aw.learner_id and sb.sentence_id = s.id
)
select
  ast.learner_id,
  ast.word_id,
  w.module_id,
  min(ast.step_best)::integer as score,
  count(*)::integer as steps_total,
  count(*) filter (where ast.step_best >= 80)::integer as steps_cleared,
  count(*) filter (where ast.step_best >= 80) = count(*) as mastered
from all_steps ast
join public.words w on w.id = ast.word_id
group by ast.learner_id, ast.word_id, w.module_id;

-- alter view public.v_word_mastery set (security_invoker = true);
-- Note: security_invoker is not captured by db diff. Applied via manual migration.
comment on view public.v_word_mastery is 'Per-learner word mastery: score = min of all step bests, mastered when all steps cleared';

-- ============================================
-- 3. v_module_progress
-- ============================================
-- Aggregates v_word_mastery per module.

create or replace view public.v_module_progress as
with active_learners as (
  select distinct learner_id
  from public.attempts
),
module_words as (
  select
    m.id as module_id,
    count(*) as total_words
  from public.modules m
  join public.words w on w.module_id = m.id
  group by m.id
),
mastered_count as (
  select
    al.learner_id,
    mw.module_id,
    mw.total_words,
    coalesce(count(*) filter (where vm.mastered), 0) as mastered_words
  from active_learners al
  cross join module_words mw
  left join public.v_word_mastery vm
    on vm.learner_id = al.learner_id and vm.module_id = mw.module_id
  group by al.learner_id, mw.module_id, mw.total_words
)
select
  mc.learner_id,
  mc.module_id,
  mc.total_words::integer,
  mc.mastered_words::integer,
  mc.mastered_words = mc.total_words as completed
from mastered_count mc;

-- alter view public.v_module_progress set (security_invoker = true);
-- Note: security_invoker is not captured by db diff. Applied via manual migration.
comment on view public.v_module_progress is 'Per-learner module progress: mastered words count and completion status';
