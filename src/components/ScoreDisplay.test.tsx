import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreDisplay } from "./ScoreDisplay";
import type { Phoneme } from "../lib/api";

const phonemes: Phoneme[] = [
  { word: "river", phone: "r", quality_score: 90, sound_most_like: "r", is_correct: true },
  { word: "river", phone: "ih", quality_score: 80, sound_most_like: "ih", is_correct: true },
  { word: "river", phone: "v", quality_score: 30, sound_most_like: "b", is_correct: false },
];

describe("ScoreDisplay", () => {
  it("shows the score number", () => {
    render(<ScoreDisplay score={85} phonemes={phonemes} />);
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("shows correct count", () => {
    render(<ScoreDisplay score={85} phonemes={phonemes} />);
    expect(screen.getByText(/3この音のうち 2こ 正解/)).toBeInTheDocument();
  });

  it("shows tier message for excellent", () => {
    render(<ScoreDisplay score={95} phonemes={phonemes} />);
    expect(screen.getByText(/かんぺき/)).toBeInTheDocument();
  });

  it("shows tier message for retry", () => {
    render(<ScoreDisplay score={40} phonemes={phonemes} />);
    expect(screen.getByText(/お手本を聞いてから/)).toBeInTheDocument();
  });

  it("shows improvement when previousCorrectCount is lower", () => {
    render(<ScoreDisplay score={85} phonemes={phonemes} previousCorrectCount={1} />);
    expect(screen.getByText(/前は 1こ → 今は 2こ/)).toBeInTheDocument();
  });

  it("does not show improvement when previousCorrectCount is same or higher", () => {
    const { container } = render(
      <ScoreDisplay score={85} phonemes={phonemes} previousCorrectCount={2} />,
    );
    expect(container.textContent).not.toContain("前は");
  });
});
