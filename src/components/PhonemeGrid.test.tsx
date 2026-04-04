import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhonemeGrid } from "./PhonemeGrid";
import type { Phoneme } from "../lib/api";

describe("PhonemeGrid", () => {
  it("renders nothing when score < 60", () => {
    const phonemes: Phoneme[] = [
      { word: "cat", phone: "k", quality_score: 90, sound_most_like: "k", is_correct: true },
    ];
    const { container } = render(<PhonemeGrid phonemes={phonemes} score={59} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders phonemes at exact boundary score = 60", () => {
    const phonemes: Phoneme[] = [
      { word: "cat", phone: "k", quality_score: 90, sound_most_like: "k", is_correct: true },
    ];
    render(<PhonemeGrid phonemes={phonemes} score={60} />);
    expect(screen.getByText("k")).toBeInTheDocument();
  });

  it("renders phonemes when score >= 60", () => {
    const phonemes: Phoneme[] = [
      { word: "cat", phone: "k", quality_score: 90, sound_most_like: "k", is_correct: true },
      { word: "cat", phone: "ae", quality_score: 70, sound_most_like: "ae", is_correct: true },
    ];
    render(<PhonemeGrid phonemes={phonemes} score={75} />);
    expect(screen.getByText("k")).toBeInTheDocument();
    expect(screen.getByText("ae")).toBeInTheDocument();
  });

  it("groups phonemes by word", () => {
    const phonemes: Phoneme[] = [
      { word: "cat", phone: "k", quality_score: 90, sound_most_like: "k", is_correct: true },
      { word: "dog", phone: "d", quality_score: 80, sound_most_like: "d", is_correct: true },
    ];
    render(<PhonemeGrid phonemes={phonemes} score={80} />);
    expect(screen.getByText("cat")).toBeInTheDocument();
    expect(screen.getByText("dog")).toBeInTheDocument();
  });
});
