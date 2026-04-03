/**
 * score-pronunciation Edge Function
 *
 * Accepts audio + word_id (+ optional sentence_id), looks up text from DB,
 * evaluates pronunciation via Speechace API, and returns feedback.
 *
 * TODO (Phase 2): Add JWT auth + learner_id validation
 * TODO (Phase 3): Save attempts to DB
 *
 * @see docs/specs/practice/edge-functions.md
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import { scorePronunciation } from "../_shared/speechace.ts";
import { errors } from "../_shared/response.ts";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const app = new Hono().basePath("/score-pronunciation");

// TODO: Restrict origin in production
app.use("*", cors());

/**
 * POST /score-pronunciation
 *
 * Request: multipart/form-data
 *   - audio: audio file (webm, wav, mp3, etc.)
 *   - word_id: target word UUID
 *   - sentence_id: (optional) sentence UUID for sentence practice
 */
app.post("/", async (c) => {
  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return errors.badRequest("Invalid form data");
  }

  const audio = formData.get("audio");
  const wordId = formData.get("word_id") as string | null;
  const sentenceId = formData.get("sentence_id") as string | null;

  if (!audio || !(audio instanceof Blob)) {
    return errors.badRequest("audio file is required");
  }

  if (!wordId) {
    return errors.badRequest("word_id is required");
  }

  const { data: word, error: wordError } = await db
    .from("words")
    .select("text")
    .eq("id", wordId)
    .single();

  if (wordError || !word) {
    return errors.notFound(`word not found: ${wordId}`);
  }

  let text = word.text;
  let targetWord: string | null = null;

  if (sentenceId) {
    const { data: sentence, error: sentenceError } = await db
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

  try {
    const result = await scorePronunciation(audio, text, targetWord);

    return c.json({
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
