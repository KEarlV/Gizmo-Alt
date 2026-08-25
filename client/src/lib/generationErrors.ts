export function humanizeGenerationError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/Unexpected token|DOCTYPE|520|fetch failed|Network error/i.test(message)) {
    return "Miso could not finish shaping this deck in time. Try again with a shorter file or a smaller set of notes.";
  }
  return message || "Miso could not shape that deck. Please try again.";
}
