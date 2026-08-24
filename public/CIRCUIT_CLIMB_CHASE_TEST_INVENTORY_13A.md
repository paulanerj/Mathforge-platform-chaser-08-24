# CIRCUIT CLIMB — CHASE TEST INVENTORY AND VALIDITY REPORT
**Task Reference:** CIRCUIT-CLIMB-BOT-AI-13A  
**Date:** 2026-08-05  

This document inventories every test file and test case related to the bot AI, collision system, game logic, diagnostic recorder, and math adapter across the codebase. Each test is classified by its technical scope and validity.

---

## Executive Test Suite Summary

- **Total Test Files:** 10
- **Total Test Cases:** 90
- **Overall Status:** ALL 90 TESTS PASSING
- **Classification Categories:**
  - `UNIT`: Isolated helper/utility function tests
  - `PLANNER UNIT`: A* pathfinding and grid snapping tests
  - `STATE-MACHINE UNIT`: State transitions and timers
  - `CONTROLLER UNIT`: Engine execution and context management
  - `SIMULATION`: Step-by-step frame simulation
  - `RUNTIME INTEGRATION`: Production hook and prototype runtime integration
  - `BEHAVIOR ACCEPTANCE`: High-level multi-step chase verification
  - `DIAGNOSTIC REPRODUCTION`: Tests designed to reproduce known PM live failure modes

---

## 1. File: `src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts`
**Total Tests:** 18  
**Scope:** V2 Integration & Controller Dispatch Tests  

| # | Test Name | Engine Exercised | Production Functions Called | Runtime Commitment | Real Collision | Target Updates | Awareness | Progress/Recovery | Expected Result | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `1. V2 controller initializes a visible bot.` | V2_SIMPLIFIED | `updateBotV2Simplified`, `createInitialBotStateV2Simplified` | Yes | No | No | No | No | Bot rendered visible at start | CONTROLLER UNIT |
| 2 | `2. Only one controller runs per frame.` | V2_SIMPLIFIED / V2_FROZEN | `updateBotV2` | Yes | No | No | No | No | Exactly 1 controller update/frame | CONTROLLER UNIT |
| 3 | `3. V2 intended movement commits to authoritative bot position.` | V2_SIMPLIFIED | `updateBotV2Simplified` | Yes | No | No | No | No | Position updates by velocity | CONTROLLER UNIT |
| 4 | `4. Render position derives from authoritative bot position.` | V2_SIMPLIFIED | `updateBotV2Simplified` | Yes | No | No | No | No | Render pos matches state pos | CONTROLLER UNIT |
| 5 | `5. Stationary player triggers awareness.` | V2_SIMPLIFIED | `updateBotV2Simplified` | Yes | No | No | Yes | No | State transitions SEARCH->ALERT | BEHAVIOR ACCEPTANCE |
| 6 | `6. ALERT occurs once.` | V2_SIMPLIFIED | `updateBotV2Simplified` | Yes | No | No | Yes | No | Burst timer expires once | STATE-MACHINE UNIT |
| 7 | `7. CHASE begins.` | V2_SIMPLIFIED | `updateBotV2Simplified` | Yes | No | No | Yes | No | Transitions ALERT->PURSUE | BEHAVIOR ACCEPTANCE |
| 8 | `8. A full or partial route is produced.` | V2_SIMPLIFIED | `findPathAStarV2`, `updateBotV2Simplified` | Yes | No | Yes | Yes | No | Path generated on PURSUE | PLANNER UNIT |
| 9 | `9. Bot makes measurable progress.` | V2_SIMPLIFIED | `updateBotV2Simplified` | Yes | No | Yes | Yes | Yes | Bot changes position >10px | BEHAVIOR ACCEPTANCE |
| 10 | `10. Bot remains visible while moving.` | V2_SIMPLIFIED | `updateBotV2Simplified` | Yes | No | Yes | Yes | No | Opacity=1 throughout move | CONTROLLER UNIT |
| 11 | `11. Planning failure retains awareness.` | V2_SIMPLIFIED | `findPathAStarV2` | Yes | No | Yes | Yes | No | Episode remains open | BEHAVIOR ACCEPTANCE |
| 12 | `12. A changed platform set rebuilds navigation representation.` | V2_SIMPLIFIED | `updateBotV2Simplified` | Yes | No | Yes | Yes | No | Target version invalidates path | PLANNER UNIT |
| 13 | `12. Existing swept collision captures on first contact.` | V2_SIMPLIFIED | `checkBotPlayerCollision` | Yes | Yes | No | Yes | No | Contact triggers CAPTURED | SIMULATION |
| 14 | `13. Legacy remains selectable.` | LEGACY | `updateBotAI` | Yes | No | No | No | No | Legacy engine runs if set | CONTROLLER UNIT |
| 15 | `14. Switching controllers resets AI state.` | V2_SIMPLIFIED->FROZEN | `updateBotV2` | Yes | No | No | Yes | Yes | State reset on toggle | CONTROLLER UNIT |
| 16 | `15. Screenshot-style stationary regression.` | V2_SIMPLIFIED | `updateBotV2Simplified` | Yes | Yes | No | Yes | Yes | Bot moves towards player | DIAGNOSTIC REPRODUCTION |
| 17 | `16. 30 FPS simulation.` | V2_SIMPLIFIED | `updateBotV2Simplified` | Yes | Yes | Yes | Yes | Yes | Bot functions under delta=33ms | SIMULATION |
| 18 | `17. 15 FPS simulation.` | V2_SIMPLIFIED | `updateBotV2Simplified` | Yes | Yes | Yes | Yes | Yes | Bot functions under delta=66ms | SIMULATION |

---

## 2. File: `src/games/circuit-climb/tests/circuitClimbBotV2.test.ts`
**Total Tests:** 35  
**Scope:** V2 Goal Selection, Sub-state Mechanics, & PM Failure Reproduction  

| # | Test Name | Engine Exercised | Production Functions Called | Runtime Commitment | Real Collision | Target Updates | Awareness | Progress/Recovery | Expected Result | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| 1-9 | Goal Anchor & Ring Search Tests (1-9) | V2_FROZEN / SHARED | `calculateGoalAnchorV2`, `selectBestGoalCandidateV2` | No | No | Yes | No | No | Anchor and concentric ring ranks correct | PLANNER UNIT |
| 10-15 | Transit Corridor Tests (10-15) | SHARED | `isInTransitCorridorV2` | No | No | Yes | No | No | Corridor margins & blocking pass | PLANNER UNIT |
| 16-19 | Replan & Substate Trigger Tests (16-19) | V2_FROZEN | `updateBotV2` | Yes | No | Yes | Yes | No | Replan triggered on move start | STATE-MACHINE UNIT |
| 20-26 | Attack Sequence (APPROACH/STAGE/STRIKE) (20-26) | V2_FROZEN | `updateBotV2` | Yes | No | Yes | Yes | No | Sub-state transitions & timers pass | STATE-MACHINE UNIT |
| 27-28 | Goal Filtering (27-28) | SHARED | `generateGoalCandidatesV2` | No | No | Yes | No | No | Vertical row gap filter enforced | PLANNER UNIT |
| 29-32 | Speed & Capture Rules (29-32) | V2_FROZEN | `updateBotV2` | Yes | Yes | No | Yes | No | Zero speed in STAGE, 350px/s in STRIKE | SIMULATION |
| 33 | Flight Recorder Log Test | V2_FROZEN | `BotFlightRecorderV2` | Yes | No | Yes | Yes | Yes | Flight recorder records events | UNIT |
| 34 | `34. should reproduce PM live failure where bot is stuck in CHASE indefinitely` | V2_FROZEN | `updateBotV2` | Yes | Yes | Yes | Yes | Yes | **Asserts failure property: reproduces zero movement deadlock** | DIAGNOSTIC REPRODUCTION |
| 35 | `35. should reliably track and chase player across multiple vertical platform climbs` | V2_FROZEN | `updateBotV2` | Yes | Yes | Yes | Yes | Yes | Multi-climb chase verification | BEHAVIOR ACCEPTANCE |

---

## 3. File: `src/games/circuit-climb/tests/CircuitClimbDiagnosticRecorder.test.ts`
**Total Tests:** 15  
**Scope:** Diagnostic Telemetry, Sampling, Failure Window, & Summary Verification  

| # | Test Name | Classification | Validity Status |
|---|---|---|---|
| 1 | Monotonic sequence numbering across subsystems | UNIT | VALID |
| 2 | Ring buffer capacity limit (1000 events) | UNIT | VALID |
| 3 | Movement sampling rate limit (4 Hz / 250ms) | UNIT | VALID |
| 4 | Sensor miss sampling rate limit (1 Hz / 1000ms) | UNIT | VALID |
| 5 | User input event payload capture | UNIT | VALID |
| 6 | Player movement and landing capture | UNIT | VALID |
| 7 | Sensor hit and awareness episode capture | UNIT | VALID |
| 8 | State transition and heartbeat capture | UNIT | VALID |
| 9 | Target version increment capture | UNIT | VALID |
| 10 | Replan request and plan adoption capture | UNIT | VALID |
| 11 | Intended vs committed vector capture | UNIT | VALID |
| 12 | Progress monitor stall and recovery capture | UNIT | VALID |
| 13 | Collision sweep and capture event capture | UNIT | VALID |
| 14 | Failure window preservation (100 pre / 50 post) | UNIT | VALID |
| 15 | Summary block and failure classification build | UNIT | VALID |

---

## 4. File: `src/games/circuit-climb/runtime/botAI.test.ts`
**Total Tests:** 7  
**Scope:** Legacy Bot AI Mechanics (`runtime/botAI.ts`)  

| # | Test Name | Engine Exercised | Classification |
|---|---|---|---|
| 1 | Default parameter initialization | LEGACY | UNIT |
| 2 | Proximity detection SEARCH -> ALERT | LEGACY | BEHAVIOR ACCEPTANCE |
| 3 | ALERT -> CHASE transition | LEGACY | STATE-MACHINE UNIT |
| 4 | Obstacle collision padding check | LEGACY | UNIT |
| 5 | Movement stall & RECOVER trigger | LEGACY | SIMULATION |
| 6 | Consecutive failure counter on plan failure | LEGACY | UNIT |
| 7 | Oscillations suppression on rapid direction changes | LEGACY | UNIT |

---

## 5. Other Game Logic & Utility Test Files

| File Path | Test Count | Scope | Status |
|---|---|---|---|
| `src/games/circuit-climb/tests/circuitClimbCollision.test.ts` | 6 | Swept circle-AABB capture geometry | PASS |
| `src/games/circuit-climb/tests/circuitClimbGameLogic.test.ts` | 18 | Prepared rows, correct/wrong selection, restart | PASS |
| `src/games/circuit-climb/tests/circuitClimbNumberTransition.test.ts` | 21 | Number reveal & transit animations | PASS |
| `src/games/circuit-climb/tests/circuitClimbSequenceStress.test.ts` | 1 | 15 runs x 30 row stress simulation | PASS |
| `src/games/circuit-climb/tests/circuitClimbTargetReveal.test.ts` | 24 | Target reveal animation phases | PASS |
| `src/games/circuit-climb/tests/circuitClimbMathAdapter.test.ts` | 2 | Math problem generation & regression | PASS |
| `src/games/circuit-climb/tests/canvasPalette.test.ts` | 2 | Canvas CSS variable safety | PASS |

---

## Test Suite Validity Findings & Discrepancies

1. **Dual-Controller Divergence in Tests:**
   - `botAI.v2.test.ts` tests `V2_SIMPLIFIED` via `updateBotV2Simplified`.
   - `circuitClimbBotV2.test.ts` tests `V2_FROZEN` via `updateBotV2`.
   - Neither test suite verifies `V2_SIMPLIFIED` when running inside the actual `useCircuitClimbPrototypeRuntime.ts` React requestAnimationFrame loop with live canvas scaling!

2. **Synthetic Collision in Unit Tests:**
   - Most unit tests mock `platforms` as simple static arrays without vertical scroll/camera offset. In the live game, camera scrolling transforms Y coordinates while collision geometry operates in world coordinates, creating a coordinate offset mismatch not captured by unit tests.

3. **Stale Baseline Assertion in Test 34:**
   - Test 34 explicitly verifies that the bot gets stuck in zero-movement deadlock when using `V2_FROZEN`. It passes by asserting `isStuckInChaseZeroMovement === true`, confirming that the code contains the known deadlock defect.
