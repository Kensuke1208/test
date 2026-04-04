import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MistakeHints } from "./MistakeHints";
import type { Phoneme } from "../lib/api";

describe("MistakeHints", () => {
  it("renders nothing when all phonemes are correct", () => {
    const phonemes: Phoneme[] = [
      { word: "cat", phone: "k", quality_score: 90, sound_most_like: "k", is_correct: true },
    ];
    const { container } = render(<MistakeHints phonemes={phonemes} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows hints for incorrect phonemes", () => {
    const phonemes: Phoneme[] = [
      { word: "river", phone: "r", quality_score: 30, sound_most_like: "l", is_correct: false },
    ];
    render(<MistakeHints phonemes={phonemes} />);
    expect(screen.getByText(/に聞こえたよ/)).toBeInTheDocument();
  });

  it("deduplicates same phone:sound_most_like pairs", () => {
    const phonemes: Phoneme[] = [
      { word: "river", phone: "r", quality_score: 30, sound_most_like: "l", is_correct: false },
      { word: "rain", phone: "r", quality_score: 40, sound_most_like: "l", is_correct: false },
    ];
    render(<MistakeHints phonemes={phonemes} />);
    const hints = screen.getAllByText(/に聞こえたよ/);
    expect(hints).toHaveLength(1);
  });

  it("limits to max hints (default 3)", () => {
    const phonemes: Phoneme[] = [
      { word: "w1", phone: "r", quality_score: 30, sound_most_like: "l", is_correct: false },
      { word: "w2", phone: "v", quality_score: 30, sound_most_like: "b", is_correct: false },
      { word: "w3", phone: "th", quality_score: 30, sound_most_like: "s", is_correct: false },
      { word: "w4", phone: "f", quality_score: 30, sound_most_like: "h", is_correct: false },
    ];
    render(<MistakeHints phonemes={phonemes} />);
    const hints = screen.getAllByText(/に聞こえたよ/);
    expect(hints).toHaveLength(3);
  });

  it("omits tip when no pronunciation tip exists for the pair", () => {
    const phonemes: Phoneme[] = [
      { word: "pen", phone: "p", quality_score: 30, sound_most_like: "b", is_correct: false },
    ];
    const { container } = render(<MistakeHints phonemes={phonemes} />);
    expect(screen.getByText(/に聞こえたよ/)).toBeInTheDocument();
    expect(container.textContent).not.toContain("💡");
  });

  it("shows pronunciation tip when available", () => {
    const phonemes: Phoneme[] = [
      { word: "river", phone: "r", quality_score: 30, sound_most_like: "l", is_correct: false },
    ];
    render(<MistakeHints phonemes={phonemes} />);
    expect(screen.getByText(/舌の先を上に曲げて/)).toBeInTheDocument();
  });
});
