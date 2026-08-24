/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vec2, BotWorldSnapshotV2 } from '../bot-ai-v2/BotTypesV2';
import {
  BotContextV3,
  BotV3UpdateResult,
  BotStateV3,
  BotRouteResultV3,
} from './BotTypesV3';
import { DEFAULT_BOT_CONFIG_V3, BotConfigV3 } from './BotConfigV3';
import { buildPlatformGraphV3 } from './BotGraphBuilderV3';
import { planRouteV3, findNearestSafeNode } from './BotRoutePlannerV3';
import { createInitialAwarenessV3, updateAwarenessV3 } from './BotAwarenessV3';
import { createInitialWatchdogV3, updateWatchdogV3 } from './BotWatchdogV3';
import { recordV3Telemetry } from './BotTelemetryV3';

let nextV3ContextInstanceId = 1;

export function createBotContextV3(initialBotPosition?: Vec2): BotContextV3 {
  const instanceId = nextV3ContextInstanceId++;
  const context: BotContextV3 = {
    instanceId,
    currentState: 'PATROL',
    stateTimeMs: 0,
    awareness: createInitialAwarenessV3(),
    target: {
      targetVersion: 1,
      targetNodeId: null,
      targetPlatformId: null,
      playerSupportingPlatformId: null,
      playerDestinationPlatformId: null,
    },
    graph: null,
    currentRoute: null,
    currentWaypointIndex: 0,
    watchdog: createInitialWatchdogV3(),
    botPosition: initialBotPosition ? { ...initialBotPosition } : { x: 200, y: 400 },
    intendedDisplacement: { x: 0, y: 0 },
    events: [],
    alertTimerMs: 0,
    patrolTargetNodeId: null,
    patrolSweepTimerMs: 0,
    patrolWaypoints: [],
    patrolWaypointIndex: 0,
  };

  recordV3Telemetry('V3_CONTEXT_CREATED', 'Clean V3 context created', 'RUNTIME');
  return context;
}

export function resetBotContextV3(context: BotContextV3): BotContextV3 {
  const newCtx = createBotContextV3(context.botPosition);
  recordV3Telemetry('V3_CONTEXT_RESET', 'V3 context reset executed', 'RUNTIME');
  return newCtx;
}

export function updateBotV3(
  snapshot: BotWorldSnapshotV2 & { lastCommittedDisplacement?: Vec2 },
  context: BotContextV3,
  config: BotConfigV3 = DEFAULT_BOT_CONFIG_V3
): BotV3UpdateResult {
  const events: Array<{ type: string; payload?: any }> = [];
  context.botPosition = { ...snapshot.botPosition };
  context.stateTimeMs = (context.stateTimeMs || 0) + snapshot.deltaMs;

  // 1. Maintain Dynamic Graph Lifecycle
  if (!context.graph || context.graph.revision !== snapshot.obstacleRevision) {
    const prevRevision = context.graph?.revision ?? -1;
    context.graph = buildPlatformGraphV3(snapshot.platforms, snapshot.obstacleRevision, {
      width: snapshot.navigationBounds.right - snapshot.navigationBounds.left,
      rowGap: snapshot.rowGap,
      botRadius: snapshot.botRadius,
      safetyMargin: config.navSafetyMargin,
    });
    context.currentRoute = null; // Invalidate route on graph rebuild
    context.patrolTargetNodeId = null;
    context.patrolWaypoints = [];

    recordV3Telemetry(
      'V3_GRAPH_REVISION_CHANGED',
      `Graph revision updated from ${prevRevision} to ${snapshot.obstacleRevision}`,
      'BOT_PLANNER',
      { newRevision: snapshot.obstacleRevision }
    );
  }

  // 2. Physical Touch Capture Check
  const touchDist = Math.hypot(
    snapshot.playerPosition.x - snapshot.botPosition.x,
    snapshot.playerPosition.y - snapshot.botPosition.y
  );
  if (touchDist <= snapshot.playerRadius + snapshot.botRadius) {
    if (context.currentState !== 'CAUGHT') {
      context.currentState = 'CAUGHT';
      context.stateTimeMs = 0;
      events.push({ type: 'CAPTURE' });
      recordV3Telemetry('V3_CAPTURED', `Touch capture triggered at distance ${touchDist.toFixed(1)}px`, 'COLLISION');
      recordV3Telemetry('V3_STATE_CHANGED', 'State changed to CAUGHT', 'BOT_STATE', { state: 'CAUGHT' });
    }
    return {
      intendedDisplacement: { x: 0, y: 0 },
      events,
      context,
    };
  }

  // 3. Update Awareness
  const awarenessRes = updateAwarenessV3(context.awareness, snapshot, config);
  context.awareness = awarenessRes.awareness;

  // 4. Evaluate State Machine & Target
  let intendedDisplacement: Vec2 = { x: 0, y: 0 };

  switch (context.currentState) {
    case 'PATROL': {
      if (awarenessRes.newlyDiscovered) {
        context.currentState = 'ALERT';
        context.stateTimeMs = 0;
        context.alertTimerMs = config.alertDurationMs;
        events.push({ type: 'PLAY_EXCITEMENT_SOUND' });
        events.push({ type: 'SHOW_ALERT_REACTION' });
        recordV3Telemetry('V3_STATE_CHANGED', 'State changed PATROL -> ALERT', 'BOT_STATE', { state: 'ALERT' });
      } else {
        // Purposeful Upward-Biased Patrol Routing
        if (!context.patrolTargetNodeId || context.patrolWaypoints.length === 0) {
          const allValidNodes = Array.from(context.graph.nodes.values()).filter(
            (n) => n.valid && (n.kind === 'VERTICAL_LANE' || n.kind === 'ROW_GAP' || n.kind === 'PLATFORM_BELOW' || n.kind === 'PLATFORM_SIDE')
          );

          if (allValidNodes.length > 0) {
            // Sort nodes by distance and prefer upward search direction (smaller Y in world space)
            const currentY = snapshot.botPosition.y;
            const targetY = currentY - snapshot.rowGap;

            const candidates = [...allValidNodes].sort((a, b) => {
              const scoreA = Math.abs(a.worldPosition.y - targetY) + (a.worldPosition.y > currentY ? 300 : 0);
              const scoreB = Math.abs(b.worldPosition.y - targetY) + (b.worldPosition.y > currentY ? 300 : 0);
              return scoreA - scoreB;
            });

            let routeFound = false;
            for (const targetNode of candidates.slice(0, 10)) {
              recordV3Telemetry('V3_PATROL_TARGET_SELECTED', `Selected patrol target node ${targetNode.id}`, 'BOT_PLANNER', {
                nodeId: targetNode.id,
                nodeY: targetNode.worldPosition.y,
                botY: snapshot.botPosition.y,
              });

              recordV3Telemetry('V3_PATROL_ROUTE_REQUESTED', `Requesting patrol route to ${targetNode.id}`, 'BOT_PLANNER', {
                targetNodeId: targetNode.id,
              });

              const route = planRouteV3(
                context.graph,
                snapshot.botPosition,
                targetNode.id,
                null,
                context.watchdog.blacklistedEdgeIds,
                config,
                [...snapshot.platforms]
              );

              if (route.status === 'ROUTE_FOUND' && route.waypoints.length > 0) {
                context.patrolTargetNodeId = targetNode.id;
                context.patrolWaypoints = route.waypoints;
                context.patrolWaypointIndex = 0;
                context.currentRoute = route;
                routeFound = true;

                recordV3Telemetry('V3_PATROL_ROUTE_FOUND', `Patrol route found with ${route.waypoints.length} waypoints`, 'BOT_PLANNER', {
                  targetNodeId: targetNode.id,
                  waypointCount: route.waypoints.length,
                });
                break;
              } else {
                recordV3Telemetry('V3_PATROL_ROUTE_FAILED', `Patrol route failed to node ${targetNode.id}: ${route.reason}`, 'BOT_PLANNER', {
                  targetNodeId: targetNode.id,
                  reason: route.reason,
                });
              }
            }

            if (!routeFound) {
              const nearestNode = findNearestSafeNode(context.graph, snapshot.botPosition, [...snapshot.platforms]);
              if (nearestNode) {
                context.patrolWaypoints = [nearestNode.worldPosition];
                context.patrolWaypointIndex = 0;
                context.patrolTargetNodeId = nearestNode.id;
              }
            }
          }
        }

        if (context.patrolWaypoints.length > 0) {
          const wp = context.patrolWaypoints[context.patrolWaypointIndex];
          const dx = wp.x - snapshot.botPosition.x;
          const dy = wp.y - snapshot.botPosition.y;
          const dist = Math.hypot(dx, dy);
          const tol = Math.max(config.minArrivalTolerancePx, config.patrolSpeedPxPerMs * snapshot.deltaMs + config.arrivalMarginPx);

          if (dist <= tol) {
            recordV3Telemetry('V3_PATROL_WAYPOINT_SELECTED', `Patrol reached waypoint ${context.patrolWaypointIndex}`, 'BOT_MOVEMENT', {
              waypointIndex: context.patrolWaypointIndex,
            });
            context.patrolWaypointIndex++;
            if (context.patrolWaypointIndex >= context.patrolWaypoints.length) {
              context.patrolTargetNodeId = null;
              context.patrolWaypoints = [];
              context.currentRoute = null;
            }
          } else {
            const moveStep = Math.min(dist, config.patrolSpeedPxPerMs * snapshot.deltaMs);
            intendedDisplacement = {
              x: (dx / dist) * moveStep,
              y: (dy / dist) * moveStep,
            };

            if (snapshot.simTimeMs % 500 < 20) {
              recordV3Telemetry('V3_PATROL_MOVEMENT_SAMPLE', `Patrol moving dx:${intendedDisplacement.x.toFixed(2)} dy:${intendedDisplacement.y.toFixed(2)}`, 'BOT_MOVEMENT', {
                botX: snapshot.botPosition.x,
                botY: snapshot.botPosition.y,
                dx: intendedDisplacement.x,
                dy: intendedDisplacement.y,
              });
            }
          }
        }
      }
      break;
    }

    case 'ALERT': {
      context.alertTimerMs -= snapshot.deltaMs;
      intendedDisplacement = { x: 0, y: 0 };

      if (context.alertTimerMs <= 0) {
        context.currentState = 'CHASE';
        context.stateTimeMs = 0;
        recordV3Telemetry('V3_STATE_CHANGED', 'State changed ALERT -> CHASE', 'BOT_STATE', { state: 'CHASE' });
      }
      break;
    }

    case 'CHASE': {
      if (awarenessRes.expired) {
        context.currentState = 'PATROL';
        context.stateTimeMs = 0;
        context.currentRoute = null;
        context.patrolTargetNodeId = null;
        context.patrolWaypoints = [];
        recordV3Telemetry('V3_STATE_CHANGED', 'State changed CHASE -> PATROL due to awareness expiry', 'BOT_STATE', { state: 'PATROL' });
        break;
      }

      // Determine Target Platform ID
      let desiredPlatformId: string | null = null;
      if (snapshot.playerMovementState === 'MOVE_STARTED' || snapshot.playerMovementState === 'IN_TRANSIT') {
        desiredPlatformId = snapshot.playerDestinationPlatformId ? String(snapshot.playerDestinationPlatformId) : null;
      } else if (snapshot.playerMovementState === 'WRONG_RETURN') {
        desiredPlatformId = snapshot.playerSettledPlatformId ? String(snapshot.playerSettledPlatformId) : null;
      } else {
        desiredPlatformId = snapshot.playerSupportingPlatformId ? String(snapshot.playerSupportingPlatformId) : null;
      }

      if (!desiredPlatformId && snapshot.playerSettledPlatformId) {
        desiredPlatformId = String(snapshot.playerSettledPlatformId);
      }

      if (desiredPlatformId && desiredPlatformId !== context.target.targetPlatformId) {
        context.target.targetPlatformId = desiredPlatformId;
        context.target.targetVersion += 1;

        let targetNodeId: string | null = null;
        context.graph.nodes.forEach((n) => {
          if (n.kind === 'PLATFORM_BELOW' && n.platformId === desiredPlatformId && n.valid) {
            targetNodeId = n.id;
          }
        });

        if (!targetNodeId) {
          const nearest = findNearestSafeNode(context.graph, snapshot.playerPosition, [...snapshot.platforms]);
          if (nearest) targetNodeId = nearest.id;
        }

        context.target.targetNodeId = targetNodeId;
        context.currentRoute = null;

        recordV3Telemetry('V3_TARGET_CHANGED', `Target platform updated to ${desiredPlatformId}, targetVersion: ${context.target.targetVersion}`, 'BOT_TARGET', {
          targetPlatformId: desiredPlatformId,
          targetVersion: context.target.targetVersion,
          targetNodeId,
        });
      }

      if (!context.currentRoute && context.target.targetNodeId) {
        const playerTransitSegment = snapshot.playerRouteStartPosition && snapshot.playerRouteDestination
          ? { start: snapshot.playerRouteStartPosition, end: snapshot.playerRouteDestination }
          : null;

        context.currentRoute = planRouteV3(
          context.graph,
          snapshot.botPosition,
          context.target.targetNodeId,
          playerTransitSegment,
          context.watchdog.blacklistedEdgeIds,
          config,
          [...snapshot.platforms]
        );
        context.currentWaypointIndex = 0;
      }

      if (context.currentRoute && context.currentRoute.status === 'ROUTE_FOUND' && context.currentRoute.waypoints.length > 0) {
        if (context.currentWaypointIndex < context.currentRoute.waypoints.length) {
          const activeWp = context.currentRoute.waypoints[context.currentWaypointIndex];
          const dx = activeWp.x - snapshot.botPosition.x;
          const dy = activeWp.y - snapshot.botPosition.y;
          const dist = Math.hypot(dx, dy);

          const arrivalTol = Math.max(
            config.minArrivalTolerancePx,
            config.speedPxPerMs * snapshot.deltaMs + config.arrivalMarginPx
          );

          if (dist <= arrivalTol) {
            recordV3Telemetry('V3_WAYPOINT_REACHED', `Reached waypoint index ${context.currentWaypointIndex}`, 'BOT_MOVEMENT', {
              waypointIndex: context.currentWaypointIndex,
            });
            context.currentWaypointIndex++;
          } else {
            const step = Math.min(dist, config.speedPxPerMs * snapshot.deltaMs);
            intendedDisplacement = {
              x: (dx / dist) * step,
              y: (dy / dist) * step,
            };
          }
        }
      }
      break;
    }

    case 'CAUGHT': {
      intendedDisplacement = { x: 0, y: 0 };
      break;
    }
  }

  // 5. Watchdog Progress Evaluation across active states
  if (context.currentState === 'PATROL' || context.currentState === 'CHASE') {
    const committedDisplacement = snapshot.lastCommittedDisplacement || intendedDisplacement;
    const currentEdgeId = context.currentRoute?.nodeIds[context.currentWaypointIndex]
      ? `edge_${context.currentRoute.nodeIds[Math.max(0, context.currentWaypointIndex - 1)]}_${context.currentRoute.nodeIds[context.currentWaypointIndex]}`
      : null;

    const watchdogRes = updateWatchdogV3(
      context.watchdog,
      snapshot.simTimeMs,
      intendedDisplacement,
      committedDisplacement,
      currentEdgeId,
      config,
      context.currentState,
      context.currentRoute?.status ?? null
    );
    context.watchdog = watchdogRes.watchdog;

    if (watchdogRes.escalated) {
      const nearestNode = findNearestSafeNode(context.graph, snapshot.botPosition, [...snapshot.platforms]);
      if (nearestNode) {
        context.botPosition = { ...nearestNode.worldPosition };
      }
      context.currentRoute = null;
      context.patrolTargetNodeId = null;
      context.patrolWaypoints = [];
    } else if (watchdogRes.triggered) {
      context.currentRoute = null;
      context.patrolTargetNodeId = null;
      context.patrolWaypoints = [];
    }
  }

  context.intendedDisplacement = intendedDisplacement;
  context.events = events;

  return {
    intendedDisplacement,
    events,
    context,
  };
}
