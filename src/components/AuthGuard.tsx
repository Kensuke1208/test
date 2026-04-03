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
  const clear = useLearnerStore((s) => s.clear);
  const location = useLocation();
  // undefined = checking, true = valid, false = invalid
  const [learnerValid, setLearnerValid] = useState<boolean | undefined>(
    requireLearner && selectedLearnerId ? undefined : true,
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setSession(session),
    );
    return () => subscription.unsubscribe();
  }, []);

  // Validate that selectedLearnerId exists in DB
  useEffect(() => {
    if (!requireLearner || !selectedLearnerId || !session) return;

    setLearnerValid(undefined);
    supabase
      .from("learners")
      .select("id")
      .eq("id", selectedLearnerId)
      .single()
      .then(({ error }) => {
        if (error) {
          clear();
          setLearnerValid(false);
        } else {
          setLearnerValid(true);
        }
      });
  }, [requireLearner, selectedLearnerId, session, clear]);

  // Loading session
  if (session === undefined) return null;

  // Not authenticated
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  // Learner required but not selected or invalid
  if (requireLearner) {
    if (!selectedLearnerId || learnerValid === false) {
      return <Navigate to="/learners" state={{ from: location }} />;
    }
    if (learnerValid === undefined) return null;
  }

  return <Outlet />;
}
