/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vec2 } from '../bot-ai-v2/BotTypesV2';
import { BotWatchdogV3State } from './BotTypesV3';
import { DEFAULT_BOT_CONFIG_V3, BotConfigV3 } from './BotConfigV3';
import { recordV3Telemetry } from './BotTelemetryV3';

export function createInitialWatchdogV3(): BotWatchdogV3State {
  return {
    triggerPosition: null,
    stallStartMs: 0,
    blacklistedEdgeIds: new Set<string>(),
    triggerTimestamps: [],
    escalated: false,
    totalTriggers: 0,
  };
}

export function updateWatchdogV3(
  watchdog: BotWatchdogV3State,
  simTimeMs: number,
  intendedDisplacement: Vec2,
  committedDisplacement: Vec2,
  currentEdgeId: string | null,
  config: BotConfigV3 = DEFAULT_BOT_CONFIG_V3,
  botState: string = 'PATROL',
  routeStatus: string | null = null
): { watchdog: BotWatchdogV3State; triggered: boolean; escalated: boolean; reason: string | null } {
  const intendedLen = Math.hypot(intendedDisplacement.x, intendedDisplacement.y);
  const committedLen = Math.hypot(committedDisplacement.x, committedDisplacement.y);

  // Check if bot is attempting to move but making zero/near-zero progress
  const isStalled =
    intendedLen > 0.1 && committedLen < config.watchdogDisplacementThresholdPx;

  const nextState: BotWatchdogV3State = {
    ...watchdog,
    blacklistedEdgeIds: new Set(watchdog.blacklistedEdgeIds),
    triggerTimestamps: [...watchdog.triggerTimestamps],
  };

  if (routeStatus === 'NO_ROUTE') {
    const reason = botState === 'PATROL' ? 'V3_PATROL_NO_ROUTE' : 'V3_CHASE_NO_ROUTE';
    recordV3Telemetry('V3_WATCHDOG_TRIGGERED', `${reason}: No route available`, 'BOT_PROGRESS', {
      botState,
      routeStatus,
    });
  }

  if (!isStalled) {
    nextState.stallStartMs = simTimeMs;
    return { watchdog: nextState, triggered: false, escalated: false, reason: null };
  }

  const stallDuration = simTimeMs - watchdog.stallStartMs;
  if (stallDuration < config.watchdogStallThresholdMs) {
    return { watchdog: nextState, triggered: false, escalated: false, reason: null };
  }

  // Stall threshold exceeded! Trigger watchdog repair
  const failureReason = botState === 'PATROL' ? 'V3_PATROL_NO_PROGRESS' : 'V3_CHASE_NO_PROGRESS';

  recordV3Telemetry('V3_WATCHDOG_TRIGGERED', `${failureReason}: Stall detected for ${stallDuration.toFixed(0)}ms`, 'BOT_PROGRESS', {
    failureReason,
    stallDurationMs: stallDuration,
    intendedSpeed: intendedLen,
    committedSpeed: committedLen,
    currentEdgeId,
    botState,
  });

  if (currentEdgeId) {
    nextState.blacklistedEdgeIds.add(currentEdgeId);
    recordV3Telemetry('V3_EDGE_BLACKLISTED', `Blacklisted failed edge ${currentEdgeId}`, 'BOT_PROGRESS', {
      edgeId: currentEdgeId,
    });
  }

  // Update rolling trigger timestamps within escalation window (10s)
  const windowStart = simTimeMs - config.watchdogEscalationWindowMs;
  const activeTimestamps = watchdog.triggerTimestamps.filter((t) => t >= windowStart);
  activeTimestamps.push(simTimeMs);
  nextState.triggerTimestamps = activeTimestamps;
  nextState.totalTriggers += 1;

  // Reset stallStartMs so watchdog doesn't re-trigger every single frame
  nextState.stallStartMs = simTimeMs;

  let escalated = false;
  if (activeTimestamps.length >= config.watchdogEscalationMaxCount) {
    escalated = true;
    nextState.escalated = true;
    nextState.triggerTimestamps = []; // Reset after escalation

    recordV3Telemetry(
      'V3_WATCHDOG_ESCALATED',
      `Watchdog escalated (${failureReason}): ${activeTimestamps.length} stalls in 10s. Forcing safety snap & patrol reset.`,
      'BOT_PROGRESS',
      { totalTriggers: nextState.totalTriggers, failureReason }
    );
  } else {
    recordV3Telemetry('V3_WATCHDOG_REPLAN', `Triggering emergency route replan (${failureReason}) excluding blacklisted edges`, 'BOT_PROGRESS');
  }

  return {
    watchdog: nextState,
    triggered: true,
    escalated,
    reason: failureReason,
  };
}
