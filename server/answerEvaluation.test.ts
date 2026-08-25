import { describe, expect, it } from "vitest";
import { evaluateAnswer, normalizeAnswer } from "./answerEvaluation";

describe("interactive answer evaluation", () => {
  it("matches a selected multiple-choice option exactly", () => {
    expect(evaluateAnswer({ questionType: "multiple_choice", answer: "Mitochondrion", correctAnswer: "Mitochondrion" })).toBe(true);
    expect(evaluateAnswer({ questionType: "multiple_choice", answer: "Ribosome", correctAnswer: "Mitochondrion" })).toBe(false);
  });

  it("accepts case and punctuation differences for identification", () => {
    expect(normalizeAnswer(" ATP! ")).toBe("atp");
    expect(evaluateAnswer({ questionType: "identification", answer: "Cell respiration", correctAnswer: "cell respiration" })).toBe(true);
    expect(evaluateAnswer({ questionType: "identification", answer: "respiration", correctAnswer: "cell respiration" })).toBe(true);
  });

  it("rejects empty or unrelated identification responses", () => {
    expect(evaluateAnswer({ questionType: "identification", answer: "", correctAnswer: "The nucleus" })).toBe(false);
    expect(evaluateAnswer({ questionType: "identification", answer: "The membrane", correctAnswer: "The nucleus" })).toBe(false);
  });
});
