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
      className="block rounded-xl border border-gray-200 p-4 hover:border-teal-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold">{title}</h3>
        {progress.completed && (
          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">
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
