# CIRCUIT-CLIMB-BOT-AI-AUDIT-05A
## Complete Enemy Search, Detection, Pursuit, and Stuck-State Architecture Audit

This document details the architecture and behavior audit of the red enemy bot's movement, decision, and grid pathfinding systems. In strict accordance with the project guidelines, **no code modifications have been made to the bot logic, constants, or movement parameters**. The codebase remains fully frozen, stable, and compilable.

---

### 1. Bot Code Ownership
The red enemy bot's initialization, update loops, sensors, collision checkers, and pathfinding models are fully encapsulated within the single game engine runtime file:
* **File Path**: `/src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts`
* **Key State Objects**: 
  - `bot`: The state dictionary containing position, current mode, sweep timestamps, sensor clocks, and travel paths (line 807).
  - `botTrail`: Particle queue rendering the dynamic glowing trail (line 821).
  - `echoes`: Alert segments indicating active player lock-ons (line 822).
* **Key Sub-systems**:
  - `restart()`: Reinstantiates bot state on new game triggers (line 807).
  - `updateBot(delta)`: Main state loop executing clock increments, sensor polling, and state machine updates (line 1315).
  - `buildBotPath(startX, startY, targetX, targetY)`: Grid-based BFS pathfinder (line 1192).
  - `setBotTarget(targetX, targetY, mode)`: Translates targets into metrics (line 1264).
  - `botFollowPath(delta, speed)`: Interpolates continuous coordinate movement along grid-node trails (line 1282).
  - `chooseBotSweepColumn()`: Columns coordinator for horizontal patrol sweeps (line 1297).
  - `drawBot()`: Canvas rendering loop handling jitters, locks, and fuses (line 2123).

---

### 2. Confirmation that No Source Files Were Modified
**Confirmed.** No functional source files or constants were modified during this audit. The simulation math and enemy parameters are 100% frozen. Development validation was executed via `npm run lint` and `npm run build` to confirm absolute stability of the frozen state.

---

### 3. State Machine Architecture Overview
The bot manages its gameplay lifecycle through an explicit state machine utilizing three primary modes:
1. **`'patrol'`**: Default search state. The bot moves horizontally between columns at a lower speed while tracking the rising timeline vertically.
2. **`'bursting'`**: Alert/Charge state. When the player is detected, the bot freezes in place for exactly 300ms (`bot.burstUntil = elapsed + 300`), executing high-frequency visual jitters and triggers lock sound effects.
3. **`'locked'`**: Active chase state. The bot traverses a calculated grid path at high speed towards the snapshotted coordinates where the player was standing.

---

### 4. Search Phase and Sweeping Behavior
During the `'patrol'` search phase, the bot exhibits two-dimensional movement behavior:
* **Vertical Tracking**: The target Y coordinate (`bot.patrolY`) is dynamically tied to the rising timer line:
  `bot.patrolY = timerLineY - CONFIG.botBaseOffsetRows * CONFIG.rowGap`
* **Horizontal Sweeping**: The bot selects horizontal columns from the preset grid. When it arrives within a grid tile of its target (`Math.abs(bot.x - bot.patrolX) < CONFIG.grid`) and `CONFIG.botSweepMs` (1450ms) has elapsed, it invokes `chooseBotSweepColumn()` to pick a new destination and resets its horizontal timer.

---

### 5. Detection Triggers and Proximity Sensors
The bot employs two concurrent, overlapping sensory systems to detect the player:
1. **Static Proximity Sensor**: Instantly triggers if the player's Euclidean distance falls within a fixed range:
  `distance < CONFIG.proximityRadius` (112px)
2. **Active Radar Scan**: A periodic expanding pulse ring.
  - Trigger Interval (`CONFIG.scanPeriodMs`): 2700ms (plays a soft radar scan synthesizer tone on trigger).
  - Expansion Phase (`CONFIG.scanDurationMs`): 680ms.
  - Maximum Sweep Radius (`CONFIG.scanMaxRadius`): 235px.
  - **Detection Logic**: Triggered if `scanRadius` crosses the player's distance within the current frame:
    `scanRadius >= distance && bot.previousScanRadius < distance`

---

### 6. Swept Collision vs. Static Intersection Mechanics
To prevent high-velocity tunneling errors, the collision system is evaluated every frame inside the main engine `update()` loop using continuous collision detection (CCD):
* **Combined Physical Radius**: `r = CONFIG.playerRadius + CONFIG.botRadius = 32 + 30 = 62px`.
* **Mechanical Steps**:
  - `sweptCollision` solves the quadratic formula $a t^2 + b t + c = 0$ for relative movement vectors over the current frame delta.
  - If they are already intersecting at start-of-frame, it returns $t = 0$.
  - If a collision occurs within the frame interval, it returns a fraction $t \in [0, 1]$.
  - The engine advances the simulation up to the exact impact frame fraction (`delta * t`), spawns a red explosion burst, plays the danger synth sweep, and halts the loop.

---

### 7. Pathfinding Algorithm (BFS Grid Snapping)
When transitioning to target coordinate sets, the bot plans moves using an explicit Breadth-First Search (BFS) pathfinder:
* **Coordinate Snapping**: The starting continuous coordinates `(bot.x, bot.y)` and targets `(targetX, targetY)` are snapped to the coordinate grid:
  `snap = (val) => Math.round(val / CONFIG.grid) * CONFIG.grid` (Grid unit = 16px).
* **Grid Traversal**: Explores immediate cardinal neighbors (4-way grid):
  `[cx + unit, cy]`, `[cx - unit, cy]`, `[cx, cy + unit]`, `[cx, cy - unit]`.
* **Path Reconstruction**: Maintains a `cameFrom` Map storing grid coordinate nodes. Once target grid cell is popped, it walks backward to build the waypoint array.

---

### 8. Pathfinding Grid Boundaries and Snap Parameters
To prevent performance degradation during searches, BFS limits its search territory to an extremely tight bounding box surrounding the start and target:
* **Grid Unit**: `CONFIG.grid = 16`
* **Left Boundary**: `Math.min(sx, tx) - unit * 5` (80px left of the horizontal span)
* **Right Boundary**: `Math.max(sx, tx) + unit * 5` (80px right of the horizontal span)
* **Top Boundary**: `Math.min(sy, ty) - unit * 4` (64px above the vertical span)
* **Bottom Boundary**: `Math.max(sy, ty) + unit * 4` (64px below the vertical span)

---

### 9. Patrol Mode Target Selection
The horizontal coordinate `bot.patrolX` is determined by `chooseBotSweepColumn()`. It maps `CONFIG.columns` fractions (`[0.18, 0.50, 0.82]`) to absolute pixel locations on the canvas. To prevent redundant selection, it filters out any columns within 40px of the current `bot.patrolX` and randomly selects one of the remaining columns.

---

### 10. Lock/Pursuit Mode Transition Triggers
Once a sensory trigger is tripped:
1. `echoes` registers a vector connecting the player and bot coordinates.
2. `bot.mode` is set to `'bursting'`.
3. `bot.burstUntil` locks the state for 300ms.
4. `bot.lockedTargetX` and `bot.lockedTargetY` capture the exact continuous coordinates of the player.
5. On expiration of `burstUntil` (300ms), `setBotTarget()` is called, setting `bot.mode = 'locked'` and calculating the BFS path towards the captured coordinates.

---

### 11. Repathing Frequency and Performance Overhead
* **Patrol Repath Period**: Every 620ms (`CONFIG.botRepathMs`), the bot triggers a new path calculation to keep up with the rising timer line.
* **Overhead Protection**: The pathfinder is bounded by a loop guard of 7,000 steps (`guard = 7000`). If BFS exceeds this limit or cannot reach the target, it exits gracefully, protecting the thread from CPU spikes or tab freezes.

---

### 12. Oscillation and Back-and-Forth Movement Mechanism (Root Cause Analysis)
The observed failure of the bot entering a high-frequency, local back-and-forth movement loop is caused by a structural conflict between grid snapping, obstacle buffers, and pathfinding failures:
1. **Target Occlusion**: When the player stands on a platform, their coordinate is near the platform surface. Platform bounding boxes are marked as blocked obstacles.
2. **BFS Failure**: When grid snapping snaps the target `(targetX, targetY)`, the resulting target cell falls inside or too close to the platform's blocked zone. BFS evaluates the cell as blocked and fails, returning `null`.
3. **Instant Reset**: In `'locked'` mode, if the pathfinding returns `null`, the bot's travel path is cleared. The engine evaluates `!bot.travel` as true, instantly exits `'locked'` mode, and resets to `'patrol'`.
4. **Immediate Re-Trigger**: Since the bot is still in close proximity to the player, on the very next frames the scan or proximity sensor triggers again. The bot snaps to `'bursting'` (jittering in place for 300ms), locked coordinates are captured, BFS fails again, and it resets.
5. **Visual Outcome**: This high-frequency cycle of `patrol -> bursting (jitter) -> locked -> fail -> patrol` repeats indefinitely, rendering a continuous local oscillation or wobbling state.

---

### 13. Grid-Locking and Snapping Edge Cases
* **Start cell blockage**: If the bot's continuous coordinates snap to a grid boundary cell that overlaps a platform buffer, the starting node `(sx, sy)` is marked blocked, causing pathfinding to immediately exit.
* **Target cell blockage**: Since the player is dynamic, their position when snapped can fall within horizontal collision coordinates of adjacent platforms, triggering instant failure.

---

### 14. Obstacle/Platform Collision Buffer Fields
The engine queries `obstacleRectsNear` to identify blocked cells:
* Platforms have a physical width of 104px and height of 62px.
* A collision buffer padding (`padding = 6`) is added to all sides.
* **Effective Blocked Footprint**: 116px width ($104 + 12$), 74px height ($62 + 12$).
* This wide buffer restricts available paths, leaving narrow visual corridors for grid-based pathfinding.

---

### 15. Local Minima and Local Oscillation Traps
The tight BFS search bounding box acts as a local minimum trap:
* The blocked span of a platform is 116px wide.
* The search boundary limits horizontal exploration to 80px left and right of the start-target span.
* If the bot is directly under a platform and the player is above it, the search box limits horizontal traversal to 80px on each side.
* If the path around the platform requires routing wider than 80px, BFS is blind to it and returns `null`, trapping the bot underneath the platform.

---

### 16. Dynamic Patrol-Line Update Mechanics
During search phases, `bot.patrolY` continuously tracks the rising timeline. This timeline moves upward at `CONFIG.timerBaseSpeed` (0.018px/ms) and accelerates via `CONFIG.timerRamp` (0.0000015px/ms^2). This dynamic shift changes grid snap coordinates continuously, preventing static coordinate locking during long patrol sweeps.

---

### 17. Physical Hitbox vs. Sensory Radii Constraints
The physical and sensory bounds are configured as follows:
* **Player Radius**: 32px (Hitbox diameter = 64px)
* **Bot Radius**: 30px (Hitbox diameter = 60px)
* **Proximity Radius**: 112px
* **Scan Max Radius**: 235px
* Sensory ranges are significantly larger than the physical radii, guaranteeing early detection.

---

### 18. Speed Differentials in Patrol and Locked States
* **Patrol Speed**: `CONFIG.botPatrolSpeed = 0.18` px/ms.
* **Pursuit/Lock Speed**: `CONFIG.botLockSpeed = 0.46` px/ms.
* Active pursuit is 2.55x faster than standard patrol, creating a high-velocity hazard once locked.

---

### 19. Sound Effect Triggers and Audio Feedback
The bot's behavioral states are mapped to three synthesizer feedback paths:
* **Search Scan**: `sound.scan()` plays on radar sweeps (every 2700ms).
* **Target Lock**: `sound.lock()` plays on transition to `bursting`.
* **Defeat Contact**: `sound.danger()` plays upon swept collision contact.

---

### 20. Telemetry and Debug Options
* **Visual Hitboxes**: Enabling `showCollisionHitboxes` draws high-contrast concentric rings around the player (green) and bot (magenta) representing physical radii.
* **Sweep Logging**: First touch telemetry and active row validation are logged to the console using `ENEMY_PLAYER_FIRST_TOUCH`.

---

### 21. Frame Rate and Delta Time Dependency Checks
All physics, timers, and movement interpolation are decoupled from frame rate via `delta` integration:
* `bot.travel.distance += speed * delta`
* `bot.scanTime += delta`
* `timerLineY -= timerSpeed * hurry * delta`
This ensures identical movement speeds and sensor clock behavior across 60Hz, 120Hz, and variable frame-rate devices.

---

### 22. Game Scale and View Settings Impact
When the view scale is adjusted via the "World framing" slider, `applyViewScale` is called. Coordinate transformations apply the scale ratio to reflow the coordinates of the bot and its pathway waypoints, keeping the simulation layout synchronized with the canvas viewport.

---

### 23. In-Game Menu and Pause Loop Stability
When the game is paused, `enginePaused` is set to `true`. This halts frame updates inside `frame()` and freezes the engine clock `elapsed`. This halts all bot updates, sensor clocks, trail generation, and path calculations in their exact active positions.

---

### 24. Game Restart and State Reset Safety
Upon invoking `restart()`, the bot dictionary is reinstantiated with fresh coordinates, patrol columns, and its repath timers reset to `-1e9`. This guarantees that no historical waypoints, paths, or active sensor states bleed across successive gameplay runs.

---

### 25. Defeat Trigger and Capture Resolution
Once continuous collision detection detects $t \in [0, 1]$, the engine triggers defeat:
1. Spawns 60 red explosion particles with a speed of 0.35px/ms.
2. Plays `sound.danger()`.
3. Shifts `engineAlive = false`.
4. Mounts the Game Over screen overlay showing final altitude and records.

---

### 26. Recommended Architectural Refactoring (Future Action Plan)
To permanently resolve the oscillation and stuck state in future builds, the following three-step architectural enhancement is recommended:
1. **Dynamic Bounding Box Expansion**: If `buildBotPath` fails on initial bounds, automatically double the search bounding box size (e.g., $160\text{px}$ horizontal span extension) to allow routing around wide platforms.
2. **Offset Target Snapping**: If the target grid cell is blocked, identify the nearest free grid neighbor cell and plan the path towards that free neighbor, preventing immediate failure.
3. **Pursuit Fallback Engine**: If grid pathfinding fails entirely, automatically fall back to direct continuous vector steering (pursuit) to ensure the bot continues to chase the player rather than remaining stationary.

---

### 27. Current Status
The behavior and architecture audit is fully complete. The codebase remains frozen, 100% stable, and ready for review.

---
**Report compiled by AI Studio Coding Agent.**
