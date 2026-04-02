import { useState, useEffect, useRef } from "react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { scorePronunciation, type ScoringResponse } from "../lib/api";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { PhonemeGrid } from "../components/PhonemeGrid";
import { MistakeHints } from "../components/MistakeHints";

// Hardcoded test word from seed data
const TEST_WORD = {
  text: "river",
  meaning_ja: "川",
};

type PracticeState = "ready" | "recording" | "submitting" | "feedback";

export function DevPracticePage() {
  const { isRecording, audioBlob, error: micError, startRecording, stopRecording } =
    useAudioRecorder();
  const [state, setState] = useState<PracticeState>("ready");
  const [feedback, setFeedback] = useState<ScoringResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // When recording stops and we have audio, submit it
  const handleAudioReady = useRef<((blob: Blob) => void) | null>(null);

  handleAudioReady.current = (blob: Blob) => {
    if (state !== "recording") return;

    setState("submitting");
    setApiError(null);

    scorePronunciation(blob, TEST_WORD.text)
      .then((result) => {
        setFeedback(result);
        setState("feedback");
      })
      .catch((err) => {
        setApiError(err.message);
        setState("ready");
      });
  };

  useEffect(() => {
    if (audioBlob) handleAudioReady.current?.(audioBlob);
  }, [audioBlob]);

  const handleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      setFeedback(null);
      setState("recording");
      startRecording();
    }
  };

  const handleRetry = () => {
    setFeedback(null);
    setState("ready");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-8">
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-1">
          dev mode — Speechace API test
        </div>
        <div className="text-5xl font-bold">{TEST_WORD.text}</div>
        <div className="text-xl text-gray-600 mt-2">{TEST_WORD.meaning_ja}</div>
      </div>

      {/* Record button */}
      <button
        onClick={handleRecord}
        disabled={state === "submitting"}
        className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-lg font-bold transition-colors ${
          isRecording
            ? "bg-red-500 hover:bg-red-600 animate-pulse"
            : state === "submitting"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-teal-500 hover:bg-teal-600"
        }`}
      >
        {isRecording ? "stop" : state === "submitting" ? "..." : "rec"}
      </button>

      {/* Errors */}
      {micError && (
        <div className="text-red-500 text-sm">{micError}</div>
      )}
      {apiError && (
        <div className="text-red-500 text-sm">{apiError}</div>
      )}

      {/* Loading */}
      {state === "submitting" && (
        <div className="text-gray-500">ひょうかちゅう...</div>
      )}

      {/* Feedback */}
      {state === "feedback" && feedback && (
        <div className="w-full max-w-md space-y-6">
          <ScoreDisplay score={feedback.score} />
          <PhonemeGrid phonemes={feedback.phonemes} />
          <MistakeHints phonemes={feedback.phonemes} />
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-teal-500 text-white rounded-lg font-bold hover:bg-teal-600"
          >
            もういちど
          </button>
        </div>
      )}
    </div>
  );
}
