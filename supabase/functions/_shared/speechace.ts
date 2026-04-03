/**
 * Speechace API client
 *
 * Proxies audio to Speechace Score Text API v9 and returns structured results.
 * @see docs/speechace-api.md
 */

interface PhonemeResult {
  word: string;
  phone: string;
  quality_score: number;
  sound_most_like: string;
  is_correct: boolean;
}

interface ScoringResult {
  score: number;
  target_word_score: number | null;
  phonemes: PhonemeResult[];
}

/**
 * Call Speechace Score Text API and return structured results.
 *
 * @param audio - Audio file blob
 * @param text - Target text to evaluate against
 * @param targetWord - For sentence practice, the specific word to extract score for (null for word practice)
 */
export async function scorePronunciation(
  audio: Blob,
  text: string,
  targetWord: string | null,
  learnerId?: string,
): Promise<ScoringResult> {
  const apiKey = Deno.env.get("SPEECHACE_API_KEY");
  if (!apiKey) throw new Error("Missing SPEECHACE_API_KEY");

  const apiUrl =
    Deno.env.get("SPEECHACE_API_URL") ??
    "https://api2.speechace.com/api/scoring/text/v9/json";

  const form = new FormData();
  form.append("text", text);
  const ext = audio.type?.includes("mp4") ? "mp4" : "webm";
  form.append("user_audio_file", audio, `recording.${ext}`);

  const params = new URLSearchParams({ key: apiKey, dialect: "en-us" });
  if (learnerId) params.set("user_id", learnerId);
  const url = `${apiUrl}?${params.toString()}`;
  const response = await fetch(url, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Speechace API error ${response.status}: ${body}`);
  }

  const data = await response.json();

  if (data.status !== "success") {
    const detail = data.detail_message ?? data.message ?? JSON.stringify(data);
    throw new Error(`Speechace API error: ${detail}`);
  }

  const textScore = data.text_score;
  const score: number = textScore.speechace_score?.pronunciation ?? 0;

  // Extract phonemes from all words in word_score_list
  const phonemes: PhonemeResult[] = [];
  let targetWordScore: number | null = null;

  for (const wordScore of textScore.word_score_list ?? []) {
    const word = wordScore.word ?? "";

    // Extract target word score for sentence practice
    if (targetWord && word.toLowerCase() === targetWord.toLowerCase()) {
      targetWordScore = wordScore.quality_score ?? null;
    }

    for (const phoneScore of wordScore.phone_score_list ?? []) {
      const phone = phoneScore.phone ?? "";
      const soundMostLike = phoneScore.sound_most_like ?? phone;
      phonemes.push({
        word,
        phone,
        quality_score: phoneScore.quality_score ?? 0,
        sound_most_like: soundMostLike,
        is_correct: phone === soundMostLike,
      });
    }
  }

  return {
    score,
    target_word_score: targetWordScore,
    phonemes,
  };
}
