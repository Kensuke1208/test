import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useLearnerStore } from "../stores/learner-store";

export function TopBar() {
  const navigate = useNavigate();
  const selectedLearnerId = useLearnerStore((s) => s.selectedLearnerId);
  const clear = useLearnerStore((s) => s.clear);

  const { data: learnerName } = useQuery({
    queryKey: ["learner-name", selectedLearnerId],
    enabled: !!selectedLearnerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("learners")
        .select("display_name")
        .eq("id", selectedLearnerId!)
        .single();
      return data?.display_name ?? null;
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clear();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-mint-100">
      <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/modules" className="text-xl font-black font-display text-mint-700 tracking-tight">
          Eigo
        </Link>
        <div className="flex items-center gap-3">
          {selectedLearnerId && (
            <Link
              to="/learners"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mint-100 text-mint-700 text-sm font-bold hover:bg-mint-200 transition-colors"
            >
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {learnerName ?? "..."}
            </Link>
          )}
          {!selectedLearnerId && (
            <Link
              to="/dashboard"
              className="text-sm text-gray-500 hover:text-mint-600 font-bold transition-colors"
            >
              学習状況
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600 font-bold transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
