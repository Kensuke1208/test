-- security_invoker is not captured by supabase db diff, so this is a manual migration.
-- See: https://github.com/supabase/cli/issues/3973

alter view public.v_learner_phoneme_stats set (security_invoker = true);
alter view public.v_word_mastery set (security_invoker = true);
alter view public.v_module_progress set (security_invoker = true);
