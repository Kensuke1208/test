import type { Phoneme } from "../lib/api";
import { getScoreTier, getTierMessage, getCorrectCount } from "../lib/score";

interface ScoreDisplayProps {
  score: number;
  phonemes: Phoneme[];
  previousCorrectCount?: number;
}

const tierColors: Record<string, string> = {
  excellent: "text-purple-600",
  good: "text-green-600",
  close: "text-yellow-600",
  retry: "text-red-600",
};

export function ScoreDisplay({
  score,
  phonemes,
  previousCorrectCount,
}: ScoreDisplayProps) {
  const tier = getScoreTier(score);
  const message = getTierMessage(tier);
  const { correct, total } = getCorrectCount(phonemes);

  return (
    <div className="text-center space-y-2">
      <div className={`text-5xl font-bold ${tierColors[tier]}`}>{score}</div>
      <div className="text-lg font-bold">{message}</div>
      <div className="text-sm text-gray-600">
        {total}このおとのうち {correct}こ せいかい
      </div>
      {previousCorrectCount !== undefined && previousCorrectCount < correct && (
        <div className="text-sm text-green-600 font-bold">
          まえは {previousCorrectCount}こ → いまは {correct}こ！
        </div>
      )}
    </div>
  );
}
