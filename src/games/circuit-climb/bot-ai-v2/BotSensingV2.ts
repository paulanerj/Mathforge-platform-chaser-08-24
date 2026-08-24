import { BotWorldSnapshotV2 } from './BotTypesV2';
import { BOT_PROFILES_V2, BOT_CONFIG_V2 } from './BotConfigV2';

export function getEdgeGap(snapshot: BotWorldSnapshotV2): number {
  const dx = snapshot.playerPosition.x - snapshot.botPosition.x;
  const dy = snapshot.playerPosition.y - snapshot.botPosition.y;
  const centerDist = Math.sqrt(dx * dx + dy * dy);
  return centerDist - snapshot.botRadius - snapshot.playerRadius;
}

export function checkNearSensor(snapshot: BotWorldSnapshotV2): boolean {
  const profile = BOT_PROFILES_V2[snapshot.difficulty] || BOT_PROFILES_V2.NORMAL;
  const edgeGap = getEdgeGap(snapshot);
  return edgeGap <= profile.nearDetectionGapPx;
}

export function checkRadarSensor(snapshot: BotWorldSnapshotV2, radarTimerMs: number): boolean {
  const profile = BOT_PROFILES_V2[snapshot.difficulty] || BOT_PROFILES_V2.NORMAL;
  const cycleTime = radarTimerMs % profile.radarPeriodMs;
  
  if (cycleTime > BOT_CONFIG_V2.radarDurationMs) {
    return false;
  }
  
  const progress = cycleTime / BOT_CONFIG_V2.radarDurationMs;
  const currentRadarRadius = progress * profile.radarMaxRadiusPx;
  
  const edgeGap = getEdgeGap(snapshot);
  
  // A hit occurs if the radar wave overlaps the gap
  // Actually, radar is drawn as a ring of some thickness.
  // We'll say it hits if the ring touches the player physical bounds.
  // Center distance is bot to player center. 
  // Radar radius is from bot center.
  // Hit if: currentRadarRadius >= (centerDist - playerRadius) AND currentRadarRadius <= (centerDist + playerRadius)
  // which is equivalent to edgeGap <= currentRadarRadius - botRadius?
  
  const dx = snapshot.playerPosition.x - snapshot.botPosition.x;
  const dy = snapshot.playerPosition.y - snapshot.botPosition.y;
  const centerDist = Math.sqrt(dx * dx + dy * dy);
  
  const playerNearEdge = centerDist - snapshot.playerRadius;
  const playerFarEdge = centerDist + snapshot.playerRadius;
  
  // Check if currentRadarRadius is within the player's bounds, plus some thickness
  const radarMin = currentRadarRadius - BOT_CONFIG_V2.radarWaveThicknessPx / 2;
  const radarMax = currentRadarRadius + BOT_CONFIG_V2.radarWaveThicknessPx / 2;
  
  return radarMax >= playerNearEdge && radarMin <= playerFarEdge;
}
