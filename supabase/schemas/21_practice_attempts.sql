-- ============================================
-- Practice Domain: Attempts
-- ============================================
-- 1. attempts table
-- 2. Indexes
-- 3. RLS policies

-- ============================================
-- 1. attempts table
-- ============================================
-- Each row is one pronunciation attempt. Immutable after creation.
-- Phoneme-level scores are stored as JSONB for immediate feedback.

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  sentence_id uuid references public.sentences(id) on delete cascade,
  target_type text not null,
  score integer not null,
  target_word_score integer,
  is_passed boolean not null default false,
  phonemes jsonb not null,
  created_at timestamptz not null default now(),
  constraint attempts_target_type_check
    check (target_type in ('word', 'sentence')),
  constraint attempts_sentence_required
    check (target_type = 'word' or sentence_id is not null),
  constraint attempts_target_word_score_check
    check (target_type = 'sentence' or target_word_score is null)
);

comment on table public.attempts is 'Pronunciation practice attempts (immutable)';
comment on column public.attempts.account_id is 'Denormalized from learners.account_id for RLS performance';
comment on column public.attempts.learner_id is 'Learner who made the attempt';
comment on column public.attempts.word_id is 'Target word (always set, even for sentence practice)';
comment on column public.attempts.sentence_id is 'Target sentence (null for word practice)';
comment on column public.attempts.target_type is 'Practice type: word or sentence';
comment on column public.attempts.score is 'Overall speechace_score.pronunciation (0-100)';
comment on column public.attempts.target_word_score is 'Target word quality_score within sentence (null for word practice)';
comment on column public.attempts.is_passed is 'Whether this attempt met the pass threshold';
comment on column public.attempts.phonemes is 'Full phoneme scores from Speechace API as JSONB array';

-- ============================================
-- 2. Indexes
-- ============================================

create index attempts_account_id_idx
  on public.attempts (account_id);

create index attempts_learner_id_idx
  on public.attempts (learner_id);

create index attempts_learner_word_idx
  on public.attempts (learner_id, word_id);

create index attempts_learner_sentence_idx
  on public.attempts (learner_id, sentence_id)
  where sentence_id is not null;

-- ============================================
-- 3. RLS policies
-- ============================================
-- SELECT: account owner can see their learners' attempts (denormalized, no JOIN).
-- INSERT: service_role only (via Edge Function).

alter table public.attempts enable row level security;

create policy attempts_select_own on public.attempts
  for select to authenticated
  using (account_id = auth.uid());

create policy attempts_insert_service on public.attempts
  for insert to service_role
  with check (true);
