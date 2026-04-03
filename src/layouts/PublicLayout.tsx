import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function PublicLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/learners", { replace: true });
      } else {
        setReady(true);
      }
    });
  }, [navigate]);

  if (!ready) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black font-display text-mint-700 tracking-tight mb-1">
            Eigo
          </h1>
          <p className="text-sm text-gray-400 font-bold">英語の発音を練習しよう</p>
        </div>
        <div className="bg-white rounded-[var(--radius-card)] border border-mint-100 shadow-lg shadow-mint-200/30 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
