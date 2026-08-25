# Mochi Study — Design Direction

## Three Initial Approaches

### Approach 1
**Theme Name:** Paper Lantern Lab  
**Very Brief Intro:** A warm editorial learning desk with quiet paper textures, ink notes, and amber highlights. It makes studying feel like building a personal reference library rather than completing a game loop.  
**Probability:** 0.06

### Approach 2
**Theme Name:** Orchard Circuit  
**Very Brief Intro:** A crisp, botanical interface that pairs leafy greens with sun-washed citrus and small data-driven accents. The mood is optimistic and focused, with a sense of steady growth.  
**Probability:** 0.08

### Approach 3
**Theme Name:** Tidepool Arcade  
**Very Brief Intro:** A playful, high-contrast study cockpit with deep ink blue, coral, and electric mint, supported by a soft mascot character. It keeps the momentum and clarity of a game UI without copying any branded visual language.  
**Probability:** 0.04

## Selected Direction: Paper Lantern Lab

### Design Movement
Contemporary editorial interface design with references to Japanese stationery, risograph print textures, and quiet luxury dashboards. The interface should feel like a well-loved study table: tactile, precise, and personal.

### Core Principles
1. **Study as craft:** Every screen should make knowledge feel collected, organized, and worth returning to.
2. **Warm clarity:** Use strong contrast and calm spacing so dense study information stays easy to scan.
3. **Earned playfulness:** Let the mascot and tiny paper-cut details add joy, but never make the learning controls feel childish.
4. **Visible momentum:** Progress, streaks, and review availability should be legible at a glance without turning the experience into a punishment loop.

### Color Philosophy
The base is warm oat paper (#F7F1E8) with carbon ink (#1E2323) for reliable reading. The signature brand color is persimmon ink (#E8694A): energetic enough to signal action but muted enough to feel printed rather than neon. Moss (#7D9071) marks completed and steady states; butter (#F1C96B) marks focus and rewards; faded denim (#7893A4) supports secondary study metadata. This palette gives the app the emotional temperature of a desk lamp at the start of an evening study session.

### Layout Paradigm
An asymmetric study desk: persistent slim rail on the left, a broad working canvas for the current study priority, and a narrow right-hand column for the mascot, streak, and next-up queue. On smaller screens the rail becomes a compact top strip and the right column folds below the primary task.

### Signature Elements
- **Index-tab rail:** Navigation items use small paper tabs and active underlines instead of generic pill buttons.
- **Red-pencil marks:** Persimmon rules, ticks, and underlines call attention to actions and review moments.
- **Mascot desk note:** The mascot appears in small paper-note moments that give context without taking over the screen.

### Interaction Philosophy
Interactions should feel like moving a real study card across a desk: deliberate, tactile, and reversible. A card flip uses a quick paper-turn motion; sorting a deck gives immediate visual confirmation; no heart loss or cooldown interrupts deep study. The unlimited-hearts state is treated as a quiet confidence badge rather than a loud gamification mechanic.

### Animation
Use 140–220ms ease-out transitions for hover, pressed, tab selection, and card flip. Entrance motion is a gentle slide-and-fade from the direction of the index rail, staggered 40ms across primary cards. Mascot micro-motion is limited to an occasional blink or small paper flutter. Avoid bounce-heavy game motion; every animation should suggest paper, ink, or hand movement. Respect reduced-motion preferences.

### Typography System
Use **Fraunces** for display headlines, deck names, and mascot notes, with **DM Sans** for navigation, controls, metadata, and study content. Headlines are high-contrast serif at 40–56px on wide screens; section labels use uppercase DM Sans with deliberate letter spacing; body copy stays 15–17px with generous line-height. Use italic Fraunces sparingly for reflective study prompts.

### Brand Essence
**Mochi Study is a calm, mascot-led study desk for people who want to turn scattered notes into durable memory without being interrupted by energy limits.**  
Personality adjectives: **attentive, warm, quietly determined**.

### Brand Voice
Headlines are concise and observant. CTAs sound like a study companion nudging you forward, not a challenge shouting at you. Microcopy is specific, encouraging, and never guilt-driven.

Example lines:
- “Your next good hour starts here.”
- “Keep the thread — three cards are ready for a second look.”

### Wordmark & Logo
The wordmark uses a custom ink-stamp treatment with a slightly offset baseline. The symbol is **Miso**, a round desk-mouse mascot with a folded-paper ear and one persimmon pencil tucked behind it. The mark should work as a small solid silhouette, with no text, so it can sit in the header and favicon.

### Signature Brand Color
**Persimmon Ink — #E8694A.** It is the ownable action color of Mochi Study: warm, printed, and unmistakably human.

## Product Scope
The first release is a front-end study workspace with a familiar Gizmo-like flow: dashboard, deck library, study session, card flip, answer confidence actions, progress summary, and activity/streak information. It uses local persistence for the demo experience and intentionally exposes **unlimited hearts** in the header and session flow so intensive practice is never interrupted.

## Style Decisions
- Use Fraunces + DM Sans; do not use Inter.
- Prefer warm paper backgrounds, asymmetrical desktop composition, and editorial separators over generic centered dashboards.
- Use the generated Miso mascot as the header mark and in the desk-note panel.
- Treat unlimited hearts as a calm “∞ focus” badge, not a red counter or blocker.

### Accepted Style Review Amendments
- All routes, including error and empty states, use the Paper Lantern Lab palette and typography; generic blue buttons and cold white SaaS cards are off-brand.
- Error and empty-state copy should sound like Miso gently helping the learner recover, never like a system message.
- The Mochi wordmark carries a small ink-stamp treatment and handmade baseline across branded moments.
- Generated assets that do not resolve are not referenced in production UI; CSS-led study motifs are used rather than visible failure placeholders.
