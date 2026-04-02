import type { Phoneme } from "../lib/api";

interface PhonemeGridProps {
  phonemes: Phoneme[];
}

function phonemeColor(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-red-100 text-red-800 border-red-300";
}

export function PhonemeGrid({ phonemes }: PhonemeGridProps) {
  // Group phonemes by word
  const grouped = new Map<string, Phoneme[]>();
  for (const p of phonemes) {
    const list = grouped.get(p.word) ?? [];
    list.push(p);
    grouped.set(p.word, list);
  }

  return (
    <div className="space-y-3">
      {[...grouped.entries()].map(([word, phones]) => (
        <div key={word}>
          <div className="text-sm text-gray-500 mb-1">{word}</div>
          <div className="flex gap-1 flex-wrap">
            {phones.map((p, i) => (
              <span
                key={`${p.phone}-${i}`}
                className={`inline-flex items-center px-2 py-1 rounded border text-sm font-mono ${phonemeColor(p.quality_score)}`}
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
