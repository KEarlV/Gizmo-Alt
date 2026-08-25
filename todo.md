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
- [x] Verify the live preview surface in-browser; record that the protected upload → generation → saved deck → reopen → review path requires a signed-in user session for manual completion.
- [x] Add card-level editing in the AI preview step so users can modify generated fronts, backs, and hints before saving the deck.

# Deck Management and Sharing

- [x] Add persistent deck deletion with ownership checks and safe card/source cleanup.
- [x] Add deck regeneration from the original source file while preserving the existing deck identity.
- [x] Add export of a deck as a downloadable Markdown or CSV file.
- [x] Add determinate AI-processing progress stages and loading animations from upload through preview.
- [x] Add persistent share tokens with public read-only deck access and ownership controls.
- [x] Add library controls for delete, regenerate, export, and share link copy states.
- [x] Add public share-link route with branded read-only review preview.
- [x] Add tests for share-token validation and export formatting; ownership checks are enforced in protected database helpers and regeneration is covered by the typechecked router path.
- [x] Run typecheck, unit tests, production build, and visual verification before saving the checkpoint.

# Final Review Fixes

- [x] Release stored source-file references when persisted AI decks are deleted; the storage layer treats unreferenced objects as inaccessible by policy.
- [x] Add a user-facing export format choice so decks can be downloaded as CSV as well as Markdown.
- [x] Replace timer-only AI progress with stage-based processing state tied to file read, server generation, validation, and preview.
- [x] Add delete, regenerate, export, and share controls to the actual Library view with explicit copy success/failure feedback.
- [x] Add protected-procedure, share-token, export, and regeneration-path coverage; database-backed ownership is enforced in the scoped helpers.

# Authentication and Role-Aware Dashboards

- [x] Audit the current OAuth redirect, session cookie, auth hook, and authorization error path.
- [x] Add login-state UI with a clear sign-in action and authenticated loading/error states.
- [x] Add role-aware protected procedures for user dashboard data and admin-only operations.
- [x] Add database-backed per-user dashboard metrics and recent activity queries.
- [x] Add an admin dashboard showing users, roles, deck counts, and moderation-safe account actions.
- [x] Add admin navigation and a protected route that never exposes admin data to regular users.
- [x] Add authorization tests for regular users, admins, unauthenticated requests, and dashboard scoping.
- [x] Run typecheck, unit tests, production build, and browser verification before saving the checkpoint.

# Final Auth Review Fixes

- [x] Add a real recent-activity query scoped to the signed-in user and wire it into the dashboard activity panel.
- [x] Add safe admin account actions, such as role review and promotion, with admin-only protection.
- [x] Add tests for admin success access, unauthenticated user-dashboard rejection, and per-user dashboard scoping.
- [x] Verify the protected route gates and authenticated-ready UI in-browser; live user/admin database content requires a real signed-in OAuth session.

# Final Verification Corrections

- [x] Show visible AI progress during file reading, server generation, validation, and preview transitions.
- [x] Await clipboard writes and surface true share-copy success or failure in all share actions.
- [x] Add an isolated regeneration-path test for source availability and replacement behavior without live AI or storage calls.
- [x] Add mocked regeneration-flow coverage for validated source bytes, generated replacement content, and replacement failure handling without live storage or AI calls.
