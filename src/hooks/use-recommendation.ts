import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

interface RecommendedWord {
  wordId: string;
  moduleId: string;
  text: string;
  meaningJa: string;
  score: number;
}

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

      // Build word lookup
      const moduleOrderMap = new Map(
        (modulesRes.data ?? []).map((m) => [m.id, m.display_order]),
      );
      const wordList = (wordsRes.data ?? []).sort((a, b) => {
        const aModOrder = moduleOrderMap.get(a.module_id) ?? 0;
        const bModOrder = moduleOrderMap.get(b.module_id) ?? 0;
        if (aModOrder !== bModOrder) return aModOrder - bModOrder;
        return a.display_order - b.display_order;
      });
      const wordMap = new Map(wordList.map((w) => [w.id, w]));

      // Find recommended word
      let recommended: RecommendedWord | null = null;
      const mastery = masteryRes.data ?? [];

      // Priority 1: attempted but not mastered (score > 0) — "almost there"
      const almostThere = mastery
        .filter((m) => !m.mastered && (m.score ?? 0) > 0)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      const candidate = almostThere[0];
      if (candidate?.word_id) {
        const word = wordMap.get(candidate.word_id);
        if (word) {
          recommended = {
            wordId: word.id,
            moduleId: word.module_id,
            text: word.text,
            meaningJa: word.meaning_ja,
            score: candidate.score ?? 0,
          };
        }
      }

      // Priority 2: first unattempted word
      if (!recommended && masteredWords < totalWords) {
        const attemptedWordIds = new Set(
          mastery.map((m) => m.word_id).filter(Boolean),
        );
        const unattempted = wordList.find((w) => !attemptedWordIds.has(w.id));
        if (unattempted) {
          recommended = {
            wordId: unattempted.id,
            moduleId: unattempted.module_id,
            text: unattempted.text,
            meaningJa: unattempted.meaning_ja,
            score: 0,
          };
        }
      }

      // Weakest phoneme (with enough data)
      const qualified = (phonemeRes.data ?? [])
        .filter((p) => (p.total_count ?? 0) >= 5)
        .sort((a, b) => Number(a.accuracy) - Number(b.accuracy));
      const weakestPhoneme = qualified[0]
        ? {
            phone: qualified[0].phone as string,
            accuracy: Number(qualified[0].accuracy),
            mostCommonMistake: qualified[0].most_common_mistake as string | null,
          }
        : null;

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
