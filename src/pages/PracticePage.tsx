import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { usePracticeData, useScoreMutation } from "../hooks/use-practice";
import { useTts } from "../hooks/use-tts";
import { useAudioRecorder } from "../hooks/use-audio-recorder";
import { useLearnerStore } from "../stores/learner-store";
import { isPassing, getScoreTier } from "../lib/score";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { PhonemeGrid } from "../components/PhonemeGrid";
import { MistakeHints } from "../components/MistakeHints";
import { StepIndicator } from "../components/StepIndicator";
import type { ScoringResponse } from "../lib/api";

type PracticeState = "ready" | "recording" | "submitting" | "feedback";

interface Step {
  type: "word" | "sentence";
  text: string;
  sentenceId?: string;
  audioUrl: string | null;
  stepKey: string;
}

export function PracticePage() {
  const { moduleId, wordId } = useParams<{
    moduleId: string;
    wordId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const learnerId = useLearnerStore((s) => s.selectedLearnerId);
  const { data, isLoading, error } = usePracticeData(wordId);
  const { speak } = useTts();
  const {
    isRecording,
    audioBlob,
    error: micError,
    startRecording,
    stopRecording,
  } = useAudioRecorder();
  const scoreMutation = useScoreMutation();

  const [state, setState] = useState<PracticeState>("ready");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<ScoringResponse | null>(null);
  const [previousCorrectCount, setPreviousCorrectCount] = useState<
    number | undefined
  >(undefined);
  const [hasHeardModel, setHasHeardModel] = useState(false);
  const [initialStepSet, setInitialStepSet] = useState(false);

  const handleAudioReady = useRef<((blob: Blob) => void) | null>(null);

  const steps = useMemo<Step[]>(() => {
    if (!data) return [];
    return [
      {
        type: "word",
        text: data.word.text,
        audioUrl: data.word.audio_url,
        stepKey: "word",
      },
      ...data.sentences.map((s) => ({
        type: "sentence" as const,
        text: s.text,
        sentenceId: s.id,
        audioUrl: s.audio_url,
        stepKey: `sentence:${s.id}`,
      })),
    ];
  }, [data]);

  const currentStep = steps[currentStepIndex];

  const stepLabels = useMemo(() => {
    if (!data) return [];
    return [
      "たんご",
      ...data.sentences.map((_, i) => `文${i + 1}`),
    ];
  }, [data]);

  // Set initial step based on past attempts (resume position)
  useEffect(() => {
    if (!data || initialStepSet || steps.length === 0) return;
    setInitialStepSet(true);

    const firstUnpassed = steps.findIndex(
      (s) => !data.passedSteps.has(s.stepKey),
    );

    // All passed → start from beginning for re-practice
    setCurrentStepIndex(firstUnpassed === -1 ? 0 : firstUnpassed);
  }, [data, steps, initialStepSet]);

  // Reset state when step changes
  useEffect(() => {
    setHasHeardModel(false);
    setFeedback(null);
    setPreviousCorrectCount(undefined);
    setState("ready");
  }, [currentStepIndex]);

  // Handle audio blob ready
  handleAudioReady.current = (blob: Blob) => {
    if (state !== "recording" || !currentStep || !wordId || !learnerId) return;

    setState("submitting");

    scoreMutation.mutate(
      {
        audio: blob,
        learnerId,
        wordId,
        sentenceId: currentStep.sentenceId,
      },
      {
        onSuccess: (result) => {
          if (feedback) {
            const prevCorrect = feedback.phonemes.filter(
              (p) => p.is_correct,
            ).length;
            setPreviousCorrectCount(prevCorrect);
          }
          setFeedback(result);
          setState("feedback");

          // Invalidate to update progress/mastery displays
          queryClient.invalidateQueries({
            queryKey: ["practice-data", wordId],
          });
          queryClient.invalidateQueries({ queryKey: ["module-detail"] });
          queryClient.invalidateQueries({ queryKey: ["modules"] });
        },
        onError: () => {
          setState("ready");
        },
      },
    );
  };

  useEffect(() => {
    if (audioBlob) handleAudioReady.current?.(audioBlob);
  }, [audioBlob]);

  // Redirect if word not found
  useEffect(() => {
    if (!isLoading && !data?.word) {
      navigate(`/modules/${moduleId}`, { replace: true });
    }
  }, [isLoading, data, navigate, moduleId]);

  if (isLoading || !initialStepSet) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-lg mx-auto space-y-4 px-4">
          <div className="h-8 w-32 bg-mint-100 rounded-2xl animate-pulse" />
          <div className="h-48 bg-mint-50 rounded-[var(--radius-card)] animate-pulse" />
          <div className="h-20 w-20 mx-auto bg-mint-100 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data || !currentStep) return null;

  const handlePlayModel = () => {
    if (currentStep.audioUrl) {
      new Audio(currentStep.audioUrl).play();
    } else {
      speak(currentStep.text);
    }
    setHasHeardModel(true);
  };

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
    setState("ready");
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      navigate(`/modules/${moduleId}`);
    }
  };

  const passed = feedback ? isPassing(feedback.score) : false;
  const isLastStep = currentStepIndex === steps.length - 1;
  const tier = feedback ? getScoreTier(feedback.score) : null;

  return (
    <div className="max-w-lg mx-auto px-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(`/modules/${moduleId}`)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-mint-600 font-bold transition-colors"
        >
          <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          もどる
        </button>
        <span className="text-xs text-gray-400 font-bold bg-white/60 px-3 py-1 rounded-full">
          {currentStepIndex + 1} / {steps.length}
        </span>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex justify-center">
        <StepIndicator labels={stepLabels} currentIndex={currentStepIndex} />
      </div>

      {/* Word info bar */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-lg font-bold font-display text-mint-800">{data.word.text}</span>
        <span className="text-sm text-gray-400 font-bold">{data.word.meaning_ja}</span>
      </div>

      {/* Target text card */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-lg shadow-mint-200/40 border border-mint-100 p-8 text-center mb-6">
        <p className="text-xs text-mint-500 font-bold mb-3 tracking-wide">
          よく聞いて、まねして言ってみよう！
        </p>
        <div className="text-4xl font-bold font-display text-gray-800 mb-5 leading-tight">
          {currentStep.text}
        </div>

        {/* Model audio button */}
        <button
          onClick={handlePlayModel}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-mint-100 hover:bg-mint-200 text-mint-700 font-bold text-sm transition-all hover:scale-105 active:scale-95"
        >
          <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          お手本を聞く
        </button>
      </div>

      {/* Record button */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="relative">
          {/* Pulse ring when recording */}
          {isRecording && (
            <div className="absolute inset-0 rounded-full bg-coral-400 animate-pulse-ring" />
          )}
          {/* Submitting spinner ring */}
          {state === "submitting" && (
            <div className="absolute inset-[-6px] rounded-full border-4 border-mint-200 border-t-mint-500 animate-spin" />
          )}
          <button
            onClick={handleRecord}
            disabled={state === "submitting" || !hasHeardModel}
            className={`relative w-[4.5rem] h-[4.5rem] rounded-full flex items-center justify-center text-white font-bold text-xs transition-all ${
              !hasHeardModel
                ? "bg-gray-300 cursor-not-allowed"
                : isRecording
                  ? "bg-coral-500 scale-110 shadow-xl shadow-coral-500/40"
                  : state === "submitting"
                    ? "bg-mint-300 cursor-not-allowed"
                    : "bg-mint-500 hover:bg-mint-600 shadow-lg shadow-mint-500/40 hover:scale-105 active:scale-95"
            }`}
          >
            {isRecording ? (
              <svg aria-hidden="true" className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : state === "submitting" ? (
              <svg aria-hidden="true" className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </button>
        </div>

        {/* Helper text */}
        <p className="text-sm font-bold text-gray-400">
          {!hasHeardModel && state === "ready"
            ? "まずお手本を聞いてね"
            : isRecording
              ? "話し終わったらボタンを押してね"
              : state === "submitting"
                ? "聞いているよ..."
                : "ボタンを押して話してね"}
        </p>
      </div>

      {/* Errors */}
      {micError && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-600 text-center font-bold mb-4">
          {micError}
        </div>
      )}
      {scoreMutation.error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-600 text-center font-bold mb-4">
          うまくいかなかったよ。もう一度ためしてね
        </div>
      )}

      {/* Feedback */}
      {state === "feedback" && feedback && (
        <div className="space-y-4">
          <ScoreDisplay
            score={feedback.score}
            phonemes={feedback.phonemes}
            previousCorrectCount={previousCorrectCount}
          />
          <PhonemeGrid phonemes={feedback.phonemes} score={feedback.score} />
          <MistakeHints phonemes={feedback.phonemes} />

          {/* Action buttons */}
          <div className="pt-2 space-y-2">
            {passed ? (
              <>
                <button
                  onClick={handleNext}
                  className="w-full py-3.5 text-white rounded-[var(--radius-button)] font-bold text-lg bg-mint-500 hover:bg-mint-600 shadow-lg shadow-mint-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] animate-confetti-pop"
                >
                  {isLastStep ? "🎊 できた！" : "つぎへ →"}
                </button>
                <button
                  onClick={handleRetry}
                  className="w-full py-2.5 text-sm text-gray-400 hover:text-mint-600 font-bold transition-colors"
                >
                  もういちど練習する
                </button>
              </>
            ) : (
              <button
                onClick={handleRetry}
                className={`w-full py-3.5 text-white rounded-[var(--radius-button)] font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                  tier === "close"
                    ? "bg-sun-400 hover:bg-sun-500 shadow-sun-400/30"
                    : "bg-gray-400 hover:bg-gray-500 shadow-gray-400/30"
                }`}
              >
                もういちど
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
