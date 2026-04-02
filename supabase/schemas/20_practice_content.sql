-- ============================================
-- Practice Domain: Content Tables
-- ============================================
-- 1. modules table
-- 2. words table
-- 3. sentences table
-- 4. Indexes
-- 5. RLS policies
-- 6. Triggers

-- ============================================
-- 1. modules table
-- ============================================
-- A module is a group of 10 words. Learners progress through modules.

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.modules is 'Practice modules, each containing 10 words';

-- ============================================
-- 2. words table
-- ============================================
-- Words belong to a module. Each word has 2-3 example sentences.

create table public.words (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  text text not null,
  meaning_ja text not null,
  image_url text,
  audio_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint words_unique_per_module unique (module_id, text)
);

comment on table public.words is 'English words within a module';
comment on column public.words.text is 'English word (e.g. "apple")';
comment on column public.words.meaning_ja is 'Japanese meaning (e.g. "りんご")';
comment on column public.words.image_url is 'Illustration URL';
comment on column public.words.audio_url is 'Native speaker audio URL';

-- ============================================
-- 3. sentences table
-- ============================================
-- Example sentences for each word. Eiken Grade 3 level.

create table public.sentences (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.words(id) on delete cascade,
  text text not null,
  meaning_ja text not null,
  audio_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sentences is 'Example sentences for each word (Eiken Grade 3 level)';
comment on column public.sentences.text is 'English sentence (e.g. "I eat an apple every morning.")';
comment on column public.sentences.meaning_ja is 'Japanese translation';

-- ============================================
-- 4. Indexes
-- ============================================

create index words_module_id_idx
  on public.words (module_id);

create index sentences_word_id_idx
  on public.sentences (word_id);

-- ============================================
-- 5. RLS policies
-- ============================================
-- Content is read-only for authenticated users. Managed via seed data.

alter table public.modules enable row level security;
alter table public.words enable row level security;
alter table public.sentences enable row level security;

create policy modules_select_authenticated on public.modules
  for select to authenticated
  using (true);

create policy words_select_authenticated on public.words
  for select to authenticated
  using (true);

create policy sentences_select_authenticated on public.sentences
  for select to authenticated
  using (true);

-- ============================================
-- 6. Triggers
-- ============================================

create trigger on_modules_update
  before update on public.modules
  for each row
  execute function internal.handle_updated_at();

create trigger on_words_update
  before update on public.words
  for each row
  execute function internal.handle_updated_at();

create trigger on_sentences_update
  before update on public.sentences
  for each row
  execute function internal.handle_updated_at();
