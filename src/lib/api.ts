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

// Pass threshold — must match the value hardcoded in v_word_mastery view
export const PASS_THRESHOLD = 80;

export async function scorePronunciation(
  audio: Blob,
  text: string,
  targetWord?: string,
): Promise<ScoringResponse> {
  const ext = audio.type.includes("mp4") ? "mp4" : "webm";
  const formData = new FormData();
  formData.append("audio", audio, `recording.${ext}`);
  formData.append("text", text);
  if (targetWord) formData.append("target_word", targetWord);

  // TODO: Add Authorization header when auth is implemented
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
