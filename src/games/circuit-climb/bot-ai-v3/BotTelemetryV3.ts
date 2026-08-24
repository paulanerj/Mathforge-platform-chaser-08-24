/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CircuitClimbUnifiedRecorder, DiagnosticSource } from '../bot-ai-v2/CircuitClimbUnifiedRecorder';
import { Vec2 } from '../bot-ai-v2/BotTypesV2';

export function recordV3Telemetry(
  eventName: string,
  reason?: string,
  source: DiagnosticSource = 'BOT_PLANNER',
  data?: Record<string, string | number | boolean | null>,
  extra?: {
    playerPosition?: Vec2;
    botPosition?: Vec2;
    targetVersion?: number;
    botState?: string;
    intendedMovement?: Vec2;
    committedMovement?: Vec2;
  }
) {
  const recorder = CircuitClimbUnifiedRecorder.getInstance();
  recorder.recordEvent(source, eventName, {
    reason,
    botEngine: 'PLATFORM_GRAPH_V3',
    data,
    playerPosition: extra?.playerPosition,
    botPosition: extra?.botPosition,
    targetVersion: extra?.targetVersion,
    botState: extra?.botState,
    intendedMovement: extra?.intendedMovement,
    committedMovement: extra?.committedMovement,
  });
}
