import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createStudyDeckShare, deleteStudyDeck, getPublicStudyDeck, getStudyDeck, getStudyDeckSource, getUserDashboardStats, insertGeneratedStudyDeck, listAdminUserSummaries, listStudyDecks, setUserRole, recordStudyCardReview, replaceStudyDeckContents } from "./db";
import { generateDeckFromUpload } from "./studyImport";
import { storageGetSignedUrl } from "./storage";
import { assertRegenerationSource, buildDeckExport, isValidShareToken, runRegenerationFlow } from "./deckTools";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  account: router({
    dashboard: protectedProcedure.query(({ ctx }) => getUserDashboardStats(ctx.user.id)),
  }),
  admin: router({
    overview: adminProcedure.query(() => listAdminUserSummaries()),
    setRole: adminProcedure.input(z.object({ userId: z.number().int().positive(), role: z.enum(["user", "admin"]) })).mutation(({ ctx, input }) => setUserRole(ctx.user.id, input.userId, input.role)),
  }),
  study: router({
    list: protectedProcedure.query(({ ctx }) => listStudyDecks(ctx.user.id)),
    get: protectedProcedure.input(z.object({ deckId: z.number().int().positive() })).query(({ ctx, input }) => getStudyDeck(ctx.user.id, input.deckId)),
    generateMaterial: protectedProcedure
      .input(z.object({
        fileName: z.string().min(1).max(255),
        mimeType: z.string().min(1).max(120),
        dataBase64: z.string().min(20),
      }))
      .mutation(({ ctx, input }) => generateDeckFromUpload({ userId: ctx.user.id, ...input })),
    saveGeneratedDeck: protectedProcedure
      .input(z.object({
        title: z.string().min(2).max(180),
        summary: z.string().min(10).max(800),
        mnemonic: z.string().min(3).max(300),
        sourceFileKey: z.string().min(1).max(512),
        sourceFileName: z.string().min(1).max(255),
        sourceMimeType: z.string().min(1).max(120),
        cards: z.array(z.object({ front: z.string().min(8).max(500), back: z.string().min(8).max(1200), hint: z.string().min(3).max(300), mnemonic: z.string().min(3).max(300) })).min(3).max(30),
      }))
      .mutation(({ ctx, input }) => insertGeneratedStudyDeck(ctx.user.id, input)),
    review: protectedProcedure
      .input(z.object({ cardId: z.number().int().positive(), difficulty: z.enum(["again", "good", "easy"]) }))
      .mutation(({ ctx, input }) => recordStudyCardReview(ctx.user.id, input.cardId, input.difficulty)),
    deleteDeck: protectedProcedure.input(z.object({ deckId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteStudyDeck(ctx.user.id, input.deckId)),
    shareDeck: protectedProcedure.input(z.object({ deckId: z.number().int().positive() })).mutation(async ({ ctx, input }) => ({ token: await createStudyDeckShare(ctx.user.id, input.deckId) })),
    exportDeck: protectedProcedure.input(z.object({ deckId: z.number().int().positive(), format: z.enum(["markdown", "csv"]) })).mutation(async ({ ctx, input }) => {
      const result = await getStudyDeck(ctx.user.id, input.deckId);
      if (!result) throw new Error("That deck is not available to this account.");
      return buildDeckExport(result.deck, result.cards, input.format);
    }),
    regenerateDeck: protectedProcedure.input(z.object({ deckId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const source = assertRegenerationSource(await getStudyDeckSource(ctx.user.id, input.deckId));
      return runRegenerationFlow<Awaited<ReturnType<typeof generateDeckFromUpload>>, Awaited<ReturnType<typeof replaceStudyDeckContents>>>(source, async (validated) => { const sourceUrl = await storageGetSignedUrl(validated.sourceFileKey); const sourceResponse = await fetch(sourceUrl); if (!sourceResponse.ok) throw new Error("Miso could not reopen the original source file."); return new Uint8Array(await sourceResponse.arrayBuffer()); }, async (validated, bytes) => generateDeckFromUpload({ userId: ctx.user.id, fileName: validated.sourceFileName, mimeType: validated.sourceMimeType, dataBase64: Buffer.from(bytes).toString("base64") }), (generated) => replaceStudyDeckContents(ctx.user.id, input.deckId, generated));
    }),
  }),
  share: router({
    get: publicProcedure.input(z.object({ token: z.string().refine(isValidShareToken, "Invalid share token") })).query(({ input }) => getPublicStudyDeck(input.token)),
  }),
});

export type AppRouter = typeof appRouter;
