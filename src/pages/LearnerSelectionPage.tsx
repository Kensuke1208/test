import { Link, useNavigate } from "react-router-dom";
import { useLearners } from "../hooks/use-learners";
import { useLearnerStore } from "../stores/learner-store";

export function LearnerSelectionPage() {
  const navigate = useNavigate();
  const setSelectedLearnerId = useLearnerStore((s) => s.setSelectedLearnerId);
  const { data: learners, isLoading } = useLearners();

  const handleSelect = (id: string) => {
    setSelectedLearnerId(id);
    navigate("/modules");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">練習する人をえらんでね</h1>

        <div className="grid grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 rounded-[var(--radius-card)] bg-mint-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasLearners = learners && learners.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {hasLearners ? "練習する人をえらんでね" : "学習者を追加しよう"}
      </h1>

      {hasLearners ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {learners.map((l) => (
              <div
                key={l.id}
                className="relative rounded-[var(--radius-card)] bg-white border border-mint-100 p-5 hover:border-mint-300 hover:shadow-lg hover:shadow-mint-200/40 transition-all cursor-pointer hover:-translate-y-0.5 group"
                onClick={() => handleSelect(l.id)}
              >
                <div className="w-10 h-10 rounded-full bg-mint-100 text-mint-600 flex items-center justify-center text-lg font-black mb-2">
                  {l.display_name[0] ?? "?"}
                </div>
                <div className="text-lg font-bold">{l.display_name}</div>
                <Link
                  to={`/learners/${l.id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-3 right-3 text-xs text-gray-500 hover:text-mint-600 font-bold transition-colors"
                >
                  編集
                </Link>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Link
              to="/learners/new"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-mint-500 hover:bg-mint-600 text-white text-sm font-bold rounded-xl shadow-md shadow-mint-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              ＋ 追加する
            </Link>
            <Link
              to="/dashboard"
              className="text-sm text-gray-400 hover:text-mint-600 font-bold transition-colors"
            >
              学習状況を見る
            </Link>
          </div>
        </>
      ) : (
        <div className="rounded-[var(--radius-card)] bg-white border border-mint-100 p-8 text-center space-y-4">
          <p className="text-gray-500 font-bold">練習する人のプロフィールを作ってね</p>
          <Link
            to="/learners/new"
            className="inline-flex items-center gap-1.5 px-6 py-3 bg-mint-500 hover:bg-mint-600 text-white font-bold rounded-xl shadow-md shadow-mint-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            ＋ 追加する
          </Link>
        </div>
      )}
    </div>
  );
}
