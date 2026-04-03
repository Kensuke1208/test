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
        <div className="h-8 w-48 bg-mint-50 rounded-2xl animate-pulse" />
        <div className="h-4 w-full bg-mint-50 rounded-full animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-mint-50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error || !data?.module) return null;

  const { module, words } = data;
  const masteredCount = words.filter((w) => w.mastery?.mastered).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/modules"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-mint-100 text-gray-400 hover:text-mint-600 hover:border-mint-300 transition-all"
        >
          <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">{module.title}</h1>
      </div>

      {/* Progress */}
      <div className="rounded-[var(--radius-card)] bg-white border border-mint-100 p-4">
        <div className="text-sm text-gray-500 font-bold mb-2">
          {masteredCount === words.length
            ? "🎉 すべて合格！"
            : `あと ${words.length - masteredCount} 単語`}
        </div>
        <ProgressBar current={masteredCount} total={words.length} />
      </div>

      {/* Word list */}
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
