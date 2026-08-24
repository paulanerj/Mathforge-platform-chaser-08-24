export interface Vec2 { x: number; y: number; }
export interface Rect { left: number; right: number; top: number; bottom: number; }
export interface PlatformObstacle { id: string | number; rect: Rect; }

export interface BotWorldSnapshotV2 {
  simTimeMs: number;
  deltaMs: number;
  playerPosition: Vec2;
  playerRadius: number;
  playerRowId: string | number | null;
  playerSupportingPlatformId: string | number | null;
  botPosition: Vec2;
  botRadius: number;
  platforms: ReadonlyArray<PlatformObstacle>;
  navigationBounds: Rect;
  obstacleRevision: number;
  paused: boolean;
  gameOver: boolean;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  rowGap: number;
  botBaseOffsetRows: number;
  playerMovementState: 'SETTLED' | 'MOVE_STARTED' | 'IN_TRANSIT' | 'LANDING' | 'WRONG_RETURN' | 'CAPTURED';
  playerSettledPlatformId: string | number | null;
  playerDestinationPlatformId: string | number | null;
  playerRoutePolyline: Vec2[] | null;
  playerRouteStartPosition: Vec2 | null;
  playerRouteDestination: Vec2 | null;
  playerRouteProgress: number;
  playerEstimatedRemainingTransitTimeMs: number;
}

export type BotGoalPurposeV2 = 'ATTACK_READY' | 'APPROACH_PROGRESS' | 'RECOVERY_ESCAPE' | 'SEARCH_DESTINATION';

export interface BotGoalV2 {
  id: string;
  cell: Vec2;
  worldPosition: Vec2;
  purpose: BotGoalPurposeV2;
  targetVersion: number;
  validForNextState: boolean;
  progressTowardEnvelopePx: number;
  attackEnvelopeErrorPx?: number;
}

export type BotPlanOutcomeV2 =
  | 'REACHED_ATTACK_READY_GOAL'
  | 'REACHED_APPROACH_PROGRESS_GOAL'
  | 'PARTIAL_PROGRESS'
  | 'NO_PROGRESS'
  | 'UNREACHABLE';

export interface BotPlanResultV2 {
  outcome: BotPlanOutcomeV2;
  path: Vec2[] | null;
  selectedGoal: BotGoalV2 | null;
  nodesExpanded: number;
  progressPx: number;
  reason: string;
}

export type BotStateV2 = 'SEARCH' | 'ALERT' | 'CHASE' | 'HOLD' | 'PURSUE' | 'FINAL_APPROACH' | 'RECOVER' | 'CAPTURED';

export interface AttackEnvelopeConfigV2 {
  envelopeHalfWidthPx: number; // default 48
  envelopeMinBelowPx: number;  // default 100
  envelopeMaxBelowPx: number;  // default 260
  envelopeTargetBelowPx: number; // default 160
}

export const DEFAULT_ATTACK_ENVELOPE_CONFIG_V2: AttackEnvelopeConfigV2 = {
  envelopeHalfWidthPx: 48,
  envelopeMinBelowPx: 100,
  envelopeMaxBelowPx: 260,
  envelopeTargetBelowPx: 160
};

export function isBotInsideAttackEnvelope(
  botPos: Vec2,
  playerPos: Vec2,
  inflatedObstacles: Rect[] = [],
  config: AttackEnvelopeConfigV2 = DEFAULT_ATTACK_ENVELOPE_CONFIG_V2
): { isInside: boolean; dx: number; dy: number; reason?: string } {
  const dx = Math.abs(botPos.x - playerPos.x);
  const dy = botPos.y - playerPos.y; // Positive if bot is below player (larger Y)

  if (dx > config.envelopeHalfWidthPx) {
    return { isInside: false, dx, dy, reason: `Horizontal distance ${dx.toFixed(1)}px exceeds half-width ${config.envelopeHalfWidthPx}px` };
  }

  if (dy < config.envelopeMinBelowPx || dy > config.envelopeMaxBelowPx) {
    return { isInside: false, dx, dy, reason: `Vertical distance ${dy.toFixed(1)}px outside range [${config.envelopeMinBelowPx}, ${config.envelopeMaxBelowPx}]` };
  }

  // Check vertical platform blockage directly between bot and player target zone
  if (inflatedObstacles.length > 0) {
    const minX = Math.min(botPos.x, playerPos.x) - 4;
    const maxX = Math.max(botPos.x, playerPos.x) + 4;
    const minY = Math.min(botPos.y, playerPos.y);
    const maxY = Math.max(botPos.y, playerPos.y);

    for (const obs of inflatedObstacles) {
      if (
        obs.left < maxX &&
        obs.right > minX &&
        obs.top < maxY &&
        obs.bottom > minY
      ) {
        return { isInside: false, dx, dy, reason: `Platform obstacle blocks direct attack envelope line of sight` };
      }
    }
  }

  return { isInside: true, dx, dy };
}

export interface AwarenessEpisodeV2 {
  id: number;
  openedAtMs: number;
  lastConfirmedAtMs: number;
  lastKnownPlayerPosition: Vec2;
  excitementPlayed: boolean;
}

export interface BotProgressV2 {
  lastPos: Vec2;
  lastPosTimeMs: number;
  lastWaypointIndex: number;
  waypointStallTimeMs: number;
  recentCells: string[];
  plannerFailures: number;
  recoveryRung: number;
  recoveryStartTimeMs: number;
}

export interface BotStateContextV2 {
  currentState: BotStateV2;
  awareness: AwarenessEpisodeV2 | null;
  radarTimerMs: number;
  alertCooldownUntilMs: number;
  
  currentPath: Vec2[] | null;
  currentPathType: 'FULL' | 'PARTIAL' | null;
  currentPathGeneratedAtMs: number;
  currentGoalAnchor: Vec2 | null;
  pathIndex: number;
  
  searchDestination: Vec2 | null;
  
  progress: BotProgressV2;

  attackSubState: 'APPROACH' | 'STAGE' | 'STRIKE' | 'NONE';
  stageTimerMs: number;
  strikeTarget: Vec2 | null;

  events: BotEventV2[];
  debug: BotDebugSnapshotV2;
  lastObstacleRevision?: number;

  targetVersion: number;
  pathTargetVersion?: number;
  lastTargetPosition?: Vec2 | null;
  lastPlayerPlatformId?: string | number | null;
}

export interface BotEventV2 {
  type: 'PLAY_EXCITEMENT_SOUND' | 'CAPTURE' | 'SHOW_ALERT_REACTION';
}

export interface BotDebugSnapshotV2 {
  implementation: 'GREENFIELD_V2';
  state: BotStateV2;
  nearHit: boolean;
  radarHit: boolean;
  edgeGap: number;
  radarRadius: number;
  awarenessId: number;
  awarenessRemainingMs: number;
  excitementPlayed: boolean;
  plannerStage: 'LOCAL' | 'EXPANDED' | 'NONE';
  plannerStatus: string;
  nodesExpanded: number;
  pathLength: number;
  recoveryRung: number;
  timeInRecoveryMs: number;
  goalCandidates: Vec2[];
  selectedGoal: Vec2 | null;
  currentPath: Vec2[] | null;
  activeWaypoint: Vec2 | null;
  inflatedObstacles: Rect[];
  navBounds: Rect;
  radarWaveRadius: number | null;
}

export interface BotUpdateResultV2 {
  intendedDisplacement: Vec2;
  events: ReadonlyArray<BotEventV2>;
  debug: BotDebugSnapshotV2;
}
