import { useState } from "react";
import { Link } from "react-router-dom";
import { useLearners } from "../hooks/use-learners";
import { useParentDashboard } from "../hooks/use-parent-dashboard";
import { ProgressBar } from "../components/ProgressBar";
import { displayPhone } from "../lib/phoneme-display";

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

function accuracyLabel(accuracy: number): { text: string; color: string } {
  if (accuracy < 0.4) return { text: "にがて", color: "text-coral-500" };
  if (accuracy < 0.6) return { text: "もう少し", color: "text-sun-500" };
  return { text: "あとちょっと", color: "text-amber-500" };
}

export function ParentDashboardPage() {
  const { data: learners, isLoading: learnersLoading } = useLearners();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedLearner = learners?.[selectedIndex] ?? null;
  const { data, isLoading } = useParentDashboard(selectedLearner?.id ?? null);

  if (learnersLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">学習状況</h1>
        <div className="h-40 rounded-[var(--radius-card)] bg-mint-50 animate-pulse" />
      </div>
    );
  }

  if (!learners || learners.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">学習状況</h1>
        <div className="rounded-[var(--radius-card)] bg-white border border-mint-100 p-8 text-center space-y-4">
          <p className="text-gray-500 font-bold">学習者を追加してね</p>
          <Link
            to="/learners/new"
            className="inline-flex items-center gap-1.5 px-6 py-3 bg-mint-500 hover:bg-mint-600 text-white font-bold rounded-xl shadow-md shadow-mint-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            ＋ 追加する
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">学習状況</h1>

      {/* Learner switcher */}
      {learners.length > 1 && (
        <div className="flex gap-2">
          {learners.map((l, i) => (
            <button
              key={l.id}
              onClick={() => setSelectedIndex(i)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                i === selectedIndex
                  ? "bg-mint-500 text-white shadow-md shadow-mint-500/30"
                  : "bg-white border border-mint-100 text-gray-500 hover:border-mint-300"
              }`}
            >
              {l.display_name}
            </button>
          ))}
        </div>
      )}

      {/* Single learner name when only 1 */}
      {learners.length === 1 && (
        <p className="text-sm text-gray-500 font-bold">{learners[0].display_name} の学習状況</p>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 rounded-[var(--radius-card)] bg-mint-50 animate-pulse" />
          <div className="h-24 rounded-[var(--radius-card)] bg-mint-50 animate-pulse" />
        </div>
      ) : data ? (
        <>
          {/* Practice consistency */}
          <div className="rounded-[var(--radius-card)] bg-white border border-mint-100 p-5">
            <h2 className="text-sm text-gray-500 font-bold mb-3">練習の取り組み</h2>

            {/* Weekly dots */}
            <div className="flex justify-between mb-3">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      data.practiceDays.has(i)
                        ? "bg-mint-500 text-white"
                        : "bg-gray-100 text-gray-300"
                    }`}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-gray-700">
                今週 <span className="text-mint-600 text-lg">{data.daysCount}</span>日 練習した
              </span>
              {data.lastPracticeDate && (
                <span className={`font-bold ${
                  data.daysSinceLastPractice !== null && data.daysSinceLastPractice >= 3
                    ? "text-coral-500"
                    : "text-gray-400"
                }`}>
                  最後の練習: {data.lastPracticeDate}
                </span>
              )}
            </div>

            {!data.lastPracticeDate && (
              <p className="text-sm text-gray-400 font-bold text-center mt-2">まだ練習していません</p>
            )}
          </div>

          {/* Recent activity */}
          {data.recentActivity.length > 0 && (
            <div className="rounded-[var(--radius-card)] bg-white border border-mint-100 p-5">
              <h2 className="text-sm text-gray-500 font-bold mb-3">最近の練習</h2>
              <div className="space-y-2">
                {data.recentActivity.map((group) => (
                  <div key={group.date}>
                    {group.entries.map((entry, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm py-1.5">
                        <span className="text-xs text-gray-400 font-bold w-10 flex-shrink-0">{group.date}</span>
                        <span className="font-bold text-gray-700">{entry.moduleTitle}</span>
                        <span className="text-gray-400">
                          {entry.wordCount}単語を練習
                          {entry.passedCount > 0 && (
                            <span className="text-mint-600 ml-1">
                              {entry.passedCount}単語合格
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievement snapshot */}
          <div className="rounded-[var(--radius-card)] bg-white border border-mint-100 p-5">
            <h2 className="text-sm text-gray-500 font-bold mb-3">達成状況</h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm font-bold mb-1.5">
                  <span className="text-gray-700">マスターした単語</span>
                  <span className="text-mint-600">{data.masteredWords} / {data.totalWords}</span>
                </div>
                <ProgressBar current={data.masteredWords} total={data.totalWords} />
              </div>
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-gray-700">クリアしたモジュール</span>
                <span className="text-mint-600">{data.completedModules} / {data.totalModules}</span>
              </div>
            </div>
          </div>

          {/* Pronunciation overview */}
          <div className="rounded-[var(--radius-card)] bg-white border border-mint-100 p-5">
            <h2 className="text-sm text-gray-500 font-bold mb-3">発音の様子</h2>
            {data.weakPhonemes.length > 0 || data.strongPhonemes.length > 0 ? (
              <div className="space-y-4">
                {data.strongPhonemes.length > 0 && (
                  <div className="space-y-1.5">
                    {data.strongPhonemes.map((p) => (
                      <div key={p.phone} className="flex items-center justify-between text-sm">
                        <span className="font-bold text-gray-700">{displayPhone(p.phone)} の音</span>
                        <span className="font-bold text-mint-600">得意</span>
                      </div>
                    ))}
                  </div>
                )}
                {data.weakPhonemes.length > 0 && data.strongPhonemes.length > 0 && (
                  <div className="border-t border-gray-100" />
                )}
                {data.weakPhonemes.length > 0 && (
                  <div className="space-y-1.5">
                    {data.weakPhonemes.map((p) => {
                      const label = accuracyLabel(p.accuracy);
                      return (
                        <div key={p.phone} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-bold text-gray-700">{displayPhone(p.phone)} の音</span>
                            {p.mostCommonMistake && (
                              <span className="text-gray-400 ml-1.5">
                                → {displayPhone(p.mostCommonMistake)} とまちがえやすい
                              </span>
                            )}
                          </div>
                          <span className={`font-bold ${label.color}`}>{label.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 font-bold">まだデータがありません。練習をつづけるとここに出てくるよ</p>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-2">
            <Link to="/learners" className="text-sm text-gray-400 hover:text-mint-600 font-bold transition-colors">
              学習者の選択にもどる
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
