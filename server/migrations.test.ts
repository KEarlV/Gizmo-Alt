import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Drizzle migration artifacts", () => {
  it("keeps the journal entries backed by committed SQL files", () => {
    const root = resolve(process.cwd(), "drizzle");
    const journal = JSON.parse(readFileSync(resolve(root, "meta/_journal.json"), "utf8")) as { entries: Array<{ tag: string }> };
    expect(journal.entries.length).toBeGreaterThan(0);
    for (const entry of journal.entries) {
      expect(existsSync(resolve(root, `${entry.tag}.sql`))).toBe(true);
    }
  });

  it("includes the production-backed audit and AI metadata changes", () => {
    const root = resolve(process.cwd(), "drizzle");
    const sql = journalSql(root);
    expect(sql).toContain("adminAuditLogs");
    expect(sql).toContain("aiDifficulty");
    expect(sql).toContain("cognitiveSkill");
    expect(sql).toContain("questionRationale");
  });
});

function journalSql(root: string) {
  const journal = JSON.parse(readFileSync(resolve(root, "meta/_journal.json"), "utf8")) as { entries: Array<{ tag: string }> };
  return journal.entries.map((entry) => readFileSync(resolve(root, `${entry.tag}.sql`), "utf8")).join("\n");
}
