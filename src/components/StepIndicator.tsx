interface StepIndicatorProps {
  labels: string[];
  currentIndex: number;
}

export function StepIndicator({ labels, currentIndex }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1 text-sm">
      {labels.map((label, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300">→</span>}
          <span
            className={
              i === currentIndex
                ? "font-bold text-teal-600"
                : i < currentIndex
                  ? "text-gray-400 line-through"
                  : "text-gray-400"
            }
          >
            {label}
          </span>
        </span>
      ))}
    </div>
  );
}
