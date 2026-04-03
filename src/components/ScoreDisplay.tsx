import type { Phoneme } from "../lib/api";
import { getScoreTier, getTierMessage, getCorrectCount } from "../lib/score";

interface ScoreDisplayProps {
  score: number;
  phonemes: Phoneme[];
  previousCorrectCount?: number;
}

const tierConfig: Record<string, { ring: string; bg: string; emoji: string }> = {
  excellent: { ring: "stroke-mint-500", bg: "from-mint-100 to-mint-50", emoji: "🎉" },
  good: { ring: "stroke-mint-400", bg: "from-mint-100 to-mint-50", emoji: "✨" },
  close: { ring: "stroke-sun-400", bg: "from-amber-50 to-orange-50", emoji: "💪" },
  retry: { ring: "stroke-gray-300", bg: "from-gray-50 to-gray-100", emoji: "🔄" },
};

export function ScoreDisplay({
  score,
  phonemes,
  previousCorrectCount,
}: ScoreDisplayProps) {
  const tier = getScoreTier(score);
  const message = getTierMessage(tier);
  const { correct, total } = getCorrectCount(phonemes);
  const config = tierConfig[tier];

  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`rounded-[var(--radius-card)] bg-gradient-to-br ${config.bg} p-6 animate-bounce-in`}>
      <div className="flex items-center gap-6">
        {/* Circular score */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100" className="score-ring">
            <circle cx="50" cy="50" r="44" className="score-ring-track" />
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`score-ring-fill ${config.ring}`}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black font-display leading-none">{score}</span>
            <span className="text-[10px] text-gray-400 font-bold">/ 100</span>
          </div>
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold mb-1">
            {config.emoji} {message}
          </div>
          <div className="text-sm text-gray-600 font-bold">
            {total}この音のうち {correct}こ 正解
          </div>
          {previousCorrectCount !== undefined && previousCorrectCount < correct && (
            <div className="text-sm text-mint-600 font-bold mt-1 animate-slide-up">
              前は {previousCorrectCount}こ → 今は {correct}こ！
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
