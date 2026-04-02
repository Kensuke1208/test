
  create table "public"."attempts" (
    "id" uuid not null default gen_random_uuid(),
    "learner_id" uuid not null,
    "word_id" uuid not null,
    "sentence_id" uuid,
    "target_type" text not null,
    "score" integer not null,
    "target_word_score" integer,
    "is_passed" boolean not null default false,
    "phonemes" jsonb not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."attempts" enable row level security;


  create table "public"."modules" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "display_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."modules" enable row level security;


  create table "public"."sentences" (
    "id" uuid not null default gen_random_uuid(),
    "word_id" uuid not null,
    "text" text not null,
    "meaning_ja" text not null,
    "audio_url" text,
    "display_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."sentences" enable row level security;


  create table "public"."words" (
    "id" uuid not null default gen_random_uuid(),
    "module_id" uuid not null,
    "text" text not null,
    "meaning_ja" text not null,
    "image_url" text,
    "audio_url" text,
    "display_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."words" enable row level security;

CREATE INDEX attempts_learner_id_idx ON public.attempts USING btree (learner_id);

CREATE INDEX attempts_learner_sentence_idx ON public.attempts USING btree (learner_id, sentence_id) WHERE (sentence_id IS NOT NULL);

CREATE INDEX attempts_learner_word_idx ON public.attempts USING btree (learner_id, word_id);

CREATE UNIQUE INDEX attempts_pkey ON public.attempts USING btree (id);

CREATE UNIQUE INDEX modules_pkey ON public.modules USING btree (id);

CREATE UNIQUE INDEX sentences_pkey ON public.sentences USING btree (id);

CREATE INDEX sentences_word_id_idx ON public.sentences USING btree (word_id);

CREATE INDEX words_module_id_idx ON public.words USING btree (module_id);

CREATE UNIQUE INDEX words_pkey ON public.words USING btree (id);

CREATE UNIQUE INDEX words_unique_per_module ON public.words USING btree (module_id, text);

alter table "public"."attempts" add constraint "attempts_pkey" PRIMARY KEY using index "attempts_pkey";

alter table "public"."modules" add constraint "modules_pkey" PRIMARY KEY using index "modules_pkey";

alter table "public"."sentences" add constraint "sentences_pkey" PRIMARY KEY using index "sentences_pkey";

alter table "public"."words" add constraint "words_pkey" PRIMARY KEY using index "words_pkey";

alter table "public"."attempts" add constraint "attempts_learner_id_fkey" FOREIGN KEY (learner_id) REFERENCES public.learners(id) ON DELETE CASCADE not valid;

alter table "public"."attempts" validate constraint "attempts_learner_id_fkey";

alter table "public"."attempts" add constraint "attempts_sentence_id_fkey" FOREIGN KEY (sentence_id) REFERENCES public.sentences(id) ON DELETE CASCADE not valid;

alter table "public"."attempts" validate constraint "attempts_sentence_id_fkey";

alter table "public"."attempts" add constraint "attempts_sentence_required" CHECK (((target_type = 'word'::text) OR (sentence_id IS NOT NULL))) not valid;

alter table "public"."attempts" validate constraint "attempts_sentence_required";

alter table "public"."attempts" add constraint "attempts_target_type_check" CHECK ((target_type = ANY (ARRAY['word'::text, 'sentence'::text]))) not valid;

alter table "public"."attempts" validate constraint "attempts_target_type_check";

alter table "public"."attempts" add constraint "attempts_target_word_score_check" CHECK (((target_type = 'sentence'::text) OR (target_word_score IS NULL))) not valid;

alter table "public"."attempts" validate constraint "attempts_target_word_score_check";

alter table "public"."attempts" add constraint "attempts_word_id_fkey" FOREIGN KEY (word_id) REFERENCES public.words(id) ON DELETE CASCADE not valid;

alter table "public"."attempts" validate constraint "attempts_word_id_fkey";

alter table "public"."sentences" add constraint "sentences_word_id_fkey" FOREIGN KEY (word_id) REFERENCES public.words(id) ON DELETE CASCADE not valid;

alter table "public"."sentences" validate constraint "sentences_word_id_fkey";

alter table "public"."words" add constraint "words_module_id_fkey" FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE not valid;

alter table "public"."words" validate constraint "words_module_id_fkey";

alter table "public"."words" add constraint "words_unique_per_module" UNIQUE using index "words_unique_per_module";

create or replace view "public"."v_learner_phoneme_stats" as  WITH expanded AS (
         SELECT a.learner_id,
            (p.value ->> 'phone'::text) AS phone,
            ((p.value ->> 'quality_score'::text))::integer AS quality_score,
            (p.value ->> 'sound_most_like'::text) AS sound_most_like,
            ((p.value ->> 'is_correct'::text))::boolean AS is_correct
           FROM public.attempts a,
            LATERAL jsonb_array_elements(a.phonemes) p(value)
        ), stats AS (
         SELECT expanded.learner_id,
            expanded.phone,
            count(*) AS total_count,
            count(*) FILTER (WHERE expanded.is_correct) AS correct_count,
            count(*) FILTER (WHERE (NOT expanded.is_correct)) AS error_count
           FROM expanded
          GROUP BY expanded.learner_id, expanded.phone
        ), mistakes AS (
         SELECT DISTINCT ON (expanded.learner_id, expanded.phone) expanded.learner_id,
            expanded.phone,
            expanded.sound_most_like AS most_common_mistake
           FROM expanded
          WHERE (NOT expanded.is_correct)
          GROUP BY expanded.learner_id, expanded.phone, expanded.sound_most_like
          ORDER BY expanded.learner_id, expanded.phone, (count(*)) DESC
        )
 SELECT s.learner_id,
    s.phone,
    (s.total_count)::integer AS total_count,
    (s.correct_count)::integer AS correct_count,
    (s.error_count)::integer AS error_count,
    round(((s.correct_count)::numeric / (s.total_count)::numeric), 2) AS accuracy,
    m.most_common_mistake
   FROM (stats s
     LEFT JOIN mistakes m ON (((s.learner_id = m.learner_id) AND (s.phone = m.phone))));


create or replace view "public"."v_word_mastery" as  WITH word_attempts AS (
         SELECT attempts.learner_id,
            attempts.word_id,
            bool_or(attempts.is_passed) AS word_passed
           FROM public.attempts
          WHERE (attempts.target_type = 'word'::text)
          GROUP BY attempts.learner_id, attempts.word_id
        ), sentence_pass AS (
         SELECT attempts.learner_id,
            attempts.word_id,
            attempts.sentence_id,
            bool_or(attempts.is_passed) AS passed
           FROM public.attempts
          WHERE (attempts.target_type = 'sentence'::text)
          GROUP BY attempts.learner_id, attempts.word_id, attempts.sentence_id
        ), sentence_check AS (
         SELECT wa_1.learner_id,
            s.word_id,
            bool_and(COALESCE(sp.passed, false)) AS all_sentences_passed
           FROM ((word_attempts wa_1
             JOIN public.sentences s ON ((s.word_id = wa_1.word_id)))
             LEFT JOIN sentence_pass sp ON (((sp.learner_id = wa_1.learner_id) AND (sp.sentence_id = s.id))))
          GROUP BY wa_1.learner_id, s.word_id
        )
 SELECT wa.learner_id,
    wa.word_id,
    w.module_id,
    COALESCE(wa.word_passed, false) AS word_passed,
    COALESCE(sc.all_sentences_passed, true) AS all_sentences_passed,
    (COALESCE(wa.word_passed, false) AND COALESCE(sc.all_sentences_passed, true)) AS is_mastered
   FROM ((word_attempts wa
     JOIN public.words w ON ((w.id = wa.word_id)))
     LEFT JOIN sentence_check sc ON (((sc.learner_id = wa.learner_id) AND (sc.word_id = wa.word_id))));


create or replace view "public"."v_module_progress" as  WITH active_learners AS (
         SELECT DISTINCT attempts.learner_id
           FROM public.attempts
        ), module_words AS (
         SELECT m.id AS module_id,
            count(*) AS total_words
           FROM (public.modules m
             JOIN public.words w ON ((w.module_id = m.id)))
          GROUP BY m.id
        ), mastered_count AS (
         SELECT al.learner_id,
            mw.module_id,
            mw.total_words,
            COALESCE(count(*) FILTER (WHERE vm.is_mastered), (0)::bigint) AS mastered_words
           FROM ((active_learners al
             CROSS JOIN module_words mw)
             LEFT JOIN public.v_word_mastery vm ON (((vm.learner_id = al.learner_id) AND (vm.module_id = mw.module_id))))
          GROUP BY al.learner_id, mw.module_id, mw.total_words
        )
 SELECT learner_id,
    module_id,
    (total_words)::integer AS total_words,
    (mastered_words)::integer AS mastered_words,
    (mastered_words = total_words) AS is_completed
   FROM mastered_count mc;


grant delete on table "public"."attempts" to "anon";

grant insert on table "public"."attempts" to "anon";

grant references on table "public"."attempts" to "anon";

grant select on table "public"."attempts" to "anon";

grant trigger on table "public"."attempts" to "anon";

grant truncate on table "public"."attempts" to "anon";

grant update on table "public"."attempts" to "anon";

grant delete on table "public"."attempts" to "authenticated";

grant insert on table "public"."attempts" to "authenticated";

grant references on table "public"."attempts" to "authenticated";

grant select on table "public"."attempts" to "authenticated";

grant trigger on table "public"."attempts" to "authenticated";

grant truncate on table "public"."attempts" to "authenticated";

grant update on table "public"."attempts" to "authenticated";

grant delete on table "public"."attempts" to "service_role";

grant insert on table "public"."attempts" to "service_role";

grant references on table "public"."attempts" to "service_role";

grant select on table "public"."attempts" to "service_role";

grant trigger on table "public"."attempts" to "service_role";

grant truncate on table "public"."attempts" to "service_role";

grant update on table "public"."attempts" to "service_role";

grant delete on table "public"."modules" to "anon";

grant insert on table "public"."modules" to "anon";

grant references on table "public"."modules" to "anon";

grant select on table "public"."modules" to "anon";

grant trigger on table "public"."modules" to "anon";

grant truncate on table "public"."modules" to "anon";

grant update on table "public"."modules" to "anon";

grant delete on table "public"."modules" to "authenticated";

grant insert on table "public"."modules" to "authenticated";

grant references on table "public"."modules" to "authenticated";

grant select on table "public"."modules" to "authenticated";

grant trigger on table "public"."modules" to "authenticated";

grant truncate on table "public"."modules" to "authenticated";

grant update on table "public"."modules" to "authenticated";

grant delete on table "public"."modules" to "service_role";

grant insert on table "public"."modules" to "service_role";

grant references on table "public"."modules" to "service_role";

grant select on table "public"."modules" to "service_role";

grant trigger on table "public"."modules" to "service_role";

grant truncate on table "public"."modules" to "service_role";

grant update on table "public"."modules" to "service_role";

grant delete on table "public"."sentences" to "anon";

grant insert on table "public"."sentences" to "anon";

grant references on table "public"."sentences" to "anon";

grant select on table "public"."sentences" to "anon";

grant trigger on table "public"."sentences" to "anon";

grant truncate on table "public"."sentences" to "anon";

grant update on table "public"."sentences" to "anon";

grant delete on table "public"."sentences" to "authenticated";

grant insert on table "public"."sentences" to "authenticated";

grant references on table "public"."sentences" to "authenticated";

grant select on table "public"."sentences" to "authenticated";

grant trigger on table "public"."sentences" to "authenticated";

grant truncate on table "public"."sentences" to "authenticated";

grant update on table "public"."sentences" to "authenticated";

grant delete on table "public"."sentences" to "service_role";

grant insert on table "public"."sentences" to "service_role";

grant references on table "public"."sentences" to "service_role";

grant select on table "public"."sentences" to "service_role";

grant trigger on table "public"."sentences" to "service_role";

grant truncate on table "public"."sentences" to "service_role";

grant update on table "public"."sentences" to "service_role";

grant delete on table "public"."words" to "anon";

grant insert on table "public"."words" to "anon";

grant references on table "public"."words" to "anon";

grant select on table "public"."words" to "anon";

grant trigger on table "public"."words" to "anon";

grant truncate on table "public"."words" to "anon";

grant update on table "public"."words" to "anon";

grant delete on table "public"."words" to "authenticated";

grant insert on table "public"."words" to "authenticated";

grant references on table "public"."words" to "authenticated";

grant select on table "public"."words" to "authenticated";

grant trigger on table "public"."words" to "authenticated";

grant truncate on table "public"."words" to "authenticated";

grant update on table "public"."words" to "authenticated";

grant delete on table "public"."words" to "service_role";

grant insert on table "public"."words" to "service_role";

grant references on table "public"."words" to "service_role";

grant select on table "public"."words" to "service_role";

grant trigger on table "public"."words" to "service_role";

grant truncate on table "public"."words" to "service_role";

grant update on table "public"."words" to "service_role";


  create policy "attempts_insert_service"
  on "public"."attempts"
  as permissive
  for insert
  to service_role
with check (true);



  create policy "attempts_select_own"
  on "public"."attempts"
  as permissive
  for select
  to authenticated
using ((learner_id IN ( SELECT learners.id
   FROM public.learners
  WHERE (learners.account_id = auth.uid()))));



  create policy "modules_select_authenticated"
  on "public"."modules"
  as permissive
  for select
  to authenticated
using (true);



  create policy "sentences_select_authenticated"
  on "public"."sentences"
  as permissive
  for select
  to authenticated
using (true);



  create policy "words_select_authenticated"
  on "public"."words"
  as permissive
  for select
  to authenticated
using (true);


CREATE TRIGGER on_modules_update BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION internal.handle_updated_at();

CREATE TRIGGER on_sentences_update BEFORE UPDATE ON public.sentences FOR EACH ROW EXECUTE FUNCTION internal.handle_updated_at();

CREATE TRIGGER on_words_update BEFORE UPDATE ON public.words FOR EACH ROW EXECUTE FUNCTION internal.handle_updated_at();


