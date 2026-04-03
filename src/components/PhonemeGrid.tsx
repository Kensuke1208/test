import type { Phoneme } from "../lib/api";

interface PhonemeGridProps {
  phonemes: Phoneme[];
  score: number;
}

function phonemeStyle(score: number): string {
  if (score >= 80) return "bg-mint-100 text-mint-800 border-mint-300 shadow-mint-200/50";
  if (score >= 60) return "bg-amber-50 text-amber-800 border-amber-300 shadow-amber-200/50";
  return "bg-red-50 text-red-700 border-red-300 shadow-red-200/50";
}

export function PhonemeGrid({ phonemes, score }: PhonemeGridProps) {
  if (score < 60) return null;

  const grouped = new Map<string, Phoneme[]>();
  for (const p of phonemes) {
    const list = grouped.get(p.word) ?? [];
    list.push(p);
    grouped.set(p.word, list);
  }

  return (
    <div className="space-y-3 animate-slide-up">
      {[...grouped.entries()].map(([word, phones], wordIdx) => (
        <div key={`${word}-${wordIdx}`}>
          <div className="text-xs text-gray-400 font-bold mb-1.5 uppercase tracking-wider font-display">
            {word}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {phones.map((p, i) => (
              <span
                key={`${p.phone}-${i}`}
                className={`inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-1.5 rounded-xl border text-sm font-bold font-display shadow-sm transition-transform hover:scale-110 ${phonemeStyle(p.quality_score)}`}
                title={`${p.phone} → ${p.sound_most_like} (${p.quality_score})`}
              >
                {p.phone}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
