# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Math Adventure" — a single-player, local-only (no backend) grade-7 math practice game for Massachusetts curriculum standards (MA 2017 Framework strands 7.RP, 7.NS, 7.EE, 7.G, 7.SP), built as an adventure map with 5 themed worlds, each containing 4 levels of questions, with XP/streak/badge gamification layered on top.

## Commands

```bash
npm run dev      # start Vite dev server (http://localhost:5173)
npm run build    # tsc -b (project-references build) + vite build — the real type check
npm run lint     # oxlint
npm test         # vitest run (unit tests for the pure-function core)
npm run preview  # preview a production build
```

**Important: use `npm run build` (or `./node_modules/.bin/tsc -b`) to type-check, not `tsc --noEmit`.** The root `tsconfig.json` has `"files": []` and only `references` to `tsconfig.app.json`/`tsconfig.node.json` — a bare `tsc --noEmit` run against it is a silent no-op and will not catch real errors (including `verbatimModuleSyntax` violations and `noUnusedLocals`/`noUnusedParameters` violations, both enabled in `tsconfig.app.json`). Only `tsc -b` resolves the project references and actually checks `src/`.

## Architecture

Screen-based state machine (no router) driven by a single Zustand store (`src/store/gameStore.ts`), persisted to `localStorage` under the key `math-adventure-save`.

**Data flow:** `src/types/game.ts` defines the core discriminated unions (`Question` variants by `type`, `VisualHint` variants by `kind`) that everything else builds on. `src/data/questions/*.ts` each export a flat `Question[]` for one strand; `src/data/questions/index.ts` concatenates them into `allQuestions` and exposes `getQuestionById`/`getQuestionsForLevel` (levels reference questions only by ID string, never by object, so content can be edited without touching structure). `src/data/worlds.ts` defines the 5 `World` objects (each with 4 `Level`s), and `src/data/badges.ts` defines badge unlock conditions evaluated against store state.

**Store (`src/store/gameStore.ts`):** holds both persisted fields (`PersistedState`: XP, badges, per-level progress/stars, current world) and runtime-only fields (`currentScreen`, the active `run` — current level's question index/streak/correct count). `persist`'s `partialize` only saves the `PersistedState` fields. The initial `currentScreen` is computed synchronously from `localStorage` in `readInitialScreen()` at store-creation time (not via `onRehydrateStorage`, which has a temporal-dead-zone footgun if it tries to call `useGameStore.setState` from inside its own initializer — don't reintroduce that pattern).

**Unlock logic** (`src/lib/unlocks.ts`): `isLevelUnlocked`/`isWorldUnlocked`/`hasAllStarsInWorld` are pure functions of `(worlds, state)`, always derived at read time rather than stored — both `src/data/badges.ts` and the screens import from here so unlock rules stay in one place.

**Screens** (`src/screens/`) are switched on `currentScreen` in `App.tsx` inside a single `AnimatePresence`: `OnboardingScreen` → `WorldMapScreen` → `LevelIntroScreen` → `GameplayScreen` → `LevelCompleteScreen`. Navigation is store actions (`selectWorld`, `startLevel`, `goToWorldMap`, etc.), not props/routes.

**Gameplay loop:** `GameplayScreen` reads `store.run`, resolves the current `Question` via `getQuestionsForLevel`, and passes it to `QuestionCard`, which does an exhaustive switch on `question.type` to pick the answer component (`MultipleChoiceAnswer` / `NumericAnswer` / `DragDropOrderAnswer` / `DragDropMatchAnswer` — the drag-drop ones are actually tap-to-order/tap-to-match, not real HTML5 drag, chosen for touch/trackpad robustness). Answer correctness is checked in `src/lib/scoring.ts` (`isAnswerCorrect`, `starsForAccuracy`). XP/streak-multiplier math lives in `src/lib/xp.ts`. Submitting an answer calls `store.submitAnswer`; continuing after feedback calls `store.advanceAfterFeedback`, which either advances to the next question or (on the last question) computes the full `LevelRunResult`, updates XP/progress/badges, and transitions to `level-complete`.

**Map rendering** (`src/components/map/`): world node positions are fixed coordinates in `mapLayout.ts`, which exports **two** layouts — `MAP_LAYOUT` (a wide 900×320 zig-zag, tablet and up) and `MAP_LAYOUT_PORTRAIT` (a 380×820 vertical trail for phones). `useMapLayout()` picks between them off a `(max-width: 640px)` media query and re-picks on rotate/resize; `WorldMapScreen` calls it and passes `nodes` down to `LevelPath` (the dashed SVG trail) and `WorldNode` (per-world SVG icon + progress ring + lock state), and into `getNodePosition(worldId, nodes)` for `Avatar` (tweens between world coordinates via Framer Motion). Don't reintroduce direct `MAP_LAYOUT` imports in those components — that silently pins them to the wide layout, which on a 375px screen collapses the whole map into a ~130px strip with clipped labels. All map/world art is inline SVG or CSS — no image assets. Note: a `motion.g` that animates `y`/`rotate` via Framer Motion will silently override any static `transform` attribute on that same element — bake positional offsets into the animated values instead (see `Avatar.tsx`'s bob animation, which had this bug once).

**Content model conventions:** question IDs follow `{strandPrefix}-l{level}-q{n}` (`rp`, `ns`, `ee`, `g`, `sp`; levels 1–4; 9 questions each). `Level.questionIds` is just an array of these ID strings, generated in `worlds.ts` via `levelQuestionIds(prefix, level)`. When adding questions, append to the relevant strand file and reference the new IDs from `worlds.ts` — no schema changes needed. Every `Question` requires a non-generic `explanation` (shown after answering) — that's the pedagogical core of the app.

**Sound** (`src/lib/sound.ts`): four effects (`correct`/`incorrect`/`levelUp`/`click`) synthesized with the Web Audio API — no audio assets are bundled. The `AudioContext` is created lazily on first playback because browsers refuse to start one before a user gesture. Every call takes `soundEnabled` and no-ops when false; `TopBar` owns the 🔊/🔇 toggle and reads `soundEnabled`/`toggleSound` straight from the store, so all three screens using `TopBar` get it without prop threading.

**Testing:** Vitest is configured inside `vite.config.ts` (node environment, `src/**/*.test.ts`). Tests cover the pure-function core — `scoring.ts`, `xp.ts`, `unlocks.ts` — since those decide whether a kid is told they're right or wrong. `.github/workflows/ci.yml` runs build (the real typecheck), lint, and tests on push and PR.

**Styling:** no CSS framework. `src/styles/theme.css` defines global CSS custom properties plus per-world theme classes (`.world-theme--{strandId}` setting `--world-primary`/`--world-secondary`/`--world-accent`), applied at the screen root so nested components can reference `var(--world-primary, <fallback>)`. Component styles are co-located (`Component.tsx` + `Component.css`).
