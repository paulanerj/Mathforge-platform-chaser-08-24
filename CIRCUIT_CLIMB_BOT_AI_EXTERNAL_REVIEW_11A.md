# CIRCUIT CLIMB - BOT AI FINAL EXTERNAL ENGINEERING HANDOFF (TASK 11A)

**Target AI System:** Greenfield V2 Bot AI Engine  
**Project:** Circuit Climb  
**Status:** ARCHITECTURE STRICTLY FROZEN. NO FIXES OR BEHAVIORAL CHANGES APPLIED.  
**Purpose:** Self-contained external review package for third-party principal gameplay AI engineering review.

---

# SECTION 1: HIGH-LEVEL ARCHITECTURE

The Greenfield V2 Bot AI is structured into discrete single-responsibility modules operating within a frame-based simulation loop.

```
                    ┌───────────────────────────────────────┐
                    │    CircuitClimbSurface / Runtime      │
                    └──────────────────┬────────────────────┘
                                       │ Frame Loop (snapshot)
                                       ▼
                    ┌───────────────────────────────────────┐
                    │          BotControllerV2              │
                    └──────┬───────────┬───────────┬────────┘
                           │           │           │
          ┌────────────────┘           │           └────────────────┐
          ▼                            ▼                            ▼
┌───────────────────┐        ┌───────────────────┐        ┌───────────────────┐
│ BotSensingV2      │        │BotStateMachineV2  │        │BotGoalSelectorV2  │
│ (Radar & Sweep)   │        │(State & Sequence) │        │(Anchors & Rings)  │
└───────────────────┘        └─────────┬─────────┘        └───────────────────┘
                                       │
                      ┌────────────────┼────────────────┐
                      ▼                ▼                ▼
            ┌────────────────┐┌────────────────┐┌────────────────┐
            │  BotPlannerV2  ││ProgressMonitor ││ BotRecoveryV2  │
            │ (2-Stage A*)   ││  (Stall/Osc)   ││(Recovery Rungs)│
            └────────────────┘└────────────────┘└────────────────┘
```

## Module Map & File Responsibilities

| Module | Source File Path | Primary Responsibility |
| :--- | :--- | :--- |
| **Types & Contracts** | `/src/games/circuit-climb/bot-ai-v2/BotTypesV2.ts` | Data structures: `BotWorldSnapshotV2`, `BotStateContextV2`, `BotStateV2`, `AwarenessEpisodeV2`, `BotProgressV2`. |
| **Configuration** | `/src/games/circuit-climb/bot-ai-v2/BotConfigV2.ts` | Hardcoded tuning constants (grid size: 16px, row gap: 140px, speeds, timers, thresholds). |
| **Sensing & Radar** | `/src/games/circuit-climb/bot-ai-v2/BotSensingV2.ts` | Proximity detection sweep and expanding circular radar waves. |
| **Goal Selection** | `/src/games/circuit-climb/bot-ai-v2/BotGoalSelectorV2.ts` | Calculates below-player attack anchor (`+210px` Y offset) and generates ring candidates (`r=1..6`). |
| **Path Planner** | `/src/games/circuit-climb/bot-ai-v2/BotPlannerV2.ts` | 2-Stage A* search (Stage 1: 160px local bounding box; Stage 2: Expanded viewport fallback). |
| **State Machine** | `/src/games/circuit-climb/bot-ai-v2/BotStateMachineV2.ts` | High-level state transitions (`SEARCH`, `ALERT`, `CHASE`, `HOLD`, `RECOVER`, `CAPTURED`) and attack substates (`APPROACH`, `STAGE`, `STRIKE`). |
| **Progress Monitor** | `/src/games/circuit-climb/bot-ai-v2/BotProgressMonitorV2.ts` | Tracks displacement every 600ms (<15px = stall), waypoint advancement (<900ms), and 2-cell ping-pong oscillations. |
| **Recovery Engine** | `/src/games/circuit-climb/bot-ai-v2/BotRecoveryV2.ts` | Multi-rung recovery ladder (Rung 1: Replanning; Rung 2: Escape Cells; Rung 3: Backtracking; Rung 4: Reset to SEARCH). |
| **Flight Recorder** | `/src/games/circuit-climb/bot-ai-v2/BotFlightRecorderV2.ts` | In-memory circular event buffer with timestamped coordinate logging. |
| **Controller Hub** | `/src/games/circuit-climb/bot-ai-v2/BotControllerV2.ts` | Primary entry point (`updateBotV2`) driving state updates and outputting frame displacement (`intendedDisplacement`). |

## Subsystem Ownership Breakdown

- **Controller Ownership:** `BotControllerV2.ts` holds active ownership of frame orchestration, calling sensing, state machine, progress check, and movement calculation in sequence.
- **Planner Ownership:** `BotPlannerV2.ts` owns path generation. Called synchronously when `shouldReplan` passes or during recovery.
- **Recovery Ownership:** `BotRecoveryV2.ts` owns escape actions when `checkProgress` returns `false`.
- **Collision Ownership:** Managed at two levels: platform obstruction checks during path planning inside `BotGoalSelectorV2.ts` / `BotPlannerV2.ts`, and physical body overlap detection inside `BotStateMachineV2.ts`.
- **Movement Ownership:** `BotControllerV2.ts` computes the exact `dx, dy` displacement vector per frame based on active state and target waypoints.
- **Rendering Ownership:** `CircuitClimbSurface.tsx` renders the bot sprite, state label overhead, radar waves, and debug overlays.
- **Telemetry Ownership:** `BotFlightRecorderV2.ts` owns structured logging.

---

# SECTION 2: INTENDED BEHAVIOR SPECIFICATION

This section defines what the bot is **intended** to do by design.

| State / Phase | Intended Gameplay Behavior | Intended Speed & Movement | Intended Transition / Outcome |
| :--- | :--- | :--- | :--- |
| **SEARCH** | The bot patrols horizontally sweeping back and forth on its initial platform, firing periodic radar pulses looking for the player. | Lateral movement at `100 px/s`. | Transitions to `ALERT` upon direct proximity detection (<110px) or radar wave collision with player. |
| **ALERT** | Fires a visual excitement indicator and plays a 350ms audio cue. Remains stationary to telegraph detection to the player. | `0 px/s` (Stationary). | Transitions to `CHASE` after 350ms excitement timer expires. |
| **CHASE** | Actively pursues the player by planning A* paths towards an attack anchor **210px directly beneath** the player's platform. | Path-following at `140 px/s`. | Substate sequence: `APPROACH` $\rightarrow$ `STAGE` $\rightarrow$ `STRIKE`. |
| **APPROACH** | Default substate of `CHASE`. Bot follows waypoints to reach a position below the player. | Path-following at `140 px/s`. | Transitions to `STAGE` when distance to below-player anchor is $\le 24\text{px}$. |
| **STAGE** | The bot pauses for a **180ms stabilizing beat** directly underneath the player's platform to signal an impending vertical leap. | `0 px/s` (Stationary stabilization). | Transitions to `STRIKE` when 180ms timer expires. |
| **STRIKE** | The bot launches a rapid vertical upward thrust directly towards the player's platform level. | Upward thrust at `350 px/s`. | Completes when bot's Y $\le$ target Y, resetting substate to `APPROACH`. |
| **RECOVER** | Triggered when the bot is stuck or stalled. Tries escalating escape rungs to unblock movement. | Variable (0 to `140 px/s`). | Returns to `CHASE` upon finding a full path, or resets to `SEARCH` after 2500ms. |
| **CAPTURE** | Triggered when the bot's body overlaps the player's body radius (margin of 5px). Ends game round. | `0 px/s` (Game Over). | Terminal state until game reset. |

---

# SECTION 3: ACTUAL OBSERVED BEHAVIOR & PM FAILURES

Despite passing automated unit/integration tests, real browser testing and PM evaluation revealed severe gameplay defects:

1. **Bot Freezes Forever Below-Left of Player (`PATH_COMPLETE_WITHOUT_ATTACK_TRANSITION`):**
   - *Symptom:* The bot moves to a platform below-left of a stationary player, stops completely, displays state label `CHASE`, and remains indefinitely frozen without staging, striking, or moving.
2. **Repeated Recover / Replan Loop:**
   - *Symptom:* After stopping, the Progress Monitor flags a stall every 600ms, triggering `RECOVER`. Rung 1 replans a 1-node path to the bot's current location (`FULL` path), which instantly reverts state back to `CHASE` on the same frame, causing a silent infinite feedback loop with zero displacement.
3. **Bot Only Moves Sideways / Fails to Climb:**
   - *Symptom:* Under certain platform layouts, the bot oscillates back and forth horizontally on a lower platform, unable to find vertical climbing paths to higher rows.
4. **Bot Waits Beside Player / Fails to Strike:**
   - *Symptom:* When the bot arrives on the same horizontal row as the player, it stops adjacent to the player because the below-player anchor (`+210px` Y) requires being *below* the platform, which is geometrically unreachable from the same row.
5. **Bot Kills Only After Player Moves:**
   - *Symptom:* A stationary bot frozen in `CHASE` suddenly captures the player only when the player voluntarily jumps down into the bot's collision radius.
6. **Unfair Side / Transit Captures:**
   - *Symptom:* Bot intercepts players during automatic jump transit across protected corridors due to stale route protection boundaries or overly wide collision margins.
7. **Planner Deadlocks:**
   - *Symptom:* A* goal candidate generator fails to return any unblocked cells when platforms are densely spaced, locking the planner into returning empty paths.

---

# SECTION 4: KNOWN HYPOTHESES

### PROVEN (Verified by Code Inspection & Flight-Recorder Trace)
- **Goal Candidate Offset Mismatch:** `getGoalCandidates` generates cells in rings `r=1..6` (16px to 96px away from target anchor). The goal cell selected by A* is often 32px–48px away from the ideal anchor.
- **Dead Zone between Path Arrival & Stage Guard:** Path follower considers a path "complete" when the final waypoint is reached ($w_{\text{dist}} \le 20\text{px}$), setting velocity to 0. However, the guard to enter `STAGE` requires distance to anchor $\le 24\text{px}$. If the selected goal cell is 32px away, path completes, bot stops, but `STAGE` never triggers.
- **Immediate Recovery Reversion Feedback Loop:** Progress Monitor triggers `RECOVER` after 600ms of zero movement. Rung 1 replans an expanded path. Because the bot is sitting on its target cell, A* returns a length-1 path of type `FULL`. `BotStateMachineV2` immediately converts state back to `CHASE` on the exact same frame, resetting the stall timer and looping infinitely.

### LIKELY (Supported by System Architecture Analysis)
- **Transit Corridor Over-Protection:** Player transit corridor protection masks out large rectangular blocks around platforms (`±12px` X, `±60px` Y), removing all valid below-player goal candidates when platforms are stacked vertically.
- **Rigid Below-Player Offset:** Hardcoding the attack anchor to exactly 1.5 row gaps (`+210px`) fails on non-standard platform spacings or bottom-row platforms where no lower platform exists.

### POSSIBLE
- **Floating-Point Precision Arrival Skew:** Sub-pixel delta rounding in `intendedDisplacement` causing the bot to stop a fraction of a pixel outside `waypointArrivalPx` tolerance.

### UNKNOWN
- **Browser-Specific Frame Rate Jitter:** Whether variable display refresh rates (e.g. 120Hz vs 60Hz) affect `deltaMs` accumulation in the Progress Monitor differently than simulated headless tests.

---

# SECTION 5: STATE TRANSITION TABLE

| Source State | Target State | Trigger / Guard Condition | Timers / Limits | Planner / Recovery Call |
| :--- | :--- | :--- | :--- | :--- |
| `SEARCH` | `ALERT` | Player detected via proximity (<110px) OR radar wave intersection. | `radarTimerMs` ticks down every 1200ms. | Clears existing paths; opens `awareness`. |
| `ALERT` | `CHASE` | `timeInAlert > 350ms` (excitement cue complete). | 350ms excitement timer. | Calls `requestReplan(..., 'EXPANDED')`. |
| `CHASE` | `HOLD` | A* path planner returns a path of type `'PARTIAL'`. | None. | Follows partial path as far as possible. |
| `HOLD` | `CHASE` | A* path planner returns a path of type `'FULL'`. | None. | Resumes full path following. |
| `CHASE` | `RECOVER` | `checkProgress` returns `false` (Stall > 600ms or Waypoint Stall > 900ms). | 600ms stall window. | Sets `recoveryRung = 1`; calls `requestReplan(..., 'EXPANDED')`. |
| `RECOVER` | `CHASE` | Replan in Rung 1 returns path of type `'FULL'`. | Executed in same frame. | Adopts new path; sets state to `CHASE`. |
| `RECOVER` | `SEARCH` | `recoveryTime > 2500ms` without finding full path. | 2500ms max recovery duration. | Resets state to `SEARCH`; clears awareness; sets 1200ms cooldown. |
| `APPROACH` | `STAGE` | `distToBelowAnchor <= 24px` during `CHASE` state. | Sets `stageTimerMs = 180ms`. | Clears path (`currentPath = null`). |
| `STAGE` | `STRIKE` | `stageTimerMs <= 0` (180ms stabilizing beat finished). | 180ms stabilization timer. | Sets `strikeTarget` to current player (X,Y). |
| `STRIKE` | `APPROACH` | `botPosition.y <= strikeTarget.y` (vertical thrust complete). | Upward speed 350 px/s. | Calls `requestReplan(..., 'EXPANDED')`. |
| `STAGE/STRIKE`| `APPROACH` | `playerMovementState === 'MOVE_STARTED'` (player moved). | Instant trigger. | Aborts strike/stage; resets to `APPROACH`. |
| Any State | `CAPTURED` | `distToPlayer <= botRadius + playerRadius - 5px`. | Overlap check per frame. | Triggers game over sequence. |

---

# SECTION 6: PLANNING PIPELINE

```
[Player Position] ──► [Calculate Below-Player Anchor (+210px Y)]
                              │
                              ▼
                [Generate Ring Candidates (r=1..6)]
                              │
                              ▼
         [Filter: Platform Obstacles & Transit Protection]
                              │
                              ▼
                    [Rank Candidates by Cost]
                              │
                              ▼
            [Run A* Search (Stage 1 Local -> Stage 2 Fallback)]
                              │
                              ▼
              [Path Follower: Waypoint Arrival <= 20px]
                              │
                              ▼
             [Attack Guard: Distance to Anchor <= 24px]
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
         (Pass: STAGE)                (Fail: STALL > 600ms)
                                             │
                                             ▼
                                   (RECOVER -> Loop)
```

1. **Anchor Calculation:** Computes ideal position `(target.x, target.y + 210)`.
2. **Ring Candidate Generation:** Generates grid cells in concentric rings `r=1..6` around the anchor.
3. **Candidate Filtering:** Rejects cells blocked by inflated platform bounding boxes, cells inside active player transit corridors (`±12px` X, `±60px` Y), and lateral camping cells ($|y_{\text{cell}} - y_{\text{player}}| < 0.85 \times \text{rowGap}$).
4. **Candidate Ranking:** Sorts remaining candidates by Manhattan distance to the anchor.
5. **A* Search:** Runs A* search trying Stage 1 (160px local bounds) first. If failed, runs Stage 2 (full viewport bounds).
6. **Path Follower & Arrival:** Advances `pathIndex` when distance to current waypoint $\le 20\text{px}$. Sets velocity to 0 when last waypoint is reached.

---

# SECTION 7: RECOVERY PIPELINE

The recovery engine (`BotRecoveryV2.ts`) is designed as an escalating 4-rung ladder:

- **Rung 1 (Expanded Replan):** Discards current path, clears path index, and requests an expanded Stage 2 A* replan. If a `'FULL'` path is found, state immediately reverts to `CHASE`.
- **Rung 2 (Escape Neighbor):** If Rung 1 fails or remains stalled, evaluates adjacent grid cells (North, South, East, West) and paths to the nearest unblocked cell not in `recentCells`.
- **Rung 3 (Backtracking):** If adjacent cells are blocked, reverses along the historical cell path stored in `recentCells`.
- **Rung 4 (Abandon & Reset):** If recovery elapsed time exceeds `2500ms`, clears awareness, resets state to `SEARCH`, and enters a 1200ms detection cooldown.

### Why Recovery Fails in Live Failure:
Because Rung 1 succeeds in finding a `'FULL'` path of length 1 (since the bot is already standing on the destination cell), Rung 1 **immediately** transitions the state back to `CHASE` within the same frame. Rungs 2, 3, and 4 are never reached, trapping the bot in a Rung 1 replan loop.

---

# SECTION 8: FLIGHT RECORDER EVENT TRACE SUMMARY

Below is an abbreviated excerpt from `/CIRCUIT_CLIMB_BOT_AI_EVENT_TRACE_10A.txt` illustrating the exact event sequence during the live deadlock:

```text
[0000ms] EVENT: CHASE_ENTERED | State: CHASE:APPROACH | Pos: (200.0, 201.4) | Path: [(200, 201.4)]
[0016ms] EVENT: ZERO_MOVEMENT_INTENT | Path Index: 0/1 | DistToAnchor: 298.6px (>24px)
[0608ms] EVENT: NO_PROGRESS_DETECTED | Moved: 0.0px in 608ms | Action: Transition to RECOVER
[0608ms] EVENT: RECOVER_ENTERED | Rung: 1 | Replan Triggered: EXPANDED
[0608ms] EVENT: PATH_ADOPTED | PathType: FULL | PathLength: 1 | Target: (200, 201.4)
[0608ms] EVENT: RECOVER_TO_CHASE | Reason: Full path found in Rung 1 | New State: CHASE
[1216ms] EVENT: NO_PROGRESS_DETECTED | Moved: 0.0px in 608ms | Action: Transition to RECOVER
[1216ms] EVENT: PATH_ADOPTED | PathType: FULL | PathLength: 1 | Target: (200, 201.4)
[1216ms] EVENT: RECOVER_TO_CHASE | Reason: Full path found in Rung 1 | New State: CHASE
... (Sequence repeats 41 times across 25.0 seconds of simulation time) ...
```

---

# SECTION 9: GAMEPLAY CONSTRAINTS & DESIGN RULES

1. **Attack From Below:** By core game design, the red bot must climb from beneath the player and attack vertically upwards. Horizontal or top-down pursuit is restricted to prevent unfair gameplay.
2. **Fairness & Readability:** The player must never feel cheated. Every attack must have a readable telegraph (`ALERT` excitement, `STAGE` 180ms pause).
3. **No Camping:** The bot must not camp directly beneath landing pads or block automatic jump routes.
4. **Transit Corridor Protection:** When the player is in jump transit between platforms, the corridor between source and destination platforms is protected.
5. **Vertical Dominance:** Lateral movement must be treated as a secondary alignment phase; vertical climbing is the primary progression vector.
6. **Intentional Capture:** Captures must result from active strikes or direct body contact, not accidental collision box overlaps during pathing.

---

# SECTION 10: ENGINEERING QUESTIONS FOR EXTERNAL REVIEWER

*Do not answer these questions. They are provided for the external reviewer to guide architectural evaluation.*

1. Is the current 6-state machine (`SEARCH`, `ALERT`, `CHASE`, `HOLD`, `RECOVER`, `CAPTURED`) with embedded `attackSubState` enum overcomplicated for a 2D platformer enemy?
2. Should path completion and arrival logic be owned entirely by the movement controller or by the state machine?
3. Is hardcoding an attack anchor at exactly `+210px` Y below the player fundamentally incompatible with variable platform layouts?
4. Should goal candidate generation (`getGoalCandidates`) include `r=0` (the exact target coordinate) in its candidate array?
5. Why does Rung 1 of `RECOVER` allow an immediate same-frame transition back to `CHASE` if the returned path length is 1?
6. Should `RECOVER` enforce a minimum duration (e.g. 10–20 frames) or force a physical escape displacement step before allowing a return to `CHASE`?
7. Is a grid-based A* planner appropriate for this gameplay loop, or would direct steering behaviors (e.g., arrival/seek behaviors with raycast probes) be cleaner?
8. Should the proximity threshold for entering `STAGE` (`distToAnchor <= 24px`) be dynamically scaled based on the actual distance of the selected A* goal cell?
9. Is the Progress Monitor window (600ms) too aggressive, or is its reset logic faulty when a path completes?
10. Should player transit protection use hard bounding boxes, or dynamic cost penalties in the A* heuristic?
11. Should `STAGE` and `STRIKE` be top-level state machine states rather than sub-states inside `CHASE`?
12. Does the separation between `BotControllerV2` and `BotStateMachineV2` create state desynchronization during frame updates?
13. Is the 2-stage A* planner (160px bounds $\rightarrow$ full bounds) introducing unnecessary pathing failures when platforms span across the boundary?
14. Should the bot maintain a continuous velocity vector towards the player rather than coming to a complete stop when a path completes?
15. Is using discrete 16px grid snapping introducing rounding errors against continuous physics coordinates?
16. Would a Behavior Tree (BT) architecture simplify recovery and state transitions compared to the current imperative state machine?
17. Should attack anchors be dynamically generated from platform edge geometry rather than relative player offsets?
18. Is `checkProgress` correctly accounting for frames where `intendedDisplacement` is intentionally zero?
19. Would restoring an earlier, simpler functional prototype AI baseline and iteratively adding features be lower risk than refactoring Greenfield V2?
20. What is the minimal, robust architectural change required to eliminate the `PATH_COMPLETE_WITHOUT_ATTACK_TRANSITION` deadlock?

---
*End of External Review Package (`/CIRCUIT_CLIMB_BOT_AI_EXTERNAL_REVIEW_11A.md`)*
