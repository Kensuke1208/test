import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { LearnerForm, handleLearnerError } from "../components/LearnerForm";

export function LearnerCreatePage() {
  const navigate = useNavigate();

  const handleSubmit = async (displayName: string): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/login");
      return null;
    }

    const { error } = await supabase.from("learners").insert({
      account_id: session.user.id,
      display_name: displayName,
    });

    if (error) return handleLearnerError(error);

    navigate("/learners");
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/learners" className="text-gray-400 hover:text-gray-600 text-xl">
          ←
        </Link>
        <h1 className="text-2xl font-bold">学習者を追加</h1>
      </div>
      <LearnerForm
        submitLabel="追加する"
        loadingLabel="追加中..."
        onSubmit={handleSubmit}
      />
    </div>
  );
}
