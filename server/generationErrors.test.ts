import { describe, expect, it } from "vitest";
import { humanizeGenerationError } from "../client/src/lib/generationErrors";

describe("AI generation error messaging", () => {
  it("turns an HTML gateway response into a retry message", () => {
    expect(humanizeGenerationError(new Error("Unexpected token '<', \"<!DOCTYPE\" is not valid JSON"))).toContain("Try again");
  });

  it("turns a 520 into a shorter-file suggestion", () => {
    expect(humanizeGenerationError(new Error("Request failed with status 520"))).toContain("shorter file");
  });

  it("preserves useful validation errors", () => {
    expect(humanizeGenerationError(new Error("That file is empty."))).toBe("That file is empty.");
  });
});
