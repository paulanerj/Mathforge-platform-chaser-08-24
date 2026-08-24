# Circuit Climb Bot AI External Audit Report (Task 10A)

**Target AI Engine:** Greenfield V2  
**Audit Executed By:** Principal AI Coding Agent  
**Status:** COMPLETE (Architecture Frozen, Deadlock Reproduced & Isolated)  
**Security/Review Classification:** Confidential External Review Handoff Package  

---

## Executive Summary

An in-depth logical, geometric, and state-machine audit of the Greenfield V2 Bot AI has successfully reproduced and isolated the live failure reported in Task 10A (where the red bot becomes permanently frozen below-left of a stationary player, labeled in `CHASE` state). 

The root cause is a **State Machine Deadlock** caused by a geometric mismatch between the **A* Goal Candidate Generator** and the **Attack-Sequence Transition Guard**. Under specific geometries, the bot reaches its planned path's end but cannot meet the proximity threshold to transition to the `STAGE` substate. This triggers a 600ms progress-stall timeout, which transitions to `RECOVER`, immediately replans a "FULL" path (of length 1) to its current position, and transitions right back to `CHASE` in the same frame. This cycle repeats infinitely with zero net displacement.

Pursuant to direct project orders, **no code changes or logical "fixes" have been made to the AI engine**. The Greenfield V2 architecture remains frozen. Instead, a comprehensive diagnostic suite has been built, and a deterministic failure reproduction test has been implemented and compiled to provide the external reviewer with a reproducible, clean baseline.

---

## 1. V2 Architecture Mapping

The Greenfield V2 Bot AI is highly modularized, separating sensing, goal-selection, pathfinding, movement control, progress monitoring, and recovery into distinct modules:

| Module / Component | Source File Path | Architectural Responsibility |
| :--- | :--- | :--- |
| **Bot Types** | `/src/games/circuit-climb/bot-ai-v2/BotTypesV2.ts` | Defines the fundamental structural contracts (`BotWorldSnapshotV2`, `BotStateContextV2`, `BotStateV2`, `AwarenessEpisodeV2`, and `BotProgressV2`). |
| **Bot Configuration** | `/src/games/circuit-climb/bot-ai-v2/BotConfigV2.ts` | Houses all hardcoded tuning constants (grid size, patrol speeds, chase speeds, progress windows, and planning limits). |
| **Sensing & Radar** | `/src/games/circuit-climb/bot-ai-v2/BotSensingV2.ts` | Translates the raw world state into the bot's sensory inputs (near-detection sweep, radar waves, and edge-gap calculations). |
| **Goal Selection** | `/src/games/circuit-climb/bot-ai-v2/BotGoalSelectorV2.ts` | Calculates the ideal below-player anchor and filters valid, unblocked goal candidate cells in snap-to-grid concentric rings. |
| **A* Path Planner** | `/src/games/circuit-climb/bot-ai-v2/BotPlannerV2.ts` | Core A* search algorithm featuring a 2-stage (Local 160px bounds -> Expanded fallback) path planning system. |
| **State Machine Hub** | `/src/games/circuit-climb/bot-ai-v2/BotStateMachineV2.ts` | Manages high-level transitions between `SEARCH`, `ALERT`, `CHASE`, `HOLD`, `RECOVER`, and `CAPTURED`, and handles the internal attack substates. |
| **Progress Monitor** | `/src/games/circuit-climb/bot-ai-v2/BotProgressMonitorV2.ts` | Monitors bot velocity and waypoints to detect stalls, zero-progress intervals, or two-cell spatial oscillations. |
| **Recovery Engine** | `/src/games/circuit-climb/bot-ai-v2/BotRecoveryV2.ts` | Implements a recovery ladder (Rung 1: Replanning -> Rung 2: Escape Cells -> Rung 3: Backtracking -> Rung 4: Cooldown and Search). |
| **Flight Recorder** | `/src/games/circuit-climb/bot-ai-v2/BotFlightRecorderV2.ts` | A deterministic in-memory diagnostic logger capturing all events with high-resolution timestamps and coordinates. |
| **Movement Controller** | `/src/games/circuit-climb/bot-ai-v2/BotControllerV2.ts` | Integrates the state machine and translates active states/paths into real-time coordinate displacement vectors. |

---

## 2. High-Level State Machine & Transitions

The bot's high-level state flow is governed by `updateStateMachine` in `BotStateMachineV2.ts`:

1. **`SEARCH`**: The bot patrols back and forth horizontally at `patrolSpeed` (100 px/s) sweeping the area. It uses proximity or radar wave collisions to trigger detection.
2. **`ALERT`**: Transitioned from `SEARCH` upon first detecting the player. The bot plays a visual reaction and a 350ms excitement sound while remaining stationary.
3. **`CHASE`**: After `ALERT` timer expires, the bot pursues the player. It attempts to plan paths to the calculated **Below-Player Anchor**.
4. **`HOLD`**: Active if the planner can only find a "PARTIAL" path (meaning the target is blocked by platforms or a player transit corridor). The bot follows the partial path to get as close as possible.
5. **`RECOVER`**: Triggered when the Progress Monitor detects a stall, waypoint block, or grid cell oscillation.
6. **`CAPTURED`**: Terminal state when the bot's body overlaps the player's collision circle (incorporating a 5px safety margin).

### Attack Sequence Substates (Active during `CHASE` and `HOLD`)
The bot's offensive logic is controlled by `context.attackSubState`:
- **`APPROACH`**: The default substate. The bot paths towards the calculated below-player anchor.
- **`STAGE`**: Triggered when the bot's distance to the below-player anchor is `≤ 24px`. The bot stops completely (`dx = 0; dy = 0`) for a **180ms stabilizing beat** to prepare its trajectory.
- **`STRIKE`**: Triggered when the 180ms staging timer expires. The bot commits to the player's last-known position and launches a high-speed vertical strike upward at `350 px/s`. It completes when the bot's Y coordinate is equal to or less than (above) the committed target's Y coordinate, returning it to `APPROACH`.

---

## 3. Detailed Logic Audits (15-Point Breakdown)

### 1. CHASE Semantics (Path Completion)
*   **Code Reference:** `BotControllerV2.ts` lines 138-184.
*   **Behavior:** When the bot follows a planned path, it checks if its distance to the current waypoint is `≤ waypointArrivalPx` (20px). If so, it increments `pathIndex`.
*   **Issue:** When `pathIndex` reaches `currentPath.length`, the path is completed. The controller calculates `dx = 0; dy = 0`, bringing the bot to a full stop. It remains in `CHASE` state because no high-level state transition is fired.

### 2. Attack-Anchor Semantics
*   **Code Reference:** `BotGoalSelectorV2.ts` lines 48-82 (`getBelowPlayerAnchor`).
*   **Formula:** `anchorX = target.x; anchorY = target.y + (snapshot.botBaseOffsetRows * snapshot.rowGap)`. With `botBaseOffsetRows = 1.5` and `rowGap = 140`, this is exactly **210px** directly beneath the player's center.
*   **Fallback Search:** If this coordinates cell is blocked by an obstacle, `getBelowPlayerAnchor` conducts a ring-by-ring concentric search up to 10 rings out (`Ring 1` to `Ring 10` using `gridSize` steps of 16px) until an unblocked cell is located.

### 3. Arrival-Condition
*   **Code Reference:** `BotStateMachineV2.ts` lines 303-332.
*   **Guard:** `distToAnchor <= 24` is required to transition from `APPROACH` to `STAGE`.
*   **Action:** Triggers `context.attackSubState = 'STAGE'`, clears any existing path (`currentPath = null`), and sets `stageTimerMs = 180`.

### 4. Transit protection (No-Camp Zone)
*   **Code Reference:** `BotGoalSelectorV2.ts` lines 9-24 (`isPointInPlayerTransitCorridor`).
*   **Corridor Bounds:** When the player is in transit, a rectangular corridor is built spanning from the start platform to the destination platform. Width is padded by `±12px` horizontally and `±60px` vertically.
*   **Filter:** A* goal candidates inside this rectangle are completely rejected (`isCellBlocked` returns `true`), preventing the bot from camping the player's landing pad.

### 5. Retarget Zone Guard
*   **Code Reference:** `BotStateMachineV2.ts` lines 271-295.
*   **Detection:** Checks if `snapshot.playerMovementState === 'MOVE_STARTED'`.
*   **Reset:** If the player starts moving, any active `STAGE` or `STRIKE` sequence is instantly aborted and reset back to `APPROACH`, forcing the bot to re-orient to the player's new platform anchor.

### 6. Search-to-Alert Transition
*   **Code Reference:** `BotStateMachineV2.ts` lines 105-151 (`updateStateMachine`).
*   **Logic:** Proximity-based detection triggers if distance to player is `≤ nearDetectionGapPx` (110px under Normal difficulty). If the player is outside this, the bot ticks down its `radarTimerMs` and issues a circular radar wave expanding to 280px. If the wave intersects the player, awareness is opened and the state changes to `ALERT`.

### 7. Alert-to-Chase Transition
*   **Code Reference:** `BotStateMachineV2.ts` lines 158-226.
*   **Timer Guard:** `timeInAlert > excitemenDurationMs` (350ms).
*   **Action:** Transition state to `CHASE`, trigger `requestReplan` with force-stage `'EXPANDED'` to construct the initial approach path.

### 8. Chase-to-Hold Transition
*   **Code Reference:** `BotStateMachineV2.ts` lines 476-499.
*   **Guard:** If a path replan is executed and A* returns a path of type `'PARTIAL'`, the state transitions from `CHASE` to `HOLD`.
*   **HOLD Behavior:** The bot continues following this partial path as far as possible. If it later plans a `'FULL'` path, it transitions back to `CHASE`.

### 9. Chase-to-Recover Transition
*   **Code Reference:** `BotStateMachineV2.ts` lines 384-470.
*   **Guard:** `!checkProgress(snapshot, context)`.
*   **Transition:** State becomes `RECOVER`, `recoveryStartTimeMs` is logged, and an expanded Stage 2 replan is executed immediately as Rung 1.

### 10. Recover-to-Chase Transition
*   **Code Reference:** `BotStateMachineV2.ts` lines 447-468.
*   **Trigger:** If the initial Rung 1 expanded replan successfully generates a `'FULL'` path, the state is immediately set back to `CHASE` on the same frame.

### 11. Progress-Monitor (PM) Semantics
*   **Code Reference:** `BotProgressMonitorV2.ts` (`checkProgress`).
*   **Window and Threshold:** Every **600ms** (`monitorNoProgressWindowMs`), the bot compares its current position to `lastPos`. If the linear distance moved is `< 15px` (`monitorNoProgressDistPx`), a progress stall is flagged.
*   **Waypoint Stall:** If `context.pathIndex` does not change for **900ms** (`monitorWaypointStallMs`), a waypoint stall is flagged.
*   **Oscillation Detection:** Tracks the last 5 grid cells. If the sequence is `A -> B -> A -> B` (representing a 2-cell ping-pong loop), it flags an oscillation stall.
*   **Return Value:** Returns `false` on any stall, which triggers the transition to `RECOVER`.

### 12. Recovery Ladder (Rungs 2–4)
*   **Code Reference:** `BotRecoveryV2.ts` (`executeRecovery`).
*   **Execution:** Only runs if the state remains `RECOVER` after the frame update.
*   **Rung 2 (Escape Neighbor):** Searches adjacent cells (`North, South, East, West`) for any unblocked cell that is NOT in `recentCells`. Paths there.
*   **Rung 3 (Backtracking):** Initiated if adjacent cells are blocked. Force paths backwards along historical cells.
*   **Rung 4 (Abandon):** If `recoveryStartTimeMs` exceeds `2500ms` (`recoveryMaxDurationMs`), it forces state to `SEARCH`, clears awareness, and triggers a 1200ms `alertCooldownMs`.

### 13. Speed Personalities
*   **Code Reference:** `BotControllerV2.ts` lines 103-140 & `BotConfigV2.ts` lines 46-47.
*   **Normal Patrol Speed:** `100 px/s` (during `SEARCH`).
*   **Chase / Hold / Recover Speed:** `140 px/s`.
*   **Strike Speed:** `350 px/s` (fast vertical upward thrust during `STRIKE`).
*   **Stage Speed:** `0 px/s` (stationary stabilization during `STAGE`).

### 14. Capture Condition
*   **Code Reference:** `BotStateMachineV2.ts` lines 122-137.
*   **Mathematical Guard:** Proximity check between bot and player: `dist <= botRadius + playerRadius - 5` (5px overlap allowance).
*   **State Override:** If this passes, the state is immediately set to `CAPTURED`, overriding all other behaviors, and the `CAPTURE` event is published.

### 15. Flight Recorder Events
*   **Code Reference:** `BotFlightRecorderV2.ts`.
*   **Events Logged:** High-fidelity event log records: `V2_CONTEXT_CREATED`, `ALERT_EXCITEMENT_FIRED`, `CHASE_ENTERED`, `ATTACK_SEQUENCE_STAGE_ENTERED`, `ATTACK_SEQUENCE_STRIKE_ENTERED`, `ATTACK_SEQUENCE_STRIKE_COMPLETED`, `ATTACK_SEQUENCE_RESET`, `PLAN_REQUESTED`, `PATH_ADOPTED`, `NO_PROGRESS_DETECTED`, `WAYPOINT_REACHED`, `ZERO_MOVEMENT_INTENT`, and more.

---

## 4. Root Cause of Greenfield V2 Deadlock

The core live failure reported in Task 10A occurs under specific geometries (such as the player settling at `x = 350, y = 250` and the bot approaching from below-left at `x = 200, y = 201.4`):

1.  **Geometric Mismatch in Goal Candidates:**
    *   The preferred **Below-Player Anchor** is calculated. For the player's position, this anchor falls on a specific grid cell.
    *   However, if that exact anchor cell is blocked, or if A* is building candidate goals, `getGoalCandidates` generates target options.
    *   Crucially, `getGoalCandidates` builds cells in concentric rings starting at **Ring 1** (`r = 1` up to `r = 6`).
    *   It **never** includes `r = 0` (the actual anchor point itself) in its candidate array.
    *   Because `r = 1` cells are offset by `1 * gridSize` (16px) or more, the closest selectable goal cell is at least **16px** (and often **32px** or **48px** if diagonal or if Ring 1 is blocked) away from the target below-player anchor.
2.  **Path Completion is Reached:**
    *   The A* planner successfully finds a path to the best available unblocked candidate cell (e.g., a cell located `32px` away from the below-player anchor).
    *   The bot travels along this path. When it arrives at the final waypoint, the path is completed.
    *   The bot comes to a complete stop (`dx = 0, dy = 0`).
3.  **Proximity Guard Blocks Attack Transition:**
    *   The bot is in `CHASE` state with `attackSubState = 'APPROACH'`.
    *   The transition guard to progress to `STAGE` is: `distToAnchor <= 24`.
    *   But because the selected goal cell is `32px` away, `distToAnchor` is **32px**.
    *   Because `32px > 24px`, the proximity guard fails. The bot remains stuck in the `APPROACH` substate!
4.  **Progress Monitor (PM) Stall & Rapid Replan Loop:**
    *   Since the path is complete and the bot has stopped moving, its speed is `0 px/s`.
    *   After **600ms** (`monitorNoProgressWindowMs`), the Progress Monitor detects that the bot has moved `0px` (which is `< 15px`).
    *   The Progress Monitor reports a stall, returning `false`, causing `updateStateMachine` to change the state to `RECOVER` and immediately call `requestReplan(..., 'EXPANDED')`.
    *   Because the bot is sitting exactly on its target goal cell, the A* planner trivially finds a `'FULL'` path of length 1 (the current position).
    *   Because the path returned is `'FULL'`, the state machine transition logic immediately (on the **same frame**) overrides `RECOVER` and sets the state back to `CHASE`!
    *   On the next frame, the path of length 1 is already complete. The bot remains stationary.
    *   This starts the 600ms stall timer again, leading to an infinite loop of:
        `CHASE:APPROACH` (Path Complete, Stationary) $\rightarrow$ 600ms $\rightarrow$ `RECOVER` $\rightarrow$ Replan Full Path $\rightarrow$ `CHASE:APPROACH` (Same frame, Path Complete, Stationary).
5.  **User Experience:**
    *   To the player, the red bot appears completely frozen below-left of them, labeled `CHASE`, refusing to stage, strike, or pursue, despite the player being fully stationary and accessible.

---

## 5. Diagnostic Test Logs

The diagnostic test `34. should reproduce the PM live failure where bot is stuck in CHASE indefinitely with zero movement` simulates this exact sequence step-by-step for **25 seconds** (1562 frames) of game time.

### Test Execution Trace
- **Frame 0 (simTimeMs = 1000):** Bot starts at `x = 200, y = 201.4` (stationary stopping location). State is `CHASE:APPROACH`.
- **Frame 1-37 (simTimeMs = 1016 to 1592):** Bot is stationary. `intendedDisplacement = { x: 0, y: 0 }`. State is `CHASE:APPROACH`.
- **Frame 38 (simTimeMs = 1608):** `608ms` has elapsed since start. Progress Monitor detects progress `< 15px` (`0.0px` moved). Triggers stall!
- **Frame 38 (Transition):** State transitions `CHASE` $\rightarrow$ `RECOVER`. Immediate Stage 1 expanded replan is executed. Since the bot is already at the goal cell, a `'FULL'` path is found. State immediately transitions back `RECOVER` $\rightarrow$ `CHASE`.
- **Frame 39-75 (simTimeMs = 1624 to 2200):** Bot remains stationary. `intendedDisplacement = { x: 0, y: 0 }`. State is `CHASE:APPROACH`.
- **Frame 76 (simTimeMs = 2216):** `608ms` has elapsed since the last stall. Progress Monitor triggers stall again. Transitions to `RECOVER`, replans `'FULL'`, transitions back to `CHASE` in the same frame.
- **Frame 77-1562 (simTimeMs = 2232 to 26000):** This loop repeats **41 times** over the course of the 25-second simulation.
- **Final Result:** The bot has executed exactly **0.0px** of net movement over 25 seconds. It never entered `STAGE`, never entered `STRIKE`, and never progressed. It remained stuck in `CHASE:APPROACH` at the final frame. The deadlock is cleanly and deterministically reproduced.

---

## 6. Guidance for the External Reviewer / AI Engineer

To resolve this deadlock *after* the architecture freeze is lifted, the external reviewer should consider the following options:

1.  **Dynamic Transition Threshold:**
    *   Instead of checking `distToAnchor <= 24` against a hardcoded value, check if the distance is `≤ (selectedGoalToAnchorDistance + 8)`. This ensures that if A* was forced to select a goal cell further away, the bot will transition to `STAGE` as soon as it reaches that goal cell.
2.  **Include r=0 in Goal Candidates:**
    *   Modify `getGoalCandidates` to include `r = 0` (the actual target anchor cell) in the list of candidates. If the anchor itself is unblocked, the bot will plan a path directly to it, making its arrival distance `0px` (which is `≤ 24px`), successfully triggering `STAGE`.
3.  **Halt Recovery Replan Feedback Loops:**
    *   Do not allow `RECOVER` to immediately transition back to `CHASE` on the same frame if the planned path has a length of 1 or has its destination at the bot's current coordinate. Force the bot to spend at least 5-10 frames in `RECOVER` executing an escape neighbor step or back-track step to break the zero-movement deadlock.
