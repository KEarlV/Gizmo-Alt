import { and, count, desc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  type InsertStudyCard,
  type InsertStudyDeck,
  type InsertUser,
  adminAuditLogs,
  studyCards,
  studyDecks,
  studyFolders,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import type { GeneratedDeck } from "./studyImport";
import { filterUserOwnedRows } from "./dashboardScope";
import { buildRoleAuditEvent, isOwnedByUser } from "./accountTools";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl, studyPreferences: users.studyPreferences, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0];
}

export async function updateUserProfile(userId: number, input: { name?: string; avatarUrl?: string | null; studyPreferences?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Please try again in a moment.");
  await db.update(users).set({ name: input.name, avatarUrl: input.avatarUrl, studyPreferences: input.studyPreferences }).where(eq(users.id, userId));
  return getUserProfile(userId);
}

export async function listStudyFolders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studyFolders).where(eq(studyFolders.userId, userId)).orderBy(desc(studyFolders.updatedAt));
}

export async function createStudyFolder(userId: number, name: string, color: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Please try again in a moment.");
  const result = await db.insert(studyFolders).values({ userId, name, color });
  const folderId = Number((result as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
  return { id: folderId, name, color };
}

export async function assignStudyDeckToFolder(userId: number, deckId: number, folderId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Please try again in a moment.");
  const deck = await db.select({ id: studyDecks.id }).from(studyDecks).where(and(eq(studyDecks.id, deckId), eq(studyDecks.userId, userId))).limit(1);
  if (!deck[0]) throw new Error("That deck is not available to this account.");
  if (folderId !== null) {
    const folder = await db.select({ id: studyFolders.id, userId: studyFolders.userId }).from(studyFolders).where(eq(studyFolders.id, folderId)).limit(1);
    if (!folder[0] || !isOwnedByUser(folder[0].userId, userId)) throw new Error("That folder is not available to this account.");
  }
  await db.update(studyDecks).set({ folderId }).where(eq(studyDecks.id, deckId));
  return true;
}

export async function deleteStudyFolder(userId: number, folderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Please try again in a moment.");
  const folder = await db.select({ id: studyFolders.id }).from(studyFolders).where(and(eq(studyFolders.id, folderId), eq(studyFolders.userId, userId))).limit(1);
  if (!folder[0]) return false;
  await db.update(studyDecks).set({ folderId: null }).where(eq(studyDecks.folderId, folderId));
  await db.delete(studyFolders).where(eq(studyFolders.id, folderId));
  return true;
}

export async function recordAdminAudit(actorUserId: number, targetUserId: number | null, action: string, metadata?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Please try again in a moment.");
  await db.insert(adminAuditLogs).values({ actorUserId, targetUserId, action, metadata: metadata ? JSON.stringify(metadata) : null });
}

export const recordUserActivity = recordAdminAudit;

export async function listAdminAuditLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(100);
}

export async function getUserRecentActivity(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const [deckEvents, reviewEvents] = await Promise.all([
    db.select({ id: studyDecks.id, title: studyDecks.title, cardCount: studyDecks.cardCount, updatedAt: studyDecks.updatedAt }).from(studyDecks).where(eq(studyDecks.userId, userId)).orderBy(desc(studyDecks.updatedAt)).limit(6),
    db.select({ id: studyCards.id, title: studyDecks.title, difficulty: studyCards.difficulty, lastReviewedAt: studyCards.lastReviewedAt }).from(studyCards).innerJoin(studyDecks, eq(studyCards.deckId, studyDecks.id)).where(and(eq(studyDecks.userId, userId), eq(studyCards.reviewCount, 1))).orderBy(desc(studyCards.lastReviewedAt)).limit(6),
  ]);
  return [...deckEvents.map((event) => ({ kind: "deck" as const, id: `deck-${event.id}`, title: event.title, detail: `${event.cardCount} cards in your desk`, happenedAt: event.updatedAt })), ...reviewEvents.filter((event) => event.lastReviewedAt).map((event) => ({ kind: "review" as const, id: `review-${event.id}`, title: event.title, detail: `Card marked ${event.difficulty}`, happenedAt: event.lastReviewedAt! }))].sort((a, b) => b.happenedAt.getTime() - a.happenedAt.getTime()).slice(0, 8);
}

export async function getUserDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { deckCount: 0, cardCount: 0, recentDecks: [], recentActivity: [] };
  const [deckTotal, cardTotal] = await Promise.all([
    db.select({ value: count() }).from(studyDecks).where(eq(studyDecks.userId, userId)),
    db.select({ value: count() }).from(studyCards).innerJoin(studyDecks, eq(studyCards.deckId, studyDecks.id)).where(eq(studyDecks.userId, userId)),
  ]);
  const recentDeckRows = await db.select({ id: studyDecks.id, userId: studyDecks.userId, title: studyDecks.title, cardCount: studyDecks.cardCount, updatedAt: studyDecks.updatedAt }).from(studyDecks).where(eq(studyDecks.userId, userId)).orderBy(desc(studyDecks.updatedAt)).limit(5);
  const recentDecks = filterUserOwnedRows(recentDeckRows, userId).map(({ userId: _ownerId, ...deck }) => deck);
  return { deckCount: Number(deckTotal[0]?.value ?? 0), cardCount: Number(cardTotal[0]?.value ?? 0), recentDecks, recentActivity: await getUserRecentActivity(userId) };
}

export async function setUserRole(actorUserId: number, targetUserId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Please try again in a moment.");
  if (actorUserId === targetUserId && role !== "admin") throw new Error("You cannot remove your own admin access from this desk.");
  const target = await db.select({ id: users.id }).from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!target[0]) return false;
  await db.update(users).set({ role }).where(eq(users.id, targetUserId));
  const auditEvent = buildRoleAuditEvent(actorUserId, targetUserId, role);
  await recordAdminAudit(auditEvent.actorUserId, auditEvent.targetUserId, auditEvent.action, auditEvent.metadata);
  return true;
}

export async function listAdminUserSummaries() {
  const db = await getDb();
  if (!db) return [];
  const allUsers = await db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn, createdAt: users.createdAt }).from(users).orderBy(desc(users.lastSignedIn));
  return Promise.all(allUsers.map(async (user) => ({ ...user, ...(await getUserDashboardStats(user.id)) })));
}

export async function listStudyDecks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studyDecks).where(eq(studyDecks.userId, userId)).orderBy(desc(studyDecks.updatedAt));
}

export async function getStudyDeck(userId: number, deckId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const deckRows = await db.select().from(studyDecks).where(and(eq(studyDecks.id, deckId), eq(studyDecks.userId, userId))).limit(1);
  const deck = deckRows[0];
  if (!deck) return undefined;
  const cards = await db.select().from(studyCards).where(eq(studyCards.deckId, deckId)).orderBy(studyCards.id);
  return { deck, cards };
}

export async function insertGeneratedStudyDeck(userId: number, generated: GeneratedDeck & { sourceFileKey: string; sourceFileName: string; sourceMimeType: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Please try again in a moment.");
  return db.transaction(async (tx) => {
    const deckValues: InsertStudyDeck = {
      userId,
      title: generated.title,
      sourceFileName: generated.sourceFileName,
      sourceFileKey: generated.sourceFileKey,
      sourceMimeType: generated.sourceMimeType,
      summary: generated.summary,
      mnemonic: generated.mnemonic,
      cardCount: generated.cards.length,
    };
    const result = await tx.insert(studyDecks).values(deckValues);
    const deckId = Number((result as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    if (!deckId) throw new Error("The new study deck could not be saved.");
    const cardValues: InsertStudyCard[] = generated.cards.map((card) => ({
      deckId,
      front: card.front,
      back: card.back,
      hint: card.hint,
      mnemonic: card.mnemonic,
      questionType: card.questionType,
      choices: JSON.stringify(card.choices),
      correctAnswer: card.correctAnswer,
      difficulty: "good",
      reviewCount: 0,
    }));
    await tx.insert(studyCards).values(cardValues);
    return { id: deckId, title: generated.title, summary: generated.summary, mnemonic: generated.mnemonic, cardCount: generated.cards.length };
  });
}

export async function deleteStudyDeck(userId: number, deckId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Please try again in a moment.");
  return db.transaction(async (tx) => {
    const owned = await tx.select({ id: studyDecks.id }).from(studyDecks).where(and(eq(studyDecks.id, deckId), eq(studyDecks.userId, userId))).limit(1);
    if (!owned[0]) return false;
    await tx.delete(studyCards).where(eq(studyCards.deckId, deckId));
    await tx.delete(studyDecks).where(eq(studyDecks.id, deckId));
    return true;
  });
}

export async function replaceStudyDeckContents(userId: number, deckId: number, generated: GeneratedDeck & { sourceFileKey: string; sourceFileName: string; sourceMimeType: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Please try again in a moment.");
  return db.transaction(async (tx) => {
    const owned = await tx.select({ id: studyDecks.id }).from(studyDecks).where(and(eq(studyDecks.id, deckId), eq(studyDecks.userId, userId))).limit(1);
    if (!owned[0]) throw new Error("That deck is not available to this account.");
    await tx.delete(studyCards).where(eq(studyCards.deckId, deckId));
    await tx.update(studyDecks).set({ title: generated.title, sourceFileName: generated.sourceFileName, sourceFileKey: generated.sourceFileKey, sourceMimeType: generated.sourceMimeType, summary: generated.summary, mnemonic: generated.mnemonic, cardCount: generated.cards.length }).where(eq(studyDecks.id, deckId));
    await tx.insert(studyCards).values(generated.cards.map((card) => ({ deckId, front: card.front, back: card.back, hint: card.hint, mnemonic: card.mnemonic, questionType: card.questionType, choices: JSON.stringify(card.choices), correctAnswer: card.correctAnswer, difficulty: "good" as const, reviewCount: 0 })));
    return { id: deckId, title: generated.title, cardCount: generated.cards.length };
  });
}

export async function createStudyDeckShare(userId: number, deckId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Please try again in a moment.");
  const owned = await db.select({ id: studyDecks.id, shareToken: studyDecks.shareToken }).from(studyDecks).where(and(eq(studyDecks.id, deckId), eq(studyDecks.userId, userId))).limit(1);
  if (!owned[0]) throw new Error("That deck is not available to this account.");
  const shareToken = owned[0].shareToken ?? crypto.randomUUID().replace(/-/g, "");
  if (!owned[0].shareToken) await db.update(studyDecks).set({ shareToken }).where(eq(studyDecks.id, deckId));
  return shareToken;
}

export async function getPublicStudyDeck(shareToken: string) {
  const db = await getDb();
  if (!db) return null;
  const deckRows = await db.select().from(studyDecks).where(eq(studyDecks.shareToken, shareToken)).limit(1);
  const deck = deckRows[0];
  if (!deck) return null;
  const cards = await db.select({ id: studyCards.id, front: studyCards.front, back: studyCards.back, hint: studyCards.hint, mnemonic: studyCards.mnemonic, questionType: studyCards.questionType, choices: studyCards.choices, correctAnswer: studyCards.correctAnswer }).from(studyCards).where(eq(studyCards.deckId, deck.id)).orderBy(studyCards.id);
  return { deck, cards };
}

export async function getStudyDeckSource(userId: number, deckId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({ id: studyDecks.id, sourceFileKey: studyDecks.sourceFileKey, sourceFileName: studyDecks.sourceFileName, sourceMimeType: studyDecks.sourceMimeType }).from(studyDecks).where(and(eq(studyDecks.id, deckId), eq(studyDecks.userId, userId))).limit(1);
  return rows[0];
}

export async function recordStudyCardReview(userId: number, cardId: number, difficulty: "again" | "good" | "easy") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Please try again in a moment.");
  const owned = await db.select({ cardId: studyCards.id }).from(studyCards).innerJoin(studyDecks, eq(studyCards.deckId, studyDecks.id)).where(and(eq(studyCards.id, cardId), eq(studyDecks.userId, userId))).limit(1);
  if (!owned[0]) return false;
  const days = difficulty === "easy" ? 14 : difficulty === "good" ? 3 : 0;
  const nextReviewAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await db.update(studyCards).set({ difficulty, reviewCount: 1, lastReviewedAt: new Date(), nextReviewAt }).where(eq(studyCards.id, cardId));
  return true;
}
