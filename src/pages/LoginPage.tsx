import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      return;
    }

    navigate("/learners");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-600 mb-1.5">メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-mint-200 rounded-xl bg-mint-50/50 focus:outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-200 transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-600 mb-1.5">パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-mint-200 rounded-xl bg-mint-50/50 focus:outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-200 transition-all"
        />
      </div>

      {error && (
        <div className="text-sm text-coral-500 font-bold bg-red-50 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-mint-500 hover:bg-mint-600 text-white font-bold rounded-xl disabled:bg-gray-300 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-mint-500/30"
      >
        {loading ? "ログイン中..." : "ログイン"}
      </button>

      <p className="text-center text-sm text-gray-400 font-bold">
        <Link to="/signup" className="text-mint-600 hover:underline">
          アカウントを作成する
        </Link>
      </p>
    </form>
  );
}
