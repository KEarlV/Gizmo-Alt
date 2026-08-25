import type { StudyCard, StudyDeck } from "../drizzle/schema";

export function isValidShareToken(token: string) {
  return /^[a-f0-9]{32}$/.test(token);
}

export function assertRegenerationSource(source?: { sourceFileKey?: string | null; sourceFileName?: string | null; sourceMimeType?: string | null }): { sourceFileKey: string; sourceFileName: string; sourceMimeType: string } {
  if (!source?.sourceFileKey || !source.sourceFileName || !source.sourceMimeType) throw new Error("This deck has no original source file to regenerate from.");
  return { sourceFileKey: source.sourceFileKey, sourceFileName: source.sourceFileName, sourceMimeType: source.sourceMimeType };
}

type RegenerationSource = { sourceFileKey: string; sourceFileName: string; sourceMimeType: string };

export async function runRegenerationFlow<TGenerated, TResult>(source: RegenerationSource | undefined, readSource: (source: RegenerationSource) => Promise<Uint8Array>, generate: (source: RegenerationSource, bytes: Uint8Array) => Promise<TGenerated>, replace: (generated: TGenerated) => Promise<TResult>) {
  const validated = assertRegenerationSource(source);
  const bytes = await readSource(validated);
  const generated = await generate(validated, bytes);
  return replace(generated);
}

export function slugifyDeckTitle(title: string) {
  return title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "mochi-deck";
}

export function buildDeckExport(deck: Pick<StudyDeck, "title" | "summary">, cards: Array<Pick<StudyCard, "front" | "back" | "hint">>, format: "markdown" | "csv") {
  if (format === "csv") {
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    return { filename: `${slugifyDeckTitle(deck.title)}.csv`, contentType: "text/csv", content: ["front,back,hint", ...cards.map((card) => [card.front, card.back, card.hint ?? ""].map(escape).join(","))].join("\n") };
  }
  return { filename: `${slugifyDeckTitle(deck.title)}.md`, contentType: "text/markdown", content: [`# ${deck.title}`, "", deck.summary ?? "", "", ...cards.map((card, index) => `## Card ${index + 1}\n\n**Prompt:** ${card.front}\n\n**Answer:** ${card.back}\n\n**Hint:** ${card.hint ?? ""}`)].join("\n") };
}
