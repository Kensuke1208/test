import { supabase } from "./supabase";

const DEV_EMAIL = "test@example.com";
const DEV_PASSWORD = "password123";
const DEV_LEARNER_NAME = "テスト太郎";

let bootstrapped = false;

/**
 * Ensures a test user, account, and learner exist in local Supabase.
 * Called once at app startup in dev mode. Returns the learner ID.
 */
export async function bootstrapDevAuth(): Promise<string | null> {
  if (bootstrapped) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: learners } = await supabase
      .from("learners")
      .select("id")
      .limit(1);
    return learners?.[0]?.id ?? null;
  }

  bootstrapped = true;

  // 1. Sign in or sign up
  const {
    data: { session: existing },
  } = await supabase.auth.getSession();

  let session = existing;

  if (!session) {
    const { data: signIn } = await supabase.auth.signInWithPassword({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
    });
    session = signIn?.session ?? null;
  }

  if (!session) {
    const { data: signUp } = await supabase.auth.signUp({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
      options: { data: { display_name: "テスト保護者" } },
    });
    session = signUp?.session ?? null;
  }

  if (!session) {
    console.error("Dev auth bootstrap failed: could not create session");
    return null;
  }

  // 2. Ensure learner exists
  const { data: learners } = await supabase
    .from("learners")
    .select("id")
    .limit(1);

  if (learners && learners.length > 0) {
    return learners[0].id;
  }

  const { data: created } = await supabase
    .from("learners")
    .insert({
      account_id: session.user.id,
      display_name: DEV_LEARNER_NAME,
    })
    .select("id")
    .single();

  return created?.id ?? null;
}
