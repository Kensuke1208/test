import { useState } from "react";

interface LearnerFormProps {
  initialName?: string;
  submitLabel: string;
  loadingLabel: string;
  onSubmit: (displayName: string) => Promise<string | null>;
}

export function LearnerForm({
  initialName = "",
  submitLabel,
  loadingLabel,
  onSubmit,
}: LearnerFormProps) {
  const [displayName, setDisplayName] = useState(initialName);
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

    const errorMessage = await onSubmit(displayName.trim());

    setLoading(false);

    if (errorMessage) {
      setError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-600 mb-1.5">名前</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoFocus
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
        {loading ? loadingLabel : submitLabel}
      </button>
    </form>
  );
}

export function handleLearnerError(error: { code?: string }): string {
  if (error.code === "23505") return "この名前は既に使われています";
  return "保存できませんでした";
}
