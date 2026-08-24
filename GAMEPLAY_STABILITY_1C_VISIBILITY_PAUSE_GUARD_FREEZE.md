# GAMEPLAY-STABILITY-1C: Visibility Pause Guard

## Files Inspected
- `src/hooks/useGameLogic.ts`

## Files Modified
- `src/hooks/useGameLogic.ts`

## Contents of Modified Files

### `src/hooks/useGameLogic.ts` (Modified Sections Only)

```typescript
  const skipRhythmStats = useRef({ totalResponseTime: 0, responseCount: 0 });
  const stepStartTimeRef = useRef<number>(0);

  // Visibility Pause Guard Refs
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const hiddenTimestampRef = useRef<number | null>(null);
  const autoPausedByVisibilityRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = state.status === 'playing';
    isPausedRef.current = state.isPaused;
  }, [state.status, state.isPaused]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isPlayingRef.current) {
          hiddenTimestampRef.current = performance.now();
          if (!isPausedRef.current) {
            autoPausedByVisibilityRef.current = true;
            dispatch({ type: 'TOGGLE_PAUSE' });
          }
        }
      } else {
        if (hiddenTimestampRef.current !== null) {
          const hiddenDuration = performance.now() - hiddenTimestampRef.current;
          stepStartTimeRef.current += hiddenDuration;
          hiddenTimestampRef.current = null;
          
          // Existing UX uses a PauseOverlay that requires manual resume.
          // Therefore, we keep the game paused and do not auto-resume.
          autoPausedByVisibilityRef.current = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Track step attempts to ensure timer resets on retry
  const stepId = `${state.stepIndex}-${stepTries}`;
```

*(Remaining file content intentionally omitted as no other lines were modified, except standard imports remaining untouched. Refer to the current repository state for full file contents which matches the requested constraints.)*

## Current Paths Inspected
- **Current Pause Path**: Uses `dispatch({ type: 'TOGGLE_PAUSE' })` which updates `state.isPaused`. The `<PauseOverlay>` correctly handles rendering. When `state.isPaused` is true, `useGameLogic.ts` automatically calls `gameEngine.stopAll()` in its effect.
- **Current Timing Stop/Start Path**: Handled natively by `<PauseOverlay>` toggling pause, triggering the effect in `useGameLogic.ts` that runs `gameEngine.stopAll()` and halts `requestAnimationFrame`.
- **Current Response Time Source**: Evaluated as `performance.now() - stepStartTimeRef.current`.

## Visibility Guard Implementation
Added a `visibilitychange` listener that triggers when `document.hidden` toggles.
- Subscribes using raw DOM API event `document.addEventListener('visibilitychange', ...)`.
- Detects whether it was playing and NOT already paused when hiding occurs to pause it by dispatching `TOGGLE_PAUSE`.
- Uses `performance.now()` in `hiddenTimestampRef` to track when it was hidden.
- Adjusts `stepStartTimeRef.current` forward by the total `hiddenDuration` upon returning to visible, successfully shifting the reference timestamp to negate the time spent asleep.
- Does NOT auto-resume. The user must click Resume.

## Adjustments
- Auto-pause on hidden: YES.
- Auto-resume on visible: NO. (Standard manual behavior maintained).
- `stepStartTimeRef` Adjusted: YES. Hidden duration is added to `stepStartTimeRef.current` to prevent inflated response time metrics upon manual resumption.

## Additional Confirmation
- Timing Kernel Modified: NO.
- Sound Hook Modified: NO.
- Reducer Modified: NO.
- Storage Modified: NO.
- Theme/SkinLab Modified: NO.

## Build/Test Results
- Build: PASS
- Lint: PASS
- Theme Resolution/Registry Tests: PASS (15 passed, 10 passed)

## Manual Smoke QA
- Tested visibility toggle during center-circle active gameplay. Auto-paused cleanly.
- `stepStartTimeRef` correctly offsets to prevent duration inflation. 
- Normal transitions unaffected.

## Recommended Next Phase
GAMEPLAY-STABILITY-1D — Ref Reset Synchronization Only (Option C from Phase 1B). Address reset triggers on `EXIT_TO_IDLE` and mutable refs cleanup before attempting timing kernel overhaul.
