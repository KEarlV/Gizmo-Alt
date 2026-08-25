import { describe, expect, it } from "vitest";
import { extractText, generatedCardSchema, generatedDeckSchema, orderCardsByDifficulty, parseGeneratedDeckResponse, validateUpload } from "./studyImport";

describe("study import validation", () => {
  it("accepts supported study files through the 20 MB size limit", () => {
    expect(validateUpload("lecture-notes.pdf", "application/pdf", 1024)).toBe(true);
    expect(validateUpload("chapter.md", "text/markdown", 1024)).toBe(true);
    expect(validateUpload("large-notes.txt", "text/plain", 20 * 1024 * 1024)).toBe(true);
  });

  it("rejects unsupported, empty, and oversized files", () => {
    expect(() => validateUpload("photo.png", "image/png", 1024)).toThrow(/PDF, DOCX, TXT/);
    expect(() => validateUpload("notes.txt", "text/plain", 0)).toThrow(/empty/);
    expect(() => validateUpload("notes.txt", "text/plain", 20 * 1024 * 1024 + 1)).toThrow(/20 MB/);
  });

  it("extracts text and markdown content without changing the source", async () => {
    expect(await extractText("notes.txt", "text/plain", Buffer.from("Cell membrane notes"))).toBe("Cell membrane notes");
    expect(await extractText("notes.md", "text/markdown", Buffer.from("# Recall\nPractice retrieval"))).toContain("Practice retrieval");
  });

  it("accepts a strict flashcard deck shape", () => {
    const deck = generatedDeckSchema.parse({
      title: "Cell Biology",
      summary: "Core organelles and their roles.",
      mnemonic: "Mighty Cells Organize Resources.",
      cards: [
        { front: "What is ATP?", back: "A usable energy molecule for cells.", hint: "Cell power.", mnemonic: "ATP = available tiny power.", questionType: "multiple_choice", choices: ["A usable energy molecule for cells.", "A cell wall protein.", "A genetic code carrier."], correctAnswer: "A usable energy molecule for cells.", aiDifficulty: "easy", cognitiveSkill: "remember", questionRationale: "Tests direct recognition of the core definition." },
        { front: "What does a ribosome build?", back: "Proteins from amino acids.", hint: "Read the recipe.", mnemonic: "Ribo = recipe builder.", questionType: "identification", choices: [], correctAnswer: "Proteins from amino acids.", aiDifficulty: "medium", cognitiveSkill: "understand", questionRationale: "Tests understanding of a process relationship." },
        { front: "What does a membrane control?", back: "What enters and leaves a cell.", hint: "Selective gate.", mnemonic: "Membrane = mindful gatekeeper.", questionType: "identification", choices: [], correctAnswer: "What enters and leaves a cell.", aiDifficulty: "hard", cognitiveSkill: "apply", questionRationale: "Tests application of the gatekeeper concept." },
      ],
    });
    expect(deck.cards).toHaveLength(3);
  });

  it("orders generated cards from warm-up to stretch difficulty", () => {
    const base = { front: "What is a cell?", back: "A basic unit of life.", hint: "Living systems.", mnemonic: "Cell = core life unit.", questionType: "identification" as const, choices: [], correctAnswer: "A basic unit of life.", cognitiveSkill: "remember" as const, questionRationale: "Tests a direct concept recall." };
    const ordered = orderCardsByDifficulty({ title: "Order test", summary: "Difficulty ordering.", mnemonic: "Easy before hard.", cards: [
      { ...base, aiDifficulty: "hard" as const, cognitiveSkill: "apply" as const },
      { ...base, front: "What is ATP?", aiDifficulty: "easy" as const },
      { ...base, front: "What does a membrane do?", aiDifficulty: "medium" as const, cognitiveSkill: "understand" as const },
    ] });
    expect(ordered.cards.map((card) => card.aiDifficulty)).toEqual(["easy", "medium", "hard"]);
  });

  it("accepts a valid structured generation response", () => {
    const raw = JSON.stringify({
      title: "Cell Biology Recall",
      summary: "Core organelles and their roles.",
      mnemonic: "Mighty Cells Organize Resources.",
      cards: [
        { front: "What is ATP?", back: "A usable energy molecule for cells.", hint: "Cell power.", mnemonic: "ATP = available tiny power.", questionType: "multiple_choice", choices: ["A usable energy molecule for cells.", "A cell wall protein.", "A genetic code carrier."], correctAnswer: "A usable energy molecule for cells.", aiDifficulty: "easy", cognitiveSkill: "remember", questionRationale: "Tests direct recognition of the core definition." },
        { front: "What does a ribosome build?", back: "Proteins from amino acids.", hint: "Read the recipe.", mnemonic: "Ribo = recipe builder.", questionType: "identification", choices: [], correctAnswer: "Proteins from amino acids.", aiDifficulty: "medium", cognitiveSkill: "understand", questionRationale: "Tests understanding of a process relationship." },
        { front: "What does a membrane control?", back: "What enters and leaves a cell.", hint: "Selective gate.", mnemonic: "Membrane = mindful gatekeeper.", questionType: "identification", choices: [], correctAnswer: "What enters and leaves a cell.", aiDifficulty: "hard", cognitiveSkill: "apply", questionRationale: "Tests application of the gatekeeper concept." },
      ],
    });
    expect(parseGeneratedDeckResponse(raw).cards).toHaveLength(3);
  });

  it("recovers fenced legacy JSON and fills missing AI metadata", () => {
    const raw = "```json\n" + JSON.stringify({ title: "Legacy deck", summary: "A legacy response with enough source detail.", mnemonic: "Keep the thread.", cards: [
      { front: "What is ATP?", back: "A usable energy molecule for cells.", hint: "Cell power.", mnemonic: "ATP = power.", questionType: "multiple_choice", choices: ["A usable energy molecule for cells.", "A cell wall protein."], correctAnswer: "A usable energy molecule for cells." },
      { front: "What does a ribosome build?", back: "Proteins from amino acids.", hint: "Read the recipe.", mnemonic: "Ribo builds.", questionType: "identification", choices: [], correctAnswer: "Proteins from amino acids." },
      { front: "What does a membrane control?", back: "What enters and leaves a cell.", hint: "Selective gate.", mnemonic: "Mindful gate.", questionType: "identification", choices: [], correctAnswer: "What enters and leaves a cell." },
    ] }) + "\n```";
    const recovered = parseGeneratedDeckResponse(raw);
    expect(recovered.cards[0].aiDifficulty).toBe("easy");
    expect(recovered.cards[0].choices).toHaveLength(4);
    expect(recovered.cards[2].questionRationale).toContain("Recovered");
  });

  it("rejects invalid AI difficulty and cognitive-skill metadata", () => {
    const validCard = { front: "What is ATP?", back: "A usable energy molecule for cells.", hint: "Cell power.", mnemonic: "ATP = available tiny power.", questionType: "identification", choices: [], correctAnswer: "A usable energy molecule for cells.", aiDifficulty: "easy", cognitiveSkill: "remember", questionRationale: "Tests direct recall of a definition." };
    expect(() => generatedCardSchema.parse({ ...validCard, aiDifficulty: "extreme" })).toThrow();
    expect(() => generatedCardSchema.parse({ ...validCard, cognitiveSkill: "memorize" })).toThrow();
  });

  it("rejects weak multiple-choice distractor sets", () => {
    const validCard = { front: "What is ATP?", back: "A usable energy molecule for cells.", hint: "Cell power.", mnemonic: "ATP = available tiny power.", questionType: "multiple_choice", choices: ["A usable energy molecule for cells.", "A cell wall protein.", "A genetic code carrier."], correctAnswer: "A usable energy molecule for cells.", aiDifficulty: "easy", cognitiveSkill: "remember", questionRationale: "Tests direct recognition of the core definition." };
    expect(() => generatedCardSchema.parse({ ...validCard, choices: [validCard.correctAnswer, "A cell wall protein."] })).toThrow(/3-4 unique/);
    expect(() => generatedCardSchema.parse({ ...validCard, choices: [validCard.correctAnswer, "A cell wall protein.", "A cell wall protein."] })).toThrow(/3-4 unique/);
    expect(() => generatedCardSchema.parse({ ...validCard, correctAnswer: "Not an option" })).toThrow(/3-4 unique/);
  });

  it("rejects incomplete model output and malformed JSON", () => {
    expect(() => generatedDeckSchema.parse({ title: "Too thin", cards: [] })).toThrow();
    expect(() => parseGeneratedDeckResponse("not-json")).toThrow(/unreadable deck/);
  });
});
