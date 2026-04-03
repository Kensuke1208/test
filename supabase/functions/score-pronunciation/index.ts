/**
 * score-pronunciation Edge Function
 *
 * Accepts audio + word_id + learner_id (+ optional sentence_id),
 * validates ownership via JWT + RLS, evaluates pronunciation via
 * Speechace API, saves attempt to DB, and returns feedback.
 *
 * Two-client pattern:
 * - userDb: anon key + user JWT for RLS-protected reads
 * - adminDb: service_role key for attempts INSERT (bypasses RLS)
 *
 * @see docs/specs/practice/edge-functions.md
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import { scorePronunciation } from "../_shared/speechace.ts";
import { errors } from "../_shared/response.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const adminDb = createClient(supabaseUrl, serviceRoleKey);

const app = new Hono().basePath("/score-pronunciation");

// TODO: Restrict origin in production
app.use("*", cors());

app.post("/", async (c) => {
  // 1. Authenticate via JWT
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return errors.unauthorized();
  }

  const userDb = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
  } = await userDb.auth.getUser();
  if (!user) {
    return errors.unauthorized();
  }

  // 2. Parse form data
  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return errors.badRequest("Invalid form data");
  }

  const audio = formData.get("audio");
  const learnerId = formData.get("learner_id") as string | null;
  const wordId = formData.get("word_id") as string | null;
  const sentenceId = formData.get("sentence_id") as string | null;

  if (!audio || !(audio instanceof Blob)) {
    return errors.badRequest("audio file is required");
  }
  if (!learnerId) {
    return errors.badRequest("learner_id is required");
  }
  if (!wordId) {
    return errors.badRequest("word_id is required");
  }

  // 3. Validate learner ownership (RLS: account_id = auth.uid())
  const { error: learnerError } = await userDb
    .from("learners")
    .select("id")
    .eq("id", learnerId)
    .single();

  if (learnerError) {
    return errors.unauthorized("Learner not found or not owned by user");
  }

  // 4. Look up word text
  const { data: word, error: wordError } = await userDb
    .from("words")
    .select("text")
    .eq("id", wordId)
    .single();

  if (wordError || !word) {
    return errors.notFound(`word not found: ${wordId}`);
  }

  let text = word.text;
  let targetWord: string | null = null;

  // 5. Look up sentence text if provided
  if (sentenceId) {
    const { data: sentence, error: sentenceError } = await userDb
      .from("sentences")
      .select("text, word_id")
      .eq("id", sentenceId)
      .single();

    if (sentenceError || !sentence) {
      return errors.notFound(`sentence not found: ${sentenceId}`);
    }

    if (sentence.word_id !== wordId) {
      return errors.badRequest("sentence does not belong to word");
    }

    text = sentence.text;
    targetWord = word.text;
  }

  // 6. Call Speechace API
  try {
    const result = await scorePronunciation(audio, text, targetWord, learnerId);

    // 7. Save attempt via service_role (bypasses RLS)
    const targetType = sentenceId ? "sentence" : "word";
    const { data: attempt, error: insertError } = await adminDb
      .from("attempts")
      .insert({
        account_id: user.id,
        learner_id: learnerId,
        word_id: wordId,
        sentence_id: sentenceId,
        target_type: targetType,
        score: result.score,
        target_word_score: result.target_word_score,
        phonemes: result.phonemes,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to save attempt:", insertError);
      return errors.internal();
    }

    return c.json({
      attempt_id: attempt.id,
      score: result.score,
      target_word_score: result.target_word_score,
      phonemes: result.phonemes,
    });
  } catch (error) {
    console.error("Speechace API error:", error);

    if (error instanceof DOMException && error.name === "TimeoutError") {
      return errors.gatewayTimeout();
    }

    if (error instanceof Error && error.message.includes("Speechace API")) {
      return errors.badGateway(error.message);
    }

    return errors.internal();
  }
});

Deno.serve(app.fetch);
