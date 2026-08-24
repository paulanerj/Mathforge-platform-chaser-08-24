import { BotWorldSnapshotV2, BotStateContextV2, Vec2, Rect } from './BotTypesV2';
import { BOT_CONFIG_V2 } from './BotConfigV2';
import { snapToGrid, isCellBlocked } from './BotGoalSelectorV2';
import { BotFlightRecorder } from './BotFlightRecorderV2';

export function executeRecovery(snapshot: BotWorldSnapshotV2, context: BotStateContextV2, inflatedObstacles: Rect[]): void {
  const recorder = BotFlightRecorder.getInstance();
  
  // We're inside RECOVER state. Recovery ladder:
  // Rung 1: Discard path, expanded stage 2 planning. (Handled in transition to RECOVER -> StateMachine checks if replan possible)
  // Actually, state machine will try to transition to CHASE if replanning works.
  // If we are in RECOVER, it means replanning failed or progress failed.
  // We should just move to an escape cell (Rung 2/3).
  
  if (snapshot.simTimeMs - context.progress.recoveryStartTimeMs > BOT_CONFIG_V2.recoveryMaxDurationMs) {
    // Rung 4: Fail completely
    context.awareness = null;
    context.currentState = 'SEARCH';
    context.alertCooldownUntilMs = snapshot.simTimeMs + BOT_CONFIG_V2.alertCooldownMs;
    context.currentPath = null;
    context.currentPathType = null;

    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'RECOVER',
      'PROGRESS_RECOVERY',
      'RECOVERY_EXHAUSTED',
      `Recovery timer exceeded max duration of ${BOT_CONFIG_V2.recoveryMaxDurationMs}ms. Rung 4: Force clearing awareness and entering SEARCH cooldown.`,
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

  // Generate escape cell (Rung 2)
  if (!context.currentPath) {
    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'PROGRESS_RECOVERY',
      'RECOVERY_RUNG_2_STARTED',
      `Rung 1 (replanning) failed to recover. Starting Rung 2: Search for adjacent unblocked escape cell.`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness?.id || 0,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex
    );

    const startX = snapToGrid(snapshot.botPosition.x);
    const startY = snapToGrid(snapshot.botPosition.y);
    const gs = BOT_CONFIG_V2.gridSize;
    const dirs = [ {dx: -gs, dy: 0}, {dx: gs, dy: 0}, {dx: 0, dy: -gs}, {dx: 0, dy: gs} ];
    let foundCell = false;
    
    for (const d of dirs) {
      const nx = startX + d.dx;
      const ny = startY + d.dy;
      const nCell = `${nx},${ny}`;
      if (!context.progress.recentCells.includes(nCell) && !isCellBlocked(nx, ny, inflatedObstacles, snapshot.navigationBounds, snapshot)) {
        context.currentPath = [{ x: nx, y: ny }];
        context.pathIndex = 0;
        context.currentPathType = 'PARTIAL';
        foundCell = true;

        recorder.recordEvent(
          snapshot.simTimeMs,
          'GREENFIELD_V2',
          context.currentState,
          'NONE',
          'PROGRESS_RECOVERY',
          'RECOVERY_ESCAPE_CELL_FOUND',
          `Rung 2: Escape cell found at neighboring grid cell (${nx}, ${ny}). Pathing there.`,
          snapshot.botPosition,
          snapshot.playerPosition,
          snapshot.botRadius,
          snapshot.playerRadius,
          context.awareness?.id || 0,
          snapshot.obstacleRevision,
          context.debug.plannerStatus,
          context.pathIndex,
          { cell: nCell }
        );
        break;
      }
    }

    if (!foundCell) {
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'PROGRESS_RECOVERY',
        'RECOVERY_RUNG_3_STARTED',
        `Rung 2 failed: All adjacent grid cells are either blocked or recently visited. Initiating Rung 3 (Backtracking fallback).`,
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

  // If we have an escape path, just follow it. It's essentially HOLD behavior but in RECOVER.
}
