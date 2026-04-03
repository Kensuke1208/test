import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { scorePronunciation } from "../lib/api";
import { useLearnerStore } from "../stores/learner-store";
import { PASS_THRESHOLD } from "../lib/score";

export function usePracticeData(wordId: string | undefined) {
  const learnerId = useLearnerStore((s) => s.selectedLearnerId);

  return useQuery({
    queryKey: ["practice-data", wordId, learnerId],
    enabled: !!wordId,
    queryFn: async () => {
      const [wordRes, sentencesRes, attemptsRes] = await Promise.all([
        supabase.from("words").select("*").eq("id", wordId!).single(),
        supabase
          .from("sentences")
          .select("*")
          .eq("word_id", wordId!)
          .order("display_order"),
        learnerId
          ? supabase
              .from("attempts")
              .select("target_type, sentence_id, score")
              .eq("learner_id", learnerId)
              .eq("word_id", wordId!)
          : Promise.resolve({ data: null }),
      ]);

      if (wordRes.error) throw wordRes.error;
      if (sentencesRes.error) throw sentencesRes.error;

      // Find best score per step and determine which are passed
      const bestScores = new Map<string, number>();
      if (attemptsRes.data) {
        for (const a of attemptsRes.data) {
          const key =
            a.target_type === "word" ? "word" : `sentence:${a.sentence_id}`;
          bestScores.set(key, Math.max(bestScores.get(key) ?? 0, a.score));
        }
      }

      const passedSteps = new Set<string>();
      for (const [key, score] of bestScores) {
        if (score >= PASS_THRESHOLD) passedSteps.add(key);
      }

      return {
        word: wordRes.data,
        sentences: sentencesRes.data,
        passedSteps,
        bestScores,
      };
    },
  });
}

export function useScoreMutation() {
  return useMutation({
    mutationFn: ({
      audio,
      learnerId,
      wordId,
      sentenceId,
    }: {
      audio: Blob;
      learnerId: string;
      wordId: string;
      sentenceId?: string;
    }) => scorePronunciation(audio, learnerId, wordId, sentenceId),
  });
}
