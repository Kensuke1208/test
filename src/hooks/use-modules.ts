import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useLearnerStore } from "../stores/learner-store";
import { toModuleProgress, toWordMastery } from "../lib/view-types";

export function useModules() {
  const learnerId = useLearnerStore((s) => s.selectedLearnerId);

  return useQuery({
    queryKey: ["modules", learnerId],
    queryFn: async () => {
      const [modulesRes, wordsRes, progressRes] = await Promise.all([
        supabase.from("modules").select("*").order("display_order"),
        supabase.from("words").select("id, module_id"),
        learnerId
          ? supabase
              .from("v_module_progress")
              .select("*")
              .eq("learner_id", learnerId)
          : Promise.resolve({ data: null }),
      ]);

      if (modulesRes.error) throw modulesRes.error;
      if (wordsRes.error) throw wordsRes.error;
      if ("error" in progressRes && progressRes.error) {
        console.error("Failed to fetch module progress:", progressRes.error);
      }

      // Count words per module
      const wordCounts = new Map<string, number>();
      for (const w of wordsRes.data) {
        wordCounts.set(w.module_id, (wordCounts.get(w.module_id) ?? 0) + 1);
      }

      const progress = new Map(
        (progressRes.data ?? []).map((p) => [
          p.module_id,
          toModuleProgress(p),
        ]),
      );

      return modulesRes.data.map((m) => ({
        ...m,
        progress: progress.get(m.id) ?? {
          mastered_words: 0,
          total_words: wordCounts.get(m.id) ?? 0,
          completed: false,
        },
      }));
    },
  });
}

export function useModuleDetail(moduleId: string | undefined) {
  const learnerId = useLearnerStore((s) => s.selectedLearnerId);

  return useQuery({
    queryKey: ["module-detail", moduleId, learnerId],
    enabled: !!moduleId,
    queryFn: async () => {
      const [moduleRes, wordsRes, masteryRes] = await Promise.all([
        supabase.from("modules").select("*").eq("id", moduleId!).single(),
        supabase
          .from("words")
          .select("*")
          .eq("module_id", moduleId!)
          .order("display_order"),
        learnerId
          ? supabase
              .from("v_word_mastery")
              .select("*")
              .eq("learner_id", learnerId)
              .eq("module_id", moduleId!)
          : Promise.resolve({ data: null }),
      ]);

      if (moduleRes.error) throw moduleRes.error;
      if (wordsRes.error) throw wordsRes.error;
      if ("error" in masteryRes && masteryRes.error) {
        console.error("Failed to fetch word mastery:", masteryRes.error);
      }

      const masteryMap = new Map(
        (masteryRes.data ?? []).map((m) => [m.word_id, toWordMastery(m)]),
      );

      return {
        module: moduleRes.data,
        words: wordsRes.data.map((w) => ({
          ...w,
          mastery: masteryMap.get(w.id) ?? null,
        })),
      };
    },
  });
}
