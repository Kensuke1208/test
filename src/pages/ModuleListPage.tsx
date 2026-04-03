import { Link } from "react-router-dom";
import { useModules } from "../hooks/use-modules";
import { useRecommendation } from "../hooks/use-recommendation";
import { useLearnerStore } from "../stores/learner-store";
import { ModuleCard } from "../components/ModuleCard";
import { displayPhone } from "../lib/phoneme-display";
import { getPronunciationTip } from "../lib/pronunciation-tips";

export function ModuleListPage() {
  const learnerId = useLearnerStore((s) => s.selectedLearnerId);
  const { data: modules, isLoading, error } = useModules();
  const { data: rec } = useRecommendation(learnerId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-[var(--radius-card)] bg-mint-100 animate-pulse" />
        <h2 className="text-lg font-bold">モジュール</h2>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-[var(--radius-card)] bg-mint-50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">😢</div>
        <p className="text-gray-500 font-bold">データを読み込めませんでした。もう一度試してね</p>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📚</div>
        <p className="text-gray-500 font-bold">モジュールを準備中です</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Recommendation card */}
      {rec && (
        <>
          {rec.allMastered ? (
            <div className="rounded-[var(--radius-card)] bg-gradient-to-br from-mint-100 to-mint-50 border border-mint-200 p-5 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <div className="text-lg font-bold text-mint-800">すべてマスターしました！</div>
              <p className="text-sm text-mint-600 mt-1">すごい！もう一度練習してもっと上手になろう</p>
            </div>
          ) : rec.recommended ? (
            <Link
              to={`/modules/${rec.recommended.moduleId}/words/${rec.recommended.wordId}`}
              className="block rounded-[var(--radius-card)] bg-gradient-to-br from-mint-100 to-mint-50 border border-mint-200 p-5 hover:shadow-lg hover:shadow-mint-200/40 transition-all hover:-translate-y-0.5"
            >
              <div className="text-xs text-mint-600 font-bold mb-2">
                {rec.recommended.score > 0 ? "あとちょっと！つづきを練習しよう" : "つぎはこの単語に挑戦しよう"}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-bold font-display text-gray-800">{rec.recommended.text}</span>
                  <span className="text-sm text-gray-400 font-bold ml-2">{rec.recommended.meaningJa}</span>
                </div>
                <span className="px-4 py-2 bg-mint-500 text-white font-bold text-sm rounded-xl shadow-md shadow-mint-500/30">
                  練習する
                </span>
              </div>
            </Link>
          ) : (
            <div className="rounded-[var(--radius-card)] bg-gradient-to-br from-mint-100 to-mint-50 border border-mint-200 p-5 text-center">
              <div className="text-lg font-bold text-mint-800">まずは練習をはじめよう！</div>
              <p className="text-sm text-mint-600 mt-1">下のモジュールから単語をえらんでね</p>
            </div>
          )}

          {/* Overall progress */}
          {rec.totalWords > 0 && (
            <p className="text-sm text-gray-500 font-bold">
              全部で {rec.totalWords} 単語のうち{" "}
              <span className="text-mint-600">{rec.masteredWords} 単語</span> マスター
            </p>
          )}

          {/* Phoneme hint */}
          {rec.weakestPhoneme && rec.weakestPhoneme.accuracy < 0.6 && (
            <div className="rounded-2xl bg-white/80 border border-mint-100 px-4 py-3 text-sm">
              <span className="text-gray-500 font-bold">
                ヒント: {displayPhone(rec.weakestPhoneme.phone)} の音、もう少し練習しよう
              </span>
              {rec.weakestPhoneme.mostCommonMistake && (() => {
                const tip = getPronunciationTip(rec.weakestPhoneme.phone, rec.weakestPhoneme.mostCommonMistake!);
                return tip ? (
                  <span className="text-mint-600 ml-1.5">💡 {tip}</span>
                ) : null;
              })()}
            </div>
          )}
        </>
      )}

      {/* Module list */}
      <h2 className="text-lg font-bold">モジュール</h2>
      {modules.map((m) => (
        <ModuleCard
          key={m.id}
          id={m.id}
          title={m.title}
          description={m.description}
          progress={m.progress}
        />
      ))}
    </div>
  );
}
