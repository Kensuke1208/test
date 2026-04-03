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
      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
        未挑戦
      </span>
    );
  }
  if (mastery.mastered) {
    return (
      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">
        合格
      </span>
    );
  }
  return (
    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
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
      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:border-teal-300 hover:shadow-sm transition-all"
    >
      <div>
        <span className="text-lg font-bold mr-2">{text}</span>
        <span className="text-sm text-gray-500">{meaningJa}</span>
      </div>
      <MasteryBadge mastery={mastery} />
    </Link>
  );
}
