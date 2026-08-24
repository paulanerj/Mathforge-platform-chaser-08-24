# GAMEPLAY-STABILITY-1B: Timer / Ref / Sleep-Wake Lifecycle Audit Only

## 1. Files Inspected
- `src/hooks/useGameLogic.ts`
- `src/store/gameReducer.ts`
- `src/services/timing.ts`
- `src/services/orchestrator.ts`
- `src/services/stepLogger.ts`
- `src/hooks/useSound.ts`
- `src/components/Game/AnswerGrid.tsx`
- `src/components/Game/GameBoard.tsx`
- `src/components/Game/GameHeader.tsx`
- `src/components/UI/PauseOverlay.tsx`
- `src/components/UI/StartScreen.tsx`
- `src/types.ts`
- `src/constants.ts`

## 2. Timer Ownership Inventory

| Timer / Clock Source | File | Owner | Purpose | Cleanup Exists? | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| `requestAnimationFrame` | `useGameLogic.ts` | `useGameLogic` | Dispatches `TICK` actions every 1000ms. | Yes, cancelled on unmount or pause. | Browsers stop `rAF` during sleep, starving the TICK action. | Pause the game when tab visibility changes to hidden. |
| `setTimeout` (400ms) | `useGameLogic.ts` | `useGameLogic` | Dispatches `CLEAR_EFFECTS` to reset flash/shake. | Yes, cleared via effect cleanup. | If tab sleeps, timeout could be delayed, but low risk. | Leave as is. |
| `setInterval` (1000ms) | `src/services/timing.ts`| `TimingKernel` | Heartbeat for step pressure timers and dark mode intervals. | Yes, via `stop()` / `pause()`. | Heavy browser throttling (down to 1 interval per minute) during sleep. Timers drift or fail. | Pause the game on visibility loss to freeze the interval gracefully. |
| `setInterval` (1000ms) | `useSound.ts` | `useSound` | Plays the 1000ms "tick" sound natively when applicable. | Yes. | Audio nodes shouldn't be scheduled blindly during long sleep. | Handle through main execution pause. |
| `setTimeout` | `useSound.ts` | `useSound` | Cleans up active audio oscillators from refs. | Yes. | Sleep could cause a massive buildup in active oscillators. | Handle through visibility pause or clear. |
| `performance.now()` | `useGameLogic.ts` | `useGameLogic` | Measure absolute human response time (`performance.now() - stepStartTimeRef`). | No. | Background time directly inflates `responseTime`, breaking step logs. | Track pause duration and subtract, or auto-pause. |

## 3. Mutable Ref Inventory

| Ref | File | Purpose | Reset Trigger | Cleared on START_GAME? | Cleared on EXIT_TO_IDLE? | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `requestRef` | `useGameLogic.ts` | Handle to the active `rAF` TICK loop. | Every frame or on pause/exit. | Cleared by effect cleanup | Cleared by effect cleanup | Low (Stale during sleep, but recovers) | Automatically pause. |
| `stepStartTimeRef` | `useGameLogic.ts` | Raw timestamp of when a step started for `responseTime` metrics. | Step Index change. | Yes (Step changes to 0) | No explicit cleanup. | High (`performance.now()` captures time effectively while the user is paused or sleeping). | Track `pauseDuration` or similar. |
| `darkStepAdvanceFiredRef` | `useGameLogic.ts` | Prevents multiple dark step advances firing simultaneously. | Step Index change. | Yes (Step changes to 0) | No. | Low | Leave as is. |
| `xpAwardedRef` | `useGameLogic.ts` | Prevents awarding XP twice for same finished session. | `playing` status. | Yes | Yes (by nature of state change) | Low | Leave as is. |
| `skipRhythmStats` | `useGameLogic.ts` | Stores Skip Rhythm counters continuously across a session. | `startGame()` wrapper function. | Yes. | No. | Low | Leave as is. |
| `configRef` | `useGameLogic.ts` | Gives latest config to inside callbacks to avoid stale closures. | `config` change. | N/A | N/A | Low | Leave as is. |
| `tickIntervalRef` | `useSound.ts` | Handle for audio "tick" timer. | Audio context/mute change. | N/A | N/A | Low | Leave as is. |

## 4. Reducer Lifecycle Inventory

| Action | File | What It Resets | What It Does Not Reset | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| `START_GAME` | `gameReducer.ts` | `status` ('playing'), `stepIndex` (0), `elapsedTime`, mistakes, `statsTracker`, `orchestrator`. | Does not clear UI flash/shake state natively unless passed in. | Medium (could carry over stale effect states). | Issue `CLEAR_EFFECTS` on start or bake it in. |
| `TICK` | `gameReducer.ts` | `elapsedTime` | N/A | Low | Safe |
| `TOGGLE_PAUSE` | `gameReducer.ts` | Flips `isPaused`. | Doesn't adjust any `stepStartTimeRef`. | High (User is penalized on response time for pausing). | Manage pause timestamps. |
| `SUBMIT_ANSWER` | `gameReducer.ts` | Submits score, advances `stepIndex`. | Doesn't clear effects. | Low | Safe |
| `TIMEOUT` | `gameReducer.ts` | Logs fail, advances `stepIndex`. | Doesn't clear effects. | Low | Safe |
| `EARLY_EXIT` | `gameReducer.ts` | Sets `status` to 'finished'. | Doesn't clear timeout kernels explicitly. | Low | Safe |
| `CLEAR_EFFECTS`| `gameReducer.ts` | Resets `flashState`, `shake`, `opUpdateAnim`. | N/A | Low | Safe |
| `EXIT_TO_IDLE` | `gameReducer.ts` | Returns entirely to 'idle' state. | Doesn't clear orchestrator explicitly. | Medium (could leave stale state if user starts another mode quickly). | Ensure orchestrator resets. |

## 5. Browser Sleep / Wake Risk Analysis

- **Tab sleeps for 5 minutes during active gameplay:** `requestAnimationFrame` pauses. `setInterval` pauses or slows to 1min. When user wakes, `setInterval` might fire some backlogged ticks, and `rAF` resumes. However, `performance.now()` minus `stepStartTimeRef.current` will be > 5 minutes, leading to massive `responseTime` logging and destroying stats/XP metrics.
- **Tab sleeps during correction/fail-safe state:** `setInterval` is stopped locally (engine stopped), `rAF` is running. Sleep halts `rAF`.
- **Tab sleeps during Dark Mode concealment:** TimingKernel interval runs, but heavily throttled. Dark Mode duration might stretch indefinitely, defeating the pressure purpose.
- **Tab sleeps during Skip Rhythm:** The user loses momentum but their response time on the next tick will be penalized drastically due to ref drift.
- **Tab sleeps after answer feedback but before CLEAR_EFFECTS:** The 400ms `setTimeout` may fail to fire promptly, locking the UI in a "flash" or "shake" state indefinitely until the user returns.
- **Browser reloads after stale localStorage:** Handled by Phase 1A safe storage.
- **User presses Home during an active timer:** Navigation unmounts timing components gracefully, but orchestrator states may not be entirely reset if `EXIT_TO_IDLE` lacks a deep clean.
- **User restarts rapidly:** Step logging artifacts or sounds may overlap if `startSession` and `stopAllSounds` aren't fired cleanly.
- **User pauses, backgrounds tab, returns later:** `setInterval` and `rAF` resume correctly when unpaused. However, `stepStartTimeRef` is STILL counting because we don't offset or recalculate timestamps during pauses!

## 6. Protected Behavior Audit
Any future timer repair must entirely avoid altering:
- correct flash duration
- wrong shake behavior
- fail-safe correction phase
- Dark Mode concealment timing
- Skip Rhythm chain logic
- XP awarding guard
- step logging
- lesson result recording
- center-circle answer-grid behavior
- SkinLab token behavior

## 7. Recommended Future Repair

Option A — Visibility Pause Guard Only
Adding page visibility handling to auto-pause when the browser sleeps or tab hides is the most universal, simplest way to address `setInterval` throttling and stale wake states without drastically rewriting timer kernels. Pausing also requires the player to hit "Resume", preparing them mentally before timers start ticking again.
(Additionally, a minor fix to offset `stepStartTimeRef` by the duration of the pause would solve the `performance.now()` drift.)
