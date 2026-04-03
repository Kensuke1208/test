import { useParams, useNavigate, Link } from "react-router-dom";
import { useModuleDetail } from "../hooks/use-modules";
import { WordCard } from "../components/WordCard";
import { ProgressBar } from "../components/ProgressBar";
import { useEffect } from "react";

export function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useModuleDetail(moduleId);

  useEffect(() => {
    if (!isLoading && !data?.module) {
      navigate("/modules", { replace: true });
    }
  }, [isLoading, data, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-lg bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error || !data?.module) return null;

  const { module, words } = data;
  const masteredCount = words.filter((w) => w.mastery?.mastered).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/modules"
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold">{module.title}</h1>
      </div>

      <ProgressBar current={masteredCount} total={words.length} />

      <div className="space-y-2">
        {words.map((w) => (
          <WordCard
            key={w.id}
            moduleId={module.id}
            id={w.id}
            text={w.text}
            meaningJa={w.meaning_ja}
            mastery={w.mastery}
          />
        ))}
      </div>
    </div>
  );
}
