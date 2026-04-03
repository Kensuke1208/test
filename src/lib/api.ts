const FUNCTIONS_URL =
  import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

export interface Phoneme {
  word: string;
  phone: string;
  quality_score: number;
  sound_most_like: string;
  is_correct: boolean;
}

export interface ScoringResponse {
  score: number;
  target_word_score: number | null;
  phonemes: Phoneme[];
}

export async function scorePronunciation(
  audio: Blob,
  wordId: string,
  sentenceId?: string,
): Promise<ScoringResponse> {
  const ext = audio.type.includes("mp4") ? "mp4" : "webm";
  const formData = new FormData();
  formData.append("audio", audio, `recording.${ext}`);
  formData.append("word_id", wordId);
  if (sentenceId) formData.append("sentence_id", sentenceId);

  const res = await fetch(`${FUNCTIONS_URL}/score-pronunciation`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `API error ${res.status}`);
  }

  return res.json();
}
