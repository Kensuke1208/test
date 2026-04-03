/**
 * Pronunciation tips for common Japanese speaker confusion patterns.
 * Maps (expected phone, actual phone) to a kid-friendly tip in hiragana.
 */

const TIPS: Record<string, string> = {
  "r:l": "したのさきを うえにまげて、どこにもつけないでね",
  "l:r": "したのさきを うえのはのうらに つけてみよう",
  "th:s": "したを はのあいだに はさんでみよう",
  "dh:z": "したを はのあいだに はさんで こえをだしてみよう",
  "v:b": "うえのはで したのくちびるに かるくふれてみよう",
  "f:h": "うえのはで したのくちびるに ふれて いきをだしてみよう",
};

/**
 * Get a pronunciation tip for a confused phoneme pair.
 * Returns null if no tip is available.
 */
export function getPronunciationTip(
  expectedPhone: string,
  actualPhone: string,
): string | null {
  return TIPS[`${expectedPhone}:${actualPhone}`] ?? null;
}
