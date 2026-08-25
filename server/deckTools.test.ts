import { describe, expect, it } from "vitest";
import { assertRegenerationSource, buildDeckExport, isValidShareToken, runRegenerationFlow, slugifyDeckTitle } from "./deckTools";

const deck = { title: "Cell Biology / Midterm", summary: "Organelles and membranes." };
const cards = [{ front: "What is ATP?", back: "The cell's usable energy currency.", hint: "Think energy." }];

describe("deck management helpers", () => {
  it("accepts only generated share tokens", () => {
    expect(isValidShareToken("0123456789abcdef0123456789abcdef")).toBe(true);
    expect(isValidShareToken("too-short")).toBe(false);
    expect(isValidShareToken("0123456789abcdef0123456789ABCDEG")).toBe(false);
  });

  it("rejects regeneration without an original source", () => {
    expect(() => assertRegenerationSource(undefined)).toThrow("original source file");
    expect(assertRegenerationSource({ sourceFileKey: "notes/a.txt", sourceFileName: "a.txt", sourceMimeType: "text/plain" })).toEqual({ sourceFileKey: "notes/a.txt", sourceFileName: "a.txt", sourceMimeType: "text/plain" });
  });

  it("runs regeneration through source, generation, and replacement stages", async () => {
    const source = { sourceFileKey: "notes/a.txt", sourceFileName: "a.txt", sourceMimeType: "text/plain" };
    const result = await runRegenerationFlow(source, async () => new Uint8Array([1, 2]), async (validated, bytes) => ({ title: validated.sourceFileName, byteCount: bytes.length }), async (generated) => ({ saved: generated.title, bytes: generated.byteCount }));
    expect(result).toEqual({ saved: "a.txt", bytes: 2 });
    await expect(runRegenerationFlow(source, async () => new Uint8Array([1]), async () => ({ title: "new" }), async () => { throw new Error("replacement failed"); })).rejects.toThrow("replacement failed");
  });

  it("creates safe export filenames", () => {
    expect(slugifyDeckTitle(deck.title)).toBe("cell-biology-midterm");
  });

  it("exports markdown and escaped CSV content", () => {
    const markdown = buildDeckExport(deck, cards, "markdown");
    const csv = buildDeckExport(deck, [{ ...cards[0], back: 'Say "energy"' }], "csv");
    expect(markdown.filename).toBe("cell-biology-midterm.md");
    expect(markdown.content).toContain("**Prompt:** What is ATP?");
    expect(csv.filename).toBe("cell-biology-midterm.csv");
    expect(csv.content).toContain('"Say ""energy"""');
  });
});
