interface ScoreDisplayProps {
  score: number;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const color =
    score >= 80
      ? "text-green-600"
      : score >= 60
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="text-center">
      <div className={`text-6xl font-bold ${color}`}>{score}</div>
      <div className="text-sm text-gray-500 mt-1">/ 100</div>
    </div>
  );
}
