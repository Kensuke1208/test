import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useLearnerStore } from "../stores/learner-store";

export function LearnerSelectionPage() {
  const navigate = useNavigate();
  const setSelectedLearnerId = useLearnerStore((s) => s.setSelectedLearnerId);

  const { data: learners, isLoading } = useQuery({
    queryKey: ["learners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learners")
        .select("id, display_name")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const handleSelect = (id: string) => {
    setSelectedLearnerId(id);
    navigate("/modules");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">だれが練習する？</h1>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasLearners = learners && learners.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">だれが練習する？</h1>

      {hasLearners ? (
        <div className="grid grid-cols-2 gap-3">
          {learners.map((l) => (
            <div
              key={l.id}
              className="relative rounded-xl border border-gray-200 p-4 hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => handleSelect(l.id)}
            >
              <div className="text-lg font-bold">{l.display_name}</div>
              <Link
                to={`/learners/${l.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-2 right-2 text-xs text-gray-400 hover:text-gray-600"
              >
                編集
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">学習者を追加してください</p>
      )}

      <div className="flex items-center justify-between">
        <Link
          to="/learners/new"
          className="inline-flex items-center gap-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold rounded-lg"
        >
          ＋ 追加する
        </Link>
        <Link
          to="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          学習状況を見る
        </Link>
      </div>
    </div>
  );
}
