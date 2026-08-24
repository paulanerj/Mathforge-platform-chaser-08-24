/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vec2 } from '../bot-ai-v2/BotTypesV2';
import {
  BotGraphV3,
  BotGraphNodeV3,
  BotGraphEdgeV3,
  BotRouteResultV3,
} from './BotTypesV3';
import { DEFAULT_BOT_CONFIG_V3, BotConfigV3 } from './BotConfigV3';
import { isSegmentPhysicallyClear, computeInflatedPlatformBounds } from './BotGraphBuilderV3';
import { recordV3Telemetry } from './BotTelemetryV3';

/**
 * Checks if two line segments intersect.
 */
function lineSegmentsIntersect(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): boolean {
  const ccw = (p1: Vec2, p2: Vec2, p3: Vec2) => {
    return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
  };
  return (
    ccw(a1, b1, b2) !== ccw(a2, b1, b2) && ccw(a1, a2, b1) !== ccw(a1, a2, b2)
  );
}

export function findNearestSafeNode(
  graph: BotGraphV3,
  pos: Vec2,
  platforms: any[] = []
): BotGraphNodeV3 | null {
  const inflatedBounds = computeInflatedPlatformBounds(platforms);
  let bestNode: BotGraphNodeV3 | null = null;
  let minDistance = Infinity;

  graph.nodes.forEach((node) => {
    if (!node.valid) return;
    const dist = Math.hypot(node.worldPosition.x - pos.x, node.worldPosition.y - pos.y);
    if (dist < minDistance) {
      if (isSegmentPhysicallyClear(pos, node.worldPosition, inflatedBounds)) {
        minDistance = dist;
        bestNode = node;
      }
    }
  });

  return bestNode;
}

export function planRouteV3(
  graph: BotGraphV3,
  startPos: Vec2,
  targetNodeId: string,
  playerTransitSegment?: { start: Vec2; end: Vec2 } | null,
  blacklistedEdgeIds?: Set<string>,
  config: BotConfigV3 = DEFAULT_BOT_CONFIG_V3,
  platforms: any[] = []
): BotRouteResultV3 {
  recordV3Telemetry('V3_ROUTE_REQUESTED', `Route requested to targetNode ${targetNodeId}`, 'BOT_PLANNER', {
    targetNodeId,
    graphRevision: graph.revision,
  });

  const targetNode = graph.nodes.get(targetNodeId);
  if (!targetNode || !targetNode.valid) {
    recordV3Telemetry('V3_NO_ROUTE', `Target node ${targetNodeId} invalid or missing`, 'BOT_PLANNER', { targetNodeId });
    return {
      status: 'NO_ROUTE',
      nodeIds: [],
      waypoints: [],
      targetNodeId: null,
      graphRevision: graph.revision,
      reason: `Target node ${targetNodeId} is invalid or does not exist in graph`,
    };
  }

  const distToTarget = Math.hypot(
    targetNode.worldPosition.x - startPos.x,
    targetNode.worldPosition.y - startPos.y
  );

  if (distToTarget <= config.minArrivalTolerancePx + 4) {
    recordV3Telemetry('V3_ROUTE_FOUND', `Already at target region ${targetNodeId}`, 'BOT_PLANNER', { targetNodeId });
    return {
      status: 'ALREADY_AT_TARGET_REGION',
      nodeIds: [targetNodeId],
      waypoints: [targetNode.worldPosition],
      targetNodeId,
      graphRevision: graph.revision,
      reason: 'Already inside target region tolerance envelope',
    };
  }

  const startNode = findNearestSafeNode(graph, startPos, platforms);
  if (!startNode) {
    recordV3Telemetry('V3_NO_ROUTE', 'Could not find clear path to any graph node from start position', 'BOT_PLANNER');
    return {
      status: 'NO_ROUTE',
      nodeIds: [],
      waypoints: [],
      targetNodeId: null,
      graphRevision: graph.revision,
      reason: 'Start position cannot reach any valid graph node safely',
    };
  }

  if (startNode.id === targetNodeId) {
    return {
      status: 'ROUTE_FOUND',
      nodeIds: [startNode.id],
      waypoints: [targetNode.worldPosition],
      targetNodeId,
      graphRevision: graph.revision,
      reason: 'Start node is target node',
    };
  }

  // A* search implementation
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const cameFrom = new Map<string, { nodeId: string; edge: BotGraphEdgeV3 }>();
  const openSet = new Set<string>();

  gScore.set(startNode.id, 0);
  const startH = Math.hypot(
    targetNode.worldPosition.x - startNode.worldPosition.x,
    targetNode.worldPosition.y - startNode.worldPosition.y
  );
  fScore.set(startNode.id, startH);
  openSet.add(startNode.id);

  while (openSet.size > 0) {
    // Pick node in openSet with lowest fScore
    let currentId: string | null = null;
    let lowestF = Infinity;
    openSet.forEach((id) => {
      const f = fScore.get(id) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        currentId = id;
      }
    });

    if (!currentId || currentId === targetNodeId) {
      break;
    }

    openSet.delete(currentId);
    const currentNode = graph.nodes.get(currentId)!;
    const currentG = gScore.get(currentId)!;

    const neighbors = graph.adjacency.get(currentId) || [];
    for (const { edge, targetNodeId: nextId } of neighbors) {
      if (blacklistedEdgeIds && blacklistedEdgeIds.has(edge.id)) {
        continue; // Skip blacklisted edge
      }

      const nextNode = graph.nodes.get(nextId);
      if (!nextNode || !nextNode.valid) continue;

      let edgeCost = edge.lengthPx;
      if (edge.kind === 'LATERAL') {
        edgeCost += config.lateralPenaltyPx;
      }

      // Check player transit fairness penalty
      if (playerTransitSegment) {
        if (
          lineSegmentsIntersect(
            currentNode.worldPosition,
            nextNode.worldPosition,
            playerTransitSegment.start,
            playerTransitSegment.end
          )
        ) {
          edgeCost += config.transitAvoidancePenaltyPx;
        }
      }

      const tentativeG = currentG + edgeCost;
      if (tentativeG < (gScore.get(nextId) ?? Infinity)) {
        cameFrom.set(nextId, { nodeId: currentId, edge });
        gScore.set(nextId, tentativeG);
        const h = Math.hypot(
          targetNode.worldPosition.x - nextNode.worldPosition.x,
          targetNode.worldPosition.y - nextNode.worldPosition.y
        );
        fScore.set(nextId, tentativeG + h);
        openSet.add(nextId);
      }
    }
  }

  if (!gScore.has(targetNodeId)) {
    recordV3Telemetry('V3_NO_ROUTE', `A* expanded graph without finding route to ${targetNodeId}`, 'BOT_PLANNER', { targetNodeId });
    return {
      status: 'NO_ROUTE',
      nodeIds: [],
      waypoints: [],
      targetNodeId: null,
      graphRevision: graph.revision,
      reason: `No path exists from start node ${startNode.id} to target node ${targetNodeId}`,
    };
  }

  // Reconstruct path
  const nodeIds: string[] = [];
  let curr: string | undefined = targetNodeId;
  while (curr) {
    nodeIds.unshift(curr);
    const prev = cameFrom.get(curr);
    curr = prev ? prev.nodeId : undefined;
  }

  const rawWaypoints: Vec2[] = nodeIds.map(
    (id) => graph.nodes.get(id)!.worldPosition
  );

  // Filter waypoints: ensure first waypoint is ahead of current startPos
  const waypoints: Vec2[] = [];
  if (
    Math.hypot(startPos.x - rawWaypoints[0].x, startPos.y - rawWaypoints[0].y) > 4
  ) {
    waypoints.push(rawWaypoints[0]);
  }
  for (let i = 1; i < rawWaypoints.length; i++) {
    waypoints.push(rawWaypoints[i]);
  }

  if (waypoints.length === 0) {
    waypoints.push(targetNode.worldPosition);
  }

  recordV3Telemetry('V3_ROUTE_FOUND', `Route found with ${waypoints.length} waypoints`, 'BOT_PLANNER', {
    targetNodeId,
    waypointCount: waypoints.length,
    totalNodes: nodeIds.length,
  });

  return {
    status: 'ROUTE_FOUND',
    nodeIds,
    waypoints,
    targetNodeId,
    graphRevision: graph.revision,
    reason: 'Route successfully planned',
  };
}
