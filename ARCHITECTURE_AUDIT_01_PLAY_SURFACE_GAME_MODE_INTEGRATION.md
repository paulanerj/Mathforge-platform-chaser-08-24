# ARCHITECTURE-AUDIT-01 — Play Surface / Game Mode Integration Read-Only Audit

## 1. Exact files inspected
* src/App.tsx
* src/types.ts
* src/store/gameReducer.ts
* src/hooks/useGameLogic.ts
* src/components/Game/GameBoard.tsx
* src/components/Game/AnswerGrid.tsx
* src/components/Game/GameHeader.tsx
* src/adapters/gameToVisualAdapter.ts
* src/config/activityPresets.ts
* src/services/practicePlanController.ts
* src/theme/themeTypes.ts
* src/theme/defaultTheme.ts
* src/theme/resolveTheme.ts
* src/experimental/README.md

## 2. Confirmation that no source files were modified
Confirmed. No source files were modified during this audit.

## 3. Confirmation that no theme files were modified
Confirmed. No theme files were modified.

## 4. Current app architecture map
* **App entry / root state:** `src/App.tsx` controls screen routing (`currentScreen`) and mounts the appropriate UI shells and `GameBoard` when active.
* **Configuration ownership:** `AppConfig` is stored in `SettingsStore`, managed by `useGameLogic`, and frequently updated by `PracticePlanController` for lesson sessions.
* **Game state ownership:** Authoritative state lives in `telemetryGameReducer` via `gameReducer.ts`.
* **Reducer / hook ownership:** `useGameLogic.ts` orchestrates the UI, timer updates, and action dispatching into `gameReducer`.
* **Answer generation:** `ProblemGenerator.generateSequence` dynamically builds `GameStep` objects based on config upon `START_GAME`.
* **Answer rendering:** The `toVisualStep` adapter translates `GameStep` into a visual contract, passing `distractors` (options) to `AnswerGrid.tsx`.
* **Scoring / XP:** `StatsTracker` observes correct/incorrect submissions and generates final session stats, which `XPTracker` evaluates and stores.
* **Timer / pause behavior:** Controlled by `timingKernel.ts` and synchronized through `useGameLogic`. `document.hidden` auto-pauses the game.
* **Fail-safe behavior:** Incorrect answers set `failedCurrentStep` to true in `gameReducer`, entering a pedagogical correction phase visually handled by `AnswerGrid.tsx` via glowing styles and disabled distractor buttons.
* **Scene / visual shell rendering:** `SceneContainer.tsx` wraps the layout and provides the background theme/particles based on `activeScene`. 
* **Settings/options flow:** `OptionsMenu.tsx` manipulates `AppConfig` directly, which triggers a game restart upon applying.
* **Lesson plan flow:** `PracticePlanController` pushes configuration templates (levels) overriding `AppConfig` successively, recording skill progress per level.

## 5. Current game mode model
* **Model Representation:** Game modes exist as two concepts: `learningMode` (curriculum format, e.g., `skipcount`, `pattern`) and `GameMode` (step mechanics, e.g., `normal`, `dark`, `qmm`, `survival`).
* **Implementation:** Currently, game modes are a hybrid. They are data-driven at the configuration/generator level but heavily hardcoded throughout the runtime. `gameReducer.ts` and `useGameLogic.ts` contain numerous `if (step.mode === 'dark')` branches controlling specific timing logic, sound effects, and step-advancement rules.

## 6. Current play surface model
* **True Play Surface Abstraction:** There is NO true play surface abstraction currently.
* **Implementation:** `GameBoard.tsx` serves as a monolithic anchor, hardcoding a `GameLayout` container composed of a dynamic `centerArea` (`ActiveRenderer`) and a fixed `answerArea` (`AnswerGrid`).
* **Extensibility:** While the center prompt can swap between a `CircleRenderer` and a `MinimalRenderer`, future surfaces (like a number line or grid) cannot plug in cleanly because `GameBoard.tsx` assumes a discrete single-prompt + multi-button choice interface.

## 7. Current visual/theme model
* **SkinLab Status:** SkinLab token migration is paused and sealed.
* **Sealed Entities:** Backgrounds (`SpaceScene`), `StartScreen`, `HelpMenu`, `PauseOverlay`, and `OptionsMenu` parent shells have safely adopted theme tokens.
* **Protected Entities:** The core gameplay loop (`GameBoard`, `AnswerGrid`, `CenterCoin`, `GameHeader`, answer feedback states, fail-safe visuals, dark mode concealment) remains hardcoded and protected against token migration, awaiting a proper semantic boundary.

## 8. Coupling risks
* **Layout Coupling:** `GameBoard` is rigidly coupled to `AnswerGrid`. A different interaction pattern (e.g., drawing, dragging) cannot bypass `AnswerGrid` without deep changes.
* **Logic Coupling:** `gameReducer.ts` handles answer submissions exclusively as discrete, single-choice numerical evaluations.
* **Visual Coupling:** Dark mode concealment logic (`opacity-0 pointer-events-none`) is hardcoded directly into the CSS classes of `AnswerGrid.tsx`.
* **State Coupling:** Visual effects like `shake`, `flashState`, and `opUpdateAnim` rely on a single central target concept, limiting surfaces that might need multi-target effects.

## 9. Existing safe extension points
* **Center Renderer Map:** The `rendererMap` inside `GameBoard` handles `circle` vs `minimal` and can theoretically support more center-prompt variants.
* **Activity Presets:** Adding new templates to `activityPresets.ts` and generating custom sequences using `PracticePlanController`.
* **Visual Adapter:** `toVisualStep` provides a layer to format raw steps before they reach the renderer, though currently restricted to standard arithmetic structures.

## 10. Unsafe extension points
* Directly modifying `GameBoard.tsx` to hack in new layouts or grid styles.
* Directly modifying `useGameLogic.ts` or `gameReducer.ts` to add more mode-specific conditional branches (`if (mode === 'gear') ...`).
* Directly modifying `AnswerGrid.tsx` to handle alternative interaction mechanics.
* Continuing SkinLab UI token migration into active gameplay components.

## 11. Recommended architecture direction
* **Direction:** registry-based play surface architecture.
* **Reasoning:** A Play Surface Registry will decouple `GameBoard` from its hardcoded `AnswerGrid` and `GameLayout`. It allows the app to map an incoming `learningMode` or `GameMode` to a completely independent surface component wrapper (e.g., `CenterCircleSurface`, `NumberLineSurface`). This eliminates the need for deeply nested `if-else` mode statements inside the renderers, securing current gameplay from future expansions.

## 12. Recommended next phase type
* ARCHITECTURE DESIGN

## 13. Recommended next phase name
* ARCHITECTURE-DESIGN-01 — Play Surface Integration Boundary Design

## 14. Implementation recommendation
* NO

## 15. If implementation is not recommended, explicit reason
* An architecture design document (mapping out the Registry interface, Surface contracts, and routing logic) must be authored and reviewed by PM before any structural refactoring occurs. Implementing it blindly risks breaking the highly stable, protected gameplay state.

## 16. Protected gameplay boundaries
* Center-circle rendering (`CenterCoin`, `CircleRenderer`)
* `AnswerGrid` fail-safe and selection behaviors
* Dark mode concealment behavior
* Scoring, XP, and `StatsTracker`
* `gameReducer.ts` transition logic
* `timingKernel.ts` and timer displays
* Visibility pause guard

## 17. Protected SkinLab/token boundaries
* `SpaceScene` rendering and token references
* `PauseOverlay`
* `StartScreen` passive splash cards
* `HelpMenu` minimal tabs
* `OptionsMenu` shell

## 18. Missing files or unclear areas
* `src/experimental/` contains only a `README.md`; no existing experimental surfaces were found to audit against.
* There is no existing `Play Surface Registry` documentation present.

## 19. Validation command results
* LINT: PASS
* THEME RESOLUTION TESTS: PASS
* THEME REGISTRY TESTS: PASS
* BUILD: PASS

## 20. Manual QA status
* App opens: PASS
* Start Screen opens: PASS
* OptionsMenu opens: PASS
* Start current center-circle game: PASS
* Correct answer behavior works: PASS
* Wrong answer / fail-safe behavior works: PASS
* Pause/resume works: PASS
* Console clean: PASS (known benign warnings only)
