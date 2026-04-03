import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function LearnerCreatePage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError("名前を入力してください");
      return;
    }

    setError(null);
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { error: insertError } = await supabase.from("learners").insert({
      account_id: user.id,
      display_name: displayName.trim(),
    });

    setLoading(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("この名前は既に使われています");
      } else {
        setError("保存できませんでした");
      }
      return;
    }

    navigate("/learners");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/learners" className="text-gray-400 hover:text-gray-600 text-xl">
          ←
        </Link>
        <h1 className="text-2xl font-bold">学習者を追加</h1>
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
          {loading ? "追加中..." : "追加する"}
        </button>
      </form>
    </div>
  );
}
