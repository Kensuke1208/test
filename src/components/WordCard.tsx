import { Link } from "react-router-dom";
import type { WordMastery } from "../lib/view-types";

interface WordCardProps {
  moduleId: string;
  id: string;
  text: string;
  meaningJa: string;
  mastery: WordMastery | null;
}

function MasteryBadge({
  mastery,
}: {
  mastery: WordCardProps["mastery"];
}) {
  if (!mastery) {
    return (
      <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full font-bold">
        未挑戦
      </span>
    );
  }
  if (mastery.mastered) {
    return (
      <span className="flex items-center gap-1 text-xs bg-mint-100 text-mint-700 px-2.5 py-1 rounded-full font-bold">
        <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        合格
      </span>
    );
  }
  return (
    <span className="text-xs bg-sun-400/20 text-amber-700 px-2.5 py-1 rounded-full font-bold">
      練習中
    </span>
  );
}

export function WordCard({
  moduleId,
  id,
  text,
  meaningJa,
  mastery,
}: WordCardProps) {
  return (
    <Link
      to={`/modules/${moduleId}/words/${id}`}
      className="flex items-center justify-between rounded-2xl bg-white border border-mint-100 px-4 py-3.5 hover:border-mint-300 hover:shadow-md hover:shadow-mint-200/30 transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold font-display">{text}</span>
        <span className="text-sm text-gray-400 font-bold">{meaningJa}</span>
      </div>
      <MasteryBadge mastery={mastery} />
    </Link>
  );
}
