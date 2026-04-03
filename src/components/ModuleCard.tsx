import { Link } from "react-router-dom";
import { ProgressBar } from "./ProgressBar";

interface ModuleCardProps {
  id: string;
  title: string;
  description: string | null;
  progress: {
    mastered_words: number;
    total_words: number;
    completed: boolean;
  };
}

export function ModuleCard({
  id,
  title,
  description,
  progress,
}: ModuleCardProps) {
  return (
    <Link
      to={`/modules/${id}`}
      className="block rounded-[var(--radius-card)] bg-white border border-mint-100 p-5 hover:border-mint-300 hover:shadow-lg hover:shadow-mint-200/40 transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold">{title}</h3>
        {progress.completed && (
          <span className="text-xs bg-mint-500 text-white px-2.5 py-1 rounded-full font-bold">
            完了
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-500 mb-3">{description}</p>
      )}
      <ProgressBar
        current={progress.mastered_words}
        total={progress.total_words}
      />
    </Link>
  );
}
