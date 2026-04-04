import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import {
  pickRecommendation,
  pickWeakestPhoneme,
  type RecommendedWord,
  type WeakestPhoneme,
} from "../lib/recommendation";

export type { RecommendedWord, WeakestPhoneme };

export function useRecommendation(learnerId: string | null) {
  return useQuery({
    queryKey: ["recommendation", learnerId],
    enabled: !!learnerId,
    queryFn: async () => {
      const [masteryRes, phonemeRes, progressRes, wordsRes, modulesRes] =
        await Promise.all([
          supabase
            .from("v_word_mastery")
            .select("word_id, module_id, score, mastered")
            .eq("learner_id", learnerId!),
          supabase
            .from("v_learner_phoneme_stats")
            .select("phone, accuracy, total_count, most_common_mistake")
            .eq("learner_id", learnerId!),
          supabase
            .from("v_module_progress")
            .select("mastered_words, total_words")
            .eq("learner_id", learnerId!),
          supabase
            .from("words")
            .select("id, module_id, text, meaning_ja, display_order")
            .order("display_order"),
          supabase
            .from("modules")
            .select("id, display_order")
            .order("display_order"),
        ]);

      if (masteryRes.error) throw masteryRes.error;
      if (progressRes.error) throw progressRes.error;
      if (phonemeRes.error) {
        console.error("Failed to fetch phoneme stats:", phonemeRes.error);
      }

      // Total progress
      const progressList = progressRes.data ?? [];
      const totalWords = progressList.reduce((s, p) => s + (p.total_words ?? 0), 0);
      const masteredWords = progressList.reduce((s, p) => s + (p.mastered_words ?? 0), 0);

      // Sort words by module order then word order
      const moduleOrderMap = new Map(
        (modulesRes.data ?? []).map((m) => [m.id, m.display_order]),
      );
      const wordList = (wordsRes.data ?? [])
        .sort((a, b) => {
          const aModOrder = moduleOrderMap.get(a.module_id) ?? 0;
          const bModOrder = moduleOrderMap.get(b.module_id) ?? 0;
          if (aModOrder !== bModOrder) return aModOrder - bModOrder;
          return a.display_order - b.display_order;
        })
        .map((w) => ({
          id: w.id,
          module_id: w.module_id,
          text: w.text,
          meaning_ja: w.meaning_ja,
        }));

      // Mastery rows
      const mastery = (masteryRes.data ?? [])
        .filter((m): m is typeof m & { word_id: string } => m.word_id !== null)
        .map((m) => ({
          word_id: m.word_id,
          score: m.score ?? 0,
          mastered: m.mastered ?? false,
        }));

      const recommended = pickRecommendation(mastery, wordList, masteredWords, totalWords);

      // Phoneme stats
      const phonemeRows = (phonemeRes.data ?? []).map((p) => ({
        phone: p.phone as string,
        accuracy: Number(p.accuracy),
        totalCount: p.total_count ?? 0,
        mostCommonMistake: p.most_common_mistake as string | null,
      }));
      const weakestPhoneme = pickWeakestPhoneme(phonemeRows);

      return {
        recommended,
        totalWords,
        masteredWords,
        allMastered: totalWords > 0 && masteredWords === totalWords,
        weakestPhoneme,
      };
    },
  });
}
