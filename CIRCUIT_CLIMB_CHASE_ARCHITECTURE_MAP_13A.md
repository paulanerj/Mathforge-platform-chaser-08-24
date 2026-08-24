# CIRCUIT CLIMB — CHASE ARCHITECTURE MAP
**Task Reference:** CIRCUIT-CLIMB-BOT-AI-13A  
**Date:** 2026-08-05  

This document details the architectural diagrams and ASCII data flows for the five primary operational pipelines in the red-bot chase system.

---

## 1. Controller Dispatch Architecture

```
                       [ requestAnimationFrame Loop ]
                                      │
                                      ▼
             [ runtime/useCircuitClimbPrototypeRuntime.ts ]
                 (Lines 1350-1450: gameLoop iteration)
                                      │
                                      ▼
                  [ Engine Selector: activeAiEngine ]
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │ LEGACY                      │ V2_FROZEN                   │ V2_SIMPLIFIED
        ▼                             ▼                             ▼
 [ runtime/botAI.ts ]     [ BotControllerV2.ts ]       [ BotControllerV2Simplified.ts ]
  updateBotAI(...)         updateBotV2(...)             updateBotV2Simplified(...)
        │                             │                             │
        │                             ▼                             ▼
        │                 [ BotStateMachineV2.ts ]    [ BotStateMachineV2Simplified.ts ]
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      │
                                      ▼
                       [ Velocity & Vector Computed ]
                         (intendedDisplacement: Vec2)
                                      │
                                      ▼
                      [ Swept AABB Collision Sweep ]
                     (checkBotPlayerCollision / AABB)
                                      │
                                      ▼
                      [ Authoritative Position Commit ]
                         (snapshot.botPosition += dt)
                                      │
                                      ▼
                       [ CircuitClimbSurface.tsx ]
                         (Canvas Renderer / Red Glow)
```

---

## 2. Player Landing to Replan Pipeline

```
 [ Player Clicks Platform ]
             │
             ▼
 [ PLAYER_MOVE_STARTED ] ──► (playerMovementState = 'TRANSIT')
             │
             ▼
 [ Player Arrives at Row ]
             │
             ▼
 [ PLAYER_LANDED Event ] ──► Increments global targetVersion (e.g., tv = 3)
             │               Updates playerSupportingPlatformId & playerRow
             ▼
 [ Bot Target Observer ]
             │
             ├─► Checks targetVersion vs context.pathTargetVersion
             │   If targetVersion > context.pathTargetVersion:
             │     Trigger BOT_TARGET_VERSION_CHANGED
             │     Invalidate active path (context.currentPath = null)
             │     Set context.needsReplan = true
             ▼
 [ Bot Planner Trigger ]
             │
             ▼
 [ BotGoalSelectorV2.ts ]
  generateGoalCandidatesV2(...) ──► Evaluates candidate grid cells (anchor, left, right)
             │
             ▼
 [ BotPlannerV2.ts ]
  findPathAStarV2(...) ─────────► Generates raw A* grid path
             │
             ▼
 [ Path Simplification ] ──────► Collinear node reduction & arrival tolerance filtering
             │
             ▼
 [ Bot Adopt Path ] ────────────► Sets context.currentPath & context.pathTargetVersion = tv
```

---

## 3. Planner to Movement Pipeline

```
 [ Actionable Waypoint Selection ]
  Target Waypoint = context.currentPath[context.pathIndex]
             │
             ▼
 [ Distance & Direction Vector ]
  dx = waypoint.x - botPosition.x
  dy = waypoint.y - botPosition.y
  dist = sqrt(dx^2 + dy^2)
             │
             ▼
 [ Check Arrival Radius ]
  If dist <= ARRIVAL_TOLERANCE (e.g. 12px):
    Advance context.pathIndex++
    Select next waypoint
             │
             ▼
 [ Intended Velocity Calculation ]
  vx = (dx / dist) * botSpeed
  vy = (dy / dist) * botSpeed
  intendedDisplacement = (vx * dt, vy * dt)
             │
             ▼
 [ Physical Collision & Obstacle Clamp ]
  Perform AABB Sweep against Platform Padding (padding = 8px)
  If blocked:
    Clamp intendedDisplacement vector along wall normal
             │
             ▼
 [ Authoritative Position Commit ]
  botPosition.x += committedDisplacement.x
  botPosition.y += committedDisplacement.y
```

---

## 4. Progress Monitor to Recovery Pipeline

```
 [ Active Movement in PURSUE ]
  Bot in PURSUE state with active path
             │
             ▼
 [ Progress Monitor Sampling ]
  Every frame: Calculate dx, dy from start of sample window (800ms window)
  displacement = hypot(currPos.x - sampleStartPos.x, currPos.y - sampleStartPos.y)
             │
             ▼
 [ Stall Evaluation ]
  Is displacement < 0.5px AND simTime - sampleStartMs > 800ms?
        │                             │
       YES                            NO
        │                             │
        ▼                             ▼
 [ BOT_NO_PROGRESS_DETECTED ]    [ Continue PURSUE ]
        │
        ▼
 [ State Transition to RECOVER ]
  currentState = 'RECOVER'
  recordEvent('BOT_RECOVER_ENTERED')
             │
             ▼
 [ Recovery Ladder Execution ]
  Rung 1: DIRECT_STEP (Step 24px in direction of waypoint)
  Rung 2: LATERAL_STEP (Orthogonal step 32px left/right)
  Rung 3: BACKTRACK_STEP (Step 32px back toward start cell)
             │
             ▼
 [ Recovery Exit Guard ]
  If displacement >= 20px OR recoveryTimer > 300ms:
    Exit RECOVER ──► Transition back to PURSUE
    Set context.needsReplan = true
```

---

## 5. Awareness Lifecycle Architecture

```
 [ Bot In SEARCH State ]
             │
             ▼
 [ Sensor Proximity Test ]
  Calculate distance = hypot(botPos.x - playerPos.x, botPos.y - playerPos.y)
  Is distance <= RADAR_RADIUS (220px)?
        │                             │
       YES                            NO
        │                             │
        ▼                             ▼
 [ BOT_NEAR_SENSOR_HIT ]         [ Remain in SEARCH ]
        │
        ▼
 [ Open Awareness Episode ]
  episodeId++ (e.g., episodeId = 1)
  recordEvent('BOT_AWARENESS_OPENED')
  Transition SEARCH ──► ALERT
             │
             ▼
 [ ALERT Burst Timer ]
  Wait 120ms
  Transition ALERT ──► PURSUE
             │
             ▼
 [ Active Pursuit ]
  Track player while distance <= RADAR_RADIUS
             │
             ▼
 [ Distance Exceeds Radar or RECOVER Triggered ]
  Is distance > 220px OR RECOVER exited?
        │
        ▼
 [ BOT_AWARENESS_CLOSED ]
  recordEvent('BOT_AWARENESS_CLOSED')
  Transition PURSUE ──► SEARCH
```
