interface StepIndicatorProps {
  labels: string[];
  currentIndex: number;
}

export function StepIndicator({ labels, currentIndex }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;

        return (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`w-6 h-0.5 rounded-full transition-colors ${
                  isDone ? "bg-mint-400" : "bg-mint-200"
                }`}
              />
            )}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                isActive
                  ? "bg-mint-500 text-white shadow-md shadow-mint-500/30"
                  : isDone
                    ? "bg-mint-200 text-mint-700"
                    : "bg-white/60 text-gray-400"
              }`}
            >
              {isDone && (
                <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
