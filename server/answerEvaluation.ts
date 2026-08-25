export type QuestionType = "multiple_choice" | "identification";

export function normalizeAnswer(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[\u2018\u2019']/g, "'").replace(/[^a-z0-9\s]/gi, "").replace(/\s+/g, " ");
}

export function evaluateAnswer(input: { questionType: QuestionType; answer: string; correctAnswer: string }) {
  if (input.questionType === "multiple_choice") return input.answer.trim() === input.correctAnswer.trim();
  const actual = normalizeAnswer(input.answer);
  const expected = normalizeAnswer(input.correctAnswer);
  if (!actual || !expected) return false;
  return actual === expected || actual.includes(expected) || expected.includes(actual);
}
