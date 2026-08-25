import { describe, expect, it } from "vitest";
import { extractText, generatedDeckSchema, parseGeneratedDeckResponse, validateUpload } from "./studyImport";

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
        { front: "What is ATP?", back: "A usable energy molecule for cells.", hint: "Cell power.", mnemonic: "ATP = available tiny power.", questionType: "multiple_choice", choices: ["A usable energy molecule for cells.", "A cell wall protein."], correctAnswer: "A usable energy molecule for cells." },
        { front: "What does a ribosome build?", back: "Proteins from amino acids.", hint: "Read the recipe.", mnemonic: "Ribo = recipe builder.", questionType: "identification", choices: [], correctAnswer: "Proteins from amino acids." },
        { front: "What does a membrane control?", back: "What enters and leaves a cell.", hint: "Selective gate.", mnemonic: "Membrane = mindful gatekeeper.", questionType: "identification", choices: [], correctAnswer: "What enters and leaves a cell." },
      ],
    });
    expect(deck.cards).toHaveLength(3);
  });

  it("rejects incomplete model output and malformed JSON", () => {
    expect(() => generatedDeckSchema.parse({ title: "Too thin", cards: [] })).toThrow();
    expect(() => parseGeneratedDeckResponse("not-json")).toThrow(/unreadable deck/);
  });
});
