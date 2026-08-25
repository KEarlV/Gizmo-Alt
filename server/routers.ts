import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getStudyDeck, insertGeneratedStudyDeck, listStudyDecks, recordStudyCardReview } from "./db";
import { generateDeckFromUpload } from "./studyImport";

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
  }),
});

export type AppRouter = typeof appRouter;
