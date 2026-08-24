import { BotProgressV2, BotWorldSnapshotV2, BotStateContextV2, isBotInsideAttackEnvelope, Rect } from './BotTypesV2';
import { BOT_CONFIG_V2 } from './BotConfigV2';
import { snapToGrid } from './BotGoalSelectorV2';
import { BotFlightRecorder } from './BotFlightRecorderV2';

export function checkProgressV2(
  snapshot: BotWorldSnapshotV2,
  context: BotStateContextV2,
  intendedMovementMagnitude: number,
  inflatedObstacles: Rect[] = []
): boolean {
  if (context.currentState !== 'PURSUE' && context.currentState !== 'FINAL_APPROACH' && context.currentState !== 'CHASE' && context.currentState !== 'HOLD') {
    return true; // only monitor active states
  }

  const prog = context.progress;
  const recorder = BotFlightRecorder.getInstance();

  if (context.attackSubState === 'STAGE' || context.attackSubState === 'STRIKE') {
    prog.lastPos = { ...snapshot.botPosition };
    prog.lastPosTimeMs = snapshot.simTimeMs;
    prog.waypointStallTimeMs = snapshot.simTimeMs;
    return true;
  }

  // INVARIANT 6 / Section 10: SEMANTIC_ZERO_MOVEMENT
  // If movement intent is zero and bot is NOT in attack envelope, trigger immediate failure!
  const insideEnvelope = isBotInsideAttackEnvelope(snapshot.botPosition, snapshot.playerPosition, inflatedObstacles).isInside;
  if (intendedMovementMagnitude === 0 && !insideEnvelope) {
    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'PROGRESS_RECOVERY',
      'SEMANTIC_ZERO_MOVEMENT_DETECTED',
      `Semantic Zero Movement: Bot movement intent magnitude is zero while outside attack envelope in state ${context.currentState}. Triggering immediate recovery.`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness?.id || 0,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex,
      { intendedMovementMagnitude, insideEnvelope }
    );
    return false; // IMMEDIATE FAULT!
  }

  const timeSinceLast = snapshot.simTimeMs - prog.lastPosTimeMs;

  if (timeSinceLast >= BOT_CONFIG_V2.monitorNoProgressWindowMs) {
    const dx = snapshot.botPosition.x - prog.lastPos.x;
    const dy = snapshot.botPosition.y - prog.lastPos.y;
    const distMoved = Math.sqrt(dx * dx + dy * dy);

    if (distMoved < BOT_CONFIG_V2.monitorNoProgressDistPx) {
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'PROGRESS_RECOVERY',
        'NO_PROGRESS_DETECTED',
        `No forward progress: Moved only ${distMoved.toFixed(1)}px (limit: ${BOT_CONFIG_V2.monitorNoProgressDistPx}px) in window of ${timeSinceLast}ms`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness?.id || 0,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex,
        { distMoved, windowMs: timeSinceLast }
      );
      return false; // NO PROGRESS
    }

    prog.lastPos = { ...snapshot.botPosition };
    prog.lastPosTimeMs = snapshot.simTimeMs;
  }

  // Waypoint stall
  if (context.pathIndex !== prog.lastWaypointIndex) {
    prog.lastWaypointIndex = context.pathIndex;
    prog.waypointStallTimeMs = snapshot.simTimeMs;
  } else {
    const stallTime = snapshot.simTimeMs - prog.waypointStallTimeMs;
    if (stallTime >= BOT_CONFIG_V2.monitorWaypointStallMs) {
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'PROGRESS_RECOVERY',
        'WAYPOINT_STALL_DETECTED',
        `Waypoint stall: Bot stuck on waypoint index ${context.pathIndex} for ${stallTime}ms (limit: ${BOT_CONFIG_V2.monitorWaypointStallMs}ms)`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness?.id || 0,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex,
        { waypointIndex: context.pathIndex, stallTimeMs: stallTime }
      );
      return false; // WAYPOINT STALL
    }
  }

  // Two cell oscillation
  const currentCell = `${snapToGrid(snapshot.botPosition.x)},${snapToGrid(snapshot.botPosition.y)}`;
  if (prog.recentCells[prog.recentCells.length - 1] !== currentCell) {
    prog.recentCells.push(currentCell);
    if (prog.recentCells.length > 5) prog.recentCells.shift();
    
    if (prog.recentCells.length >= 4) {
      const c1 = prog.recentCells[prog.recentCells.length - 1];
      const c2 = prog.recentCells[prog.recentCells.length - 2];
      const c3 = prog.recentCells[prog.recentCells.length - 3];
      const c4 = prog.recentCells[prog.recentCells.length - 4];
      if (c1 === c3 && c2 === c4 && c1 !== c2) {
        recorder.recordEvent(
          snapshot.simTimeMs,
          'GREENFIELD_V2',
          context.currentState,
          'NONE',
          'PROGRESS_RECOVERY',
          'TWO_CELL_OSCILLATION_DETECTED',
          `Two-cell oscillation: Bot trapped in ping-pong loop between ${c1} and ${c2}`,
          snapshot.botPosition,
          snapshot.playerPosition,
          snapshot.botRadius,
          snapshot.playerRadius,
          context.awareness?.id || 0,
          snapshot.obstacleRevision,
          context.debug.plannerStatus,
          context.pathIndex,
          { recentCells: [...prog.recentCells] }
        );
        return false; // OSCILLATION
      }
    }
  }

  return true;
}

export function checkProgress(snapshot: BotWorldSnapshotV2, context: BotStateContextV2): boolean {
  if (context.currentState !== 'CHASE' && context.currentState !== 'HOLD') {
    return true; // only monitor during active pathing
  }

  const prog = context.progress;

  if (context.attackSubState === 'STAGE' || context.attackSubState === 'STRIKE') {
    prog.lastPos = { ...snapshot.botPosition };
    prog.lastPosTimeMs = snapshot.simTimeMs;
    prog.waypointStallTimeMs = snapshot.simTimeMs;
    return true;
  }

  const recorder = BotFlightRecorder.getInstance();
  const timeSinceLast = snapshot.simTimeMs - prog.lastPosTimeMs;

  if (timeSinceLast >= BOT_CONFIG_V2.monitorNoProgressWindowMs) {
    const dx = snapshot.botPosition.x - prog.lastPos.x;
    const dy = snapshot.botPosition.y - prog.lastPos.y;
    const distMoved = Math.sqrt(dx * dx + dy * dy);

    if (distMoved < BOT_CONFIG_V2.monitorNoProgressDistPx) {
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'PROGRESS_RECOVERY',
        'NO_PROGRESS_DETECTED',
        `No forward progress: Moved only ${distMoved.toFixed(1)}px (limit: ${BOT_CONFIG_V2.monitorNoProgressDistPx}px) in window of ${timeSinceLast}ms`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness?.id || 0,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex,
        { distMoved, windowMs: timeSinceLast }
      );
      return false; // NO PROGRESS
    }

    prog.lastPos = { ...snapshot.botPosition };
    prog.lastPosTimeMs = snapshot.simTimeMs;
  }

  // Waypoint stall
  if (context.pathIndex !== prog.lastWaypointIndex) {
    prog.lastWaypointIndex = context.pathIndex;
    prog.waypointStallTimeMs = snapshot.simTimeMs;
  } else {
    const stallTime = snapshot.simTimeMs - prog.waypointStallTimeMs;
    if (stallTime >= BOT_CONFIG_V2.monitorWaypointStallMs) {
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'PROGRESS_RECOVERY',
        'WAYPOINT_STALL_DETECTED',
        `Waypoint stall: Bot stuck on waypoint index ${context.pathIndex} for ${stallTime}ms (limit: ${BOT_CONFIG_V2.monitorWaypointStallMs}ms)`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness?.id || 0,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex,
        { waypointIndex: context.pathIndex, stallTimeMs: stallTime }
      );
      return false; // WAYPOINT STALL
    }
  }

  // Two cell oscillation
  const currentCell = `${snapToGrid(snapshot.botPosition.x)},${snapToGrid(snapshot.botPosition.y)}`;
  if (prog.recentCells[prog.recentCells.length - 1] !== currentCell) {
    prog.recentCells.push(currentCell);
    if (prog.recentCells.length > 5) prog.recentCells.shift();
    
    // Check if oscillating between two cells
    if (prog.recentCells.length >= 4) {
      const c1 = prog.recentCells[prog.recentCells.length - 1];
      const c2 = prog.recentCells[prog.recentCells.length - 2];
      const c3 = prog.recentCells[prog.recentCells.length - 3];
      const c4 = prog.recentCells[prog.recentCells.length - 4];
      if (c1 === c3 && c2 === c4 && c1 !== c2) {
        recorder.recordEvent(
          snapshot.simTimeMs,
          'GREENFIELD_V2',
          context.currentState,
          'NONE',
          'PROGRESS_RECOVERY',
          'TWO_CELL_OSCILLATION_DETECTED',
          `Two-cell oscillation: Bot trapped in ping-pong loop between ${c1} and ${c2}`,
          snapshot.botPosition,
          snapshot.playerPosition,
          snapshot.botRadius,
          snapshot.playerRadius,
          context.awareness?.id || 0,
          snapshot.obstacleRevision,
          context.debug.plannerStatus,
          context.pathIndex,
          { recentCells: [...prog.recentCells] }
        );
        return false; // OSCILLATION
      }
    }
  }

  // Thrash is handled in state machine

  return true;
}
