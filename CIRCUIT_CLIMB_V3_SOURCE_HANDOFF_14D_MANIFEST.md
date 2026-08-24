# CIRCUIT CLIMB V3 SOURCE HANDOFF MANIFEST (14D)

## 1. EXPORTED FILES MANIFEST

| Repository-Relative Path | Byte Size | Line Count | Purpose / Category | Why Included |
| :--- | :--- | :--- | :--- | :--- |
| `src/games/circuit-climb/bot-ai-v3/BotTypesV3.ts` | 2,647 | 111 | Core V3 Types | Defines interfaces, graph data structures, snapshots, and route state for V3. |
| `src/games/circuit-climb/bot-ai-v3/BotConfigV3.ts` | 1,319 | 50 | V3 Configuration | Holds constants and parameters for V3 graph generation, speeds, and bounds. |
| `src/games/circuit-climb/bot-ai-v3/BotTelemetryV3.ts` | 994 | 35 | V3 Telemetry Loggers | Sub-logger pipeline dedicated to V3 execution events and debugging. |
| `src/games/circuit-climb/bot-ai-v3/BotGraphBuilderV3.ts` | 11,750 | 390 | V3 Graph Builder | Generates graph nodes, vertical ladders/lanes, and edge connectivity checks. |
| `src/games/circuit-climb/bot-ai-v3/BotRoutePlannerV3.ts` | 7,421 | 250 | V3 A* Planner | Computes optimal waypoint paths across graph nodes excluding blacklisted edges. |
| `src/games/circuit-climb/bot-ai-v3/BotAwarenessV3.ts` | 3,361 | 99 | V3 Target Selection | Evaluates player movement state, destination, and target node selection logic. |
| `src/games/circuit-climb/bot-ai-v3/BotWatchdogV3.ts` | 3,961 | 114 | V3 Progress Watchdog | Detects bot stalls, path progress failures, and issues edge blacklisting. |
| `src/games/circuit-climb/bot-ai-v3/BotControllerV3.ts` | 15,296 | 392 | V3 Controller Entrypoint | Main `updateBotV3` lifecycle function executing sensing, planning, and movement. |
| `src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts` | 117,667 | 3,305 | Production Runtime Owner | Manages game loop, physics engine, row generation, collision functions, and bot tick. |
| `src/games/circuit-climb/CircuitClimbSurface.tsx` | 23,571 | 576 | UI & Engine Dispatcher | UI component providing engine dropdown, canvas rendering, and state dispatch. |
| `src/games/circuit-climb/components/CircuitClimbV3DiagnosticPanel.tsx` | 15,566 | 385 | V3 Live Diagnostics | Live overlay rendering real-time V3 telemetry, state, platform IDs, and path info. |
| `src/games/circuit-climb/bot-ai-v2/CircuitClimbUnifiedRecorder.ts` | 18,985 | 585 | Flight Recorder | Unified flight recorder logging V3 and V2 diagnostic snapshots to console/memory. |
| `src/games/circuit-climb/bot-ai-v3/botAI.v3.test.ts` | 22,134 | 601 | V3 Unit Test Suite | Comprehensive unit tests for graph builder, A* planner, watchdog, and controller. |
| `src/games/circuit-climb/model/circuitClimbTypes.ts` | 2,130 | 74 | Platform Data Model | Defines core runtime interfaces: `Platform`, `Row`, `Player`, `TravelState`. |
| `src/games/circuit-climb/runtime/botAI.ts` | 35,271 | 1,048 | Legacy Bot/Collision Logic | Contains physical collision checking helper functions (`checkCollision`, etc.). |

---

## 2. PRODUCTION PLATFORM IDENTITY

- **Exact Platform ID Type**: `string` (defined as `id: string` in `model/circuitClimbTypes.ts` and `id?: string` on platforms).
- **Exact Code Creating Live Platform IDs**:
  In `useCircuitClimbPrototypeRuntime.ts` (line 1845):
  ```ts
  id: p.id || (r.y + '-' + p.x)
  ```
  Additionally, when constructing `playerSupportingPlatformId` and `playerDestinationPlatformId` (lines 1878, 1986, 3128):
  ```ts
  player.platform.id || `${player.platform.row}-${player.platform.column}`
  ```
  Because individual platform objects generated in `generateInitialRows` do not set a explicit `.id` property on creation, runtime platform IDs default to formatted strings representing row/column or vertical coordinate offset (e.g., `4-1` or `1280-180`).
- **Exact `playerSupportingPlatformId` Type**: `string | null`
- **Exact `playerDestinationPlatformId` Type**: `string | null`
- **Graph Node `platformId` Type**: `string | undefined`
- **Synthetic vs. Production IDs**:
  - `p0`, `p1`, `p2`, `node_below_p0` occur **ONLY in tests** (`src/games/circuit-climb/bot-ai-v3/botAI.v3.test.ts`) where mock platforms and snapshots are constructed with simplified test IDs.
  - Production platform IDs generated during live gameplay are dynamic strings derived from row/column or row.y/platform.x (e.g., `4-1`).

---

## 3. CURRENT LIVE V3 CALL CHAIN

Below is the exact execution sequence per game frame in live runtime:

1. **Game Frame**: RequestAnimationFrame loop in `useCircuitClimbPrototypeRuntime.ts` invokes `updateGame()`.
2. **V3 Selector**: `updateGame()` checks `CONFIG.aiImplementation === 'PLATFORM_GRAPH_V3'`. Sets `actualControllerCalled = 'updateBotV3'`.
3. **Snapshot Construction**: Constructs `snapshot` from live state (`rows`, `player`, `bot`, `travel`, `cameraY`, `width`, `height`). Extracts platforms into `snapshot.platforms` with `id: p.id || (r.y + '-' + p.x)`.
4. **updateBotV3**: Calls `updateBotV3(snapshot, botContextV3)` in `BotControllerV3.ts`.
5. **Graph Builder**: `buildGraphV3(snapshot, ctx)` in `BotGraphBuilderV3.ts` scans `snapshot.platforms`, creates platform top nodes, vertical lanes, and row gap nodes, checking edge collisions via `isEdgeBlockedByCollision`.
6. **Target Lookup**: `selectPatrolTargetV3` / `updateAwarenessV3` in `BotAwarenessV3.ts` maps `playerSupportingPlatformId` or `playerDestinationPlatformId` to target graph nodes.
7. **Route Planner**: `planRouteV3` in `BotRoutePlannerV3.ts` executes A* search across `graph.nodes` and `graph.edges`, filtering out blacklisted edges from `ctx.blacklistedEdges`.
8. **Waypoint Follower**: `followRouteV3` in `BotControllerV3.ts` advances current waypoint index and calculates intended movement displacement vector `(dx, dy)`.
9. **Collision Resolver**: Applies movement clamping and collision checks via `applyBotMovementWithCollision` in `useCircuitClimbPrototypeRuntime.ts` / `botAI.ts`.
10. **Committed Bot Position**: Updated `bot.x` and `bot.y` coordinates are saved back to runtime state.

---

## 4. VALIDATION & CONFIRMATION

- Workspace Status: Verified clean. No production source files were modified during this handoff packaging turn.
- ZIP File: `CIRCUIT_CLIMB_V3_SOURCE_HANDOFF_14D.zip` created containing all 15 source files.
- ZIP Size: **71,617 bytes**.
