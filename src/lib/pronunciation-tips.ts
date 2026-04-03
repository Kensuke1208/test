/**
 * Pronunciation tips for common Japanese speaker confusion patterns.
 * Maps (expected phone, actual phone) to a kid-friendly tip in hiragana.
 */

const TIPS: Record<string, string> = {
  "r:l": "舌の先を上に曲げて、どこにもつけないでね",
  "l:r": "舌の先を上の歯のうらにつけてみよう",
  "th:s": "舌を歯の間にはさんでみよう",
  "dh:z": "舌を歯の間にはさんで声を出してみよう",
  "v:b": "上の歯で下のくちびるに軽くふれてみよう",
  "f:h": "上の歯で下のくちびるにふれて息を出してみよう",
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
