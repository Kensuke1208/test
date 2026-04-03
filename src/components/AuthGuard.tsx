import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLearnerStore } from "../stores/learner-store";
import type { Session } from "@supabase/supabase-js";

interface AuthGuardProps {
  requireLearner?: boolean;
}

export function AuthGuard({ requireLearner = false }: AuthGuardProps) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const selectedLearnerId = useLearnerStore((s) => s.selectedLearnerId);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setSession(session),
    );
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  if (!session) {
    if (import.meta.env.DEV) return null;
    return <Navigate to="/login" state={{ from: location }} />;
  }
  if (requireLearner && !selectedLearnerId) {
    if (import.meta.env.DEV) return null;
    return <Navigate to="/learners" state={{ from: location }} />;
  }

  return <Outlet />;
}
