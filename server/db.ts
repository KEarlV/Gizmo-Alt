import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  type InsertStudyCard,
  type InsertStudyDeck,
  type InsertUser,
  studyCards,
  studyDecks,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import type { GeneratedDeck } from "./studyImport";

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
      difficulty: "good",
      reviewCount: 0,
    }));
    await tx.insert(studyCards).values(cardValues);
    return { id: deckId, title: generated.title, summary: generated.summary, mnemonic: generated.mnemonic, cardCount: generated.cards.length };
  });
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
