import { useModules } from "../hooks/use-modules";
import { ModuleCard } from "../components/ModuleCard";

export function ModuleListPage() {
  const { data: modules, isLoading, error } = useModules();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">モジュール一覧</h1>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-[var(--radius-card)] bg-mint-50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">😢</div>
        <p className="text-gray-500 font-bold">データを読み込めませんでした。もう一度試してね</p>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📚</div>
        <p className="text-gray-500 font-bold">モジュールを準備中です</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">モジュール一覧</h1>
      {modules.map((m) => (
        <ModuleCard
          key={m.id}
          id={m.id}
          title={m.title}
          description={m.description}
          progress={m.progress}
        />
      ))}
    </div>
  );
}
