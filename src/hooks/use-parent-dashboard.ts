import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { toModuleProgress } from "../lib/view-types";
import { getJstMondayUtc, getJstDayOfWeek, formatJstDate } from "../lib/jst-date";
import { groupRecentActivity, splitPhonemeStats } from "../lib/dashboard";

export function useParentDashboard(learnerId: string | null) {
  return useQuery({
    queryKey: ["parent-dashboard", learnerId],
    enabled: !!learnerId,
    queryFn: async () => {
      const mondayUtc = getJstMondayUtc();

      const [weeklyRes, recentRes, progressRes, phonemeRes, wordsRes, modulesRes] =
        await Promise.all([
          supabase
            .from("attempts")
            .select("created_at")
            .eq("learner_id", learnerId!)
            .gte("created_at", mondayUtc),
          supabase
            .from("attempts")
            .select("created_at, score, word_id")
            .eq("learner_id", learnerId!)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("v_module_progress")
            .select("*")
            .eq("learner_id", learnerId!),
          supabase
            .from("v_learner_phoneme_stats")
            .select("*")
            .eq("learner_id", learnerId!),
          supabase.from("words").select("id, module_id"),
          supabase.from("modules").select("id, title"),
        ]);

      if (weeklyRes.error) throw weeklyRes.error;
      if (recentRes.error) throw recentRes.error;
      if (progressRes.error) throw progressRes.error;
      if (phonemeRes.error) {
        console.error("Failed to fetch phoneme stats:", phonemeRes.error);
      }

      // Word → module title mapping
      const moduleMap = new Map(
        (modulesRes.data ?? []).map((m) => [m.id, m.title]),
      );
      const wordModuleMap = new Map(
        (wordsRes.data ?? []).map((w) => [w.id, moduleMap.get(w.module_id) ?? "不明"]),
      );

      // Weekly practice days
      const practiceDays = new Set<number>();
      for (const a of weeklyRes.data) {
        practiceDays.add(getJstDayOfWeek(a.created_at));
      }

      // Last practice date
      const lastPracticeDate =
        recentRes.data.length > 0 ? formatJstDate(recentRes.data[0].created_at) : null;

      // Days since last practice
      let daysSinceLastPractice: number | null = null;
      if (recentRes.data.length > 0) {
        daysSinceLastPractice = Math.floor(
          (Date.now() - new Date(recentRes.data[0].created_at).getTime()) / (1000 * 60 * 60 * 24),
        );
      }

      // Recent activity
      const recentActivity = groupRecentActivity(recentRes.data, wordModuleMap);

      // Module progress totals
      const progressList = (progressRes.data ?? []).map(toModuleProgress);
      const totalWords = progressList.reduce((s, p) => s + p.total_words, 0);
      const masteredWords = progressList.reduce((s, p) => s + p.mastered_words, 0);
      const completedModules = progressList.filter((p) => p.completed).length;
      const totalModules = progressList.length;

      // Phoneme stats
      const phonemeRows = (phonemeRes.data ?? []).map((p) => ({
        phone: p.phone as string,
        accuracy: Number(p.accuracy),
        totalCount: p.total_count ?? 0,
        mostCommonMistake: p.most_common_mistake as string | null,
      }));
      const { weak: weakPhonemes, strong: strongPhonemes } = splitPhonemeStats(phonemeRows);

      return {
        practiceDays,
        daysCount: practiceDays.size,
        lastPracticeDate,
        daysSinceLastPractice,
        recentActivity,
        totalWords,
        masteredWords,
        completedModules,
        totalModules,
        weakPhonemes,
        strongPhonemes,
      };
    },
  });
}
