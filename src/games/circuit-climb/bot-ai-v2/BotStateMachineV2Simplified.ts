import { BotWorldSnapshotV2, BotStateContextV2, Rect, isBotInsideAttackEnvelope, DEFAULT_ATTACK_ENVELOPE_CONFIG_V2 } from './BotTypesV2';
import { BOT_CONFIG_V2 } from './BotConfigV2';
import { updateAwareness } from './BotAwarenessV2';
import { checkProgressV2 } from './BotProgressMonitorV2';
import { getSemanticGoalCandidatesV2, snapToGrid } from './BotGoalSelectorV2';
import { planPathV2Simplified, simplifyPath } from './BotPlannerV2';
import { executeRecovery } from './BotRecoveryV2';
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

export function updateStateMachineSimplified(
  snapshot: BotWorldSnapshotV2,
  context: BotStateContextV2,
  lastMovementMagnitude: number
): void {
  const recorder = BotFlightRecorder.getInstance();
  const inflatedObstacles = inflateObstacles(snapshot);

  // Normalize legacy state names for backward compatibility
  if ((context.currentState as string) === 'CHASE' || (context.currentState as string) === 'HOLD') {
    context.currentState = 'PURSUE';
  } else if ((context.currentState as string) === 'STAGE' || (context.currentState as string) === 'STRIKE') {
    context.currentState = 'FINAL_APPROACH';
  }

  if (typeof context.lastObstacleRevision === 'undefined') {
    context.lastObstacleRevision = snapshot.obstacleRevision;
  }

  // Track target updates
  if (typeof context.targetVersion === 'undefined') {
    context.targetVersion = 1;
  }

  const playerPlatformChanged = snapshot.playerSupportingPlatformId !== context.lastPlayerPlatformId;
  const playerLandedOrMoved = snapshot.playerMovementState === 'MOVE_STARTED' || snapshot.playerMovementState === 'LANDING' || snapshot.playerMovementState === 'SETTLED';
  const distFromLastPos = context.lastTargetPosition
    ? Math.hypot(snapshot.playerPosition.x - context.lastTargetPosition.x, snapshot.playerPosition.y - context.lastTargetPosition.y)
    : 0;

  if ((playerPlatformChanged && snapshot.playerSupportingPlatformId !== null) || (playerLandedOrMoved && distFromLastPos > 24)) {
    context.targetVersion++;
    context.lastPlayerPlatformId = snapshot.playerSupportingPlatformId;
    context.lastTargetPosition = { ...snapshot.playerPosition };
  }

  // 1. Update Awareness
  updateAwareness(snapshot, context);

  // If we just gained awareness, trigger ALERT
  if (context.awareness && context.currentState === 'SEARCH') {
    if (snapshot.simTimeMs <= context.alertCooldownUntilMs) {
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'STATE_MACHINE',
        'STATE_TRANSITION_REJECTED',
        `Transition SEARCH to ALERT rejected due to active cooldown (${context.alertCooldownUntilMs - snapshot.simTimeMs}ms remaining).`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
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
        `Gained awareness. Entered ALERT state.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );

      // Reset progress tracking
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
  const centerDist = Math.hypot(dx, dy);
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
        `Bot captured player at distance ${centerDist.toFixed(1)}px.`,
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

  // 3. ALERT state handling
  if (context.currentState === 'ALERT') {
    if (!context.awareness?.excitementPlayed) {
      context.events.push({ type: 'PLAY_EXCITEMENT_SOUND' });
      context.events.push({ type: 'SHOW_ALERT_REACTION' });
      if (context.awareness) context.awareness.excitementPlayed = true;
    }

    const timeInAlert = snapshot.simTimeMs - (context.awareness?.openedAtMs || 0);
    if (timeInAlert > BOT_CONFIG_V2.excitementDurationMs) {
      const oldState = context.currentState;
      context.currentState = 'PURSUE';

      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        oldState,
        'STATE_MACHINE',
        'ALERT_TO_PURSUE',
        `Alert duration finished. Entered PURSUE state.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness?.id || 0,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );

      requestReplanSimplified(snapshot, context, inflatedObstacles);
    }
    return;
  }

  // 4. PURSUE state handling
  if (context.currentState === 'PURSUE') {
    if (!context.awareness) {
      context.currentState = 'SEARCH';
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        'SEARCH',
        'PURSUE',
        'STATE_MACHINE',
        'PURSUE_TO_SEARCH',
        `Awareness expired. Reverting to SEARCH.`,
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

    // Check if bot is inside Attack Envelope -> Transition to FINAL_APPROACH
    const envCheck = isBotInsideAttackEnvelope(snapshot.botPosition, snapshot.playerPosition, inflatedObstacles);
    if (envCheck.isInside) {
      context.currentState = 'FINAL_APPROACH';
      context.currentPath = null;
      context.currentPathType = null;

      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        'FINAL_APPROACH',
        'PURSUE',
        'STATE_MACHINE',
        'PURSUE_TO_FINAL_APPROACH',
        `Bot entered attack envelope (dx=${envCheck.dx.toFixed(1)}px, dy=${envCheck.dy.toFixed(1)}px). Transitioned to FINAL_APPROACH.`,
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

    // Check progress monitor
    const progressOk = checkProgressV2(snapshot, context, lastMovementMagnitude, inflatedObstacles);
    if (!progressOk) {
      context.currentState = 'RECOVER';
      context.progress.recoveryStartTimeMs = snapshot.simTimeMs;
      context.progress.recoveryRung = 1;

      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        'RECOVER',
        'PURSUE',
        'STATE_MACHINE',
        'PURSUE_TO_RECOVER',
        `Progress check failed in PURSUE. Transitioned to RECOVER.`,
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

    // Check if replanning needed
    if (shouldReplanSimplified(snapshot, context)) {
      requestReplanSimplified(snapshot, context, inflatedObstacles);
    }
  }

  // 5. FINAL_APPROACH state handling
  if (context.currentState === 'FINAL_APPROACH') {
    if (!context.awareness) {
      context.currentState = 'SEARCH';
      return;
    }

    const envCheck = isBotInsideAttackEnvelope(snapshot.botPosition, snapshot.playerPosition, inflatedObstacles);
    const absDx = Math.abs(snapshot.botPosition.x - snapshot.playerPosition.x);
    const dy = snapshot.botPosition.y - snapshot.playerPosition.y;

    // Check if player moved outside approach envelope bounds
    const maxAllowedHalfWidth = DEFAULT_ATTACK_ENVELOPE_CONFIG_V2.envelopeHalfWidthPx * 1.5;
    const minAllowedBelow = DEFAULT_ATTACK_ENVELOPE_CONFIG_V2.envelopeMinBelowPx - 20;
    const maxAllowedBelow = DEFAULT_ATTACK_ENVELOPE_CONFIG_V2.envelopeMaxBelowPx + 40;

    if (absDx > maxAllowedHalfWidth || dy < minAllowedBelow || dy > maxAllowedBelow) {
      context.currentState = 'PURSUE';
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        'PURSUE',
        'FINAL_APPROACH',
        'STATE_MACHINE',
        'FINAL_APPROACH_TO_PURSUE',
        `Player moved outside valid approach envelope relationship (dx=${absDx.toFixed(1)}px, dy=${dy.toFixed(1)}px). Returning to PURSUE.`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness.id,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex
      );
      requestReplanSimplified(snapshot, context, inflatedObstacles);
      return;
    }

    const progressOk = checkProgressV2(snapshot, context, lastMovementMagnitude, inflatedObstacles);
    if (!progressOk) {
      context.currentState = 'RECOVER';
      context.progress.recoveryStartTimeMs = snapshot.simTimeMs;
      context.progress.recoveryRung = 1;

      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        'RECOVER',
        'FINAL_APPROACH',
        'STATE_MACHINE',
        'FINAL_APPROACH_TO_RECOVER',
        `Stall or zero movement in FINAL_APPROACH. Transitioned to RECOVER.`,
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
  }

  // 6. RECOVER state handling
  if (context.currentState === 'RECOVER') {
    // INVARIANT 5: Same-frame recovery exit forbidden!
    if (snapshot.simTimeMs === context.progress.recoveryStartTimeMs) {
      return;
    }

    // Execute recovery steps
    executeRecovery(snapshot, context, inflatedObstacles);

    // INVARIANT 4: RECOVER can exit to PURSUE only if material condition changed
    const botMovedDist = Math.hypot(
      snapshot.botPosition.x - context.progress.lastPos.x,
      snapshot.botPosition.y - context.progress.lastPos.y
    );
    const playerMoved = snapshot.playerMovementState === 'MOVE_STARTED' || snapshot.playerMovementState === 'IN_TRANSIT';
    const obstacleChanged = snapshot.obstacleRevision !== context.lastObstacleRevision;

    const materialConditionChanged = botMovedDist >= 16 || playerMoved || obstacleChanged || context.progress.recoveryRung >= 2 || context.pathTargetVersion !== context.targetVersion || !context.currentPath;

    if (materialConditionChanged) {
      // Attempt replan to see if valid pursuit plan is available
      const goals = getSemanticGoalCandidatesV2(
        snapshot,
        snapshot.botPosition,
        snapshot.playerPosition,
        inflatedObstacles,
        context.targetVersion,
        context.progress.recentCells
      );

      const planRes = planPathV2Simplified(
        snapshot.botPosition,
        goals,
        inflatedObstacles,
        snapshot.navigationBounds,
        snapshot.navigationBounds,
        BOT_CONFIG_V2.plannerExpandedMaxNodes,
        snapshot
      );

      if (planRes.outcome === 'REACHED_ATTACK_READY_GOAL' || planRes.outcome === 'REACHED_APPROACH_PROGRESS_GOAL' || planRes.outcome === 'PARTIAL_PROGRESS') {
        context.currentState = 'PURSUE';
        context.currentPath = planRes.path ? simplifyPath(planRes.path) : null;
        context.currentPathType = planRes.outcome === 'PARTIAL_PROGRESS' ? 'PARTIAL' : 'FULL';
        context.pathIndex = 0;
        context.currentPathGeneratedAtMs = snapshot.simTimeMs;
        context.pathTargetVersion = context.targetVersion;
        context.currentGoalAnchor = planRes.selectedGoal ? { ...planRes.selectedGoal.worldPosition } : { ...snapshot.playerPosition };
        context.progress.plannerFailures = 0;

        recorder.recordEvent(
          snapshot.simTimeMs,
          'GREENFIELD_V2',
          'PURSUE',
          'RECOVER',
          'PROGRESS_RECOVERY',
          'RECOVER_TO_PURSUE',
          `Recovery succeeded with outcome ${planRes.outcome}. Material condition met (moved: ${botMovedDist.toFixed(1)}px). Transitioned to PURSUE.`,
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
  }
}

export function shouldReplanSimplified(snapshot: BotWorldSnapshotV2, context: BotStateContextV2): boolean {
  if (snapshot.playerMovementState === 'MOVE_STARTED') {
    return true;
  }

  if (typeof context.lastObstacleRevision !== 'undefined' && snapshot.obstacleRevision !== context.lastObstacleRevision) {
    context.lastObstacleRevision = snapshot.obstacleRevision;
    return true;
  }

  // Target version updated (player changed platform, landed, or moved > 24px)
  if (typeof context.pathTargetVersion !== 'undefined' && context.pathTargetVersion !== context.targetVersion) {
    return true;
  }

  // Path absent, empty, or completed
  if (!context.currentPath || context.currentPath.length === 0) return true;
  if (context.pathIndex >= context.currentPath.length) return true;

  // Player position moved significantly from current goal anchor
  if (context.currentGoalAnchor) {
    const dist = Math.hypot(snapshot.playerPosition.x - context.currentGoalAnchor.x, snapshot.playerPosition.y - context.currentGoalAnchor.y);
    if (dist > 48) return true;
  }

  const age = snapshot.simTimeMs - context.currentPathGeneratedAtMs;
  if (age > BOT_CONFIG_V2.pathStaleAgeMs) return true;

  return false;
}

export function requestReplanSimplified(
  snapshot: BotWorldSnapshotV2,
  context: BotStateContextV2,
  inflatedObstacles: Rect[]
): void {
  if (!context.awareness) return;

  const recorder = BotFlightRecorder.getInstance();
  const goals = getSemanticGoalCandidatesV2(
    snapshot,
    snapshot.botPosition,
    snapshot.playerPosition,
    inflatedObstacles,
    context.targetVersion,
    context.progress.recentCells
  );

  recorder.recordEvent(
    snapshot.simTimeMs,
    'GREENFIELD_V2',
    context.currentState,
    'NONE',
    'GOAL_SELECTION',
    'GOAL_SET_CREATED',
    `Generated ${goals.length} semantic goals for target v${context.targetVersion} (ATTACK_READY: ${goals.filter(g => g.purpose === 'ATTACK_READY').length}, APPROACH: ${goals.filter(g => g.purpose === 'APPROACH_PROGRESS').length}).`,
    snapshot.botPosition,
    snapshot.playerPosition,
    snapshot.botRadius,
    snapshot.playerRadius,
    context.awareness.id,
    snapshot.obstacleRevision,
    context.debug.plannerStatus,
    context.pathIndex,
    { count: goals.length, targetVersion: context.targetVersion }
  );

  if (goals.length === 0) {
    context.currentPath = null;
    context.currentPathType = null;
    return;
  }

  const planRes = planPathV2Simplified(
    snapshot.botPosition,
    goals,
    inflatedObstacles,
    snapshot.navigationBounds,
    snapshot.navigationBounds,
    BOT_CONFIG_V2.plannerLocalMaxNodes,
    snapshot
  );

  if (planRes.path && planRes.path.length > 0) {
    context.currentPath = simplifyPath(planRes.path);
    context.currentPathType = planRes.outcome === 'PARTIAL_PROGRESS' ? 'PARTIAL' : 'FULL';
    context.pathIndex = 0;
    context.currentPathGeneratedAtMs = snapshot.simTimeMs;
    context.pathTargetVersion = context.targetVersion;
    context.currentGoalAnchor = planRes.selectedGoal ? { ...planRes.selectedGoal.worldPosition } : { ...snapshot.playerPosition };
    context.progress.plannerFailures = 0;
    context.debug.plannerStatus = planRes.outcome;
  } else {
    context.progress.plannerFailures++;
    context.debug.plannerStatus = planRes.outcome;
    context.currentState = 'RECOVER';
    context.progress.recoveryStartTimeMs = snapshot.simTimeMs;
  }
}
