import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing auth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  avatarUrl: varchar("avatarUrl", { length: 512 }),
  studyPreferences: text("studyPreferences"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** A generated or manually-created study collection owned by one user. */
export const studyFolders = mysqlTable("studyFolders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 80 }).notNull(),
  color: varchar("color", { length: 24 }).default("persimmon").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const studyDecks = mysqlTable("studyDecks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  folderId: int("folderId").references(() => studyFolders.id),
  title: varchar("title", { length: 180 }).notNull(),
  sourceFileName: varchar("sourceFileName", { length: 255 }),
  sourceFileKey: varchar("sourceFileKey", { length: 512 }),
  sourceMimeType: varchar("sourceMimeType", { length: 120 }),
  shareToken: varchar("shareToken", { length: 64 }).unique(),
  summary: text("summary"),
  mnemonic: text("mnemonic"),
  cardCount: int("cardCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** One atomic recall prompt generated from a deck source. */
export const studyCards = mysqlTable("studyCards", {
  id: int("id").autoincrement().primaryKey(),
  deckId: int("deckId").notNull().references(() => studyDecks.id),
  front: text("front").notNull(),
  back: text("back").notNull(),
  hint: text("hint"),
  mnemonic: text("mnemonic"),
  questionType: mysqlEnum("questionType", ["multiple_choice", "identification"]).default("identification").notNull(),
  choices: text("choices"),
  correctAnswer: text("correctAnswer"),
  difficulty: mysqlEnum("difficulty", ["again", "good", "easy"]).default("good").notNull(),
  reviewCount: int("reviewCount").default(0).notNull(),
  nextReviewAt: timestamp("nextReviewAt"),
  lastReviewedAt: timestamp("lastReviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export const adminAuditLogs = mysqlTable("adminAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId").notNull().references(() => users.id),
  targetUserId: int("targetUserId").references(() => users.id),
  action: varchar("action", { length: 120 }).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudyFolder = typeof studyFolders.$inferSelect;
export type InsertStudyFolder = typeof studyFolders.$inferInsert;
export type StudyDeck = typeof studyDecks.$inferSelect;
export type InsertStudyDeck = typeof studyDecks.$inferInsert;
export type StudyCard = typeof studyCards.$inferSelect;
export type InsertStudyCard = typeof studyCards.$inferInsert;
