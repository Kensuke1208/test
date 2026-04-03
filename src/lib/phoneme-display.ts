/**
 * ARPABET → child/parent-friendly display mapping.
 * Used by MistakeHints (practice feedback) and dashboards (weak point summary).
 * @see docs/specs/app.md §8
 */

const PHONEME_DISPLAY: Record<string, string> = {
  r: '"r"',
  l: '"l"',
  th: '"th"',
  dh: '"th"',
  v: '"v"',
  f: '"f"',
  b: '"b"',
  s: '"s"',
  z: '"z"',
  ae: '"a"',
  ah: '"u"',
  aa: '"o"',
  ih: '"i"',
  uh: '"oo"',
  ax: '"a"',
};

export function displayPhone(phone: string): string {
  return PHONEME_DISPLAY[phone] ?? `"${phone}"`;
}
