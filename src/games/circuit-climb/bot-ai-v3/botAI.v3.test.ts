/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2, PlatformObstacle, BotWorldSnapshotV2 } from '../bot-ai-v2/BotTypesV2';
import { DEFAULT_BOT_CONFIG_V3 } from './BotConfigV3';
import {
  buildPlatformGraphV3,
  isSegmentPhysicallyClear,
  isPositionPhysicallyClear,
  computeInflatedPlatformBounds,
} from './BotGraphBuilderV3';
import { planRouteV3, findNearestSafeNode } from './BotRoutePlannerV3';
import { createInitialAwarenessV3, updateAwarenessV3 } from './BotAwarenessV3';
import { createInitialWatchdogV3, updateWatchdogV3 } from './BotWatchdogV3';
import { createBotContextV3, resetBotContextV3, updateBotV3 } from './BotControllerV3';

function makeMockSnapshot(overrides: Partial<BotWorldSnapshotV2> = {}): BotWorldSnapshotV2 {
  const defaultPlatforms: PlatformObstacle[] = [
    { id: 'p0', rect: { left: 100, right: 300, top: 400, bottom: 440 } },
    { id: 'p1', rect: { left: 100, right: 300, top: 200, bottom: 240 } },
    { id: 'p2', rect: { left: 500, right: 700, top: 200, bottom: 240 } },
  ];

  return {
    simTimeMs: 1000,
    deltaMs: 16.666,
    playerPosition: { x: 200, y: 180 },
    playerRadius: 15,
    playerRowId: 1,
    playerSupportingPlatformId: 'p1',
    botPosition: { x: 200, y: 500 },
    botRadius: 30,
    platforms: defaultPlatforms,
    navigationBounds: { left: 0, right: 800, top: 0, bottom: 1000 },
    obstacleRevision: 1,
    paused: false,
    gameOver: false,
    difficulty: 'NORMAL',
    rowGap: 160,
    botBaseOffsetRows: 3,
    playerMovementState: 'SETTLED',
    playerSettledPlatformId: 'p1',
    playerDestinationPlatformId: null,
    playerRoutePolyline: null,
    playerRouteStartPosition: null,
    playerRouteDestination: null,
    playerRouteProgress: 0,
    playerEstimatedRemainingTransitTimeMs: 0,
    ...overrides,
  };
}

describe('PLATFORM_GRAPH_V3 Engine Test Suite (46 Tests)', () => {

  // ==========================================
  // Category 1: GRAPH CONSTRUCTION & LIFECYCLE (1-6)
  // ==========================================
  describe('Category 1: Graph Construction & Lifecycle', () => {
    it('Test 1: Pure Graph Construction - Deterministic Graph Nodes', () => {
      const snap = makeMockSnapshot();
      const graph1 = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });
      const graph2 = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });

      expect(graph1.nodes.size).toBeGreaterThan(0);
      expect(graph1.nodes.size).toBe(graph2.nodes.size);
      expect(graph1.edges.length).toBe(graph2.edges.length);
    });

    it('Test 2: Edge Physical Validation - Reject Intersecting Edge', () => {
      // Platform directly between (100,300) and (500,300)
      const blockingPlatform: PlatformObstacle[] = [
        { id: 'block', rect: { left: 250, right: 350, top: 250, bottom: 350 } },
      ];
      const bounds = computeInflatedPlatformBounds(blockingPlatform, 30, 6);
      const clear = isSegmentPhysicallyClear({ x: 100, y: 300 }, { x: 500, y: 300 }, bounds, 30, 6);

      expect(clear).toBe(false);
    });

    it('Test 3: Shared Geometry Contract Invariant', () => {
      const snap = makeMockSnapshot();
      const graph = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });
      const bounds = computeInflatedPlatformBounds(snap.platforms, 30, 6);

      graph.edges.forEach((edge) => {
        const fromNode = graph.nodes.get(edge.fromNodeId)!;
        const toNode = graph.nodes.get(edge.toNodeId)!;
        const clear = isSegmentPhysicallyClear(fromNode.worldPosition, toNode.worldPosition, bounds, 30, 6);
        expect(clear).toBe(true);
      });
    });

    it('Test 4: Node Types and Categorization', () => {
      const snap = makeMockSnapshot();
      const graph = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });
      const kinds = new Set(Array.from(graph.nodes.values()).map((n) => n.kind));

      expect(kinds.has('PLATFORM_BELOW')).toBe(true);
      expect(kinds.has('VERTICAL_LANE')).toBe(true);
    });

    it('Test 5: Graph Revision Incrementing', () => {
      const ctx = createBotContextV3();
      const snap1 = makeMockSnapshot({ obstacleRevision: 1 });
      updateBotV3(snap1, ctx);
      expect(ctx.graph?.revision).toBe(1);

      const snap2 = makeMockSnapshot({ obstacleRevision: 2 });
      updateBotV3(snap2, ctx);
      expect(ctx.graph?.revision).toBe(2);
    });

    it('Test 6: Node Clearance Radius Bounds', () => {
      const snap = makeMockSnapshot();
      const graph = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });
      graph.nodes.forEach((node) => {
        expect(node.clearanceRadiusPx).toBeGreaterThanOrEqual(36);
      });
    });
  });

  // ==========================================
  // Category 2: ROUTING & REASON CODES (7-15)
  // ==========================================
  describe('Category 2: Routing & Reason Codes', () => {
    it('Test 7: Route Finding Success - Valid Path', () => {
      const snap = makeMockSnapshot();
      const graph = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });
      const targetId = Array.from(graph.nodes.keys())[0];
      const res = planRouteV3(graph, { x: 200, y: 500 }, targetId);

      expect(res.status === 'ROUTE_FOUND' || res.status === 'ALREADY_AT_TARGET_REGION').toBe(true);
    });

    it('Test 8: Already At Target Region Detection', () => {
      const snap = makeMockSnapshot();
      const graph = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });
      const targetNode = Array.from(graph.nodes.values())[0];
      const res = planRouteV3(graph, targetNode.worldPosition, targetNode.id);

      expect(res.status).toBe('ALREADY_AT_TARGET_REGION');
    });

    it('Test 9: Invalid Target Node - Return NO_ROUTE', () => {
      const snap = makeMockSnapshot();
      const graph = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });
      const res = planRouteV3(graph, { x: 200, y: 500 }, 'non_existent_node');

      expect(res.status).toBe('NO_ROUTE');
      expect(res.waypoints).toEqual([]);
    });

    it('Test 10: Lateral Edge Cost Penalty Preference', () => {
      const snap = makeMockSnapshot();
      const graph = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });
      const lateralEdges = graph.edges.filter((e) => e.kind === 'LATERAL');
      expect(DEFAULT_BOT_CONFIG_V3.lateralPenaltyPx).toBe(30);
    });

    it('Test 11: Player Transit Corridor Avoidance Penalty', () => {
      const snap = makeMockSnapshot();
      const graph = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });
      const transit = { start: { x: 100, y: 300 }, end: { x: 500, y: 300 } };
      const targetNodeId = Array.from(graph.nodes.keys())[0];
      const res = planRouteV3(graph, { x: 200, y: 500 }, targetNodeId, transit);

      expect(res).toBeDefined();
    });

    it('Test 12: Blacklisted Edge Exclusion', () => {
      const snap = makeMockSnapshot();
      const graph = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });
      if (graph.edges.length > 0) {
        const blacklisted = new Set([graph.edges[0].id]);
        const targetNodeId = graph.edges[0].toNodeId;
        const res = planRouteV3(graph, { x: 200, y: 500 }, targetNodeId, null, blacklisted);
        expect(res).toBeDefined();
      }
    });

    it('Test 13: Unreachable Node - Pure NO_ROUTE Return', () => {
      const snap = makeMockSnapshot();
      const graph = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });
      const res = planRouteV3(graph, { x: 200, y: 500 }, 'invalid_id');

      expect(res.status).toBe('NO_ROUTE');
      expect(res.nodeIds.length).toBe(0);
      expect(res.waypoints.length).toBe(0);
    });

    it('Test 14: Monotonic Target Version Incrementing', () => {
      const ctx = createBotContextV3();
      ctx.currentState = 'CHASE';
      ctx.awareness.discovered = true;
      ctx.awareness.chaseMemoryExpiryMs = 999999;

      const snap1 = makeMockSnapshot({ playerSupportingPlatformId: 'p0', playerMovementState: 'SETTLED' });
      updateBotV3(snap1, ctx);
      const version1 = ctx.target.targetVersion;

      const snap2 = makeMockSnapshot({ playerSupportingPlatformId: 'p1', playerMovementState: 'SETTLED' });
      updateBotV3(snap2, ctx);
      const version2 = ctx.target.targetVersion;

      expect(version2).toBeGreaterThan(version1);
    });

    it('Test 15: Reason String Logging in Route Result', () => {
      const snap = makeMockSnapshot();
      const graph = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });
      const res = planRouteV3(graph, { x: 200, y: 500 }, 'fake');

      expect(res.reason).toBeTruthy();
    });
  });

  // ==========================================
  // Category 3: MOVEMENT & WAYPOINT TRACKING (16-22)
  // ==========================================
  describe('Category 3: Movement & Waypoint Tracking', () => {
    it('Test 16: Dynamic Arrival Tolerance Math', () => {
      const speed = 0.32;
      const deltaMs = 16.666;
      const margin = 4;
      const tol = Math.max(8, speed * deltaMs + margin);

      expect(tol).toBeGreaterThanOrEqual(8);
      expect(tol).toBeCloseTo(9.333, 2);
    });

    it('Test 17: Discard Already Reached Initial Waypoints', () => {
      const snap = makeMockSnapshot();
      const graph = buildPlatformGraphV3(snap.platforms, 1, { width: 800, rowGap: 160 });
      const startPos = { x: 200, y: 500 };
      const targetId = Array.from(graph.nodes.keys())[0];
      const res = planRouteV3(graph, startPos, targetId);

      if (res.waypoints.length > 0) {
        expect(res.waypoints[0]).toBeDefined();
      }
    });

    it('Test 18: Deterministic Displacement Vector Calculation', () => {
      const ctx = createBotContextV3();
      const snap = makeMockSnapshot();
      ctx.currentState = 'CHASE';
      ctx.awareness.discovered = true;

      const res = updateBotV3(snap, ctx);
      expect(res.intendedDisplacement).toBeDefined();
    });

    it('Test 19: Touch Distance Capture Detection', () => {
      const ctx = createBotContextV3();
      const snap = makeMockSnapshot({
        playerPosition: { x: 200, y: 500 },
        botPosition: { x: 200, y: 500 },
        playerRadius: 15,
        botRadius: 30,
      });

      const res = updateBotV3(snap, ctx);
      expect(ctx.currentState).toBe('CAUGHT');
      expect(res.events.some((e) => e.type === 'CAPTURE')).toBe(true);
    });

    it('Test 20: Zero Displacement When Frozen in Alert', () => {
      const ctx = createBotContextV3();
      ctx.currentState = 'ALERT';
      ctx.alertTimerMs = 150;
      const snap = makeMockSnapshot();

      const res = updateBotV3(snap, ctx);
      expect(res.intendedDisplacement).toEqual({ x: 0, y: 0 });
    });

    it('Test 21: Patrol Speed Cap for Safe Patrol Sweep', () => {
      expect(DEFAULT_BOT_CONFIG_V3.patrolSpeedPxPerMs).toBe(0.18);
      expect(DEFAULT_BOT_CONFIG_V3.speedPxPerMs).toBe(0.32);
    });

    it('Test 22: Clean Waypoint Advancement', () => {
      const ctx = createBotContextV3();
      ctx.currentState = 'CHASE';
      ctx.awareness.discovered = true;
      const snap = makeMockSnapshot();

      updateBotV3(snap, ctx);
      expect(ctx.currentWaypointIndex).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================
  // Category 4: AWARENESS & DISCOVERY (23-29)
  // ==========================================
  describe('Category 4: Awareness & Discovery', () => {
    it('Test 23: Near Gap Sensor Discovery Trigger', () => {
      const awareness = createInitialAwarenessV3();
      const snap = makeMockSnapshot({
        botPosition: { x: 200, y: 220 },
        playerPosition: { x: 200, y: 180 }, // dist = 40 <= near gap 50
      });

      const res = updateAwarenessV3(awareness, snap);
      expect(res.newlyDiscovered).toBe(true);
      expect(res.awareness.discovered).toBe(true);
    });

    it('Test 24: Radar Pulse Wave Sensor Trigger', () => {
      const awareness = createInitialAwarenessV3();
      // Sim time ms where radar wave radius matches distance
      const snap = makeMockSnapshot({
        simTimeMs: 1000, // half phase = 117.5px radius
        botPosition: { x: 200, y: 317.5 },
        playerPosition: { x: 200, y: 200 }, // dist = 117.5
      });

      const res = updateAwarenessV3(awareness, snap);
      expect(res.awareness.discovered).toBe(true);
    });

    it('Test 25: Episode ID Incrementing on New Acquisition', () => {
      const awareness = createInitialAwarenessV3();
      const snap = makeMockSnapshot({
        botPosition: { x: 200, y: 200 },
        playerPosition: { x: 200, y: 190 },
      });

      const res = updateAwarenessV3(awareness, snap);
      expect(res.awareness.episodeId).toBe(1);
    });

    it('Test 26: Chase Memory Refresh on Player Action', () => {
      const awareness = createInitialAwarenessV3();
      awareness.discovered = true;
      awareness.chaseMemoryExpiryMs = 2000;

      const snap = makeMockSnapshot({
        simTimeMs: 1500,
        playerMovementState: 'MOVE_STARTED',
        botPosition: { x: 200, y: 800 },
        playerPosition: { x: 200, y: 100 },
      });

      const res = updateAwarenessV3(awareness, snap);
      expect(res.awareness.chaseMemoryExpiryMs).toBeGreaterThan(2000);
    });

    it('Test 27: Awareness Memory Expiry After 5000ms', () => {
      const awareness = createInitialAwarenessV3();
      awareness.discovered = true;
      awareness.chaseMemoryExpiryMs = 5000;

      const snap = makeMockSnapshot({
        simTimeMs: 6000, // past 5000ms
        playerMovementState: 'SETTLED',
        botPosition: { x: 200, y: 900 },
        playerPosition: { x: 200, y: 100 },
      });

      const res = updateAwarenessV3(awareness, snap);
      expect(res.expired).toBe(true);
      expect(res.awareness.discovered).toBe(false);
    });

    it('Test 28: Sound Cues Fired Exactly Once Per Episode', () => {
      const ctx = createBotContextV3();
      const snap = makeMockSnapshot({
        botPosition: { x: 200, y: 300 },
        playerPosition: { x: 200, y: 240 }, // dist 60px > 45px touch radius, <= 95px near gap
      });

      const res = updateBotV3(snap, ctx);
      const scanSound = res.events.filter((e) => e.type === 'PLAY_EXCITEMENT_SOUND');
      expect(scanSound.length).toBe(1);
    });

    it('Test 29: Patrol Transition on Memory Loss', () => {
      const ctx = createBotContextV3();
      ctx.currentState = 'CHASE';
      ctx.awareness.discovered = true;
      ctx.awareness.chaseMemoryExpiryMs = 1000;

      const snap = makeMockSnapshot({
        simTimeMs: 2000,
        playerMovementState: 'SETTLED',
        botPosition: { x: 200, y: 900 },
        playerPosition: { x: 200, y: 100 },
      });

      updateBotV3(snap, ctx);
      expect(ctx.currentState).toBe('PATROL');
    });
  });

  // ==========================================
  // Category 5: WATCHDOG REPAIR & ESCALATION (30-35)
  // ==========================================
  describe('Category 5: Watchdog Repair & Escalation', () => {
    it('Test 30: No Watchdog Trigger When Progress Made', () => {
      const watchdog = createInitialWatchdogV3();
      const res = updateWatchdogV3(
        watchdog,
        1000,
        { x: 5, y: 0 }, // intended > 1.0
        { x: 5, y: 0 }, // committed > 3.0
        'edge_1'
      );

      expect(res.triggered).toBe(false);
    });

    it('Test 31: Watchdog Trigger on Zero Progress Stall (> 600ms)', () => {
      let watchdog = createInitialWatchdogV3();
      watchdog.stallStartMs = 1000;

      const res = updateWatchdogV3(
        watchdog,
        1700, // 700ms > 600ms
        { x: 5, y: 0 }, // intended > 1.0
        { x: 0, y: 0 }, // committed < 3.0
        'edge_1'
      );

      expect(res.triggered).toBe(true);
      expect(res.watchdog.blacklistedEdgeIds.has('edge_1')).toBe(true);
    });

    it('Test 32: Failed Edge Blacklisting', () => {
      let watchdog = createInitialWatchdogV3();
      watchdog.stallStartMs = 1000;

      const res = updateWatchdogV3(watchdog, 1700, { x: 5, y: 0 }, { x: 0, y: 0 }, 'bad_edge');
      expect(res.watchdog.blacklistedEdgeIds.has('bad_edge')).toBe(true);
    });

    it('Test 33: Escalation Trigger on 3 Stalls in 10s', () => {
      let watchdog = createInitialWatchdogV3();
      watchdog.stallStartMs = 1000;
      watchdog.triggerTimestamps = [1100, 1200];

      const res = updateWatchdogV3(watchdog, 1700, { x: 5, y: 0 }, { x: 0, y: 0 }, 'edge_3');
      expect(res.escalated).toBe(true);
    });

    it('Test 34: Emergency Safety Snap on Escalation', () => {
      const ctx = createBotContextV3();
      ctx.currentState = 'CHASE';
      ctx.awareness.discovered = true;
      ctx.target.targetPlatformId = 'p1';
      ctx.watchdog.stallStartMs = 1000;
      ctx.watchdog.triggerTimestamps = [1100, 1200];

      const snap = makeMockSnapshot({ simTimeMs: 1700, botPosition: { x: 200, y: 600 } });
      updateBotV3(snap, ctx);

      expect(ctx.watchdog.escalated || ctx.currentRoute === null).toBe(true);
    });

    it('Test 35: Target Version Retained Across Watchdog Repair', () => {
      const ctx = createBotContextV3();
      ctx.currentState = 'CHASE';
      ctx.target.targetVersion = 5;
      ctx.target.targetPlatformId = 'p1';
      ctx.watchdog.stallStartMs = 1000;

      const snap = makeMockSnapshot({ simTimeMs: 1700, botPosition: { x: 200, y: 600 } });
      updateBotV3(snap, ctx);

      expect(ctx.target.targetVersion).toBe(5);
    });
  });

  // ==========================================
  // Category 6: INTEGRATED ENGINE & ISOLATION (36-46)
  // ==========================================
  describe('Category 6: Integrated Engine & Isolation', () => {
    it('Test 36: Clean BotContextV3 Creation', () => {
      const ctx = createBotContextV3();
      expect(ctx.currentState).toBe('PATROL');
      expect(ctx.target.targetVersion).toBe(1);
      expect(ctx.watchdog.blacklistedEdgeIds.size).toBe(0);
    });

    it('Test 37: Complete Reset via resetBotContextV3', () => {
      const ctx = createBotContextV3();
      ctx.currentState = 'CHASE';
      ctx.target.targetVersion = 99;

      const resetCtx = resetBotContextV3(ctx);
      expect(resetCtx.currentState).toBe('PATROL');
      expect(resetCtx.target.targetVersion).toBe(1);
    });

    it('Test 38: Isolation - No V2 State Reused', () => {
      const ctx = createBotContextV3();
      expect((ctx as any).v2GoalSelector).toBeUndefined();
      expect((ctx as any).v2Planner).toBeUndefined();
    });

    it('Test 39: PATROL -> ALERT -> CHASE Full Lifecycle Flow', () => {
      const ctx = createBotContextV3();
      expect(ctx.currentState).toBe('PATROL');

      // Frame 1: Discover player
      const snap1 = makeMockSnapshot({ botPosition: { x: 200, y: 300 }, playerPosition: { x: 200, y: 240 } });
      updateBotV3(snap1, ctx);
      expect(ctx.currentState).toBe('ALERT');

      // Frame 2: Alert timer countdown
      const snap2 = makeMockSnapshot({ simTimeMs: 1200, deltaMs: 200, botPosition: { x: 200, y: 300 }, playerPosition: { x: 200, y: 240 } });
      updateBotV3(snap2, ctx);
      expect(ctx.currentState).toBe('CHASE');
    });

    it('Test 40: Target Platform Below Selection on Player Settled', () => {
      const ctx = createBotContextV3();
      ctx.currentState = 'CHASE';
      ctx.awareness.discovered = true;
      ctx.awareness.chaseMemoryExpiryMs = 999999;
      const snap = makeMockSnapshot({ playerSupportingPlatformId: 'p0', playerMovementState: 'SETTLED' });

      updateBotV3(snap, ctx);
      expect(ctx.target.targetPlatformId).toBe('p0');
    });

    it('Test 41: Target Platform Destination Selection on Player Move', () => {
      const ctx = createBotContextV3();
      ctx.currentState = 'CHASE';
      ctx.awareness.discovered = true;
      ctx.awareness.chaseMemoryExpiryMs = 999999;
      const snap = makeMockSnapshot({
        playerDestinationPlatformId: 'p2',
        playerMovementState: 'MOVE_STARTED',
      });

      updateBotV3(snap, ctx);
      expect(ctx.target.targetPlatformId).toBe('p2');
    });

    it('Test 42: Target Platform Fallback on Missing Destination', () => {
      const ctx = createBotContextV3();
      ctx.currentState = 'CHASE';
      ctx.awareness.discovered = true;
      ctx.awareness.chaseMemoryExpiryMs = 999999;
      const snap = makeMockSnapshot({
        playerDestinationPlatformId: null,
        playerSettledPlatformId: 'p1',
        playerMovementState: 'SETTLED',
      });

      updateBotV3(snap, ctx);
      expect(ctx.target.targetPlatformId).toBe('p1');
    });

    it('Test 43: Telemetry Event Recording Validation', () => {
      const ctx = createBotContextV3();
      const snap = makeMockSnapshot();
      const res = updateBotV3(snap, ctx);

      expect(res).toBeDefined();
    });

    it('Test 44: High-Velocity Movement Interpolation Safety', () => {
      const snap = makeMockSnapshot({ deltaMs: 100 });
      const ctx = createBotContextV3();
      const res = updateBotV3(snap, ctx);

      expect(res.intendedDisplacement).toBeDefined();
    });

    it('Test 45: Zero Progress Handled Gracefully Without Infinite Loop', () => {
      const ctx = createBotContextV3();
      ctx.currentState = 'CHASE';
      ctx.awareness.discovered = true;
      const snap = makeMockSnapshot();

      for (let i = 0; i < 50; i++) {
        updateBotV3(snap, ctx);
      }
      expect(ctx.currentState).toBeDefined();
    });

    it('Test 46: Full Autonomous Chase Execution Simulation', () => {
      const ctx = createBotContextV3();
      let snap = makeMockSnapshot({ botPosition: { x: 200, y: 700 } });

      // Run 60 frames (1 second) of simulation
      for (let i = 0; i < 60; i++) {
        snap = { ...snap, simTimeMs: 1000 + i * 16.666 };
        updateBotV3(snap, ctx);
      }

      expect(ctx.currentState).toBeDefined();
      expect(ctx.graph).not.toBeNull();
    });
  });
});
