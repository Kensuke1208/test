import type { Phoneme } from "../lib/api";
import { getPronunciationTip } from "../lib/pronunciation-tips";

// ARPABET → child-friendly display (subset, see app.md §8)
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

function displayPhone(phone: string): string {
  return PHONEME_DISPLAY[phone] ?? `"${phone}"`;
}

interface MistakeHintsProps {
  phonemes: Phoneme[];
  max?: number;
}

export function MistakeHints({ phonemes, max = 3 }: MistakeHintsProps) {
  const seen = new Set<string>();
  const mistakes = phonemes
    .filter((p) => {
      if (p.is_correct) return false;
      const key = `${p.phone}:${p.sound_most_like}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, max);

  if (mistakes.length === 0) return null;

  return (
    <div className="space-y-2">
      {mistakes.map((m, i) => {
        const tip = getPronunciationTip(m.phone, m.sound_most_like);
        return (
          <div key={i} className="text-sm">
            <div className="text-gray-700">
              {displayPhone(m.phone)} が {displayPhone(m.sound_most_like)}{" "}
              にきこえたよ
            </div>
            {tip && (
              <div className="text-teal-600 mt-0.5">💡 {tip}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
