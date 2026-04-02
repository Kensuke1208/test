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
-- Determines whether a learner has mastered a word.
-- Mastered = word practice passed AND all sentences for that word passed.
-- Unattempted sentences count as not passed.

create or replace view public.v_word_mastery as
with word_attempts as (
  select
    learner_id,
    word_id,
    bool_or(is_passed) as word_passed
  from public.attempts
  where target_type = 'word'
  group by learner_id, word_id
),
sentence_pass as (
  select
    learner_id,
    word_id,
    sentence_id,
    bool_or(is_passed) as passed
  from public.attempts
  where target_type = 'sentence'
  group by learner_id, word_id, sentence_id
),
sentence_check as (
  select
    wa.learner_id,
    s.word_id,
    bool_and(coalesce(sp.passed, false)) as all_sentences_passed
  from word_attempts wa
  join public.sentences s on s.word_id = wa.word_id
  left join sentence_pass sp
    on sp.learner_id = wa.learner_id
    and sp.sentence_id = s.id
  group by wa.learner_id, s.word_id
)
select
  wa.learner_id,
  wa.word_id,
  w.module_id,
  coalesce(wa.word_passed, false) as word_passed,
  coalesce(sc.all_sentences_passed, true) as all_sentences_passed,
  coalesce(wa.word_passed, false) and coalesce(sc.all_sentences_passed, true) as is_mastered
from word_attempts wa
join public.words w on w.id = wa.word_id
left join sentence_check sc
  on sc.learner_id = wa.learner_id and sc.word_id = wa.word_id;

-- alter view public.v_word_mastery set (security_invoker = true);
-- Note: security_invoker is not captured by db diff. Applied via manual migration.
comment on view public.v_word_mastery is 'Per-learner word mastery status (word practice + all sentences passed)';

-- ============================================
-- 3. v_module_progress
-- ============================================
-- Aggregates v_word_mastery per module.
-- completed_at is the timestamp of the last word mastered in the module.

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
    coalesce(count(*) filter (where vm.is_mastered), 0) as mastered_words
  from active_learners al
  cross join module_words mw
  left join public.v_word_mastery vm
    on vm.learner_id = al.learner_id and vm.module_id = mw.module_id
  group by al.learner_id, mw.module_id, mw.total_words
),
completion_time as (
  select
    a.learner_id,
    w.module_id,
    max(a.created_at) as completed_at
  from public.attempts a
  join public.words w on w.id = a.word_id
  join public.v_word_mastery vm
    on vm.learner_id = a.learner_id and vm.word_id = a.word_id
  where vm.is_mastered = true and a.is_passed = true
  group by a.learner_id, w.module_id
)
select
  mc.learner_id,
  mc.module_id,
  mc.total_words::integer,
  mc.mastered_words::integer,
  mc.mastered_words = mc.total_words as is_completed,
  case
    when mc.mastered_words = mc.total_words then ct.completed_at
    else null
  end as completed_at
from mastered_count mc
left join completion_time ct
  on ct.learner_id = mc.learner_id and ct.module_id = mc.module_id;

-- alter view public.v_module_progress set (security_invoker = true);
-- Note: security_invoker is not captured by db diff. Applied via manual migration.
comment on view public.v_module_progress is 'Per-learner module progress with completion timestamp';
