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
      <LearnerForm
        initialName={currentName}
        submitLabel="保存する"
        loadingLabel="保存中..."
        onSubmit={handleSubmit}
      />
    </div>
  );
}
