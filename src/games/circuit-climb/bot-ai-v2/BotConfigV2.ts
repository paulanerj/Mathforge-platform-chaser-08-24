export interface BotDetectionProfileV2 {
  nearDetectionGapPx: number;
  radarMaxRadiusPx: number;
  radarPeriodMs: number;
  awarenessMemoryMs: number;
}

export const BOT_PROFILES_V2: Record<'EASY' | 'NORMAL' | 'HARD', BotDetectionProfileV2> = {
  EASY: {
    nearDetectionGapPx: 80,
    radarMaxRadiusPx: 230,
    radarPeriodMs: 2000,
    awarenessMemoryMs: 1800,
  },
  NORMAL: {
    nearDetectionGapPx: 110,
    radarMaxRadiusPx: 280,
    radarPeriodMs: 1500,
    awarenessMemoryMs: 2500,
  },
  HARD: {
    nearDetectionGapPx: 140,
    radarMaxRadiusPx: 320,
    radarPeriodMs: 1000,
    awarenessMemoryMs: 3200,
  }
};

export const BOT_CONFIG_V2 = {
  gridSize: 16,
  navMarginPx: 4,
  radarDurationMs: 680,
  radarWaveThicknessPx: 24,
  excitementDurationMs: 350,
  waypointArrivalPx: 20,
  plannerLocalMaxNodes: 2500,
  plannerExpandedMaxNodes: 8000,
  replanningIntervalMs: 150,
  playerMoveReplanDistPx: 48,
  pathStaleAgeMs: 1200,
  monitorNoProgressDistPx: 15,
  monitorNoProgressWindowMs: 600,
  monitorWaypointStallMs: 900,
  recoveryMaxDurationMs: 2500,
  alertCooldownMs: 1200,
  patrolSpeed: 100,
  chaseSpeed: 140,
  captureRadiusDiff: 5, // How much overlap needed for capture
  corridorSoftCost: 200,
  corridorRepulsionGain: 1.5,
  attackEnvelopeHalfWidthPx: 48,
  attackEnvelopeMinBelowPx: 100,
  attackEnvelopeMaxBelowPx: 260,
  attackEnvelopeTargetBelowPx: 160,
};
