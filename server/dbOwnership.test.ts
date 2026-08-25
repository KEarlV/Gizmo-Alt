import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  auditValues: vi.fn(),
}));

vi.mock("drizzle-orm/mysql2", () => ({ drizzle: vi.fn(() => dbMock) }));

import { assignStudyDeckToFolder, setUserRole } from "./db";

function selectResult(rows: unknown[]) {
  return { from: () => ({ where: () => ({ limit: async () => rows }) }) };
}

beforeEach(() => {
  process.env.DATABASE_URL = "mysql://test";
  vi.clearAllMocks();
  dbMock.update.mockReturnValue({ set: () => ({ where: async () => undefined }) });
  dbMock.auditValues.mockResolvedValue(undefined);
  dbMock.insert.mockReturnValue({ values: dbMock.auditValues });
});

describe("database ownership helpers", () => {
  it("allows a deck owner to assign a deck to their own folder", async () => {
    dbMock.select
      .mockImplementationOnce(() => selectResult([{ id: 4 }]))
      .mockImplementationOnce(() => selectResult([{ id: 8, userId: 7 }]));
    await expect(assignStudyDeckToFolder(7, 4, 8)).resolves.toBe(true);
    expect(dbMock.update).toHaveBeenCalledTimes(1);
  });

  it("rejects assignment to another user's folder", async () => {
    dbMock.select
      .mockImplementationOnce(() => selectResult([{ id: 4 }]))
      .mockImplementationOnce(() => selectResult([{ id: 8, userId: 99 }]));
    await expect(assignStudyDeckToFolder(7, 4, 8)).rejects.toThrow("not available");
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it("persists a role-change audit event through the database boundary", async () => {
    dbMock.select.mockImplementationOnce(() => selectResult([{ id: 7 }]));
    await expect(setUserRole(1, 7, "admin")).resolves.toBe(true);
    expect(dbMock.insert).toHaveBeenCalledTimes(1);
    expect(dbMock.auditValues).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 1, targetUserId: 7, action: "role_changed", metadata: JSON.stringify({ role: "admin" }) }));
  });
});
