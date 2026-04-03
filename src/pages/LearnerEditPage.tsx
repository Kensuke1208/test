import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { LearnerForm, handleLearnerError } from "../components/LearnerForm";

export function LearnerEditPage() {
  const { learnerId } = useParams<{ learnerId: string }>();
  const navigate = useNavigate();
  const [currentName, setCurrentName] = useState<string | null>(null);

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
        setCurrentName(data.display_name);
      });
  }, [learnerId, navigate]);

  const handleSubmit = async (displayName: string): Promise<string | null> => {
    const { error } = await supabase
      .from("learners")
      .update({ display_name: displayName })
      .eq("id", learnerId!);

    if (error) return handleLearnerError(error);

    navigate("/learners");
    return null;
  };

  if (currentName === null) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-mint-50 rounded-2xl animate-pulse" />
        <div className="h-12 bg-mint-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          to="/learners"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-mint-100 text-gray-400 hover:text-mint-600 hover:border-mint-300 transition-all"
        >
          <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">学習者を編集</h1>
      </div>
      <LearnerForm
        initialName={currentName}
        submitLabel="保存する"
        loadingLabel="保存中..."
        onSubmit={handleSubmit}
      />
    </div>
  );
}
