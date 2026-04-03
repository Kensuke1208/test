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
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <Link to="/modules" className="text-xl font-bold">
        Eigo
      </Link>
      <div className="flex items-center gap-4">
        {selectedLearnerId && (
          <Link
            to="/learners"
            className="text-sm text-teal-600 font-bold hover:underline"
          >
            {learnerName ?? "..."}
          </Link>
        )}
        <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          学習状況
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
