import { AwarenessEpisodeV2, BotWorldSnapshotV2, BotStateContextV2 } from './BotTypesV2';
import { BOT_PROFILES_V2 } from './BotConfigV2';
import { checkNearSensor, checkRadarSensor, getEdgeGap } from './BotSensingV2';
import { BotFlightRecorder } from './BotFlightRecorderV2';

let nextEpisodeId = 1;

export function updateAwareness(snapshot: BotWorldSnapshotV2, context: BotStateContextV2): void {
  const recorder = BotFlightRecorder.getInstance();
  const profile = BOT_PROFILES_V2[snapshot.difficulty] || BOT_PROFILES_V2.NORMAL;

  const isNear = checkNearSensor(snapshot);
  const isRadar = checkRadarSensor(snapshot, context.radarTimerMs);
  const detected = isNear || isRadar;

  const edgeGap = getEdgeGap(snapshot);
  const currentPulseId = Math.floor(context.radarTimerMs / profile.radarPeriodMs);
  const cycleTime = context.radarTimerMs % profile.radarPeriodMs;
  const isRadarActive = cycleTime <= 680; // radar duration is 680ms

  // Detect and log radar pulse started
  if (typeof (context as any)._lastPulseId === 'undefined' || (context as any)._lastPulseId !== currentPulseId) {
    (context as any)._lastPulseId = currentPulseId;
    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'SENSING',
      'RADAR_PULSE_STARTED',
      `Radar wave initiated. Period: ${profile.radarPeriodMs}ms. Max Radius: ${profile.radarMaxRadiusPx}px`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness?.id || 0,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex,
      { pulseId: currentPulseId, maxRadius: profile.radarMaxRadiusPx }
    );
  }

  // Throttle sampling logs to avoid ring buffer flood (every ~300ms)
  const shouldLogSample = snapshot.simTimeMs % 300 < snapshot.deltaMs;

  if (shouldLogSample) {
    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'SENSING',
      'NEAR_SENSOR_CHECK_SAMPLE',
      `Checking near sensor. Gap: ${edgeGap.toFixed(1)} px. Limit: ${profile.nearDetectionGapPx} px`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness?.id || 0,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex,
      { isNear, edgeGap }
    );

    if (isRadarActive) {
      const progress = cycleTime / 680;
      const currentRadius = progress * profile.radarMaxRadiusPx;
      const dx = snapshot.playerPosition.x - snapshot.botPosition.x;
      const dy = snapshot.playerPosition.y - snapshot.botPosition.y;
      const playerDist = Math.sqrt(dx * dx + dy * dy);
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'SENSING',
        'RADAR_EXPANSION_SAMPLE',
        `Radar wave expanding. Radius: ${currentRadius.toFixed(1)} px. Player distance: ${playerDist.toFixed(1)} px`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness?.id || 0,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex,
        { currentRadius, playerDist }
      );
    }
  }

  // Specific hits
  if (isNear) {
    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'SENSING',
      'NEAR_SENSOR_HIT',
      `Near sensor HIT! Gap ${edgeGap.toFixed(1)} px is within near limit ${profile.nearDetectionGapPx} px`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness?.id || 0,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex,
      { edgeGap }
    );
  }

  if (isRadar) {
    recorder.recordEvent(
      snapshot.simTimeMs,
      'GREENFIELD_V2',
      context.currentState,
      'NONE',
      'SENSING',
      'RADAR_SENSOR_HIT',
      `Radar wave HIT player! Overlaps at current wave front`,
      snapshot.botPosition,
      snapshot.playerPosition,
      snapshot.botRadius,
      snapshot.playerRadius,
      context.awareness?.id || 0,
      snapshot.obstacleRevision,
      context.debug.plannerStatus,
      context.pathIndex,
      { radarTimerMs: context.radarTimerMs }
    );
  }

  // Crossing detection (did wave radius cross player near edge?)
  const dx = snapshot.playerPosition.x - snapshot.botPosition.x;
  const dy = snapshot.playerPosition.y - snapshot.botPosition.y;
  const playerDist = Math.sqrt(dx * dx + dy * dy);
  const playerNearEdge = playerDist - snapshot.playerRadius;
  const currentRadius = isRadarActive ? (cycleTime / 680) * profile.radarMaxRadiusPx : 0;
  if (isRadarActive && currentRadius >= playerNearEdge) {
    if (typeof (context as any)._lastPulseCrossedId === 'undefined' || (context as any)._lastPulseCrossedId !== currentPulseId) {
      (context as any)._lastPulseCrossedId = currentPulseId;
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'SENSING',
        'RADAR_WAVE_CROSSED_PLAYER',
        `Radar wave front (${currentRadius.toFixed(1)}px) crossed player's near edge (${playerNearEdge.toFixed(1)}px)`,
        snapshot.botPosition,
        snapshot.playerPosition,
        snapshot.botRadius,
        snapshot.playerRadius,
        context.awareness?.id || 0,
        snapshot.obstacleRevision,
        context.debug.plannerStatus,
        context.pathIndex,
        { currentRadius, playerNearEdge }
      );
    }
  }

  if (detected) {
    if (!context.awareness) {
      context.awareness = {
        id: nextEpisodeId++,
        openedAtMs: snapshot.simTimeMs,
        lastConfirmedAtMs: snapshot.simTimeMs,
        lastKnownPlayerPosition: { ...snapshot.playerPosition },
        excitementPlayed: false
      };
      
      recorder.recordEvent(
        snapshot.simTimeMs,
        'GREENFIELD_V2',
        context.currentState,
        'NONE',
        'AWARENESS',
        'AWARENESS_EPISODE_OPENED',
        `Sensing confirmed. Opening awareness episode #${context.awareness.id}`,
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
      context.awareness.lastConfirmedAtMs = snapshot.simTimeMs;
      context.awareness.lastKnownPlayerPosition = { ...snapshot.playerPosition };
    }
  } else if (context.awareness) {
    // Keep lastKnownPlayerPosition fresh during active pursuit/alert states
    if (context.currentState === 'PURSUE' || context.currentState === 'FINAL_APPROACH' || context.currentState === 'ALERT') {
      context.awareness.lastKnownPlayerPosition = { ...snapshot.playerPosition };
    }
  }

  // Check expiration
  if (context.awareness) {
    const timeSinceConfirmed = snapshot.simTimeMs - context.awareness.lastConfirmedAtMs;
    
    if (timeSinceConfirmed > profile.awarenessMemoryMs) {
      if (edgeGap > profile.radarMaxRadiusPx) {
        const expiredId = context.awareness.id;
        context.awareness = null;
        
        recorder.recordEvent(
          snapshot.simTimeMs,
          'GREENFIELD_V2',
          context.currentState,
          'NONE',
          'AWARENESS',
          'AWARENESS_EPISODE_EXPIRED',
          `No sensor confirmation for ${timeSinceConfirmed}ms and gap ${edgeGap.toFixed(1)}px is beyond radar radius ${profile.radarMaxRadiusPx}px. Closed episode #${expiredId}`,
          snapshot.botPosition,
          snapshot.playerPosition,
          snapshot.botRadius,
          snapshot.playerRadius,
          0,
          snapshot.obstacleRevision,
          context.debug.plannerStatus,
          context.pathIndex
        );
      }
    }
  }
}
