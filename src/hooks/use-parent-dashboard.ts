import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { toModuleProgress } from "../lib/view-types";
import { PASS_THRESHOLD } from "../lib/score";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getJstMondayUtc(): string {
  const jstNow = new Date(Date.now() + JST_OFFSET_MS);
  const day = jstNow.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(jstNow);
  monday.setUTCDate(monday.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return new Date(monday.getTime() - JST_OFFSET_MS).toISOString();
}

function getJstDayOfWeek(isoString: string): number {
  const day = new Date(new Date(isoString).getTime() + JST_OFFSET_MS).getUTCDay();
  return day === 0 ? 6 : day - 1;
}

function formatJstDate(isoString: string): string {
  const d = new Date(new Date(isoString).getTime() + JST_OFFSET_MS);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

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

      // Recent activity grouped by date + module
      const recentActivity: {
        date: string;
        entries: { moduleTitle: string; wordCount: number; passedCount: number }[];
      }[] = [];
      const grouped = new Map<string, Map<string, { wordIds: Set<string>; passedWordIds: Set<string> }>>();
      for (const a of recentRes.data) {
        const dateKey = formatJstDate(a.created_at);
        const moduleTitle = wordModuleMap.get(a.word_id) ?? "不明";

        if (!grouped.has(dateKey)) grouped.set(dateKey, new Map());
        const dateMap = grouped.get(dateKey)!;
        if (!dateMap.has(moduleTitle))
          dateMap.set(moduleTitle, { wordIds: new Set(), passedWordIds: new Set() });
        const entry = dateMap.get(moduleTitle)!;
        entry.wordIds.add(a.word_id);
        if (a.score >= PASS_THRESHOLD) entry.passedWordIds.add(a.word_id);
      }
      for (const [date, moduleEntries] of grouped) {
        const entries = [...moduleEntries.entries()].map(([moduleTitle, data]) => ({
          moduleTitle,
          wordCount: data.wordIds.size,
          passedCount: data.passedWordIds.size,
        }));
        recentActivity.push({ date, entries });
      }
      recentActivity.splice(5);

      // Module progress totals
      const progressList = (progressRes.data ?? []).map(toModuleProgress);
      const totalWords = progressList.reduce((s, p) => s + p.total_words, 0);
      const masteredWords = progressList.reduce((s, p) => s + p.mastered_words, 0);
      const completedModules = progressList.filter((p) => p.completed).length;
      const totalModules = progressList.length;

      // Phoneme stats: filter, sort client-side, split into weak/strong
      const allPhonemes = (phonemeRes.data ?? [])
        .filter((p) => (p.total_count ?? 0) >= 5)
        .sort((a, b) => Number(a.accuracy) - Number(b.accuracy))
        .map((p) => ({
          phone: p.phone as string,
          accuracy: Number(p.accuracy),
          mostCommonMistake: p.most_common_mistake as string | null,
        }));
      const weakPhonemes = allPhonemes.filter((p) => p.accuracy < 0.8).slice(0, 3);
      const strongPhonemes = allPhonemes
        .filter((p) => p.accuracy >= 0.8)
        .reverse()
        .slice(0, 3);

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
