/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BotConfigV3 {
  botRadius: number;
  navSafetyMargin: number;
  inflatedPadding: number;
  columnsFraction: [number, number, number];
  speedPxPerMs: number;
  patrolSpeedPxPerMs: number;
  alertDurationMs: number;
  chaseMemoryMs: number;
  watchdogStallThresholdMs: number;
  watchdogDisplacementThresholdPx: number;
  watchdogEscalationMaxCount: number;
  watchdogEscalationWindowMs: number;
  lateralPenaltyPx: number;
  transitAvoidancePenaltyPx: number;
  minArrivalTolerancePx: number;
  arrivalMarginPx: number;
  nearDetectionGapPx: number;
  radarMaxRadiusPx: number;
  radarPeriodMs: number;
  radarWaveThicknessPx: number;
}

export const DEFAULT_BOT_CONFIG_V3: BotConfigV3 = {
  botRadius: 30,
  navSafetyMargin: 6,
  inflatedPadding: 6,
  columnsFraction: [0.18, 0.50, 0.82],
  speedPxPerMs: 0.32,
  patrolSpeedPxPerMs: 0.18,
  alertDurationMs: 180,
  chaseMemoryMs: 5000,
  watchdogStallThresholdMs: 600,
  watchdogDisplacementThresholdPx: 3.0,
  watchdogEscalationMaxCount: 3,
  watchdogEscalationWindowMs: 10000,
  lateralPenaltyPx: 30,
  transitAvoidancePenaltyPx: 80,
  minArrivalTolerancePx: 8,
  arrivalMarginPx: 4,
  nearDetectionGapPx: 50,
  radarMaxRadiusPx: 235,
  radarPeriodMs: 2000,
  radarWaveThicknessPx: 16,
};
