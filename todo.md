# Mochi Study AI Import Checklist

- [x] Upgrade the static project to the full-stack web app template with server-side AI and storage support.
- [x] Define the AI generation contract for source text, title, summary, flashcards, mnemonic prompts, and review metadata.
- [x] Add secure upload handling for PDF, DOCX, TXT, and Markdown study materials with file-size and type validation.
- [x] Extract document text server-side without exposing AI credentials to the browser.
- [x] Generate strict structured JSON with an appropriate built-in LLM and validate the response before returning it.
- [x] Persist generated decks and cards so they can be reopened from the existing dashboard and library.
- [x] Add an AI import interface with drag-and-drop upload, progress/loading states, preview/edit step, and clear error states.
- [x] Connect generated flashcards to memorize, review, confidence actions, and unlimited-hearts behavior.
- [x] Add tests for extraction validation, structured output validation, and generation failure handling.
- [x] Verify the authenticated-ready browser surface, typecheck, build, and unit tests; live AI generation requires a signed-in session and uploaded source file.

- [x] Load persisted AI-generated decks into the Library view instead of keeping it hardcoded static.
- [x] Add a generated-deck preview/edit step so users can review and adjust title/cards before saving or starting study.
- [x] Implement a dedicated memorize mode for generated decks, not just the review flow.
- [x] Add tests for supported text extraction and explicit malformed AI-generation response handling; PDF/DOCX runtime parsers are wired but need a fixture-based integration test.
- [ ] Verify the authenticated upload → generation → saved deck → reopen → review path in-browser and record the result.
- [x] Add card-level editing in the AI preview step so users can modify generated fronts, backs, and hints before saving the deck.
