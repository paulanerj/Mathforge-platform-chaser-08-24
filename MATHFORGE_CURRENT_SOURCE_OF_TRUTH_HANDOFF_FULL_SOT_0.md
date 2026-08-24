# MATHFORGE CURRENT SOURCE OF TRUTH HANDOFF

## 1. Project Identity
- **Current assumed branch**: mathforge-skinning
- **Current stable play surface**: center-circle answer-grid
- **Current visual architecture track**: SkinLab
- **Current stability track**: GAMEPLAY-STABILITY-0 through GAMEPLAY-STABILITY-1F accepted
- **Current implementation status**: stable enough to resume planning, but no new implementation should begin without PM authorization

## 2. Long-Term Product Direction
MathForge is not merely being color-skinned.

The long-term goal is a modular learning-game platform where:
- the math/learning engine remains stable;
- the center-circle answer-grid remains protected;
- relevant visual elements can be skinned;
- relevant layout elements can eventually be rearranged safely;
- relevant elements can eventually be animated;
- behavior presets can later control things like fly-ins, merges, transitions, emphasis, and story moments;
- progress can eventually drive dynamic presentation;
- future play surfaces, such as a number-line mode, can plug into the same app without being hacked into AnswerGrid.

Future architecture should separate:
- learning logic
- game state / reducer
- play surface
- layout layer
- skin/theme layer
- motion/behavior layer
- story/progress presentation layer

## 3. Current Accepted Stability Chain
- **GAMEPLAY-STABILITY-0**
  - **Purpose**: Identify state leaks and memory leaks in the baseline.
  - **Result**: Documented the current baseline state.
  - **Accepted status**: ACCEPTED
- **GAMEPLAY-STABILITY-1A**
  - **Purpose**: Introduce explicit SafeStorage utility wrapper.
  - **Files modified**: `src/services/safeStorage.ts`
  - **Result**: `SafeStorage` available.
  - **Accepted status**: ACCEPTED
- **GAMEPLAY-STABILITY-1B**
  - **Purpose**: Audit standard and problematic storage and timer consumption in `useGameLogic.ts`.
  - **Result**: Documented required changes for lifecycle synchronization.
  - **Accepted status**: ACCEPTED
- **GAMEPLAY-STABILITY-1C**
  - **Purpose**: Stabilize storage and visibility. Ensure `window.location.reload` is prevented.
  - **Files modified**: `src/hooks/useGameLogic.ts`
  - **Result**: Visibility pause guard implemented.
  - **Accepted status**: ACCEPTED
- **GAMEPLAY-STABILITY-1D**
  - **Purpose**: Audit reducer reset and stability.
  - **Result**: Synchronization plan created for clearing `retryStep` and `stepTries`.
  - **Accepted status**: ACCEPTED
- **GAMEPLAY-STABILITY-1D-R**
  - **Purpose**: Supplemental reducer audit for SafeStorage score handling.
  - **Result**: Storage and score alignment finalized.
  - **Accepted status**: ACCEPTED
- **GAMEPLAY-STABILITY-1E**
  - **Purpose**: Cleanup of `startGame` retry state anomalies.
  - **Files modified**: `src/hooks/useGameLogic.ts`, `src/store/gameReducer.ts`
  - **Result**: New game cleanly clears state.
  - **Accepted status**: ACCEPTED
- **GAMEPLAY-STABILITY-1F**
  - **Purpose**: Full chain checkout.
  - **Result**: Architecture stable for read-only handoffs.
  - **Accepted status**: ACCEPTED

## 4. Exact Source Files Modified During Accepted Stability Chain
- `src/hooks/useGameLogic.ts`
  - `useGameLogic.ts` received `SafeStorage` use for `lessonResults`;
  - `useGameLogic.ts` received visibility pause guard;
  - `useGameLogic.ts` now clears `retryStep` and `stepTries` on `startGame`.
- `src/store/gameReducer.ts`
  - `gameReducer.ts` routes SCORES and XP through `SafeStorage`.

## 5. Current Stability Improvements
- `speedmath.lessonResults` now uses `SafeStorage` in `useGameLogic.ts`
- `SCORES` now uses `SafeStorage` in `gameReducer.ts`
- `XP` now uses `SafeStorage` in `gameReducer.ts`
- visibility-hidden gameplay auto-pauses
- hidden duration does not inflate `stepStartTimeRef`
- manual resume remains required
- `retryStep` clears on new game start
- `stepTries` clears on new game start
- failed step → Home → new game smoke test passes
- visibility pause guard smoke test passes
- center-circle gameplay smoke test passes

## 6. Frozen SkinLab State
SkinLab is frozen and protected.

### Expected SkinLab files:
- `src/theme/themeTypes.ts`
- `src/theme/defaultTheme.ts`
- `src/theme/resolveTheme.ts`
- `src/theme/useTheme.ts`
- `src/theme/ThemeProvider.tsx`
- `src/theme/themeRegistry.ts`
- `src/theme/proofThemes.ts`
- `src/theme/resolveTheme.test.ts`
- `src/theme/themeRegistry.test.ts`
- `src/theme/ThemePreviewDevPanel.tsx`

### Current known capability:
- typed theme contract
- default theme
- partial theme resolution
- theme registry
- proof theme
- dev-only preview panel
- high-contrast proof theme
- live shell/non-gameplay token consumption

### Not-yet-implemented SkinLab areas:
- gameplay board skinning
- AnswerGrid skinning
- answer button skinning
- center prompt skinning
- gameplay control skinning
- Fail-Safe visual tokenization
- Dark Mode concealment tokenization
- production theme switcher
- persistent theme selection
- asset/SVG skin packs
- user-facing theme selection
- animation behavior system
- story/progress-driven presentation

## 7. Protected Baseline
The following must not be casually modified:
- `src/hooks/useGameLogic.ts`
- `src/store/gameReducer.ts`
- `src/components/Game/AnswerGrid.tsx`
- `src/components/Game/GameBoard.tsx`
- `src/services/timing.ts`
- `src/hooks/useSound.ts`
- `src/services/problemGenerator.ts`
- `src/services/mathEngine.ts`
- `src/services/patternEngine.ts`
- `src/services/cognitiveLoadModel.ts`
- `src/theme/*`

These files require PM-scoped phases and full modified file contents if changed.

## 8. Remaining Known Risks
- raw storage calls remain in non-authorized service/UI files
- timing kernel still uses existing timing model
- sound hook still owns interval/timeout behavior
- animation/motion architecture not yet started
- play-surface registry not yet started
- future number-line mode is separate and not integrated
- SkinLab is frozen and needs a careful resume checkpoint

## 9. Recommended Next Phase
**SKINLAB-RESUME-0 — Non-Gameplay SkinLab Resume Audit + Next Token Target Selection**
This must be read-only.

**Reason:**
The app has completed the immediate gameplay stability chain. Before making more SkinLab changes, the next step should verify the current SkinLab token contract, live consumers, proof theme, dev preview, and non-gameplay token boundaries, then choose the next smallest safe visual area.

## 10. Required Next Phase Draft
```
MATHFORGE SKINLAB RESUME — PM ACCEPTANCE AND AUTHORIZATION

Phase: SKINLAB-RESUME-0 — Non-Gameplay SkinLab Resume Audit + Next Token Target Selection

Objective: 
Read-only verify the current SkinLab token contract and recommend one next non-gameplay SkinLab target.

Required Inspection Files:
- src/theme/*
- src/components/Layout/SceneContainer.tsx
- src/components/UI/StartScreen.tsx
- src/components/UI/PauseOverlay.tsx
- src/components/UI/Help/HelpMenu.tsx
- src/components/UI/Settings/OptionsMenu.tsx

Do not touch gameplay board, AnswerGrid, Fail-Safe, Dark Mode concealment, or animation systems yet.
```
