import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

vi.mock("./db", async (importOriginal) => ({ ...(await importOriginal<typeof import("./db")>()), listAdminUserSummaries: vi.fn().mockResolvedValue([]) }));

import { appRouter } from "./routers";
import { filterUserOwnedRows } from "./dashboardScope";
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
});
