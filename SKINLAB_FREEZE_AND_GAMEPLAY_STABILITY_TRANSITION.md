# MATHFORGE — SKINLAB FREEZE + GAMEPLAY STABILITY TRANSITION

## Objective

Freeze current SkinLab progress and transition priority back to gameplay/math correctness.

## Current Build/Test Status

*   **Lint**: `tsc --noEmit` passed.
*   **Tests (`resolveTheme.test.ts`)**: 15 tests passed.
*   **Tests (`themeRegistry.test.ts`)**: 10 tests passed.
*   **Build**: `vite build` completed successfully (5.70s).

## Frozen SkinLab State

SkinLab currently supports:
*   Theme type contract definition.
*   Default theme specification.
*   Partial theme resolution logic.
*   Theme registry lookup.
*   Controlled proof theme testing.
*   Dev-only preview functionality.
*   High-contrast proof theme calibration.
*   Shell token consumption (Live integration) for `StartScreen`, `SceneContainer`, `PauseOverlay`, `OptionsMenu`, and `HelpMenu`.

## Frozen SkinLab Files

The following files represent the frozen SkinLab architecture:
*   `src/vite-env.d.ts`
*   `src/theme/themeTypes.ts`
*   `src/theme/defaultTheme.ts`
*   `src/theme/resolveTheme.ts`
*   `src/theme/useTheme.ts`
*   `src/theme/ThemeProvider.tsx`
*   `src/theme/themeRegistry.ts`
*   `src/theme/proofThemes.ts`
*   `src/theme/resolveTheme.test.ts`
*   `src/theme/themeRegistry.test.ts`
*   `src/theme/ThemePreviewDevPanel.tsx`

## Frozen Live Theme Consumers

*   `src/components/UI/PauseOverlay.tsx`
*   `src/components/UI/Help/HelpMenu.tsx`
*   `src/components/UI/Settings/OptionsMenu.tsx`
*   `src/components/UI/StartScreen.tsx`
*   `src/components/Layout/SceneContainer.tsx`

## Dev Preview / Proof Theme Status

*   **Dev Preview**: Exists, is strictly dev-only, non-persistent, and resets to defaults on application reload.
*   **Proof Theme**: `crystalForgeProofTheme` exists, provides high-contrast calibration styling, is registered in the theme registry, but remains inactive by default.

## Not Yet Implemented In SkinLab

*   Gameplay board skinning.
*   AnswerGrid skinning.
*   Answer button skinning.
*   Fail-Safe visual tokenization.
*   Dark Mode concealment tokenization.
*   Center prompt skinning.
*   Gameplay controls skinning.
*   Production theme switcher.
*   Persistent theme selection.
*   Asset/SVG skin packs.
*   User-facing theme selection.

## Protected During Gameplay Repair

During gameplay stability repair, **do not modify** the following files unless directly implicated in a bug. If modification is necessary, a precise justification must be documented first:
*   `src/theme/*` (All files)
*   `src/vite-env.d.ts`
*   `ThemeProvider` and `ThemePreviewDevPanel` logic.
*   `proofThemes` and `themeRegistry` logic.
*   StartScreen token usage.
*   SceneContainer token usage.
*   PauseOverlay shell token usage.
*   HelpMenu shell token usage.
*   OptionsMenu shell token usage.
*   All `SKINLAB_*.md` freeze check and contract documents.

## Gameplay Stability Concern

**User-Reported Issue:**
The application may corrupt or confuse its core math logic when left open or not fully restarted from the browser (e.g., returning from sleep, stale closures).

## Likely Gameplay Stability Investigation Areas

Files that dictate core gameplay loops, states, and lifecycles:
*   `src/hooks/useGameLogic.ts`
*   `src/store/gameReducer.ts`
*   `src/services/practicePlanController.ts`
*   `src/services/safeStorage.ts`
*   `src/components/Game/AnswerGrid.tsx`
*   `src/components/Game/GameBoard.tsx`
*   `src/components/Game/GameHeader.tsx`
*   `src/constants.ts`
*   `src/types.ts`
*   Math generation utilities (if segmented)

## Persistence / Stale State Search Notes

*   **Storage Access**: The app makes extensive use of `localStorage` for scores, settings, progress, curriculum presets, session configs, and achievements. Although `safeStorage.ts` exists, direct `localStorage` access is heavily spread across `src/services/` and `src/components/UI/`.
*   **Timers**: Both `setTimeout` and `setInterval` are heavily utilized, notably in renderers (e.g., `RigidRenderer`, `CircleRenderer`), timing services, `useGameLogic.ts` state changes, and audio syncs.
*   **Effect Hooks**: Over 40+ `useEffect` declarations exist across UI components and `useGameLogic`, managing events, updates, timeouts, bounds, and closures.
*   **Reset/Restart Flows**: The terms `reset` and `restart` trigger deep state clearing via reducers and orchestrators. Finding mismatched lifecycles inside `useGameLogic` or `gameReducer.ts` resets will be critical to catching stale closures.

## Recommended Next Phase

**GAMEPLAY-STABILITY-0 — Read-only bug reproduction and lifecycle audit**
