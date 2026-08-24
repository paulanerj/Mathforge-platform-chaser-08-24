# CIRCUIT CLIMB BOT AI 12A ARCHITECTURE SPECIFICATION
**Architecture:** Simplified Hybrid V2 AI Architecture  
**Status:** ACTIVE PRODUCTION SPECIFICATION  
**Date:** August 2026  

---

## 1. HIGH-LEVEL SYSTEM ARCHITECTURE

The **Simplified Hybrid V2 AI Architecture** is a decoupled, deterministic, state-driven navigation and combat system engineered for real-time 2D platforming enemies.

### 1.1 Module Hierarchy & File Ownership
```
src/games/circuit-climb/bot-ai-v2/
├── BotTypesV2.ts                  # Pure data types, contracts, and envelope geometry
├── BotConfigV2.ts                 # Configuration constants and tuning parameters
├── BotGoalSelectorV2.ts           # Semantic goal candidate generator & anchor math
├── BotPlannerV2.ts                # A* planner with soft corridor cost & predicate checks
├── BotProgressMonitorV2.ts        # Motion tracking & zero-movement fault detection
├── BotSensingV2.ts                # Sensor raycasts, edge gap detection & awareness
├── BotRecoveryV2.ts               # Multi-rung recovery behaviors and rung escalation
├── BotStateMachineV2Simplified.ts # Core state transitions & invariant enforcement
├── BotControllerV2Simplified.ts   # Velocity vector generation & telemetry dispatch
├── BotControllerV2.ts             # Primary entry point & legacy/simplified router
└── BotFlightRecorderV2.ts         # Diagnostic event logging and flight recorder
```

---

## 2. STATE MACHINE SPECIFICATION

The state machine operates across 5 primary discrete states:

```
                  ┌──────────────┐
                  │    SEARCH    │
                  └──────┬───────┘
                         │ (Awareness Gained)
                         ▼
                  ┌──────────────┐
                  │    ALERT     │
                  └──────┬───────┘
                         │ (Excitement Timer Expired: 350ms)
                         ▼
                  ┌──────────────┐
        ┌────────>│    PURSUE    │<────────┐
        │         └──────┬───────┘         │
        │                │                 │
        │                │ (In Envelope)   │ (Outside Envelope / Player Moved)
        │                ▼                 │
        │         ┌──────────────┐         │
        │         │FINAL_APPROACH│─────────┘
        │         └──────┬───────┘
        │                │
        │ (Progress      │ (Progress
        │  Fault)        │  Fault)
        │                ▼
        │         ┌──────────────┐
        └─────────│   RECOVER    │
 (Material Change └──────────────┘
  & Path Found)
```

### State Definitions:
1. **`SEARCH`**: Idle/patrol state. Bot sweeps laterally across navigation bounds until player enters awareness range.
2. **`ALERT`**: Reaction pause upon initial player detection. Plays excitement sound and holds position for 350ms before giving chase.
3. **`PURSUE`**: Global pathfinding navigation state. Uses A* (`planPathV2Simplified`) with soft transit corridor costs to navigate around platforms toward semantic goal candidates.
4. **`FINAL_APPROACH`**: Local steering attack preparation state. Activated when bot enters the attack envelope (`abs(dx) <= 60px`, `120px <= dy <= 200px`). Uses continuous proportional steering toward `(player.x, player.y + 160)` with vertical bias (`2.0x`).
5. **`RECOVER`**: Stall recovery state. Executed when progress monitor detects zero movement intent or waypoint stalling. Applies rung-based recovery actions (rung 1: lateral step, rung 2: vertical drop, rung 3: search reset).

---

## 3. GOAL SELECTION & PLANNER CONTRACTS

### 3.1 Semantic Goal Candidate Generation (`BotGoalSelectorV2.ts`)
Goals are classified into two explicit semantic purpose categories:
1. **`ATTACK_READY`**: Located at the canonical below-player anchor `(player.x, player.y + 160)`. Generated ONLY if unblocked and outside active player transit corridors.
2. **`APPROACH_PROGRESS`**: Generated in concentric rings around the anchor when direct anchor cell is blocked or distant.

### 3.2 A* Planner Rules (`BotPlannerV2.ts`)
- **Soft Transit Corridor Cost:** `cost = distance + (inTransitCorridor ? 36.0 : 0.0)`.
- **Start Cell Predicate Check:** If start cell matches candidate goal `cell`, the planner checks `isBotInsideAttackEnvelope()`. If false, the match is rejected, preventing 1-node path deadlocks.

---

## 4. PROGRESS MONITORING & RECOVERY INVARIANTS

### 4.1 Progress Monitor Rules (`BotProgressMonitorV2.ts`)
1. **`SEMANTIC_ZERO_MOVEMENT`**: If `intendedDisplacement === (0, 0)` while in `PURSUE` (outside attack envelope), `checkProgressV2()` returns `false` immediately.
2. **Stall Timeout:** If bot remains within `12px` of last position for >1000ms without advancing waypoint index, `checkProgressV2()` returns `false`.

### 4.2 Recovery Invariants (`BotStateMachineV2Simplified.ts`)
- **Non-Zero Duration:** Frame entering `RECOVER` cannot exit `RECOVER` on the same tick.
- **Material State Change:** Exiting `RECOVER` back to `PURSUE` requires at least one material state change (displacement >= 16px, player movement state change, or platform set revision update).

---

## 5. TELEMETRY AND FLIGHT RECORDER LOGGING

All state machine transitions, goal generation events, path planning outcomes, and progress faults write structured telemetry events to `BotFlightRecorderV2`:
- `SEARCH_TO_ALERT`
- `ALERT_TO_PURSUE`
- `PURSUE_TO_FINAL_APPROACH`
- `FINAL_APPROACH_TO_PURSUE`
- `PURSUE_TO_RECOVER`
- `RECOVER_TO_PURSUE`
- `ZERO_MOVEMENT_INTENT`

Telemetry overlays rendered on the canvas HUD expose current state, edge gap, awareness timer, planner status, path length, and recovery rung in real-time.

---
*End of Architecture Specification.*
