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
        {loading ? loadingLabel : submitLabel}
      </button>
    </form>
  );
}

export function handleLearnerError(error: { code?: string }): string {
  if (error.code === "23505") return "この名前は既に使われています";
  return "保存できませんでした";
}
