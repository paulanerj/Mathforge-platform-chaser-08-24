import { BotWorldSnapshotV2, BotStateContextV2, BotUpdateResultV2, Vec2 } from './BotTypesV2';
import { BOT_CONFIG_V2 } from './BotConfigV2';
import { updateStateMachine, inflateObstacles } from './BotStateMachineV2';
import { executeRecovery } from './BotRecoveryV2';
import { getEdgeGap } from './BotSensingV2';
import { BotFlightRecorder } from './BotFlightRecorderV2';
import { updateBotV2Simplified } from './BotControllerV2Simplified';

export function createBotContextV2(): BotStateContextV2 {
  searchSeq = 0;
  
  // Log V2 Context Creation
  BotFlightRecorder.getInstance().recordEvent(
    0,
    'GREENFIELD_V2',
    'SEARCH',
    'NONE',
    'LIFECYCLE',
    'V2_CONTEXT_CREATED',
    `Greenfield V2 AI state controller context initialized.`,
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    BOT_CONFIG_V2.gridSize,
    BOT_CONFIG_V2.gridSize,
    0,
    0,
    '',
    0
  );

  return {
    currentState: 'SEARCH',
    awareness: null,
    radarTimerMs: 0,
    alertCooldownUntilMs: 0,
    currentPath: null,
    currentPathType: null,
    currentPathGeneratedAtMs: 0,
    currentGoalAnchor: null,
    pathIndex: 0,
    searchDestination: null,
    progress: {
      lastPos: { x: 0, y: 0 },
      lastPosTimeMs: 0,
      lastWaypointIndex: 0,
      waypointStallTimeMs: 0,
      recentCells: [],
      plannerFailures: 0,
      recoveryRung: 0,
      recoveryStartTimeMs: 0
    },
    attackSubState: 'NONE',
    stageTimerMs: 0,
    strikeTarget: null,
    events: [],
    targetVersion: 1,
    pathTargetVersion: 0,
    lastTargetPosition: null,
    lastPlayerPlatformId: null,
    debug: {
      implementation: 'GREENFIELD_V2',
      state: 'SEARCH',
      nearHit: false,
      radarHit: false,
      edgeGap: 0,
      radarRadius: 0,
      awarenessId: 0,
      awarenessRemainingMs: 0,
      excitementPlayed: false,
      plannerStage: 'NONE',
      plannerStatus: '',
      nodesExpanded: 0,
      pathLength: 0,
      recoveryRung: 0,
      timeInRecoveryMs: 0,
      goalCandidates: [],
      selectedGoal: null,
      currentPath: null,
      activeWaypoint: null,
      inflatedObstacles: [],
      navBounds: { left: 0, right: 0, top: 0, bottom: 0 },
      radarWaveRadius: null
    }
  };
}

let searchSeq = 0;

export function updateBotV2(snapshot: BotWorldSnapshotV2, context: BotStateContextV2): BotUpdateResultV2 {
  return updateBotV2Simplified(snapshot, context);
}

export function updateBotV2Frozen(snapshot: BotWorldSnapshotV2, context: BotStateContextV2): BotUpdateResultV2 {
  const recorder = BotFlightRecorder.getInstance();
  
  if (snapshot.paused) {
    return { intendedDisplacement: { x: 0, y: 0 }, events: [], debug: context.debug };
  }

  context.events = [];
  context.radarTimerMs += snapshot.deltaMs;

  updateStateMachine(snapshot, context);

  if (context.currentState === 'RECOVER') {
    executeRecovery(snapshot, context, inflateObstacles(snapshot));
  }

  let dx = 0;
  let dy = 0;

  if (context.currentState === 'CHASE' && context.attackSubState === 'STAGE') {
    // STAGE: Stabilize beneath player, zero displacement
    dx = 0;
    dy = 0;
  } else if (context.currentState === 'CHASE' && context.attackSubState === 'STRIKE') {
    // STRIKE: Fast committed upward strike directly to strikeTarget
    const strikeSpeed = 350; // px/s
    const strikeDist = strikeSpeed * (snapshot.deltaMs / 1000);
    const sdx = context.strikeTarget!.x - snapshot.botPosition.x;
    const sdy = context.strikeTarget!.y - snapshot.botPosition.y;
    const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
    if (sdist > 0) {
      dx = (sdx / sdist) * strikeDist;
      dy = (sdy / sdist) * strikeDist;
    }
  } else if (context.currentState === 'SEARCH') {
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
  } else if ((context.currentState === 'CHASE' || context.currentState === 'HOLD' || context.currentState === 'RECOVER') && context.currentPath) {
    const speed = BOT_CONFIG_V2.chaseSpeed;
    const dist = speed * (snapshot.deltaMs / 1000);
    let targetWp = context.currentPath[context.pathIndex];
    if (targetWp) {
      const wdx = targetWp.x - snapshot.botPosition.x;
      const wdy = targetWp.y - snapshot.botPosition.y;
      const wdist = Math.sqrt(wdx*wdx + wdy*wdy);
      if (wdist <= BOT_CONFIG_V2.waypointArrivalPx) {
        const oldIndex = context.pathIndex;
        context.pathIndex++;

        recorder.recordEvent(
          snapshot.simTimeMs,
          'GREENFIELD_V2',
          context.currentState,
          'NONE',
          'MOVEMENT',
          'WAYPOINT_REACHED',
          `Bot arrived at waypoint index ${oldIndex} (${targetWp.x.toFixed(0)}, ${targetWp.y.toFixed(0)}) within arrival tolerance ${BOT_CONFIG_V2.waypointArrivalPx}px`,
          snapshot.botPosition,
          snapshot.playerPosition,
          snapshot.botRadius,
          snapshot.playerRadius,
          context.awareness?.id || 0,
          snapshot.obstacleRevision,
          context.debug.plannerStatus,
          context.pathIndex,
          { waypointIndex: oldIndex, coordinate: targetWp }
        );

        if (context.pathIndex < context.currentPath.length) {
          targetWp = context.currentPath[context.pathIndex];
        }
      }
      
      if (context.pathIndex < context.currentPath.length && targetWp) {
        const ndx = targetWp.x - snapshot.botPosition.x;
        const ndy = targetWp.y - snapshot.botPosition.y;
        const ndist = Math.sqrt(ndx*ndx + ndy*ndy);
        if (ndist > 0) {
          dx = (ndx / ndist) * dist;
          dy = (ndy / ndist) * dist;
        }
      }
    }
  }

  // Log zero movement intent if calculated in active states
  if ((context.currentState === 'CHASE' || context.currentState === 'HOLD' || context.currentState === 'RECOVER') && dx === 0 && dy === 0 && context.attackSubState !== 'STAGE') {
    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'MOVEMENT',
      'ZERO_MOVEMENT_INTENT',
      `Zero movement intent calculated during active state ${context.currentState}. Waypoint index: ${context.pathIndex}/${context.currentPath?.length || 0}`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness?.id || 0,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex
    );
  }

  context.debug.state = context.currentState;
  context.debug.edgeGap = getEdgeGap(snapshot);
  context.debug.awarenessId = context.awareness?.id || 0;
  context.debug.awarenessRemainingMs = context.awareness ? 2500 - (snapshot.simTimeMs - context.awareness.lastConfirmedAtMs) : 0;
  context.debug.excitementPlayed = context.awareness?.excitementPlayed || false;
  context.debug.currentPath = context.currentPath;
  context.debug.pathLength = context.currentPath?.length || 0;
  context.debug.activeWaypoint = context.currentPath ? context.currentPath[context.pathIndex] : null;
  context.debug.inflatedObstacles = inflateObstacles(snapshot);
  context.debug.navBounds = snapshot.navigationBounds;
  
  const cycleTime = context.radarTimerMs % 1500;
  context.debug.radarWaveRadius = cycleTime <= BOT_CONFIG_V2.radarDurationMs ? (cycleTime / BOT_CONFIG_V2.radarDurationMs) * 280 : null;

  return {
    intendedDisplacement: { x: dx, y: dy },
    events: [...context.events],
    debug: { ...context.debug }
  };
}
