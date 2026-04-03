import type { Database } from "./database.types";

type ModuleProgressRow =
  Database["public"]["Views"]["v_module_progress"]["Row"];
type WordMasteryRow = Database["public"]["Views"]["v_word_mastery"]["Row"];

export interface ModuleProgress {
  mastered_words: number;
  total_words: number;
  completed: boolean;
}

export interface WordMastery {
  score: number;
  steps_cleared: number;
  steps_total: number;
  mastered: boolean;
}

export function toModuleProgress(row: ModuleProgressRow): ModuleProgress {
  return {
    mastered_words: row.mastered_words ?? 0,
    total_words: row.total_words ?? 0,
    completed: row.completed ?? false,
  };
}

export function toWordMastery(row: WordMasteryRow): WordMastery {
  return {
    score: row.score ?? 0,
    steps_cleared: row.steps_cleared ?? 0,
    steps_total: row.steps_total ?? 0,
    mastered: row.mastered ?? false,
  };
}
