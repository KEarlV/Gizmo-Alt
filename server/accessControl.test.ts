import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

const dbMocks = vi.hoisted(() => ({ listAdminUserSummaries: vi.fn().mockResolvedValue([]), recordUserActivity: vi.fn().mockResolvedValue(undefined), assignStudyDeckToFolder: vi.fn(async (userId: number, deckId: number, folderId: number | null) => { if (userId !== 7 || folderId === 999) throw new Error("That folder is not available to this account."); return true; }), setUserRole: vi.fn(async (actorUserId: number, targetUserId: number, role: "user" | "admin") => ({ actorUserId, targetUserId, action: "role_changed", metadata: { role } })) }));
vi.mock("./db", async (importOriginal) => ({ ...(await importOriginal<typeof import("./db")>()), ...dbMocks }));

import { appRouter } from "./routers";
import { filterUserOwnedRows } from "./dashboardScope";
import { buildRoleAuditEvent, isOwnedByUser } from "./accountTools";
import type { TrpcContext } from "./_core/context";

function context(user?: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const regularUser = { id: 7, openId: "learner-7", name: "Learner", email: "learner@example.com", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const adminUser = { ...regularUser, id: 1, openId: "admin-1", role: "admin" as const };

async function errorCode(promise: Promise<unknown>) {
  try { await promise; return null; } catch (error) { return error instanceof TRPCError ? error.code : null; }
}

describe("role-aware access", () => {
  it("rejects anonymous admin access", async () => {
    const code = await errorCode(appRouter.createCaller(context()).admin.overview());
    expect(code).toBe("FORBIDDEN");
  });

  it("rejects regular users from admin summaries", async () => {
    const code = await errorCode(appRouter.createCaller(context(regularUser)).admin.overview());
    expect(code).toBe("FORBIDDEN");
  });

  it("allows an admin to read the protected overview", async () => {
    const result = await appRouter.createCaller(context(adminUser)).admin.overview();
    expect(result).toEqual([]);
  });

  it("rejects unauthenticated user-dashboard access", async () => {
    const code = await errorCode(appRouter.createCaller(context()).account.dashboard());
    expect(code).toBe("UNAUTHORIZED");
  });

  it("keeps dashboard rows scoped to the signed-in user", () => {
    const rows = [{ userId: 7, title: "Mine" }, { userId: 8, title: "Not mine" }];
    expect(filterUserOwnedRows(rows, 7)).toEqual([{ userId: 7, title: "Mine" }]);
  });

  it("rejects malformed public share tokens before database access", async () => {
    const code = await errorCode(appRouter.createCaller(context()).share.get({ token: "too-short" }));
    expect(code).toBe("BAD_REQUEST");
  });

  it("rejects unauthenticated profile and folder access", async () => {
    expect(await errorCode(appRouter.createCaller(context()).account.profile())).toBe("UNAUTHORIZED");
    expect(await errorCode(appRouter.createCaller(context()).folders.list())).toBe("UNAUTHORIZED");
  });

  it("keeps audit logs behind the admin boundary", async () => {
    expect(await errorCode(appRouter.createCaller(context(regularUser)).admin.audit())).toBe("FORBIDDEN");
  });

  it("enforces folder ownership for assignment decisions", () => {
    expect(isOwnedByUser(7, 7)).toBe(true);
    expect(isOwnedByUser(8, 7)).toBe(false);
  });

  it("builds a role-change audit event with actor and target", () => {
    expect(buildRoleAuditEvent(1, 2, "admin")).toEqual({ actorUserId: 1, targetUserId: 2, action: "role_changed", metadata: { role: "admin" } });
  });

  it("exercises folder assignment through the protected procedure boundary", async () => {
    await expect(appRouter.createCaller(context(regularUser)).folders.assignDeck({ deckId: 4, folderId: 8 })).resolves.toBe(true);
    await expect(appRouter.createCaller(context(adminUser)).folders.assignDeck({ deckId: 4, folderId: 999 })).rejects.toThrow("That folder is not available");
    expect(dbMocks.assignStudyDeckToFolder).toHaveBeenCalledWith(7, 4, 8);
  });

  it("asserts the role-change procedure emits a role_changed audit event", async () => {
    const event = await appRouter.createCaller(context(adminUser)).admin.setRole({ userId: 7, role: "admin" });
    expect(event).toMatchObject({ actorUserId: 1, targetUserId: 7, action: "role_changed", metadata: { role: "admin" } });
    expect(dbMocks.setUserRole).toHaveBeenCalledWith(1, 7, "admin");
  });

  it("validates profile inputs before mutation", async () => {
    const code = await errorCode(appRouter.createCaller(context(regularUser)).account.updateProfile({ name: "", avatarUrl: null, studyPreferences: "{}" }));
    expect(code).toBe("BAD_REQUEST");
  });
});
