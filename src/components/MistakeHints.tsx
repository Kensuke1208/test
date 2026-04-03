import type { Phoneme } from "../lib/api";
import { getPronunciationTip } from "../lib/pronunciation-tips";
import { displayPhone } from "../lib/phoneme-display";

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
    <div className="space-y-2 animate-slide-up" style={{ animationDelay: "150ms" }}>
      {mistakes.map((m, i) => {
        const tip = getPronunciationTip(m.phone, m.sound_most_like);
        return (
          <div
            key={i}
            className="rounded-2xl bg-white/80 border border-mint-200 p-3.5 shadow-sm"
          >
            <div className="text-sm font-bold text-gray-700">
              <span className="text-coral-500">{displayPhone(m.phone)}</span>
              {" "}が{" "}
              <span className="text-gray-500">{displayPhone(m.sound_most_like)}</span>
              {" "}に聞こえたよ
            </div>
            {tip && (
              <div className="text-sm text-mint-700 mt-1.5 flex items-start gap-1.5">
                <span className="text-base leading-none mt-0.5">💡</span>
                <span>{tip}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
