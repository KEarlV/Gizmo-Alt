import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("responsive audit safeguards", () => {
  it("keeps narrow top-bar controls inside the viewport", () => {
    const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
    expect(css).toContain(".top-bar__actions { min-width: 0; flex: 1; justify-content: flex-end; gap: 6px; }");
    expect(css).toContain(".top-bar__review { width: 36px; height: 36px; padding: 0; font-size: 0; }");
    expect(css).toContain(".profile-trigger__copy, .profile-trigger > svg { display: none; }");
  });
});
