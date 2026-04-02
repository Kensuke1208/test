/**
 * score-pronunciation Edge Function
 *
 * MVP: Speechace API proxy without auth or DB writes.
 * Accepts audio + text, returns pronunciation score and phoneme feedback.
 *
 * @see docs/specs/practice/edge-functions.md
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { scorePronunciation } from "../_shared/speechace.ts";
import { errors } from "../_shared/response.ts";

const app = new Hono().basePath("/score-pronunciation");

app.use("*", cors());

/**
 * POST /score-pronunciation
 *
 * Request: multipart/form-data
 *   - audio: audio file (webm, wav, mp3, etc.)
 *   - text: target text to evaluate against
 *   - target_word: (optional) specific word to extract score for in sentence practice
 */
app.post("/", async (c) => {
  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return errors.badRequest("Invalid form data");
  }

  const audio = formData.get("audio");
  const text = formData.get("text");
  const targetWord = formData.get("target_word") as string | null;

  if (!audio || !(audio instanceof Blob)) {
    return errors.badRequest("audio file is required");
  }

  if (!text || typeof text !== "string") {
    return errors.badRequest("text is required");
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
