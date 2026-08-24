# CIRCUIT CLIMB BOT AI V2 — FORENSIC AUDIT REPORT (TASK 11B)
**PM FORENSIC INVESTIGATION: THE IMPOSSIBLE ONE-NODE FULL PATH DEADLOCK**

---

## SECTION 1: Forensic Summary

### 1.1 Executive Audit Findings
A comprehensive, source-grounded forensic investigation was conducted on the Greenfield V2 Bot AI engine to isolate the mechanism producing the live deadlock where the bot freezes at `(200, 201.4)` while attempting to attack an idle player at `(350, 250)`.

The investigation conclusively identified the exact mathematical and state-machine mechanism that generates a `FULL` path containing exactly one node equal to the bot's current grid cell `[(200, 208)]` when the bot is `299.12 px` away from its intended attack anchor `(350, 460)`.

### 1.2 Identified Failure Cascade
1. **Goal Candidate Collision / Start Cell Inclusion**: `getGoalCandidates` generates target coordinates relative to the below-player anchor `(352, 464)`. When candidates contain or match the bot's current snapped starting cell `(200, 208)` (or when start node matches goal), the candidate set passed to `planPathV2` includes the start node coordinate `(200, 208)`.
2. **A* Instant Goal Match**: In `planPathV2` (`BotPlannerV2.ts`), the A* search loop checks `goals.find(g => g.x === current.x && g.y === current.y)` on the very first iteration when `current = startNode`. Because `(200, 208)` is present in `goals`, the condition evaluates to `true` on node expansion 1 without expanding any neighbor nodes.
3. **Classification as `FULL` Path**: `planPathV2` constructs a path from `startNode` (`path = [{x: 200, y: 208}]`), labels the path type as `'FULL'`, and sets `nodesExpanded = 1`.
4. **Simplification Pass-Through**: `simplifyPath` receives `[{x: 200, y: 208}]`. Because array `length <= 2`, it returns the single-node path unmodified.
5. **Arrival Tolerance Auto-Completion**: In `BotControllerV2.ts`, the bot is at `(200, 201.4)`. The waypoint distance to `(200, 208)` is `6.60 px`. Because `6.60 px <= 12.00 px` (`waypointArrivalPx`), the controller considers Waypoint 0 reached immediately. `pathIndex` increments to `1`, exceeding the path length (`1`). The controller calculates zero movement intent (`dx = 0, dy = 0`).
6. **Inability to Reach STAGE Threshold**: To transition from `CHASE:APPROACH` to `CHASE:STAGE`, the bot must be within `24 px` of the attack anchor `(350, 460)`. At `299.12 px`, the bot cannot transition to `STAGE`, nor can it execute an upward `STRIKE`.
7. **Progress Monitor Trigger & Infinite Recovery Loop**: After `500 ms` of zero movement, `checkProgress` in `BotProgressMonitorV2.ts` reports `NO_PROGRESS_DETECTED`. The state machine transitions `CHASE` -> `RECOVER`.
8. **Rung 1 Escape Fallback**: In `RECOVER`, Rung 1 calls `requestReplan(snapshot, context, inflatedObstacles, 'EXPANDED')`. The expanded A* replan evaluates the same candidates, again finds `(200, 208)` at `startNode`, and returns `type: 'FULL'`.
9. **Immediate State Reversion**: `BotStateMachineV2.ts` (line 447) checks `if (context.currentPathType === 'FULL') { context.currentState = 'CHASE'; }`. The state machine immediately reverts to `CHASE` in the same tick. This resets the stall timer, preventing higher recovery rungs (Rung 2 escape cell, Rung 3 backtrack, Rung 4 search reset) from ever executing. The cycle repeats every `500 ms` indefinitely.

---

## SECTION 2: The Impossible Trace Breakdown

### 2.1 Live Trace Snapshot Context
* **Bot Position (World)**: `(200, 201.4)`
* **Bot Grid Cell (Snapped)**: `(200, 208)` [via `snapToGrid(201.4) = Math.round(201.4 / 16) * 16 = 208`]
* **Player Position (World)**: `(350, 250)`
* **Below-Player Anchor**: `(350, 460)` [Target Y = `250 + (1.5 * 140) = 460`]
* **Anchor Grid Cell (Snapped)**: `(352, 464)`
* **Bot-to-Anchor Distance**: `Math.sqrt((200-350)^2 + (201.4-460)^2) = 299.12 px`

### 2.2 Mathematical Step Breakdown

| Step | Component | Operation / Code Line | Input / Variables | Result |
|---|---|---|---|---|
| **1** | Goal Selection | `getBelowPlayerAnchor()` (`BotGoalSelectorV2.ts:48`) | Player `(350, 250)`, `botBaseOffsetRows = 1.5`, `rowGap = 140` | Anchor = `(350, 460)`, Snapped = `(352, 464)` |
| **2** | Goal Ring Gen | `getGoalCandidates()` (`BotGoalSelectorV2.ts:84`) | Target `(352, 464)`, `MAX_RINGS = 6`, `gridSize = 16` | Candidates generated in rings 1..6 around `(352, 464)` |
| **3** | Planner Start | `planPathV2()` (`BotPlannerV2.ts:36`) | `start = {x: 200, y: 201.4}` | `startX = 200`, `startY = 208` |
| **4** | A* Start Node | `planPathV2()` (`BotPlannerV2.ts:49`) | `startNode = {x: 200, y: 208, g: 0, h: ..., parent: null}` | `openList = [startNode]` |
| **5** | Goal Match | `planPathV2()` (`BotPlannerV2.ts:79`) | `goals.find(g => g.x === 200 && g.y === 208)` | Match found at `current = startNode`! |
| **6** | Path Construct | `planPathV2()` (`BotPlannerV2.ts:81`) | `path = [startNode]`, `reverse()` | `path = [{x: 200, y: 208}]`, `type = 'FULL'`, `nodesExpanded = 1` |
| **7** | Path Simplify | `simplifyPath()` (`BotPlannerV2.ts:147`) | `path.length (1) <= 2` | Returns `[{x: 200, y: 208}]` |
| **8** | Movement Intent | `updateBotV2()` (`BotControllerV2.ts:141`) | Bot `(200, 201.4)`, Waypoint 0 `(200, 208)` | `wdist = 6.60 px <= 12.00 px` -> `pathIndex` = 1 -> `dx=0, dy=0` |
| **9** | Progress Check | `checkProgress()` (`BotProgressMonitorV2.ts:28`) | `timeSinceLast = 500ms`, `distMoved = 0.0px < 8.0px` | Returns `false` -> Transition to `RECOVER` |
| **10** | Recovery Replan | `requestReplan()` (`BotStateMachineV2.ts:818`) | Expanded search bounds | Returns `type: 'FULL'`, `path = [{x: 200, y: 208}]` |
| **11** | Reversion Loop | `updateStateMachine()` (`BotStateMachineV2.ts:447`) | `context.currentPathType === 'FULL'` | Immediate transition back to `CHASE` (Loop repeats) |

---

## SECTION 3: Goal Candidate Set Audit

### 3.1 Candidate Generation Logic (`BotGoalSelectorV2.ts`)
The function `getGoalCandidates(snapshot, targetPos, inflatedObstacles)` constructs deterministic square concentric rings (`r = 1` to `MAX_RINGS = 6`) around `targetPos`:
* Ring offset formula: `targetPos.x + dx * gridSize`, `targetPos.y + dy * gridSize`.
* Rings are generated at radius `r * 16 px` (`16`, `32`, `48`, `64`, `80`, `96` px away).
* Filtering rules applied:
  1. `isPointInPlayerTransitCorridor(pt, snapshot)` -> filters cells inside active player trajectory.
  2. `Math.abs(pt.y - playerPosition.y) < rowGap * 0.85` (`119 px`) -> filters lateral camping.
  3. `isCellBlocked(pt.x, pt.y, inflatedObstacles, navBounds, snapshot)` -> filters obstacles/bounds.

### 3.2 Candidate Ingress Analysis
Under normal operation, ring cells centered at anchor `(352, 464)` span `X ∈ [256, 448]` and `Y ∈ [368, 560]`.
However, the candidate set can include `(200, 208)` under two documented system states:
1. **Goal Set Injection / Fallback**: When obstacle inflation or transit corridor boundaries block all ring candidates near `(352, 464)`, or when goal candidate selection logic falls back / injects default unblocked grid positions including the bot's current grid cell `(200, 208)`.
2. **Current-Cell Matching**: When `goals` contains `{x: 200, y: 208}` (or when start node coordinate matches a goal in the list), A* terminates at `startNode`.

---

## SECTION 4: A* Search Mechanics & Early Termination

### 4.1 A* Goal Match Implementation (`BotPlannerV2.ts`)
```typescript
79:  const reachedGoal = goals.find(g => g.x === current.x && g.y === current.y);
80:  if (reachedGoal) {
81:    const path: Vec2[] = [];
82:    let curr: AStarNode | null = current;
83:    while (curr) {
84:      path.push({ x: curr.x, y: curr.y });
85:      curr = curr.parent;
86:    }
87:    return { path: path.reverse(), type: 'FULL', nodesExpanded, selectedGoal: reachedGoal };
88:  }
```

### 4.2 Mathematical Proof of Early Termination
1. `planPathV2` converts `start = {x: 200, y: 201.4}` to grid coordinates:
   $$\text{startX} = \text{snapToGrid}(200) = 200$$
   $$\text{startY} = \text{snapToGrid}(201.4) = \text{Math.round}(201.4 / 16) \times 16 = 208$$
2. `startNode` is initialized with `x = 200, y = 208, g = 0, parent = null`.
3. `openList` contains `[startNode]`.
4. While loop iteration 1:
   - `current = openList.shift()` (`startNode`).
   - `nodesExpanded` becomes `1`.
   - `reachedGoal = goals.find(g => g.x === 200 && g.y === 208)`.
   - If `(200, 208)` is present in `goals`, `reachedGoal` is non-null!
   - Backtrace loop executes: `path = [{x: 200, y: 208}]`.
   - Return object: `{ path: [{x: 200, y: 208}], type: 'FULL', nodesExpanded: 1, selectedGoal: {x: 200, y: 208} }`.

---

## SECTION 5: Path Arrival Tolerance & Zero Movement Intent

### 5.1 Controller Waypoint Evaluation (`BotControllerV2.ts`)
```typescript
141:  let targetWp = context.currentPath[context.pathIndex];
142:  if (targetWp) {
143:    const wdx = targetWp.x - snapshot.botPosition.x;
144:    const wdy = targetWp.y - snapshot.botPosition.y;
145:    const wdist = Math.sqrt(wdx*wdx + wdy*wdy);
146:    if (wdist <= BOT_CONFIG_V2.waypointArrivalPx) {
147:      const oldIndex = context.pathIndex;
148:      context.pathIndex++;
...
```

### 5.2 Distance Calculation & Zero Movement Proof
* **Bot Position**: `(200.0, 201.4)`
* **Target Waypoint**: `(200, 208)`
* **Euclidean Distance**:
  $$\text{wdist} = \sqrt{(200 - 200)^2 + (208 - 201.4)^2} = \sqrt{0 + 43.56} = 6.60 \text{ px}$$
* **Arrival Threshold**: `BOT_CONFIG_V2.waypointArrivalPx = 12.00 px`.
* **Evaluation**: `6.60 px <= 12.00 px` -> `TRUE`.
* **Index Increment**: `pathIndex` increments from `0` to `1`.
* **Path Exhaustion**: `pathIndex (1) < currentPath.length (1)` is `FALSE`.
* **Displacement Assignment**: `dx = 0, dy = 0`.
* **Event Recorded**: `ZERO_MOVEMENT_INTENT`.

---

## SECTION 6: Progress Monitor & Rung 1 Recovery Loop Mechanics

### 6.1 Stall Detection (`BotProgressMonitorV2.ts`)
1. Every `500 ms` (`monitorNoProgressWindowMs`), `checkProgress` calculates displacement from `lastPos`:
   $$\text{distMoved} = \sqrt{(200 - 200)^2 + (201.4 - 201.4)^2} = 0.00 \text{ px}$$
2. Condition: `0.00 px < 8.00 px` (`monitorNoProgressDistPx`).
3. `checkProgress` returns `false`.

### 6.2 State Machine Recovery Loop (`BotStateMachineV2.ts`)
1. In `updateStateMachine`: `progressOk = checkProgress(...)` returns `false`.
2. State transitions: `context.currentState = 'RECOVER'`, `progress.recoveryRung = 1`.
3. Recovery Rung 1 executes: `requestReplan(snapshot, context, inflatedObstacles, 'EXPANDED')`.
4. `requestReplan` calls `planPathV2` with full viewport bounds.
5. `planPathV2` evaluates the goal set containing `(200, 208)`, matches `startNode` on iteration 1, and returns `type: 'FULL'`.
6. Immediate state reversion check (line 447):
   ```typescript
   if (context.currentPathType === 'FULL') {
     context.currentState = 'CHASE';
   }
   ```
7. `context.currentState` is overwritten to `'CHASE'` within the **same execution frame**.
8. Transition to `'CHASE'` resets `progress.lastPosTimeMs = snapshot.simTimeMs`.
9. The bot never enters Rung 2 (escape cell), Rung 3 (backtracking), or Rung 4 (SEARCH reset).
10. The system loops infinitely between `CHASE` and `RECOVER` every `500 ms`.

---

## SECTION 7: Test Suite Gap Analysis

### 7.1 Identified Test Coverage Deficits
1. **One-Node Path Acceptance**: Existing tests in `botAI.v2.test.ts` check `expect(context.currentPath?.length || 0).toBeGreaterThan(0)`. A 1-node path satisfies `length > 0` (length = 1), masking the defect.
2. **`FULL` Classification Guard**: No unit test verifies that a path starting and ending at the bot's current grid cell is rejected or reclassified as `PARTIAL` / invalid when the true target anchor is far away.
3. **Recovery Oscillation Guard**: Tests verified that `RECOVER` can be entered, but did not assert that `RECOVER -> CHASE -> RECOVER` loops increment the recovery rung counter if zero movement persists across consecutive replans.

---

## SECTION 8: Source Reference Concordance

### 8.1 Key Source Locations
* **`BotPlannerV2.ts`**:
  * Line 25: `planPathV2` entry point.
  * Line 36-37: Start coordinate grid snapping.
  * Line 49-56: `startNode` initialization.
  * Line 79-88: Immediate A* goal check (`reachedGoal`).
  * Line 147-163: `simplifyPath` function.
* **`BotStateMachineV2.ts`**:
  * Line 384-469: `checkProgress` failure handler & Rung 1 `RECOVER` transition.
  * Line 447-468: `RECOVER_TO_CHASE` immediate reversion on `FULL` path type.
  * Line 610-933: `requestReplan` orchestration function.
* **`BotGoalSelectorV2.ts`**:
  * Line 48-82: `getBelowPlayerAnchor` anchor calculation.
  * Line 84-198: `getGoalCandidates` candidate generator.
* **`BotControllerV2.ts`**:
  * Line 138-184: Path movement calculation and waypoint arrival tolerance check.
* **`BotProgressMonitorV2.ts`**:
  * Line 6-52: `checkProgress` windowed movement check.
