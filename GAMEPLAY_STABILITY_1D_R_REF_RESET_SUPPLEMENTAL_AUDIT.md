# GAMEPLAY_STABILITY_1D_R_REF_RESET_SUPPLEMENTAL_AUDIT.md

## 1. Exact Missing Files Inspected
- `src/components/Game/AnswerGrid.tsx`
- `src/components/Game/GameBoard.tsx`
- `src/components/UI/PauseOverlay.tsx`
- `src/components/UI/StartScreen.tsx`
- `src/types.ts`
- `src/constants.ts`

## 2. Ref / Local Mutable State Found
- `AnswerGrid.tsx`:
  - `scaleFactor` (useState): purely visual UI scaling factor.
  - `failSafeMessage` (useState): UI presentation for Fail-Safe helper string. (Cleared safely via an effect on `state.failedCurrentStep`).
  - `containerRef` (useRef): standard DOM node reference for ResizeObserver layout logic.
- `GameBoard.tsx`:
  - Contains NO local state or refs. Pure component representation.
- `PauseOverlay.tsx`: 
  - Contains NO local state or refs. Pure component representation.
- `StartScreen.tsx`:
  - `hasActiveLesson` (useState): basic rendering gate for the resume button layout.
  - `lessonTitle` (useState): basic visual string layout content.
- `types.ts` & `constants.ts`:
  - Pure structural typings and enums. NO runtime states.

## 3. Lifecycle-Triggering Callbacks Found
- `AnswerGrid.tsx`: Triggers `actions.handleAnswer(ans)`
- `GameBoard.tsx`: Triggers `actions.advanceDarkStepNow`
- `PauseOverlay.tsx`: Triggers `actions.togglePause()`, `actions.startGame()`, `onExitToHome()`
- `StartScreen.tsx`: Triggers `actions.setConfig()`, `actions.startGame(newConfig)`, `onNavigate(...)`

## 4. Orignal Medium Risk Validation
- **Risk Remains Valid:**
  - `retryStep` and `stepTries` are definitively stored inside `useGameLogic.ts`, untouched and unimpeded by unmounting any of the frontend components.
  - Their presence is never cleared when navigating out to the Home screen (via `EXIT_TO_IDLE` or `onExitToHome`) or when hitting Restart (`startGame()`), confirming that failing a step and restarting rapidly will inject the prior step payload metadata as the first active step and permanently distort confidence metrics.

## 5. New High or Critical Risks
- **NO NEW RISKS IDENTIFIED.**
- The visual components bind purely to the `dispatch` actions properly and execute state resets via established architectural channels. The only lingering bug is in `useGameLogic`'s explicit `retryStep` scoped mutable states.

## 6. Recommended Next Phase
- **Option A — START_GAME Ref Cleanup Only**
- Reason: The bug exists purely inside `useGameLogic`'s local state closure where `retryStep` and `stepTries` must be explicitly nullified upon calling `startGame()` to prevent bleeding failsafe contexts into a new round of timings. Everything else has been confirmed secure.
