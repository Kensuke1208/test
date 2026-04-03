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
            className="h-24 rounded-xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-gray-500">
        データを読み込めませんでした。もう一度試してね
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        モジュールを準備中です
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
