import { supabase } from "./supabase";

export interface Phoneme {
  word: string;
  phone: string;
  quality_score: number;
  sound_most_like: string;
  is_correct: boolean;
}

export interface ScoringResponse {
  attempt_id: string;
  score: number;
  target_word_score: number | null;
  phonemes: Phoneme[];
}

export async function scorePronunciation(
  audio: Blob,
  learnerId: string,
  wordId: string,
  sentenceId?: string,
): Promise<ScoringResponse> {
  const ext = audio.type.includes("mp4") ? "mp4" : "webm";
  const formData = new FormData();
  formData.append("audio", audio, `recording.${ext}`);
  formData.append("learner_id", learnerId);
  formData.append("word_id", wordId);
  if (sentenceId) formData.append("sentence_id", sentenceId);

  const { data, error } = await supabase.functions.invoke(
    "score-pronunciation",
    { body: formData },
  );

  if (error) {
    throw new Error(error.message ?? "API error");
  }

  return data as ScoringResponse;
}
