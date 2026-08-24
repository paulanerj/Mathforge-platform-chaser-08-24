/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vec2, Rect, PlatformObstacle } from '../bot-ai-v2/BotTypesV2';
import {
  BotGraphNodeV3,
  BotGraphEdgeV3,
  BotGraphV3,
  BotGraphNodeKindV3,
} from './BotTypesV3';
import { DEFAULT_BOT_CONFIG_V3 } from './BotConfigV3';
import { recordV3Telemetry } from './BotTelemetryV3';

/**
 * Pure function to check if a point is outside inflated platform bounds.
 */
export function isPositionPhysicallyClear(
  pos: Vec2,
  inflatedPlatformBounds: Rect[]
): boolean {
  for (const rect of inflatedPlatformBounds) {
    if (
      pos.x >= rect.left &&
      pos.x <= rect.right &&
      pos.y >= rect.top &&
      pos.y <= rect.bottom
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Pure function equivalent required by Section 5 (SHARED GEOMETRY CONTRACT).
 * Validates the ENTIRE segment (line segment between start and end) against inflated platform bounds.
 */
export function isSegmentPhysicallyClear(
  start: Vec2,
  end: Vec2,
  inflatedPlatformBounds: Rect[],
  _botRadius: number = DEFAULT_BOT_CONFIG_V3.botRadius,
  _safetyMargin: number = DEFAULT_BOT_CONFIG_V3.navSafetyMargin
): boolean {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    return isPositionPhysicallyClear(start, inflatedPlatformBounds);
  }

  // Step resolution: check every 4 pixels along the segment
  const stepPx = 4;
  const steps = Math.max(1, Math.ceil(length / stepPx));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const pt: Vec2 = {
      x: start.x + dx * t,
      y: start.y + dy * t,
    };
    if (!isPositionPhysicallyClear(pt, inflatedPlatformBounds)) {
      return false;
    }
  }

  return true;
}

/**
 * Computes inflated platform bounds given a list of platform obstacles.
 */
export function computeInflatedPlatformBounds(
  platforms: ReadonlyArray<PlatformObstacle>,
  botRadius: number = DEFAULT_BOT_CONFIG_V3.botRadius,
  safetyMargin: number = DEFAULT_BOT_CONFIG_V3.navSafetyMargin
): Rect[] {
  const totalMargin = botRadius + safetyMargin;
  return platforms.map((p) => ({
    left: p.rect.left - totalMargin,
    right: p.rect.right + totalMargin,
    top: p.rect.top - totalMargin,
    bottom: p.rect.bottom + totalMargin,
  }));
}

export interface GraphBuilderOptions {
  width: number;
  rowGap: number;
  botRadius?: number;
  safetyMargin?: number;
  columnsFraction?: [number, number, number];
}

/**
 * Pure deterministic graph builder for V3.
 */
export function buildPlatformGraphV3(
  platforms: ReadonlyArray<PlatformObstacle>,
  revision: number,
  options: GraphBuilderOptions
): BotGraphV3 {
  const botRadius = options.botRadius ?? DEFAULT_BOT_CONFIG_V3.botRadius;
  const safetyMargin = options.safetyMargin ?? DEFAULT_BOT_CONFIG_V3.navSafetyMargin;
  const width = options.width;
  const rowGap = options.rowGap;
  const columnsFraction = options.columnsFraction ?? DEFAULT_BOT_CONFIG_V3.columnsFraction;

  recordV3Telemetry('V3_GRAPH_BUILD_STARTED', `Building graph revision ${revision}`, 'BOT_PLANNER', { revision });

  const inflatedBounds = computeInflatedPlatformBounds(platforms, botRadius, safetyMargin);

  const colX = [
    columnsFraction[0] * width,
    columnsFraction[1] * width,
    columnsFraction[2] * width,
  ];

  // Lanes: vertical corridors between platform columns
  const laneX = [
    colX[0] / 2, // Lane 0 (left edge)
    (colX[0] + colX[1]) / 2, // Lane 1 (between col 0 and 1)
    (colX[1] + colX[2]) / 2, // Lane 2 (between col 1 and 2)
    (colX[2] + width) / 2, // Lane 3 (right edge)
  ];

  // Group platforms by discrete Y levels (rows)
  const rowMap = new Map<number, PlatformObstacle[]>();
  platforms.forEach((p) => {
    // Round y to identify row altitude
    const rowY = Math.round(p.rect.top + (p.rect.bottom - p.rect.top) / 2);
    let foundKey: number | null = null;
    for (const key of rowMap.keys()) {
      if (Math.abs(key - rowY) < 30) {
        foundKey = key;
        break;
      }
    }
    if (foundKey === null) {
      foundKey = rowY;
      rowMap.set(foundKey, []);
    }
    rowMap.get(foundKey)!.push(p);
  });

  const sortedRowYs = Array.from(rowMap.keys()).sort((a, b) => b - a); // ascending world (y decreases upwards or increases downwards)

  const nodes = new Map<string, BotGraphNodeV3>();

  // 1. Create Nodes
  sortedRowYs.forEach((rowY, rowIndex) => {
    const rowPlatforms = rowMap.get(rowY) || [];

    // PLATFORM_BELOW nodes
    rowPlatforms.forEach((p, pIdx) => {
      const platWidth = p.rect.right - p.rect.left;
      const platHeight = p.rect.bottom - p.rect.top;
      const platCenterX = p.rect.left + platWidth / 2;
      const platBottomY = p.rect.bottom;

      const belowPos: Vec2 = {
        x: platCenterX,
        y: platBottomY + botRadius + safetyMargin + 12,
      };

      const valid = isPositionPhysicallyClear(belowPos, inflatedBounds);
      const nodeId = `node_below_${p.id}`;

      nodes.set(nodeId, {
        id: nodeId,
        kind: 'PLATFORM_BELOW',
        worldPosition: belowPos,
        rowIndex,
        platformId: String(p.id),
        clearanceRadiusPx: botRadius + safetyMargin,
        valid,
      });

      if (!valid) {
        recordV3Telemetry('V3_GRAPH_INVALID_NODE', `Below node ${nodeId} blocked`, 'BOT_PLANNER', { nodeId });
      }

      // PLATFORM_SIDE nodes (left and right bypass)
      const leftSidePos: Vec2 = {
        x: p.rect.left - (botRadius + safetyMargin + 10),
        y: p.rect.top + platHeight / 2,
      };
      if (isPositionPhysicallyClear(leftSidePos, inflatedBounds)) {
        const sideNodeId = `node_side_left_${p.id}`;
        nodes.set(sideNodeId, {
          id: sideNodeId,
          kind: 'PLATFORM_SIDE',
          worldPosition: leftSidePos,
          rowIndex,
          platformId: String(p.id),
          clearanceRadiusPx: botRadius + safetyMargin,
          valid: true,
        });
      }

      const rightSidePos: Vec2 = {
        x: p.rect.right + (botRadius + safetyMargin + 10),
        y: p.rect.top + platHeight / 2,
      };
      if (isPositionPhysicallyClear(rightSidePos, inflatedBounds)) {
        const sideNodeId = `node_side_right_${p.id}`;
        nodes.set(sideNodeId, {
          id: sideNodeId,
          kind: 'PLATFORM_SIDE',
          worldPosition: rightSidePos,
          rowIndex,
          platformId: String(p.id),
          clearanceRadiusPx: botRadius + safetyMargin,
          valid: true,
        });
      }
    });

    // VERTICAL_LANE nodes at row altitude
    laneX.forEach((lx, laneIdx) => {
      const lanePos: Vec2 = { x: lx, y: rowY };
      const valid = isPositionPhysicallyClear(lanePos, inflatedBounds);
      const nodeId = `node_vlane_r${rowIndex}_l${laneIdx}`;

      nodes.set(nodeId, {
        id: nodeId,
        kind: 'VERTICAL_LANE',
        worldPosition: lanePos,
        rowIndex,
        laneIndex: laneIdx,
        clearanceRadiusPx: botRadius + safetyMargin,
        valid,
      });
    });

    // ROW_GAP nodes midway to next row
    if (rowIndex < sortedRowYs.length - 1) {
      const nextRowY = sortedRowYs[rowIndex + 1];
      const gapY = (rowY + nextRowY) / 2;

      laneX.forEach((lx, laneIdx) => {
        const gapPos: Vec2 = { x: lx, y: gapY };
        const valid = isPositionPhysicallyClear(gapPos, inflatedBounds);
        const nodeId = `node_rowgap_r${rowIndex}_l${laneIdx}`;

        nodes.set(nodeId, {
          id: nodeId,
          kind: 'ROW_GAP',
          worldPosition: gapPos,
          rowIndex,
          laneIndex: laneIdx,
          clearanceRadiusPx: botRadius + safetyMargin,
          valid,
        });
      });
    }
  });

  // 2. Create Edges
  const edges: BotGraphEdgeV3[] = [];
  const adjacency = new Map<string, Array<{ edge: BotGraphEdgeV3; targetNodeId: string }>>();

  const addEdge = (fromId: string, toId: string, kind: 'VERTICAL' | 'LATERAL' | 'APPROACH') => {
    const fromNode = nodes.get(fromId);
    const toNode = nodes.get(toId);

    if (!fromNode || !toNode || !fromNode.valid || !toNode.valid) return;

    // Check existing edge
    const edgeId = `edge_${fromId}_${toId}`;
    if (edges.some((e) => e.id === edgeId)) return;

    // Validate segment physics
    const clear = isSegmentPhysicallyClear(
      fromNode.worldPosition,
      toNode.worldPosition,
      inflatedBounds,
      botRadius,
      safetyMargin
    );

    if (!clear) {
      recordV3Telemetry('V3_GRAPH_REJECTED_EDGE', `Edge ${edgeId} rejected by physical collision`, 'BOT_PLANNER', { edgeId });
      return;
    }

    const lengthPx = Math.hypot(
      toNode.worldPosition.x - fromNode.worldPosition.x,
      toNode.worldPosition.y - fromNode.worldPosition.y
    );

    const edge: BotGraphEdgeV3 = {
      id: edgeId,
      fromNodeId: fromId,
      toNodeId: toId,
      kind,
      lengthPx,
      physicallyValidated: true,
    };

    edges.push(edge);

    if (!adjacency.has(fromId)) adjacency.set(fromId, []);
    adjacency.get(fromId)!.push({ edge, targetNodeId: toId });

    // Undirected graph (bidirectional movement along corridors)
    const backEdgeId = `edge_${toId}_${fromId}`;
    const backEdge: BotGraphEdgeV3 = {
      id: backEdgeId,
      fromNodeId: toId,
      toNodeId: fromId,
      kind,
      lengthPx,
      physicallyValidated: true,
    };
    edges.push(backEdge);

    if (!adjacency.has(toId)) adjacency.set(toId, []);
    adjacency.get(toId)!.push({ edge: backEdge, targetNodeId: fromId });
  };

  const nodeList = Array.from(nodes.values()).filter((n) => n.valid);

  // Connect Vertical Corridor Edges
  nodeList.forEach((from) => {
    nodeList.forEach((to) => {
      if (from.id === to.id) return;

      // Vertical Corridor Connection: Same lane, adjacent Y
      if (from.laneIndex !== undefined && to.laneIndex !== undefined && from.laneIndex === to.laneIndex) {
        const yDist = Math.abs(from.worldPosition.y - to.worldPosition.y);
        if (yDist > 0 && yDist <= rowGap * 1.2) {
          addEdge(from.id, to.id, 'VERTICAL');
        }
      }

      // Lateral Connection: Same altitude/row, adjacent lanes
      if (
        (from.kind === 'ROW_GAP' && to.kind === 'ROW_GAP') ||
        (from.kind === 'VERTICAL_LANE' && to.kind === 'VERTICAL_LANE')
      ) {
        if (Math.abs(from.worldPosition.y - to.worldPosition.y) < 15) {
          if (from.laneIndex !== undefined && to.laneIndex !== undefined) {
            if (Math.abs(from.laneIndex - to.laneIndex) === 1) {
              addEdge(from.id, to.id, 'LATERAL');
            }
          }
        }
      }

      // Approach Connection: Below platform to nearest corridor node
      if (from.kind === 'PLATFORM_BELOW' && (to.kind === 'VERTICAL_LANE' || to.kind === 'ROW_GAP')) {
        const dist = Math.hypot(
          from.worldPosition.x - to.worldPosition.x,
          from.worldPosition.y - to.worldPosition.y
        );
        if (dist <= width * 0.45) {
          addEdge(from.id, to.id, 'APPROACH');
        }
      }

      // Side bypass connections
      if (from.kind === 'PLATFORM_SIDE' && (to.kind === 'VERTICAL_LANE' || to.kind === 'ROW_GAP' || to.kind === 'PLATFORM_BELOW')) {
        const dist = Math.hypot(
          from.worldPosition.x - to.worldPosition.x,
          from.worldPosition.y - to.worldPosition.y
        );
        if (dist <= width * 0.35) {
          addEdge(from.id, to.id, 'APPROACH');
        }
      }
    });
  });

  recordV3Telemetry('V3_GRAPH_BUILD_COMPLETED', `Graph build completed. Nodes: ${nodes.size}, Edges: ${edges.length}`, 'BOT_PLANNER', {
    revision,
    nodeCount: nodes.size,
    edgeCount: edges.length,
  });

  return {
    nodes,
    edges,
    adjacency,
    revision,
  };
}
