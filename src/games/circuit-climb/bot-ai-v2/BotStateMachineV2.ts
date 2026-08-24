import { BotWorldSnapshotV2, BotStateContextV2, Rect } from './BotTypesV2';
import { BOT_CONFIG_V2 } from './BotConfigV2';
import { updateAwareness } from './BotAwarenessV2';
import { checkProgress } from './BotProgressMonitorV2';
import { getGoalCandidates, snapToGrid, isCellBlocked, getBelowPlayerAnchor } from './BotGoalSelectorV2';
import { planPathV2, simplifyPath } from './BotPlannerV2';
import { BotFlightRecorder } from './BotFlightRecorderV2';

export function inflateObstacles(snapshot: BotWorldSnapshotV2): Rect[] {
  const margin = snapshot.botRadius + BOT_CONFIG_V2.navMarginPx;
  return snapshot.platforms.map(p => ({
    left: p.rect.left - margin,
    right: p.rect.right + margin,
    top: p.rect.top - margin,
    bottom: p.rect.bottom + margin,
  }));
}

export function updateStateMachine(snapshot: BotWorldSnapshotV2, context: BotStateContextV2): void {
  const recorder = BotFlightRecorder.getInstance();
  
  if (typeof context.lastObstacleRevision === 'undefined') {
    context.lastObstacleRevision = snapshot.obstacleRevision;
  }
  // 1. Update Awareness
  updateAwareness(snapshot, context);

  // If we just gained awareness, trigger ALERT
  if (context.awareness && context.currentState === 'SEARCH') {
    if (snapshot.simTimeMs <= context.alertCooldownUntilMs) {
      // Record rejected transition
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'STATE_MACHINE',
        'STATE_TRANSITION_REJECTED',
        `Transition SEARCH to ALERT rejected. Guard: cooldown active until ${context.alertCooldownUntilMs}ms (current: ${snapshot.simTimeMs}ms)`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex,
        { cooldownRemainingMs: context.alertCooldownUntilMs - snapshot.simTimeMs }
      );
    } else {
      const oldState = context.currentState;
      context.currentState = 'ALERT';
      context.awareness.openedAtMs = snapshot.simTimeMs;
      
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        oldState,
        'STATE_MACHINE',
        'SEARCH_TO_ALERT',
        `Sensing confirmed and cooldown inactive. Gained awareness. Entered ALERT.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );

      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        oldState,
        'STATE_MACHINE',
        'ALERT_ENTERED',
        `Entered ALERT state. Initializing progress counters.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );

      // reset progress tracking
      context.progress = {
        lastPos: { ...snapshot.botPosition },
        lastPosTimeMs: snapshot.simTimeMs,
        lastWaypointIndex: 0,
        waypointStallTimeMs: snapshot.simTimeMs,
        recentCells: [],
        plannerFailures: 0,
        recoveryRung: 0,
        recoveryStartTimeMs: 0
      };
    }
  }

  // 2. Check collision for capture
  const dx = snapshot.playerPosition.x - snapshot.botPosition.x;
  const dy = snapshot.playerPosition.y - snapshot.botPosition.y;
  const centerDist = Math.sqrt(dx * dx + dy * dy);
  if (centerDist < snapshot.botRadius + snapshot.playerRadius - BOT_CONFIG_V2.captureRadiusDiff) {
    if (context.currentState !== 'CAPTURED') {
      const oldState = context.currentState;
      context.events.push({ type: 'CAPTURE' });
      context.currentState = 'CAPTURED';
      
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        oldState,
        'LIFECYCLE',
        'BOT_CAPTURED',
        `Bot has captured the player. Distance: ${centerDist.toFixed(1)}px. Overlap: ${(snapshot.botRadius + snapshot.playerRadius - centerDist).toFixed(1)}px`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness?.id || 0,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );

      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        oldState,
        'STATE_MACHINE',
        'CAPTURED_ENTERED',
        `Entered CAPTURED state.`,
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
  }

  if (context.currentState === 'CAPTURED') return;

  // 3. State execution & transitions
  const inflatedObstacles = inflateObstacles(snapshot);

  if (context.currentState === 'ALERT') {
    if (!context.awareness?.excitementPlayed) {
      context.events.push({ type: 'PLAY_EXCITEMENT_SOUND' });
      context.events.push({ type: 'SHOW_ALERT_REACTION' });
      if (context.awareness) context.awareness.excitementPlayed = true;

      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'STATE_MACHINE',
        'ALERT_EXCITEMENT_FIRED',
        `Played excitement/warning sound and triggered screen shake/visual alert echo.`,
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
    const timeInAlert = snapshot.simTimeMs - (context.awareness?.openedAtMs || 0);
    if (timeInAlert > BOT_CONFIG_V2.excitementDurationMs) {
      const oldState = context.currentState;
      context.currentState = 'CHASE';
      
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        oldState,
        'STATE_MACHINE',
        'ALERT_TIMER_COMPLETED',
        `Alert state timer finished (${timeInAlert}ms > ${BOT_CONFIG_V2.excitementDurationMs}ms)`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness?.id || 0,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );

      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        oldState,
        'STATE_MACHINE',
        'CHASE_ENTERED',
        `Entered CHASE state. Requesting initial full-search path planning.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness?.id || 0,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );

      requestReplan(snapshot, context, inflatedObstacles, 'EXPANDED');
    }
    return;
  }

  if (context.currentState === 'CHASE' || context.currentState === 'HOLD') {
    if (!context.awareness) {
      const oldState = context.currentState;
      context.currentState = 'SEARCH';
      
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        oldState,
        'STATE_MACHINE',
        'AWARENESS_EXPIRED',
        `Awareness expired/lost. Reverting to SEARCH state.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        0,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );

      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        oldState,
        'STATE_MACHINE',
        'SEARCH_ENTERED',
        `Entered SEARCH state. Will patrol/sweep horizontally.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        0,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );
      return;
    }

    // 1. Reset attack sequence if player started moving (transit protection & retarget zone)
    if (snapshot.playerMovementState === 'MOVE_STARTED') {
      if (context.attackSubState !== 'APPROACH' && context.attackSubState !== 'NONE') {
        recorder.recordEvent(
          snapshot.simTimeMs,
          'GREENFIELD_V2',
          context.currentState,
          'NONE',
          'STATE_MACHINE',
          'ATTACK_SEQUENCE_RESET',
          `Player transit initiated. Resetting attack sequence to APPROACH to pursue new below-player anchor.`,
          snapshot.botPosition,
          snapshot.playerPosition,
          snapshot.botRadius,
          snapshot.playerRadius,
          context.awareness?.id || 0,
          snapshot.obstacleRevision,
          context.debug.plannerStatus,
          context.pathIndex
        );
        context.attackSubState = 'APPROACH';
        context.stageTimerMs = 0;
        context.strikeTarget = null;
      }
    }

    // 2. Initialize attackSubState if NONE
    if (context.attackSubState === 'NONE') {
      context.attackSubState = 'APPROACH';
    }

    // 3. Tick attack sequence sub-states
    if (context.attackSubState === 'APPROACH') {
      const anchor = getBelowPlayerAnchor(context.awareness.lastKnownPlayerPosition, snapshot, inflatedObstacles);
      const adx = anchor.x - snapshot.botPosition.x;
      const ady = anchor.y - snapshot.botPosition.y;
      const distToAnchor = Math.sqrt(adx * adx + ady * ady);

      if (distToAnchor <= 24) {
        context.attackSubState = 'STAGE';
        context.stageTimerMs = 180; // 180ms stabilizing beat
        context.currentPath = null;
        context.currentPathType = null;

        recorder.recordEvent(
          snapshot.simTimeMs,
          'GREENFIELD_V2',
          context.currentState,
          'NONE',
          'STATE_MACHINE',
          'ATTACK_SEQUENCE_STAGE_ENTERED',
          `Bot reached below-player anchor staging zone (distance ${distToAnchor.toFixed(1)}px <= 24px). Entering STAGE beat.`,
          snapshot.botPosition,
          snapshot.playerPosition,
          snapshot.botRadius,
          snapshot.playerRadius,
          context.awareness.id,
          snapshot.obstacleRevision,
          context.debug.plannerStatus,
          context.pathIndex
        );
      }
    } else if (context.attackSubState === 'STAGE') {
      context.stageTimerMs -= snapshot.deltaMs;
      if (context.stageTimerMs <= 0) {
        context.attackSubState = 'STRIKE';
        context.strikeTarget = { x: snapshot.playerPosition.x, y: snapshot.playerPosition.y };

        recorder.recordEvent(
          snapshot.simTimeMs,
          'GREENFIELD_V2',
          context.currentState,
          'NONE',
          'STATE_MACHINE',
          'ATTACK_SEQUENCE_STRIKE_ENTERED',
          `Staging beat completed. Launching upward STRIKE toward committed player position (${context.strikeTarget.x.toFixed(0)}, ${context.strikeTarget.y.toFixed(0)}).`,
          snapshot.botPosition,
          snapshot.playerPosition,
          snapshot.botRadius,
          snapshot.playerRadius,
          context.awareness.id,
          snapshot.obstacleRevision,
          context.debug.plannerStatus,
          context.pathIndex
        );
      }
    } else if (context.attackSubState === 'STRIKE') {
      // Completed when bot's Y meets or goes above the committed player's Y coordinate (reducing Y)
      if (snapshot.botPosition.y <= context.strikeTarget!.y) {
        recorder.recordEvent(
          snapshot.simTimeMs,
          'GREENFIELD_V2',
          context.currentState,
          'NONE',
          'STATE_MACHINE',
          'ATTACK_SEQUENCE_STRIKE_COMPLETED',
          `Strike finished. Bot reached player height of ${snapshot.botPosition.y.toFixed(0)}px (committed target Y: ${context.strikeTarget!.y.toFixed(0)}px). Returning to APPROACH.`,
          snapshot.botPosition,
          snapshot.playerPosition,
          snapshot.botRadius,
          snapshot.playerRadius,
          context.awareness.id,
          snapshot.obstacleRevision,
          context.debug.plannerStatus,
          context.pathIndex
        );
        context.attackSubState = 'APPROACH';
        context.stageTimerMs = 0;
        context.strikeTarget = null;
        requestReplan(snapshot, context, inflatedObstacles, 'EXPANDED');
      }
    }

    const progressOk = checkProgress(snapshot, context);
    if (!progressOk) {
      const oldState = context.currentState;
      context.currentState = 'RECOVER';
      context.progress.recoveryStartTimeMs = snapshot.simTimeMs;
      context.progress.recoveryRung = 1;

      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        oldState,
        'PROGRESS_RECOVERY',
        'NO_PROGRESS_DETECTED',
        `Forward progress stalled, waypoint stuck, or oscillation detected! Initiating Recovery State.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );

      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        oldState,
        'STATE_MACHINE',
        'CHASE_TO_RECOVER',
        `Stall detected. Transitioned to RECOVER.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );

      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        oldState,
        'STATE_MACHINE',
        'RECOVER_ENTERED',
        `Entered RECOVER state. Rung 1: Discard path & attempt local full-grid expanded replan.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );

      // Rung 1: discard and replan expanded
      requestReplan(snapshot, context, inflatedObstacles, 'EXPANDED');
      if (context.currentPathType === 'FULL') {
         const lastState = context.currentState;
         context.currentState = 'CHASE';
         
         recorder.recordEvent(
           snapshot.simTimeMs,
           'GREENFIELD_V2',
           context.currentState,
           lastState,
           'PROGRESS_RECOVERY',
           'RECOVER_TO_CHASE',
           `Rung 1 recovery succeeded! Full path planned during recovery, returning to CHASE.`,
           snapshot.botPosition,
           snapshot.playerPosition,
           snapshot.botRadius,
           snapshot.playerRadius,
           context.awareness.id,
           snapshot.obstacleRevision,
           context.debug.plannerStatus,
           context.pathIndex
         );
      }
      return;
    }

    if (shouldReplan(snapshot, context)) {
      requestReplan(snapshot, context, inflatedObstacles, 'LOCAL');
    }

    const nextState = context.currentPathType === 'PARTIAL' ? 'HOLD' : 'CHASE';
    if (context.currentState !== nextState) {
      const oldState = context.currentState;
      context.currentState = nextState;

      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        oldState,
        'STATE_MACHINE',
        nextState === 'HOLD' ? 'CHASE_TO_HOLD' : 'HOLD_TO_CHASE',
        `Path type changed to ${context.currentPathType}. Transitioning from ${oldState} to ${nextState}.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );
    }
  }

  if (context.currentState !== 'CHASE' && context.currentState !== 'HOLD') {
    context.attackSubState = 'NONE';
    context.stageTimerMs = 0;
    context.strikeTarget = null;
  }
}

export function shouldReplan(snapshot: BotWorldSnapshotV2, context: BotStateContextV2): boolean {
  if (context.attackSubState === 'STAGE' || context.attackSubState === 'STRIKE') {
    return false;
  }

  const recorder = BotFlightRecorder.getInstance();

  if (snapshot.playerMovementState === 'MOVE_STARTED') {
    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'PLANNING',
      'RETARGETING_TRIGGERED',
      `Player transit initiated. Bypassing replan interval to retarget player's new destination platform.`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness?.id || 0,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex
    );
    return true;
  }
  
  if (typeof context.lastObstacleRevision !== 'undefined' && snapshot.obstacleRevision !== context.lastObstacleRevision) {
    const prev = context.lastObstacleRevision;
    context.lastObstacleRevision = snapshot.obstacleRevision;
    
    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'PLANNING',
      'OBSTACLE_REVISION_CHANGED',
      `Obstacle revision updated from ${prev} to ${snapshot.obstacleRevision}. Rebuilding nav grid.`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness?.id || 0,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex
    );
    return true;
  }
  if (!context.currentPath || context.currentPath.length === 0) return true;
  
  const age = snapshot.simTimeMs - context.currentPathGeneratedAtMs;
  if (age > BOT_CONFIG_V2.pathStaleAgeMs) {
    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'PLANNING',
      'PATH_BECAME_STALE',
      `Path generated ${age.toFixed(0)}ms ago has exceeded stale age limit of ${BOT_CONFIG_V2.pathStaleAgeMs}ms. Replanning required.`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness?.id || 0,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex
    );
    return true;
  }
  if (context.currentGoalAnchor) {
    const pdx = snapshot.playerPosition.x - context.currentGoalAnchor.x;
    const pdy = snapshot.playerPosition.y - context.currentGoalAnchor.y;
    const playerMovedDist = Math.sqrt(pdx*pdx + pdy*pdy);
    if (playerMovedDist > BOT_CONFIG_V2.playerMoveReplanDistPx) {
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'PLANNING',
        'GOAL_TARGET_VERSION_CHANGED',
        `Player moved ${playerMovedDist.toFixed(1)}px from goal anchor. Goal anchor version updated. Requesting local replan.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness?.id || 0,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );
      return true;
    }
  }
  return false;
}

export function requestReplan(snapshot: BotWorldSnapshotV2, context: BotStateContextV2, inflatedObstacles: Rect[], forceStage: 'LOCAL'|'EXPANDED' = 'LOCAL') {
  if (!context.awareness) return;

  const recorder = BotFlightRecorder.getInstance();
  const target = getBelowPlayerAnchor(context.awareness.lastKnownPlayerPosition, snapshot, inflatedObstacles);

  recorder.recordEvent(
    snapshot.simTimeMs,
    'GREENFIELD_V2',
    context.currentState,
    'NONE',
    'GOAL_SELECTION',
    'GOAL_SELECTION_STARTED',
    `Planning path to below-player anchor: (${target.x.toFixed(0)}, ${target.y.toFixed(0)}).`,
    snapshot.botPosition,
    snapshot.playerPosition,
    snapshot.botRadius,
    snapshot.playerRadius,
    context.awareness.id,
    snapshot.obstacleRevision,
    context.debug.plannerStatus,
    context.pathIndex
  );

  // Filter blocked candidate cells
  const rawCandidates = [
    { x: snapToGrid(target.x), y: snapToGrid(target.y) },
    { x: snapToGrid(target.x), y: snapToGrid(target.y) - BOT_CONFIG_V2.gridSize },
    { x: snapToGrid(target.x), y: snapToGrid(target.y) + BOT_CONFIG_V2.gridSize },
    { x: snapToGrid(target.x) - BOT_CONFIG_V2.gridSize, y: snapToGrid(target.y) },
    { x: snapToGrid(target.x) + BOT_CONFIG_V2.gridSize, y: snapToGrid(target.y) }
  ];

  rawCandidates.forEach((c, idx) => {
    const isBlocked = isCellBlocked(c.x, c.y, inflatedObstacles, snapshot.navigationBounds, snapshot);
    const label = idx === 0 ? 'PLAYER_CENTER_CELL' : `ADJACENT_NEIGHBOR_${idx}`;
    if (isBlocked) {
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'GOAL_SELECTION',
        idx === 0 ? 'PLAYER_CENTER_CELL_BLOCKED' : 'GOAL_CANDIDATE_REJECTED',
        `Goal candidate ${label} at (${c.x}, ${c.y}) rejected. Reason: cell blocked or overlaps obstacle.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness!.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex,
        { cell: c, reason: 'blocked' }
      );
    } else {
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'GOAL_SELECTION',
        'GOAL_CANDIDATE_ACCEPTED',
        `Goal candidate ${label} at (${c.x}, ${c.y}) accepted.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness!.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex,
        { cell: c }
      );
    }
  });

  const candidates = getGoalCandidates(snapshot, target, inflatedObstacles);

  recorder.recordEvent(
    snapshot.simTimeMs,
    'GREENFIELD_V2',
    context.currentState,
    'NONE',
    'GOAL_SELECTION',
    'GOAL_SET_CREATED',
    `Created candidate target goal set. Total unblocked goals: ${candidates.length}`,
    snapshot.botPosition,
    snapshot.playerPosition,
    snapshot.botRadius,
    snapshot.playerRadius,
    context.awareness.id,
    snapshot.obstacleRevision,
    context.debug.plannerStatus,
    context.pathIndex,
    { count: candidates.length }
  );

  if (candidates.length === 0) {
    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'GOAL_SELECTION',
      'NO_LEGAL_GOALS',
      `No valid, unblocked goal locations could be selected around the target. Path planning aborted.`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness.id,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex
    );
    return;
  }

  recorder.recordEvent(
    snapshot.simTimeMs,
    'GREENFIELD_V2',
    context.currentState,
    'NONE',
    'PLANNING',
    'PLAN_REQUESTED',
    `Requesting path plan. Start cell: (${snapToGrid(snapshot.botPosition.x)}, ${snapToGrid(snapshot.botPosition.y)}). Goal count: ${candidates.length}. ForceStage: ${forceStage}`,
    snapshot.botPosition,
    snapshot.playerPosition,
    snapshot.botRadius,
    snapshot.playerRadius,
    context.awareness.id,
    snapshot.obstacleRevision,
    context.debug.plannerStatus,
    context.pathIndex
  );

  let searchBounds = { ...snapshot.navigationBounds };
  if (forceStage === 'LOCAL') {
    const minX = Math.min(snapshot.botPosition.x, target.x) - 160;
    const maxX = Math.max(snapshot.botPosition.x, target.x) + 160;
    const minY = Math.min(snapshot.botPosition.y, target.y) - 160;
    const maxY = Math.max(snapshot.botPosition.y, target.y) + 160;
    searchBounds = { left: minX, right: maxX, top: minY, bottom: maxY };
  }

  recorder.recordEvent(
    snapshot.simTimeMs,
    'GREENFIELD_V2',
    context.currentState,
    'NONE',
    'PLANNING',
    'PLAN_STAGE_1_STARTED',
    `A* Stage 1 (LOCAL) started. Max Nodes: ${BOT_CONFIG_V2.plannerLocalMaxNodes}. Bounds: L:${searchBounds.left.toFixed(0)} R:${searchBounds.right.toFixed(0)} T:${searchBounds.top.toFixed(0)} B:${searchBounds.bottom.toFixed(0)}`,
    snapshot.botPosition,
    snapshot.playerPosition,
    snapshot.botRadius,
    snapshot.playerRadius,
    context.awareness.id,
    snapshot.obstacleRevision,
    context.debug.plannerStatus,
    context.pathIndex
  );

  let res = planPathV2(snapshot.botPosition, candidates, inflatedObstacles, snapshot.navigationBounds, searchBounds, BOT_CONFIG_V2.plannerLocalMaxNodes, snapshot);
  context.debug.nodesExpanded = res.nodesExpanded;

  if (res.type !== 'FULL') {
    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'PLANNING',
      res.type === 'PARTIAL' ? 'PLAN_STAGE_1_PARTIAL' : 'PLAN_STAGE_1_FAILED',
      `A* Stage 1 (LOCAL) did not find full path. Result: ${res.type || 'FAILED'}. Nodes expanded: ${res.nodesExpanded}`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness.id,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex,
      { nodesExpanded: res.nodesExpanded }
    );

    // Stage 2 expanded
    context.debug.plannerStage = 'EXPANDED';

    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'PLANNING',
      'PLAN_STAGE_2_STARTED',
      `A* Stage 2 (EXPANDED) fallback initiated. Max Nodes: ${BOT_CONFIG_V2.plannerExpandedMaxNodes}. Bounds: Full viewport`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness.id,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex
    );

    res = planPathV2(snapshot.botPosition, candidates, inflatedObstacles, snapshot.navigationBounds, snapshot.navigationBounds, BOT_CONFIG_V2.plannerExpandedMaxNodes, snapshot);
    context.debug.nodesExpanded += res.nodesExpanded;

    if (res.path) {
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'PLANNING',
        res.type === 'FULL' ? 'PLAN_STAGE_2_FULL' : 'PLAN_STAGE_2_PARTIAL',
        `A* Stage 2 (EXPANDED) completed. Result: ${res.type}. Path length: ${res.path.length}. Nodes expanded this stage: ${res.nodesExpanded}`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex,
        { pathType: res.type, nodesExpanded: res.nodesExpanded }
      );
    } else {
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'PLANNING',
        'PLAN_STAGE_2_FAILED',
        `A* Stage 2 (EXPANDED) failed to find any path to goal. Nodes expanded: ${res.nodesExpanded}`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );
    }
  } else {
    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'PLANNING',
      'PLAN_STAGE_1_FULL',
      `A* Stage 1 (LOCAL) found full path! Path length: ${res.path ? res.path.length : 0}. Nodes expanded: ${res.nodesExpanded}`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness.id,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex,
      { pathType: 'FULL', nodesExpanded: res.nodesExpanded }
    );
    context.debug.plannerStage = 'LOCAL';
  }

  if (res.path) {
    context.currentPath = simplifyPath(res.path);
    context.currentPathType = res.type;
    context.pathIndex = 0;
    context.currentGoalAnchor = target;
    context.currentPathGeneratedAtMs = snapshot.simTimeMs;
    context.progress.plannerFailures = 0;
    context.debug.plannerStatus = res.type === 'FULL' ? 'SUCCESS' : 'PARTIAL';

    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'PLANNING',
      'PATH_ADOPTED',
      `Adopted planned path. Simplified waypoints: ${context.currentPath.length}. Goal coordinate: (${res.selectedGoal?.x}, ${res.selectedGoal?.y})`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness.id,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex,
      { waypointsCount: context.currentPath.length }
    );
  } else {
    context.progress.plannerFailures++;
    context.debug.plannerStatus = 'FAILED';

    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'PLANNING',
      'PATH_DISCARDED',
      `No path found in any stage. Current path cleared. Planner failure count: ${context.progress.plannerFailures}`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness.id,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex
    );
  }
  
  context.debug.goalCandidates = candidates;
  context.debug.selectedGoal = res.selectedGoal;
}

