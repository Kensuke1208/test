import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { scorePronunciation } from "../lib/api";

export function usePracticeData(wordId: string | undefined) {
  return useQuery({
    queryKey: ["practice-data", wordId],
    enabled: !!wordId,
    queryFn: async () => {
      const [wordRes, sentencesRes] = await Promise.all([
        supabase.from("words").select("*").eq("id", wordId!).single(),
        supabase
          .from("sentences")
          .select("*")
          .eq("word_id", wordId!)
          .order("display_order"),
      ]);

      if (wordRes.error) throw wordRes.error;
      if (sentencesRes.error) throw sentencesRes.error;

      return {
        word: wordRes.data,
        sentences: sentencesRes.data,
      };
    },
  });
}

export function useScoreMutation() {
  return useMutation({
    mutationFn: ({
      audio,
      wordId,
      sentenceId,
    }: {
      audio: Blob;
      wordId: string;
      sentenceId?: string;
    }) => scorePronunciation(audio, wordId, sentenceId),
  });
}
