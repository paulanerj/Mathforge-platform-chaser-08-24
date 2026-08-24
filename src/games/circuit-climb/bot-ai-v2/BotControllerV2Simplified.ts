import { BotWorldSnapshotV2, BotStateContextV2, BotUpdateResultV2, isBotInsideAttackEnvelope, DEFAULT_ATTACK_ENVELOPE_CONFIG_V2 } from './BotTypesV2';
import { BOT_CONFIG_V2 } from './BotConfigV2';
import { updateStateMachineSimplified, inflateObstacles } from './BotStateMachineV2Simplified';
import { executeRecovery } from './BotRecoveryV2';
import { getEdgeGap } from './BotSensingV2';
import { isPointInPlayerTransitCorridor } from './BotGoalSelectorV2';
import { BotFlightRecorder } from './BotFlightRecorderV2';

let searchSeq = 0;
let lastCalculatedMovementMagnitude = 0;

export function updateBotV2Simplified(
  snapshot: BotWorldSnapshotV2,
  context: BotStateContextV2
): BotUpdateResultV2 {
  const recorder = BotFlightRecorder.getInstance();

  if (snapshot.paused) {
    return { intendedDisplacement: { x: 0, y: 0 }, events: [], debug: context.debug };
  }

  context.events = [];
  context.radarTimerMs += snapshot.deltaMs;

  // Run simplified state machine
  updateStateMachineSimplified(snapshot, context, lastCalculatedMovementMagnitude);

  let dx = 0;
  let dy = 0;

  // Calculate intended movement displacement based on current state
  if (context.currentState === 'SEARCH') {
    const speed = BOT_CONFIG_V2.patrolSpeed;
    const dist = speed * (snapshot.deltaMs / 1000);
    if (!context.searchDestination) {
      const w = snapshot.navigationBounds.right - snapshot.navigationBounds.left;
      const targets = [
        snapshot.navigationBounds.left + w * 0.2,
        snapshot.navigationBounds.left + w * 0.8,
        snapshot.navigationBounds.left + w * 0.5
      ];
      searchSeq = (searchSeq + 1) % targets.length;
      context.searchDestination = { x: targets[searchSeq], y: snapshot.botPosition.y };
    } else {
      const pdx = context.searchDestination.x - snapshot.botPosition.x;
      if (Math.abs(pdx) < BOT_CONFIG_V2.waypointArrivalPx) {
        context.searchDestination = null;
      } else {
        dx = Math.sign(pdx) * dist;
      }
    }
  } else if (context.currentState === 'PURSUE' && context.currentPath) {
    const speed = BOT_CONFIG_V2.chaseSpeed;
    const dist = speed * (snapshot.deltaMs / 1000);
    let targetWp = context.currentPath[context.pathIndex];

    if (targetWp) {
      const wdx = targetWp.x - snapshot.botPosition.x;
      const wdy = targetWp.y - snapshot.botPosition.y;
      const wdist = Math.hypot(wdx, wdy);

      if (wdist <= BOT_CONFIG_V2.waypointArrivalPx) {
        context.pathIndex++;
        if (context.pathIndex < context.currentPath.length) {
          targetWp = context.currentPath[context.pathIndex];
        }
      }

      if (context.pathIndex < context.currentPath.length && targetWp) {
        const ndx = targetWp.x - snapshot.botPosition.x;
        const ndy = targetWp.y - snapshot.botPosition.y;
        const ndist = Math.hypot(ndx, ndy);
        if (ndist > 0) {
          dx = (ndx / ndist) * dist;
          dy = (ndy / ndist) * dist;
        }
      }
    }
  } else if (context.currentState === 'FINAL_APPROACH') {
    // Local steering controller directly targeting (player.x, player.y + 160) with vertical bias
    const speed = BOT_CONFIG_V2.chaseSpeed;
    const distStep = speed * (snapshot.deltaMs / 1000);

    const targetX = snapshot.playerPosition.x;
    const targetY = snapshot.playerPosition.y + DEFAULT_ATTACK_ENVELOPE_CONFIG_V2.envelopeTargetBelowPx;

    const rawDx = targetX - snapshot.botPosition.x;
    const rawDy = targetY - snapshot.botPosition.y;

    // Apply vertical bias factor (~2.0)
    let steerX = rawDx;
    let steerY = rawDy * 2.0;

    // Add corridor repulsion if player is in transit
    if (isPointInPlayerTransitCorridor(snapshot.botPosition, snapshot)) {
      const repelDir = snapshot.botPosition.x >= snapshot.playerPosition.x ? 1 : -1;
      steerX += repelDir * BOT_CONFIG_V2.corridorRepulsionGain * 30;
    }

    const steerDist = Math.hypot(steerX, steerY);
    if (steerDist > 0) {
      dx = (steerX / steerDist) * distStep;
      dy = (steerY / steerDist) * distStep;
    }
  } else if (context.currentState === 'RECOVER' && context.currentPath) {
    const speed = BOT_CONFIG_V2.chaseSpeed;
    const dist = speed * (snapshot.deltaMs / 1000);
    const targetWp = context.currentPath[context.pathIndex];

    if (targetWp) {
      const rdx = targetWp.x - snapshot.botPosition.x;
      const rdy = targetWp.y - snapshot.botPosition.y;
      const rdist = Math.hypot(rdx, rdy);
      if (rdist > 0) {
        dx = (rdx / rdist) * dist;
        dy = (rdy / rdist) * dist;
      }
    }
  }

  lastCalculatedMovementMagnitude = Math.hypot(dx, dy);

  // Debug snapshot
  context.debug.state = context.currentState;
  context.debug.edgeGap = getEdgeGap(snapshot);
  context.debug.awarenessId = context.awareness?.id || 0;
  context.debug.currentPath = context.currentPath;
  context.debug.pathLength = context.currentPath?.length || 0;
  context.debug.activeWaypoint = context.currentPath ? context.currentPath[context.pathIndex] : null;
  context.debug.inflatedObstacles = inflateObstacles(snapshot);
  context.debug.navBounds = snapshot.navigationBounds;

  return {
    intendedDisplacement: { x: dx, y: dy },
    events: [...context.events],
    debug: { ...context.debug }
  };
}
