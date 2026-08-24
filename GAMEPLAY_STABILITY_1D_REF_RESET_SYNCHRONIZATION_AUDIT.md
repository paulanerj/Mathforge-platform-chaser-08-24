# GAMEPLAY_STABILITY_1D_REF_RESET_SYNCHRONIZATION_AUDIT.md

## 1. Exact Files Inspected
- `src/hooks/useGameLogic.ts`
- `src/store/gameReducer.ts`
- `src/services/timing.ts`
- `src/services/orchestrator.ts`
- `src/services/stepLogger.ts`
- `src/hooks/useSound.ts`
- `src/components/Game/GameHeader.tsx`

## 2. Ref / Mutable Singleton Inventory

| Ref / Mutable Singleton | File | Purpose | Current Reset Trigger | Missing Reset Risk | Should Reset On | Should Preserve On | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `retryStep` (useState) | `useGameLogic.ts` | Failsafe step state. | `isCorrect` inside answer handler. | Medium (Invalidates first step of a new game). | `START_GAME` | Pause, Hidden, Blur | Reset in `startGame()` fn. |
| `stepTries` (useState) | `useGameLogic.ts` | Tracks tries for confidence. | `isCorrect` inside answer handler. | Medium (Invalidates confidence scoring). | `START_GAME` | Pause, Hidden | Reset in `startGame()` fn. |
| `requestRef` | `useGameLogic.ts` | `rAF` TICK loop. | Cleanup / State changes. | Low | - | - | Safe as is |
| `stepStartTimeRef` | `useGameLogic.ts` | Tracks step duration. | `stepId` change. | Low | - | - | Safe as is |
| `darkStepAdvanceFiredRef`| `useGameLogic.ts`| Prevents double advance fire. | `stepId` change. | Low | - | - | Safe as is |
| `xpAwardedRef` | `useGameLogic.ts` | Session XP deduplication. | `status === 'playing'` effect. | Low | - | - | Safe as is |
| `skipRhythmStats`| `useGameLogic.ts` | Rhythm analytics. | `START_GAME` if `skip_rhythm`. | Low | `START_GAME` | - | Safely bound to mode. |
| `configRef` | `useGameLogic.ts` | Stale closure guard. | `setConfig`. | Low | - | - | Safe as is |
| `isPlayingRef` | `useGameLogic.ts` | Visibility listener guard. | `state.status` mapping. | Low | - | - | Safe as is |
| `isPausedRef` | `useGameLogic.ts` | Visibility listener guard. | `state.isPaused` mapping. | Low | - | - | Safe as is |
| `hiddenTimestampRef`| `useGameLogic.ts`| Start of hidden window. | `visibilitychange` mapping. | Low | - | - | Safe as is |
| `autoPausedByVisibilityRef`| `useGameLogic.ts`| Cause descriptor. | `visibilitychange` mapping. | Low | - | - | Safe as is |
| `tickIntervalRef` | `useSound.ts` | Audio node tick generator. | Cleanup fn. | Low | - | - | Safe as is |
| `activeOscillatorsRef` | `useSound.ts` | Active tracking audio nodes. | Cleanup fn. | Low | - | - | Safe as is |
| `statsTracker` | `gameReducer.ts` | Metric aggregation sum. | Reducer `START_GAME`. | Low | - | - | Safe as is |
| `orchestrator` | `gameReducer.ts` | Level sequence phase tracker. | Reducer `START_GAME`. | Low | - | - | Safe as is |
| `gameEngine.currentStepId`| `timing.ts`| Internal step identifier. | Reducer `START_GAME`. | Low | - | - | Safe as is |
| `StepLogger currentSession`|`stepLogger.ts`| Analytics logger payload object.| `startSession()`. | Low | - | - | Safe as is |

## 3. Lifecycle Boundary Inventory

| Lifecycle Boundary | Current Behavior | Refs/Singletons Reset | Refs/Singletons Not Reset | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| `START_GAME` | Restarts singletons. | `statsTracker`, `orchestrator`, `StepLogger`, `gameEngine`, `skipRhythmStats`, `xpAwardedRef`. | `retryStep`, `stepTries`. | Medium (Leaves old failsafe step and try count on first new step). | Reset `retryStep` and `stepTries` via `useGameLogic.ts` on start. |
| `EARLY_EXIT` | Finishes game. | Ends logger cleanly, fires XP dispatch. | `retryStep`, `stepTries`. | Low | Safe |
| `EXIT_TO_IDLE` | Discards game session. | None immediately. Logically abandoned. | `logger`, `retryStep`. | Low | Safe |
| `TOGGLE_PAUSE` | Hides gameplay. | Stops `rAF` and timing interval. | All step states. | Low | Safe |
| `manual resume` | Opens gameplay. | Resumes timers cleanly. | - | Low | Safe |
| `visibility hidden`| 1C Guard | Triggers `TOGGLE_PAUSE` cleanly. | `hiddenTimestampRef` set. | Low | Safe |
| `visibility visible`| 1C Guard | Offsets `stepStartTimeRef` properly. | `hiddenTimestampRef` cleared.| Low | Safe |
| `restart` | Triggers START_GAME. | Game state resets cleanly via hooks. | `retryStep`, `stepTries`. | Medium | Rely on START_GAME cleanup patch. |
| `Home navigation` | Triggers EXIT_TO_IDLE. | Discards actively visible components. | - | Low | Safe |
| `session finished` | Fires `EARLY_EXIT` map | Records XP data cleanly. | - | Low | Safe |

## 4. Risk Ranking

- LOW: Timing Kernel intervals (managed cleanly by `gameEngine.stopAll()` bindings).
- LOW: StepLogger (abandoned cleanly on idle without side effects, overwritten cleanly on start).
- LOW: StatsTracker / Orchestrator / GameEngine (reducer synchronously cleans them up on `START_GAME`).
- MEDIUM: `retryStep`, `stepTries` hooks acting as mutable session state (if the user fails a step, then exits, and then restarts the game, the very first step object is deeply corrupted by the stale failsafe payload reference and breaks confidence score tracking).

## 5. Protected Behaviors Audit

Confirmed future ref reset repair must NOT alter:
- correct flash
- wrong shake
- fail-safe correction phase semantics
- Dark Mode concealment and step advances
- Skip Rhythm chain logic
- XP awarding guard semantics
- step logging timestamps
- lesson result analytics
- center-circle answer-grid visual behavior
- SkinLab token behavior
- visibility auto-pause behavior implemented in 1C

## 6. Recommended Future Repair Phase

**Option A — START_GAME Ref Cleanup Only**

Reset the explicitly scoped `retryStep` and `stepTries` variables directly within the `startGame` initialization wrapper inside `useGameLogic.ts`. This closes the boundary loop cleanly without altering active gameplay timings.
