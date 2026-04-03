import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function SignupPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!displayName.trim()) return "名前を入力してください";
    if (!email.trim()) return "メールアドレスを入力してください";
    if (password.length < 6) return "パスワードは6文字以上にしてください";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName.trim() } },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        setError("このメールアドレスは既に登録されています");
      } else {
        setError(error.message);
      }
      return;
    }

    navigate("/learners");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold mb-1">名前</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
        />
      </div>
      <div>
        <label className="block text-sm font-bold mb-1">メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
        />
      </div>
      <div>
        <label className="block text-sm font-bold mb-1">パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
        />
        <p className="text-xs text-gray-400 mt-1">6文字以上</p>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg disabled:bg-gray-400"
      >
        {loading ? "作成中..." : "アカウントを作成"}
      </button>

      <p className="text-center text-sm text-gray-500">
        すでにアカウントをお持ちの方{" "}
        <Link to="/login" className="text-teal-600 hover:underline">
          ログイン
        </Link>
      </p>
    </form>
  );
}
