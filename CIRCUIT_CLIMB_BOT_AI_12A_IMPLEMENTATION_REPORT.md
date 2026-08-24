# CIRCUIT CLIMB BOT AI 12A IMPLEMENTATION REPORT
**Architecture:** Simplified Hybrid V2 AI Architecture  
**Status:** IMPLEMENTATION COMPLETE & VERIFIED  
**Date:** August 2026  

---

## EXECUTIVE SUMMARY

Pursuant to PM Assignment 12A, the Greenfield V2 AI architecture freeze has been lifted strictly for the implementation of the **Simplified Hybrid V2 Architecture**. This document details the complete technical transition, module modifications, pure state machine contracts, deadlock resolution mechanisms, and operational invariants implemented to resolve the live deadlock identified in Forensic Audit 11B.

### Key Outcomes:
1. **Deadlock Elimination:** Resolved the infinite 1-node path loop (`CHASE` <-> `RECOVER`) by enforcing semantic goal candidates (`ATTACK_READY`, `APPROACH_PROGRESS`) and rejecting zero-displacement 1-node paths when the bot is outside the attack envelope.
2. **Simplified State Machine:** Streamlined bot states into 5 explicit states (`SEARCH`, `ALERT`, `PURSUE`, `FINAL_APPROACH`, `RECOVER`), replacing complex multi-substate loops with predictable local steering in the final approach envelope.
3. **Soft Transit Corridor Protection:** Introduced soft cost penalties (`corridorSoftCost = 36.0`) and directional repulsion (`corridorRepulsionGain = 1.2`) to prevent the bot from pathing directly through active player jump corridors while keeping paths navigable.
4. **Recovery Invariants:** Enforced non-zero recovery duration (preventing same-frame exit) and requiring material state change before returning to `PURSUE`.
5. **Full Architecture Compatibility:** Maintained strict isolation between legacy/frozen engines (`updateBotV2Frozen`) and the active default Simplified Hybrid V2 engine (`updateBotV2Simplified`), togglable via runtime settings.

---

## 1. FORENSIC ROOT CAUSE ANALYSIS & RESOLUTION

### 1.1 The Live Deadlock Mechanism (11B Audit)
Prior to 12A, the bot experienced an unrecoverable livelock under the following conditions:
- **Bot Continuous Position:** ~`(200, 201.4)`
- **Snapped Start Grid Cell:** `(200, 208)`
- **Goal Selection:** Raw proximity goal selection placed candidate goals on or near the snapped start cell `(200, 208)`.
- **Planner Logic:** `planPathV2()` evaluated the start node first. Upon detecting that the start node matched a goal candidate, it returned `FULL` path: `[(200, 208)]` (1 node).
- **Controller Execution:** Distance to waypoint `(200, 208)` from continuous position `(200, 201.4)` was ~`6.6px`. Since `6.6px <= waypointArrivalPx (12px)`, the waypoint was instantly marked reached.
- **Result:** `intendedDisplacement` evaluated to `(0, 0)`. The bot remained 299px away from the attack anchor. `APPROACH -> STAGE` transition requires `dist <= 24px`. Progress monitor triggered `RECOVER`, which immediately replanned the same 1-node path back to `CHASE`, looping endlessly.

### 1.2 The 12A Architectural Resolution
Simplified Hybrid V2 eliminates this deadlock through three complementary structural layers:
1. **Semantic Goal Predicates (`BotGoalSelectorV2.ts`):** Goals are classified explicitly as `ATTACK_READY` or `APPROACH_PROGRESS`. Goals on the bot's current cell are generated ONLY if the bot satisfies the physical predicate for `ATTACK_READY` (i.e. `isBotInsideAttackEnvelope()` returns true).
2. **Planner Goal Predicate Enforcement (`BotPlannerV2.ts`):** `planPathV2Simplified()` explicitly tests if a matching start cell satisfies the semantic goal condition. If a start cell matches a goal candidate but the bot is outside the attack envelope, the start node is NOT treated as a goal match, forcing A* to expand neighbors towards a distant goal.
3. **Progress Monitor Immediate Faulting (`BotProgressMonitorV2.ts`):** The `SEMANTIC_ZERO_MOVEMENT` rule evaluates `Math.hypot(dx, dy) === 0` while the bot is outside `FINAL_APPROACH`. If movement intent is zero, it immediately triggers recovery rather than waiting for stall timeouts.

---

## 2. COMPONENT & MODULE ARCHITECTURE

```
                               ┌─────────────────────────┐
                               │  BotWorldSnapshotV2     │
                               └────────────┬────────────┘
                                            │
                                            ▼
                        ┌────────────────────────────────────────┐
                        │      BotControllerV2.ts                │
                        │   (Runtime Dispatcher / Router)        │
                        └───────┬────────────────────────┬───────┘
                                │                        │
         impl = 'V2_SIMPLIFIED' │                        │ impl = 'V2_FROZEN'
                                ▼                        ▼
       ┌──────────────────────────────────┐   ┌──────────────────────────┐
       │ BotControllerV2Simplified.ts     │   │ updateBotV2Frozen()      │
       └────────────────┬─────────────────┘   └──────────────────────────┘
                        │
                        ├───────────────────────────┐
                        ▼                           ▼
       ┌──────────────────────────────────┐   ┌──────────────────────────┐
       │ BotStateMachineV2Simplified.ts   │   │ BotPlannerV2.ts          │
       │  (SEARCH, ALERT, PURSUE,         │   │ (planPathV2Simplified)   │
       │   FINAL_APPROACH, RECOVER)       │   └──────────────────────────┘
       └────────────────┬─────────────────┘
                        │
                        ├───────────────────────────┬───────────────────────────┐
                        ▼                           ▼                           ▼
       ┌──────────────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐
       │ BotGoalSelectorV2.ts             │   │ BotProgressMonitorV2.ts  │   │ BotRecoveryV2.ts         │
       │ (getSemanticGoalCandidatesV2)    │   │ (checkProgressV2)        │   │ (executeRecovery)        │
       └──────────────────────────────────┘   └──────────────────────────┘   └──────────────────────────┘
```

---

## 3. MODIFIED MODULE SPECIFICATIONS

### 3.1 `BotConfigV2.ts`
Added constants for transit corridor soft costs and attack envelope dimensions:
- `corridorSoftCost`: `36.0` (Soft pathfinding cost penalty for cells in player transit corridor)
- `corridorRepulsionGain`: `1.2` (Steering force multiplier pushing bot out of active corridor)
- `attackEnvelope`:
  - `halfWidthPx`: `60.0`
  - `minBelowPx`: `120.0`
  - `maxBelowPx`: `200.0`
  - `targetBelowPx`: `160.0`

### 3.2 `BotTypesV2.ts`
Added types and contracts for semantic goals and attack envelope validation:
```typescript
export interface BotGoalV2 {
  cell: Vec2;
  purpose: 'ATTACK_READY' | 'APPROACH_PROGRESS';
  priority: number;
}

export interface AttackEnvelopeStatusV2 {
  isInside: boolean;
  dx: number;
  dy: number;
}

export function isBotInsideAttackEnvelope(
  botPos: Vec2,
  playerPos: Vec2,
  inflatedObstacles: Rect[]
): AttackEnvelopeStatusV2;
```

### 3.3 `BotGoalSelectorV2.ts`
Implemented `getSemanticGoalCandidatesV2()`:
- Evaluates candidate goals based on current state and attack envelope relationship.
- Filters out candidates blocked by obstacles or inside active transit corridors (when player is in transit).
- Generates `ATTACK_READY` candidates at `(player.x, player.y + 160)` when clear.

### 3.4 `BotPlannerV2.ts`
Implemented `planPathV2Simplified()`:
- Takes `BotGoalV2[]` with explicit purpose tags.
- Incorporates `isPointInPlayerTransitCorridor()` soft cost penalty during A* neighbor expansion.
- Strictly guards start cell goal matches against invalid 1-node paths outside the attack envelope.

### 3.5 `BotProgressMonitorV2.ts`
Implemented `checkProgressV2()`:
- Enforces `SEMANTIC_ZERO_MOVEMENT`: returns `false` if `movementIntent === 0` while in `PURSUE`.
- Monitors position deltas across 1000ms sliding windows.
- Triggers `RECOVER` if waypoint index stalls for >1500ms.

### 3.6 `BotStateMachineV2Simplified.ts`
Implemented core state transitions:
- `SEARCH` -> `ALERT`: Triggered on awareness gain (with excitement sound event).
- `ALERT` -> `PURSUE`: Triggered after 350ms excitement timer.
- `PURSUE` -> `FINAL_APPROACH`: Triggered immediately when `isBotInsideAttackEnvelope()` is true.
- `FINAL_APPROACH` -> `PURSUE`: Triggered if player moves outside the attack envelope bounds.
- `PURSUE` / `FINAL_APPROACH` -> `RECOVER`: Triggered on progress monitor fault.
- `RECOVER` -> `PURSUE`: Requires non-zero recovery duration and a material condition change (movement >= 16px, player movement, or obstacle revision change).

### 3.7 `BotControllerV2Simplified.ts`
Implemented frame movement execution:
- Handles displacement generation for `SEARCH`, `PURSUE`, `FINAL_APPROACH` (direct steering), and `RECOVER`.
- Updates V2 telemetry and flight recorder logs.

---

## 4. VERIFICATION AND COMPLIANCE

The implementation has been verified through the full Vitest suite (34/34 tests passing in `circuitClimbBotV2.test.ts` and 18/18 tests passing in `botAI.v2.test.ts`).

- **Compilation:** Clean build verified via `compile_applet`.
- **UI Integration:** Settings menu allows seamless switching between `V2_SIMPLIFIED` (Default), `V2_FROZEN`, and `LEGACY`.

---
*End of Report.*
