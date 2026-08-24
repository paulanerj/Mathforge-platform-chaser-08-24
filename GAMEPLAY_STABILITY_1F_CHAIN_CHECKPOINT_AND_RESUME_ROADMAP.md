# GAMEPLAY_STABILITY_1F_CHAIN_CHECKPOINT_AND_RESUME_ROADMAP

## 1. Current Project Identity
* Assumed Branch: `mathforge-skinning`
* SkinLab: FROZEN
* Center-circle answer-grid: STABLE BASELINE

## 2. Accepted Stability Phases
* GAMEPLAY-STABILITY-0
* GAMEPLAY-STABILITY-1A (Storage safe funnel freeze)
* GAMEPLAY-STABILITY-1B (Timer ref lifecycle audit)
* GAMEPLAY-STABILITY-1C (Visibility pause guard freeze)
* GAMEPLAY-STABILITY-1D (Ref reset synchronization audit)
* GAMEPLAY-STABILITY-1D-R (Ref reset supplemental audit)
* GAMEPLAY-STABILITY-1E (START_GAME retry state cleanup freeze)

## 3. Exact Source Modifications Accepted During the Chain
* `src/hooks/useGameLogic.ts`: Added visibility pause guard and start game retry state cleanup
* `src/store/gameReducer.ts`: Fixed uninitialized array references and cleanup logic.

## 4. Exact Source Areas Intentionally Untouched
* SkinLab files
* theme registry
* proof themes
* reducer during 1C/1E
* timing service
* sound hook
* AnswerGrid/GameBoard/StartScreen/PauseOverlay source during 1D-R

## 5. Current Stability Improvements
* Core storage calls routed through SafeStorage for `speedmath.lessonResults`, `SCORES`, and `XP`.
* Visibility-hidden gameplay auto-pause guard added to prevent active gameplay progression when tab is hidden.
* Hidden duration no longer inflates `stepStartTimeRef` tracking.
* Stale `retryStep` and `stepTries` explicitly cleared on new game start, fixing confidence metric leak upon restart.

## 6. Remaining Known Risks
* Raw storage calls remain in non-authorized service/UI files (e.g. settings persist).
* Timer kernel still uses its existing timing model which may need architectural alignment future-proofed.
* Sound hook still owns its own interval/timeout behavior.
* Broader animation/behavior architecture not yet implemented or unified.
* Future number-line play surface is separate and not integrated yet.

## 7. Protected Product Direction
* MathForge is moving toward a modular platform.
* SkinLab is not just color reskinning; it handles extensive visual semantics.
* Future layers should include layout control, animation/motion behavior, story/progress-driven presentation, and separate play surfaces.
* The current center-circle mode must remain stable throughout these transitions.

## 8. Recommended Next Lane
**Option B: Return to SkinLab with a non-gameplay token checkpoint.**
*Reason:* The center-circle gameplay stability has been largely achieved through addressing the most glaring issues (visibility tab hides and state leaks). A return to the SkinLab phase that was paused for this stability push will allow the design/UX pipeline to catch up before we dive deeper into unifying architectures like MotionLab or Play Surface Registry. We achieved the minimum stability threshold needed to safely resume token definitions.
