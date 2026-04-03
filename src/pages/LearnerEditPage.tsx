import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function LearnerEditPage() {
  const { learnerId } = useParams<{ learnerId: string }>();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!learnerId) {
      navigate("/learners", { replace: true });
      return;
    }

    supabase
      .from("learners")
      .select("display_name")
      .eq("id", learnerId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          navigate("/learners", { replace: true });
          return;
        }
        setDisplayName(data.display_name);
        setInitialLoading(false);
      });
  }, [learnerId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError("名前を入力してください");
      return;
    }

    setError(null);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("learners")
      .update({ display_name: displayName.trim() })
      .eq("id", learnerId!);

    setLoading(false);

    if (updateError) {
      if (updateError.code === "23505") {
        setError("この名前は既に使われています");
      } else {
        setError("保存できませんでした");
      }
      return;
    }

    navigate("/learners");
  };

  if (initialLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/learners" className="text-gray-400 hover:text-gray-600 text-xl">
          ←
        </Link>
        <h1 className="text-2xl font-bold">学習者を編集</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1">名前</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg disabled:bg-gray-400"
        >
          {loading ? "保存中..." : "保存する"}
        </button>
      </form>
    </div>
  );
}
