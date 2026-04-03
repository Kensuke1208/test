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
        <div className="h-32 w-64 bg-gray-100 rounded-xl animate-pulse" />
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
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <button
          onClick={() => navigate(`/modules/${moduleId}`)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← もどる
        </button>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold mr-2">{data.word.text}</span>
            <span className="text-gray-500">{data.word.meaning_ja}</span>
          </div>
          <span className="text-sm text-gray-400">
            {currentStepIndex + 1} / {steps.length}
          </span>
        </div>
        <StepIndicator labels={stepLabels} currentIndex={currentStepIndex} />
      </div>

      {/* Target text */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <div className="text-3xl font-bold mb-4">{currentStep.text}</div>

        {/* Model audio button */}
        <button
          onClick={handlePlayModel}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm transition-colors"
        >
          🔊 お手本を聞く
        </button>
      </div>

      {/* Record button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleRecord}
          disabled={state === "submitting" || !hasHeardModel}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors ${
            !hasHeardModel
              ? "bg-gray-300 cursor-not-allowed"
              : isRecording
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : state === "submitting"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-teal-500 hover:bg-teal-600"
          }`}
        >
          {isRecording
            ? "とめる"
            : state === "submitting"
              ? "..."
              : "ろくおん"}
        </button>
        {!hasHeardModel && state === "ready" && (
          <p className="text-sm text-gray-400">
            まずお手本を聞いてね
          </p>
        )}
      </div>

      {/* Errors */}
      {micError && <div className="text-red-500 text-sm text-center">{micError}</div>}
      {scoreMutation.error && (
        <div className="text-red-500 text-sm text-center">
          うまくいかなかったよ。もう一度ためしてね
        </div>
      )}

      {/* Loading */}
      {state === "submitting" && (
        <div className="text-gray-500 text-center">評価中...</div>
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

          {passed ? (
            <div className="space-y-2">
              <button
                onClick={handleNext}
                className="w-full py-3 text-white rounded-lg font-bold bg-teal-500 hover:bg-teal-600"
              >
                {isLastStep ? "できた！" : "つぎへ →"}
              </button>
              <button
                onClick={handleRetry}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                もういちど練習する
              </button>
            </div>
          ) : (
            <button
              onClick={handleRetry}
              className={`w-full py-3 text-white rounded-lg font-bold ${
                tier === "close"
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-gray-500 hover:bg-gray-600"
              }`}
            >
              もういちど
            </button>
          )}
        </div>
      )}
    </div>
  );
}
