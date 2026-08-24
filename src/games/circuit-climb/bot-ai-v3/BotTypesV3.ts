/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vec2, Rect, PlatformObstacle, BotWorldSnapshotV2 } from '../bot-ai-v2/BotTypesV2';

export type BotGraphNodeKindV3 =
  | 'VERTICAL_LANE'
  | 'ROW_GAP'
  | 'PLATFORM_BELOW'
  | 'PLATFORM_SIDE'
  | 'SEARCH';

export interface BotGraphNodeV3 {
  id: string;
  kind: BotGraphNodeKindV3;
  worldPosition: Vec2;
  rowIndex: number;
  laneIndex?: number;
  platformId?: string | null;
  clearanceRadiusPx: number;
  valid: boolean;
}

export type BotGraphEdgeKindV3 = 'VERTICAL' | 'LATERAL' | 'APPROACH';

export interface BotGraphEdgeV3 {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  kind: BotGraphEdgeKindV3;
  lengthPx: number;
  physicallyValidated: boolean;
}

export interface BotGraphV3 {
  nodes: Map<string, BotGraphNodeV3>;
  edges: BotGraphEdgeV3[];
  adjacency: Map<string, Array<{ edge: BotGraphEdgeV3; targetNodeId: string }>>;
  revision: number;
}

export type BotRouteStatusV3 =
  | 'ROUTE_FOUND'
  | 'ALREADY_AT_TARGET_REGION'
  | 'NO_ROUTE';

export interface BotRouteResultV3 {
  status: BotRouteStatusV3;
  nodeIds: string[];
  waypoints: Vec2[];
  targetNodeId: string | null;
  graphRevision: number;
  reason: string;
}

export type BotStateV3 = 'PATROL' | 'ALERT' | 'CHASE' | 'CAUGHT';

export interface BotAwarenessV3State {
  discovered: boolean;
  lastDetectedAtMs: number;
  detectedPosition: Vec2 | null;
  episodeId: number;
  alertPlayed: boolean;
  lastTargetUpdateMs: number;
  chaseMemoryExpiryMs: number;
}

export interface BotWatchdogV3State {
  triggerPosition: Vec2 | null;
  stallStartMs: number;
  blacklistedEdgeIds: Set<string>;
  triggerTimestamps: number[];
  escalated: boolean;
  totalTriggers: number;
}

export interface BotTargetStateV3 {
  targetVersion: number;
  targetNodeId: string | null;
  targetPlatformId: string | null;
  playerSupportingPlatformId: string | null;
  playerDestinationPlatformId: string | null;
}

export interface BotContextV3 {
  instanceId: number;
  currentState: BotStateV3;
  stateTimeMs: number;
  awareness: BotAwarenessV3State;
  target: BotTargetStateV3;
  graph: BotGraphV3 | null;
  currentRoute: BotRouteResultV3 | null;
  currentWaypointIndex: number;
  watchdog: BotWatchdogV3State;
  botPosition: Vec2;
  intendedDisplacement: Vec2;
  events: Array<{ type: string; payload?: any }>;
  alertTimerMs: number;
  patrolTargetNodeId: string | null;
  patrolSweepTimerMs: number;
  patrolWaypoints: Vec2[];
  patrolWaypointIndex: number;
}

export interface BotV3UpdateResult {
  intendedDisplacement: Vec2;
  events: Array<{ type: string; payload?: any }>;
  context: BotContextV3;
}
