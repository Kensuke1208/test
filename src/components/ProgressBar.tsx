interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-mint-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-mint-400 to-mint-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm text-mint-700 font-bold whitespace-nowrap">
        {current} / {total}
      </span>
    </div>
  );
}
