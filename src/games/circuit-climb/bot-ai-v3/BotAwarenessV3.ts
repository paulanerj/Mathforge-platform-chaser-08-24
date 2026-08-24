/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vec2, BotWorldSnapshotV2 } from '../bot-ai-v2/BotTypesV2';
import { BotAwarenessV3State } from './BotTypesV3';
import { DEFAULT_BOT_CONFIG_V3, BotConfigV3 } from './BotConfigV3';
import { recordV3Telemetry } from './BotTelemetryV3';

export function createInitialAwarenessV3(): BotAwarenessV3State {
  return {
    discovered: false,
    lastDetectedAtMs: -10000,
    detectedPosition: null,
    episodeId: 0,
    alertPlayed: false,
    lastTargetUpdateMs: -10000,
    chaseMemoryExpiryMs: 0,
  };
}

export function updateAwarenessV3(
  awareness: BotAwarenessV3State,
  snapshot: BotWorldSnapshotV2,
  config: BotConfigV3 = DEFAULT_BOT_CONFIG_V3
): { awareness: BotAwarenessV3State; newlyDiscovered: boolean; expired: boolean } {
  const { botPosition, playerPosition, simTimeMs, playerMovementState } = snapshot;
  const dist = Math.hypot(playerPosition.x - botPosition.x, playerPosition.y - botPosition.y);

  let detectedThisFrame = false;

  // 1. Near Gap Sensor Check
  if (dist <= config.nearDetectionGapPx + snapshot.playerRadius + snapshot.botRadius) {
    detectedThisFrame = true;
  }

  // 2. Radar Pulse Sensor Check
  if (!detectedThisFrame) {
    const radarPhase = (simTimeMs % config.radarPeriodMs) / config.radarPeriodMs;
    const currentRadarRadius = radarPhase * config.radarMaxRadiusPx;
    if (Math.abs(dist - currentRadarRadius) <= config.radarWaveThicknessPx) {
      detectedThisFrame = true;
    }
  }

  // 3. Player Movement Event Refresh
  const playerActiveMovement =
    playerMovementState === 'MOVE_STARTED' ||
    playerMovementState === 'IN_TRANSIT' ||
    playerMovementState === 'LANDING';

  let newlyDiscovered = false;
  let expired = false;

  const nextState: BotAwarenessV3State = { ...awareness };

  if (detectedThisFrame) {
    nextState.lastDetectedAtMs = simTimeMs;
    nextState.detectedPosition = { ...playerPosition };
    nextState.lastTargetUpdateMs = simTimeMs;
    nextState.chaseMemoryExpiryMs = simTimeMs + config.chaseMemoryMs;

    if (!awareness.discovered) {
      newlyDiscovered = true;
      nextState.discovered = true;
      nextState.episodeId = awareness.episodeId + 1;
      nextState.alertPlayed = false;

      recordV3Telemetry('V3_AWARENESS_ACQUIRED', `Player detected at distance ${dist.toFixed(1)}px`, 'BOT_AWARENESS', {
        episodeId: nextState.episodeId,
        distancePx: Math.round(dist),
      });
    } else {
      recordV3Telemetry('V3_AWARENESS_REFRESHED', `Awareness refreshed by direct sensor`, 'BOT_AWARENESS', {
        episodeId: nextState.episodeId,
      });
    }
  } else if (awareness.discovered && simTimeMs > awareness.chaseMemoryExpiryMs) {
    // Check for memory expiry first
    expired = true;
    nextState.discovered = false;
    nextState.alertPlayed = false;

    recordV3Telemetry('V3_AWARENESS_LOST', `Awareness memory expired after ${config.chaseMemoryMs}ms without detection`, 'BOT_AWARENESS', {
      episodeId: nextState.episodeId,
    });
  } else if (playerActiveMovement && awareness.discovered) {
    // Refresh memory on active player movement while awareness active
    nextState.lastTargetUpdateMs = simTimeMs;
    nextState.chaseMemoryExpiryMs = simTimeMs + config.chaseMemoryMs;
  }

  return {
    awareness: nextState,
    newlyDiscovered,
    expired,
  };
}
