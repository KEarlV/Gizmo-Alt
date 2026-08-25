import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_SOURCE_CHARS = 80_000;

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
]);

export const generatedCardSchema = z.object({
  front: z.string().min(8).max(500),
  back: z.string().min(8).max(1200),
  hint: z.string().min(3).max(300),
  mnemonic: z.string().min(3).max(300),
  questionType: z.enum(["multiple_choice", "identification"]),
  choices: z.array(z.string().min(1).max(300)).max(5),
  correctAnswer: z.string().min(1).max(500),
  aiDifficulty: z.enum(["easy", "medium", "hard"]),
  cognitiveSkill: z.enum(["remember", "understand", "apply", "analyze", "evaluate"]),
  questionRationale: z.string().min(12).max(240),
}).superRefine((card, ctx) => {
  const uniqueChoices = new Set(card.choices.map((choice) => choice.trim().toLowerCase()));
  if (card.questionType === "multiple_choice" && (card.choices.length < 3 || card.choices.length > 4 || uniqueChoices.size !== card.choices.length || !card.choices.includes(card.correctAnswer))) {
    ctx.addIssue({ code: "custom", message: "Multiple-choice cards need 3-4 unique concept-based choices including the correct answer.", path: ["choices"] });
  }
  if (card.questionType === "identification" && card.choices.length > 0) {
    ctx.addIssue({ code: "custom", message: "Identification cards should not include answer choices.", path: ["choices"] });
  }
});

const recoveryCardSchema = z.object({
  front: z.string().min(8).max(500),
  back: z.string().min(8).max(1200),
  hint: z.string().min(3).max(300),
  mnemonic: z.string().min(3).max(300),
  questionType: z.enum(["multiple_choice", "identification"]),
  choices: z.array(z.string().min(1).max(300)).max(5),
  correctAnswer: z.string().min(1).max(500),
  aiDifficulty: z.enum(["easy", "medium", "hard"]).optional(),
  cognitiveSkill: z.enum(["remember", "understand", "apply", "analyze", "evaluate"]).optional(),
  questionRationale: z.string().min(12).max(240).optional(),
});

export const generatedDeckSchema = z.object({
  title: z.string().min(2).max(180),
  summary: z.string().min(10).max(800),
  mnemonic: z.string().min(3).max(300),
  cards: z.array(generatedCardSchema).min(3).max(30),
});

export type GeneratedDeck = z.infer<typeof generatedDeckSchema>;

const difficultyRank: Record<GeneratedDeck["cards"][number]["aiDifficulty"], number> = { easy: 0, medium: 1, hard: 2 };

export function orderCardsByDifficulty(deck: GeneratedDeck): GeneratedDeck {
  return { ...deck, cards: [...deck.cards].sort((a, b) => difficultyRank[a.aiDifficulty] - difficultyRank[b.aiDifficulty]) };
}

export function validateUpload(fileName: string, mimeType: string, byteLength: number) {
  const extension = fileName.toLowerCase().split(".").pop() ?? "";
  const supportedExtension = ["pdf", "docx", "txt", "md", "markdown"].includes(extension);
  if (!fileName || fileName.length > 255) throw new Error("Please choose a file with a shorter name.");
  if (!supportedExtension || !SUPPORTED_MIME_TYPES.has(mimeType)) {
    throw new Error("Mochi can import PDF, DOCX, TXT, or Markdown files.");
  }
  if (byteLength === 0) throw new Error("That file is empty. Choose a study source with some notes in it.");
  if (byteLength > MAX_UPLOAD_BYTES) throw new Error("That file is larger than 20 MB. Try a shorter set of notes.");
  return true;
}

export async function extractText(fileName: string, mimeType: string, buffer: Buffer): Promise<string> {
  const extension = fileName.toLowerCase().split(".").pop() ?? "";
  if (mimeType === "text/plain" || mimeType === "text/markdown" || ["txt", "md", "markdown"].includes(extension)) {
    return buffer.toString("utf8");
  }
  if (extension === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (extension === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }
  throw new Error("That file type is not supported.");
}

function contentAsText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => (part && typeof part === "object" && "text" in part ? String((part as { text?: unknown }).text ?? "") : ""))
    .join("\n");
}

export function parseGeneratedDeckResponse(raw: string): GeneratedDeck {
  let parsed: unknown;
  try {
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("The study companion returned an unreadable deck. Please try the import again.");
  }
  const recovered = z.object({
    title: z.string().min(2).max(180),
    summary: z.string().min(10).max(800),
    mnemonic: z.string().min(3).max(300),
    cards: z.array(recoveryCardSchema).min(3).max(30),
  }).parse(parsed);
  const enriched = {
    ...recovered,
    cards: recovered.cards.map((card, index) => ({
      ...card,
      choices: card.questionType === "multiple_choice" ? Array.from(new Set([card.correctAnswer, ...card.choices, "A nearby concept", "A common misconception"])).slice(0, 4) : [],
      aiDifficulty: card.aiDifficulty ?? (index < Math.ceil(recovered.cards.length / 3) ? "easy" : index < Math.ceil((recovered.cards.length * 2) / 3) ? "medium" : "hard"),
      cognitiveSkill: card.cognitiveSkill ?? (card.questionType === "multiple_choice" ? "understand" : "remember"),
      questionRationale: card.questionRationale ?? "Recovered from an earlier deck format; difficulty was estimated from the question type and position.",
    })),
  };
  return generatedDeckSchema.parse(enriched);
}

export async function generateDeckFromUpload(args: {
  userId: number;
  fileName: string;
  mimeType: string;
  dataBase64: string;
}): Promise<GeneratedDeck & { sourceFileKey: string; sourceFileName: string; sourceMimeType: string }> {
  const buffer = Buffer.from(args.dataBase64, "base64");
  validateUpload(args.fileName, args.mimeType, buffer.byteLength);
  const source = (await extractText(args.fileName, args.mimeType, buffer)).replace(/\u0000/g, "").trim().slice(0, MAX_SOURCE_CHARS);
  if (source.length < 80) throw new Error("I need a little more source material before I can make useful cards.");

  const safeName = args.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
  const stored = await storagePut(`study-sources/${args.userId}/${safeName}`, buffer, args.mimeType);

  const response = await invokeLLM({
    model: "gpt-5-mini",
    maxTokens: 3200,
    maxRetries: 1,
    messages: [
      {
        role: "system",
        content: "You are Mochi, a precise study-companion. Transform source material into durable retrieval practice. Do not invent facts that are absent from the source. Prefer clear, specific prompts over trivia. Output only the requested JSON structure.",
      },
      {
        role: "user",
        content: `Create a study deck from the source below. First analyze the source from start to finish and identify the concepts, prerequisite relationships, common confusions, and likely learning progression. Make 6-12 high-signal flashcards when the material supports it, otherwise make as many as the source supports. Assign every card an aiDifficulty of easy, medium, or hard using retrieval complexity: easy = direct recognition/definition, medium = explain a relationship or distinguish similar concepts, hard = apply, analyze, or evaluate a situation using the source. Assign cognitiveSkill as remember, understand, apply, analyze, or evaluate. Return cards in easy-to-hard order, with hard cards saved for the end. Choose multiple_choice when carefully selected conceptual distractors can test discrimination; choose identification when recall is more valuable. Multiple-choice cards must have 3-4 unique plausible choices, exactly one correct answer, and distractors must be tempting misconceptions or nearby concepts from the source, never random filler. Identification cards must have an empty choices array. For every card, explain the question design briefly in questionRationale. Each card should test one idea, with a concise answer, a gentle hint, and a memorable mnemonic. Also provide a short deck summary and one overall mnemonic.\n\nFILE: ${args.fileName}\nSOURCE:\n${source}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "mochi_study_deck",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "A clear study deck title" },
            summary: { type: "string", description: "A concise description of what this deck covers" },
            mnemonic: { type: "string", description: "One helpful memory hook for the whole deck" },
            cards: {
              type: "array",
              minItems: 3,
              maxItems: 30,
              items: {
                type: "object",
                properties: {
                  front: { type: "string" },
                  back: { type: "string" },
                  hint: { type: "string" },
                  mnemonic: { type: "string" },
                  questionType: { type: "string", enum: ["multiple_choice", "identification"] },
                  choices: { type: "array", items: { type: "string" } },
                  correctAnswer: { type: "string" },
                  aiDifficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                  cognitiveSkill: { type: "string", enum: ["remember", "understand", "apply", "analyze", "evaluate"] },
                  questionRationale: { type: "string" },
                },
                required: ["front", "back", "hint", "mnemonic", "questionType", "choices", "correctAnswer", "aiDifficulty", "cognitiveSkill", "questionRationale"],
                additionalProperties: false,
              },
            },
          },
          required: ["title", "summary", "mnemonic", "cards"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = contentAsText(response.choices[0]?.message?.content);
  const deck = orderCardsByDifficulty(parseGeneratedDeckResponse(raw));
  return {
    ...deck,
    sourceFileKey: stored.key,
    sourceFileName: args.fileName,
    sourceMimeType: args.mimeType,
  };
}
