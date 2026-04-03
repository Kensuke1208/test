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
