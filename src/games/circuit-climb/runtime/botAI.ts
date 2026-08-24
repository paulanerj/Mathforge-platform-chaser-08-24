/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BotAIStateName = 'SEARCH' | 'ALERT' | 'CHASE' | 'HOLD' | 'RECOVER' | 'CAPTURED';

export interface CircuitClimbBotDetectionProfile {
  nearDetectionGapPx: number;
  radarMaxRadiusPx: number;
  radarPeriodMs: number;
  radarWaveThicknessPx: number;
  awarenessMemoryMs: number;
  loseDistancePx: number;
  reacquireCooldownMs: number;
}

export const BOT_DETECTION_PROFILES: Record<'EASY' | 'NORMAL' | 'HARD', CircuitClimbBotDetectionProfile> = {
  EASY: {
    nearDetectionGapPx: 30, // center-to-center distance approx 92px
    radarMaxRadiusPx: 190,
    radarPeriodMs: 3600,
    radarWaveThicknessPx: 12,
    awarenessMemoryMs: 2000,
    loseDistancePx: 320,
    reacquireCooldownMs: 3000,
  },
  NORMAL: {
    nearDetectionGapPx: 50, // center-to-center distance is exactly 112px (matching production)
    radarMaxRadiusPx: 235,  // matching production 235px
    radarPeriodMs: 2000,    // faster cadence than original 2700ms for active searching feel
    radarWaveThicknessPx: 16,
    awarenessMemoryMs: 3200, // reliable memory retention
    loseDistancePx: 450,
    reacquireCooldownMs: 2000,
  },
  HARD: {
    nearDetectionGapPx: 80, // center-to-center distance approx 142px
    radarMaxRadiusPx: 300,
    radarPeriodMs: 1200,    // fast cadence
    radarWaveThicknessPx: 24,
    awarenessMemoryMs: 5000,
    loseDistancePx: 600,
    reacquireCooldownMs: 1000,
  }
};

export function getBotDetectionProfile(level: number, difficulty: 'EASY' | 'NORMAL' | 'HARD'): CircuitClimbBotDetectionProfile {
  return BOT_DETECTION_PROFILES[difficulty] || BOT_DETECTION_PROFILES.NORMAL;
}

export interface BotWaypoints {
  points: Array<{ x: number; y: number }>;
  lengths: number[];
  total: number;
  distance: number;
  segment: number;
}

export interface BotAIState {
  x: number;
  y: number;
  mode: BotAIStateName;
  
  // Awareness
  detected: boolean;
  lastDetectedAt: number;
  detectedPosition: { x: number; y: number } | null;
  awarenessEpisodeId: number;
  hasExcited: boolean;
  wasInProximity: boolean;
  recoveryCooldownUntil: number;
  burstUntil: number;

  // Patrol
  patrolX: number;
  patrolY: number;
  sweepAt: number;
  lastRepath: number;

  // Radar/Pulse state
  scanTime: number;
  previousScanRadius: number;

  // Pathing / Goals
  travel: BotWaypoints | null;
  currentGoal: string;
  currentTargetCell: { x: number; y: number } | null;
  currentWaypoint: { x: number; y: number } | null;
  lastPlanTime: number;
  nodesExpanded: number;
  plannerStatus: 'idle' | 'planning' | 'success' | 'failed';
  plannerFailures: number;
  plannerRetryCount: number;
  currentSearchBounds: { left: number; right: number; top: number; bottom: number } | null;

  // Progress Monitor
  lastDisplacementCheckAt: number;
  lastDisplacementX: number;
  lastDisplacementY: number;
  oscillationCounter: number;
  lastDirectionX: number; // -1 or 1
  waypointStallTime: number;
  lastWaypointIndex: number;
  consecutiveFailures: number;

  // Recovery State
  recoveryTargetX: number;
  recoveryTargetY: number;
  
  // Vestigial fields for UI backward-compatibility
  contactTime: number;

  // Telemetry counters
  nearSensorHits: number;
  radarSensorHits: number;
  awarenessOpenedCount: number;
  awarenessRefreshedCount: number;
  alertStartedCount: number;
  chaseStartedCount: number;
  planSucceededCount: number;
  planPartialCount: number;
  planFailedCount: number;
  holdEnteredCount: number;
  recoverEnteredCount: number;
  awarenessClosedCount: number;
  captureContactCount: number;
}

// Pseudo-random number generator for determinism
function deterministicRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function initBotAIState(startX: number, startY: number, playerX: number): BotAIState {
  return {
    x: startX,
    y: startY,
    mode: 'SEARCH',
    
    detected: false,
    lastDetectedAt: -1e9,
    detectedPosition: null,
    awarenessEpisodeId: -1,
    hasExcited: false,
    wasInProximity: false,
    recoveryCooldownUntil: 0,
    burstUntil: 0,

    patrolX: playerX,
    patrolY: startY,
    sweepAt: 0,
    lastRepath: -1e9,

    scanTime: 0,
    previousScanRadius: -1,

    travel: null,
    currentGoal: 'none',
    currentTargetCell: null,
    currentWaypoint: null,
    lastPlanTime: -1e9,
    nodesExpanded: 0,
    plannerStatus: 'idle',
    plannerFailures: 0,
    plannerRetryCount: 0,
    currentSearchBounds: null,

    lastDisplacementCheckAt: 0,
    lastDisplacementX: startX,
    lastDisplacementY: startY,
    oscillationCounter: 0,
    lastDirectionX: 0,
    waypointStallTime: 0,
    lastWaypointIndex: -1,
    consecutiveFailures: 0,

    recoveryTargetX: startX,
    recoveryTargetY: startY,
    contactTime: 0,

    nearSensorHits: 0,
    radarSensorHits: 0,
    awarenessOpenedCount: 0,
    awarenessRefreshedCount: 0,
    alertStartedCount: 0,
    chaseStartedCount: 0,
    planSucceededCount: 0,
    planPartialCount: 0,
    planFailedCount: 0,
    holdEnteredCount: 0,
    recoverEnteredCount: 0,
    awarenessClosedCount: 0,
    captureContactCount: 0,
  };
}

// Check platform collisions with padding
export function obstacleRectsNear(y0: number, y1: number, rows: any[], CONFIG: any) {
  const padding = 6;
  const rects: any[] = [];
  const rowGap = CONFIG.rowGap || 205;
  rows.forEach((row) => {
    if (row.y < y0 - rowGap || row.y > y1 + rowGap) return;
    row.platforms.forEach((platform: any) => {
      if (platform.row === 0 && platform.column !== 1) return;
      rects.push({
        left: platform.x - platform.width / 2 - padding,
        right: platform.x + platform.width / 2 + padding,
        top: platform.y - padding,
        bottom: platform.y + platform.height + padding,
      });
    });
  });
  return rects;
}

export function cellBlocked(x: number, y: number, rects: any[]): boolean {
  return rects.some((rect) => x > rect.left && x < rect.right && y > rect.top && y < rect.bottom);
}

function pathMetrics(points: Array<{ x: number; y: number }>) {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const d = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    lengths.push(d);
    total += d;
  }
  return { lengths, total };
}

function pointOnPath(currentTravel: BotWaypoints) {
  let distance = currentTravel.distance;
  for (let i = 0; i < currentTravel.lengths.length; i += 1) {
    const length = currentTravel.lengths[i];
    if (distance <= length || i === currentTravel.lengths.length - 1) {
      const a = currentTravel.points[i];
      const b = currentTravel.points[i + 1];
      const amount = length === 0 ? 1 : clamp(distance / length, 0, 1);
      return { x: lerp(a.x, b.x, amount), segment: i };
    }
    distance -= length;
  }
  const end = currentTravel.points[currentTravel.points.length - 1];
  return { x: end.x, segment: currentTravel.lengths.length - 1 };
}

// Dynamic Zigzag cosmetic personality layer (only for visual rendering)
export function getZigzagOffset(botState: BotAIState, elapsed: number, rows: any[], player: any): number {
  if (botState.mode !== 'CHASE') return 0;
  
  // Calculate raw zigzag offset
  const rawOffset = Math.sin(elapsed * 0.008) * 6; // subtle 6px wave

  // Fade near target
  const distanceToPlayer = Math.hypot(player.x - botState.x, player.y - botState.y);
  let targetFade = clamp((distanceToPlayer - 40) / 40, 0, 1);

  // Fade near obstacles
  const rects = obstacleRectsNear(botState.y - 40, botState.y + 40, rows, { rowGap: 205 });
  let minDistanceToObstacle = 9999;
  for (const rect of rects) {
    const dx = Math.max(rect.left - botState.x, 0, botState.x - rect.right);
    const dy = Math.max(rect.top - botState.y, 0, botState.y - rect.bottom);
    const dist = Math.hypot(dx, dy);
    if (dist < minDistanceToObstacle) {
      minDistanceToObstacle = dist;
    }
  }
  let obstacleFade = clamp((minDistanceToObstacle - 20) / 20, 0, 1);

  return rawOffset * targetFade * obstacleFade;
}

// A* Planner with multi-goal capability and staged bounds
function findAStarPath(
  startX: number,
  startY: number,
  goals: Array<{ x: number; y: number }>,
  bounds: { left: number; right: number; top: number; bottom: number },
  rects: any[],
  CONFIG: any,
  botState: BotAIState
): { points: Array<{ x: number; y: number }> | null; expanded: number } {
  const unit = CONFIG.grid;
  const snap = (val: number) => Math.round(val / unit) * unit;
  
  const sx = snap(startX);
  const sy = snap(startY);

  const validGoals = goals.map(g => ({ x: snap(g.x), y: snap(g.y) })).filter(g => !cellBlocked(g.x, g.y, rects));
  if (validGoals.length === 0) {
    return { points: null, expanded: 0 };
  }

  const key = (x: number, y: number) => `${x},${y}`;
  const goalKeys = new Set(validGoals.map(g => key(g.x, g.y)));

  // Heuristic: Min Manhattan distance to any of the valid goals
  const h = (cx: number, cy: number) => {
    let minH = Infinity;
    for (const g of validGoals) {
      const dist = Math.abs(cx - g.x) + Math.abs(cy - g.y);
      if (dist < minH) minH = dist;
    }
    return minH;
  };

  // Node structures
  const openSetList: Array<{ x: number; y: number; g: number; f: number }> = [];
  const openSetMap = new Map<string, number>(); // key -> f
  const closedSet = new Set<string>();
  const cameFrom = new Map<string, string | null>();

  const startKey = key(sx, sy);
  const startH = h(sx, sy);
  
  openSetList.push({ x: sx, y: sy, g: 0, f: startH });
  openSetMap.set(startKey, startH);
  cameFrom.set(startKey, null);

  let expanded = 0;
  let foundKey: string | null = null;
  const guard = 5000;

  // Helper to treat starting cell as unblocked if we get pushed inside
  const isStart = (cx: number, cy: number) => cx === sx && cy === sy;

  while (openSetList.length > 0 && expanded < guard) {
    expanded += 1;

    // Linear scan to find the node with minimum f
    let minIdx = 0;
    for (let i = 1; i < openSetList.length; i++) {
      if (openSetList[i].f < openSetList[minIdx].f) {
        minIdx = i;
      }
    }

    const current = openSetList[minIdx];
    const currentKey = key(current.x, current.y);

    // Remove from open list
    openSetList.splice(minIdx, 1);
    openSetMap.delete(currentKey);
    closedSet.add(currentKey);

    // Goal reached?
    if (goalKeys.has(currentKey)) {
      foundKey = currentKey;
      break;
    }

    const neighbors = [
      [current.x + unit, current.y],
      [current.x - unit, current.y],
      [current.x, current.y + unit],
      [current.x, current.y - unit],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < bounds.left || nx > bounds.right || ny < bounds.top || ny > bounds.bottom) continue;
      
      const nKey = key(nx, ny);
      if (closedSet.has(nKey)) continue;

      // Start is always unblocked
      if (!isStart(nx, ny) && cellBlocked(nx, ny, rects)) continue;

      const tentativeG = current.g + unit;
      const existingG = openSetMap.has(nKey) ? (openSetMap.get(nKey)! - h(nx, ny)) : Infinity;

      if (tentativeG < existingG) {
        cameFrom.set(nKey, currentKey);
        const fScore = tentativeG + h(nx, ny);
        openSetMap.set(nKey, fScore);

        // Update list or add new node
        const nodeIdx = openSetList.findIndex(n => n.x === nx && n.y === ny);
        if (nodeIdx >= 0) {
          openSetList[nodeIdx].g = tentativeG;
          openSetList[nodeIdx].f = fScore;
        } else {
          openSetList.push({ x: nx, y: ny, g: tentativeG, f: fScore });
        }
      }
    }
  }

  if (!foundKey) return { points: null, expanded };

  // Reconstruct path
  const points: Array<{ x: number; y: number }> = [];
  let cursor: string | null | undefined = foundKey;
  while (cursor !== undefined && cursor !== null) {
    const [cx, cy] = cursor.split(',').map(Number);
    points.push({ x: cx, y: cy });
    cursor = cameFrom.get(cursor);
  }
  points.reverse();

  // Path pruning (remove collinear redundant midpoints)
  const cleaned = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    const previous = cleaned[cleaned.length - 1];
    if (point.x === previous.x && point.y === previous.y) continue;
    if (cleaned.length >= 2) {
      const before = cleaned[cleaned.length - 2];
      const sameX = before.x === previous.x && previous.x === point.x;
      const sameY = before.y === previous.y && previous.y === point.y;
      if (sameX || sameY) {
        cleaned[cleaned.length - 1] = point;
        continue;
      }
    }
    cleaned.push(point);
  }

  return { points: cleaned, expanded };
}

// Generate deterministic goals near player platform
function generateGoals(player: any, rows: any[], CONFIG: any): { goals: Array<{ x: number; y: number; label: string }> } {
  const goals: Array<{ x: number; y: number; label: string }> = [];

  // Find nearest platform
  let activePlatform = player.platform;
  if (!activePlatform) {
    let bestDist = Infinity;
    rows.forEach(row => {
      row.platforms.forEach((platform: any) => {
        const dist = Math.hypot(platform.x - player.x, platform.y - player.y);
        if (dist < bestDist) {
          bestDist = dist;
          activePlatform = platform;
        }
      });
    });
  }

  if (activePlatform) {
    const platY = activePlatform.y;
    const platL = activePlatform.x - activePlatform.width / 2;
    const platR = activePlatform.x + activePlatform.width / 2;
    
    // 1. Left of platform
    goals.push({ x: platL - 20, y: platY - 16, label: 'left-platform' });
    // 2. Right of platform
    goals.push({ x: platR + 20, y: platY - 16, label: 'right-platform' });
  }

  // 3. Above player
  goals.push({ x: player.x, y: player.y - 48, label: 'above-player' });
  // 4. Below player
  goals.push({ x: player.x, y: player.y + 48, label: 'below-player' });
  // 5. Nearest player tile
  goals.push({ x: player.x, y: player.y, label: 'nearest-player' });

  return { goals };
}

// Central planPath function utilizing Staged Search Bounds
function planPath(
  botState: BotAIState,
  player: any,
  rows: any[],
  CONFIG: any,
  width: number,
  height: number
): { points: Array<{ x: number; y: number }> | null; goalLabel: string } {
  botState.plannerRetryCount += 1;
  botState.lastPlanTime = botState.scanTime;

  const { goals } = generateGoals(player, rows, CONFIG);
  const unit = CONFIG.grid;

  // Staged Search Bounds Setup
  // Stage 1: Local Search
  const stage1Bounds = {
    left: Math.min(botState.x, player.x) - unit * 10,
    right: Math.max(botState.x, player.x) + unit * 10,
    top: Math.min(botState.y, player.y) - unit * 8,
    bottom: Math.max(botState.y, player.y) + unit * 8,
  };

  const rects1 = obstacleRectsNear(stage1Bounds.top, stage1Bounds.bottom, rows, CONFIG);
  
  botState.currentSearchBounds = stage1Bounds;
  botState.plannerStatus = 'planning';

  let result = findAStarPath(botState.x, botState.y, goals, stage1Bounds, rects1, CONFIG, botState);
  
  if (result.points) {
    botState.nodesExpanded = result.expanded;
    botState.plannerStatus = 'success';
    botState.consecutiveFailures = 0;
    botState.planSucceededCount = (botState.planSucceededCount || 0) + 1;
    
    // Find which goal we hit
    const end = result.points[result.points.length - 1];
    const snap = (v: number) => Math.round(v / unit) * unit;
    const hitGoal = goals.find(g => snap(g.x) === snap(end.x) && snap(g.y) === snap(end.y)) || { label: 'unknown' };
    
    return { points: result.points, goalLabel: hitGoal.label };
  }

  // Stage 2: Global Search (Expand bounds to full visible arena span)
  const stage2Bounds = {
    left: 0,
    right: width,
    top: Math.min(botState.y, player.y) - unit * 28,
    bottom: Math.max(botState.y, player.y) + unit * 28,
  };

  const rects2 = obstacleRectsNear(stage2Bounds.top, stage2Bounds.bottom, rows, CONFIG);
  botState.currentSearchBounds = stage2Bounds;

  result = findAStarPath(botState.x, botState.y, goals, stage2Bounds, rects2, CONFIG, botState);
  botState.nodesExpanded = result.expanded;

  if (result.points) {
    botState.plannerStatus = 'success';
    botState.consecutiveFailures = 0;
    botState.planPartialCount = (botState.planPartialCount || 0) + 1;

    const end = result.points[result.points.length - 1];
    const snap = (v: number) => Math.round(v / unit) * unit;
    const hitGoal = goals.find(g => snap(g.x) === snap(end.x) && snap(g.y) === snap(end.y)) || { label: 'unknown' };

    return { points: result.points, goalLabel: hitGoal.label };
  }

  // Both stages failed
  botState.plannerStatus = 'failed';
  botState.consecutiveFailures += 1;
  botState.plannerFailures += 1;
  botState.planFailedCount = (botState.planFailedCount || 0) + 1;

  return { points: null, goalLabel: 'none' };
}

// Main logic coordinator
export function updateBotAI(
  botState: BotAIState,
  player: any,
  rows: any[],
  timerLineY: number,
  CONFIG: any,
  delta: number,
  elapsed: number,
  width: number,
  height: number
): { state: BotAIState; movement: { x: number; y: number }; events: string[]; debug: any } {
  const events: string[] = [];
  
  // 1. Decoupled Player Sighting & Detection Systems
  const distance = Math.hypot(player.x - botState.x, player.y - botState.y);

  const previousCycle = Math.floor(botState.scanTime / CONFIG.scanPeriodMs);
  botState.scanTime += delta;
  const scanTimeInCycle = botState.scanTime % CONFIG.scanPeriodMs;
  
  if (Math.floor(botState.scanTime / CONFIG.scanPeriodMs) !== previousCycle) {
    events.push('scan');
  }

  // Expansion duration is always scanDurationMs (680ms)
  const scanDurationMs = CONFIG.scanDurationMs || 680;
  const scanRadius = scanTimeInCycle < scanDurationMs
    ? (scanTimeInCycle / scanDurationMs) * CONFIG.scanMaxRadius
    : -1;

  // Swept radial wavefront intersection
  let scanHit = false;
  const wavefrontThickness = CONFIG.radarWaveThicknessPx !== undefined ? CONFIG.radarWaveThicknessPx : 16;
  const playerRadius = CONFIG.playerRadius || 32;

  if (scanRadius >= 0 && botState.previousScanRadius >= 0 && scanRadius >= botState.previousScanRadius) {
    const minD = botState.previousScanRadius - wavefrontThickness - playerRadius;
    const maxD = scanRadius + playerRadius;
    if (distance >= minD && distance <= maxD) {
      scanHit = true;
    }
  } else if (scanRadius >= 0 && botState.previousScanRadius < 0) {
    const maxD = scanRadius + playerRadius;
    if (distance <= maxD) {
      scanHit = true;
    }
  }
  botState.previousScanRadius = scanRadius;

  // Continuous Near-Range Proximity Detection (edge-based or center fallback)
  let inProximity = false;
  if (CONFIG.nearDetectionGapPx !== undefined) {
    const botRadius = CONFIG.botRadius || 30;
    const edgeGap = distance - playerRadius - botRadius;
    inProximity = edgeGap <= CONFIG.nearDetectionGapPx;
  } else {
    inProximity = distance < CONFIG.proximityRadius;
  }

  // Increment telemetry counters for sensor hits on active frame
  if (inProximity) {
    botState.nearSensorHits = (botState.nearSensorHits || 0) + 1;
  }
  if (scanHit) {
    botState.radarSensorHits = (botState.radarSensorHits || 0) + 1;
  }

  // Sensed event triggers if either sensor detects the player
  const isSensed = inProximity || scanHit;
  
  if (isSensed) {
    botState.lastDetectedAt = elapsed;
    botState.detectedPosition = { x: player.x, y: player.y };

    if (!botState.detected) {
      botState.detected = true;
      botState.awarenessEpisodeId = elapsed;
      botState.hasExcited = false; // Prepared to play excitement when cooldown permits
      botState.awarenessOpenedCount = (botState.awarenessOpenedCount || 0) + 1;
      events.push('awareness_opened');
    } else {
      botState.awarenessRefreshedCount = (botState.awarenessRefreshedCount || 0) + 1;
    }
  }

  // Awareness memory decay guard with distance limit
  const awarenessMemoryMs = CONFIG.awarenessMemoryMs !== undefined ? CONFIG.awarenessMemoryMs : 3200;
  const loseDistancePx = CONFIG.loseDistancePx !== undefined ? CONFIG.loseDistancePx : 450;
  if (botState.detected && (elapsed - botState.lastDetectedAt > awarenessMemoryMs || distance > loseDistancePx)) {
    botState.detected = false;
    botState.detectedPosition = null;
    botState.awarenessClosedCount = (botState.awarenessClosedCount || 0) + 1;
    events.push('awareness_closed');
  }

  // 2. FSM Loop implementation
  const isCooldownActive = elapsed < botState.recoveryCooldownUntil;

  if (botState.mode === 'SEARCH') {
    // Move horizontally at patrol speeds
    botState.patrolY = timerLineY - CONFIG.botBaseOffsetRows * CONFIG.rowGap;
    
    if (Math.abs(botState.x - botState.patrolX) < CONFIG.grid && elapsed - botState.sweepAt > CONFIG.botSweepMs) {
      // Deterministic Sweep column selection
      const seed = Math.floor(elapsed) + Math.floor(botState.x);
      const choices = CONFIG.columns
        .map((fraction: number) => fraction * width)
        .filter((x: number) => Math.abs(x - botState.patrolX) > 40);
      
      if (choices.length) {
        const idx = Math.floor(deterministicRandom(seed) * choices.length);
        botState.patrolX = choices[idx];
      } else {
        botState.patrolX = width * 0.5;
      }
      botState.sweepAt = elapsed;
    }

    if (elapsed - botState.lastRepath > CONFIG.botRepathMs) {
      botState.lastRepath = elapsed;
      // Plan patrol route
      const { points } = planPath(botState, { x: botState.patrolX, y: botState.patrolY }, rows, CONFIG, width, height);
      if (points && points.length >= 2) {
        const metrics = pathMetrics(points);
        botState.travel = {
          points,
          lengths: metrics.lengths,
          total: metrics.total,
          distance: 0,
          segment: 0,
        };
      }
    }

    // Follow patrol waypoints
    if (botState.travel) {
      botState.travel.distance += CONFIG.botPatrolSpeed * delta;
      const point = pointOnPath(botState.travel);
      botState.x = point.x;
      botState.travel.segment = point.segment;
      if (botState.travel.distance >= botState.travel.total) {
        botState.travel = null;
      }
    } else {
      // Direct drift to target if untravelled
      const dx = botState.patrolX - botState.x;
      const step = CONFIG.botPatrolSpeed * delta;
      if (Math.abs(dx) > step) {
        botState.x += Math.sign(dx) * step;
      } else {
        botState.x = botState.patrolX;
      }
    }
    // Track timeline height continuously
    botState.y = botState.patrolY;

    // Detection transition to Alert/Chase
    if (botState.detected) {
      if (!isCooldownActive) {
        if (!botState.hasExcited) {
          botState.mode = 'ALERT';
          botState.burstUntil = elapsed + 300;
          botState.hasExcited = true;
          botState.alertStartedCount = (botState.alertStartedCount || 0) + 1;
          events.push('lock');
        } else {
          // Direct Chase/Hold if excitement already played in this awareness block
          const { points, goalLabel } = planPath(botState, player, rows, CONFIG, width, height);
          if (points && points.length >= 2) {
            const metrics = pathMetrics(points);
            botState.travel = {
              points,
              lengths: metrics.lengths,
              total: metrics.total,
              distance: 0,
              segment: 0,
            };
            botState.currentGoal = goalLabel;
            botState.currentTargetCell = points[points.length - 1];
            botState.mode = 'CHASE';
            botState.chaseStartedCount = (botState.chaseStartedCount || 0) + 1;
          } else {
            botState.mode = 'HOLD';
            botState.holdEnteredCount = (botState.holdEnteredCount || 0) + 1;
          }
        }
      } else {
        // Cooldown active: Bypass freeze-frame ALERT and go straight to pursuit!
        const { points, goalLabel } = planPath(botState, player, rows, CONFIG, width, height);
        if (points && points.length >= 2) {
          const metrics = pathMetrics(points);
          botState.travel = {
            points,
            lengths: metrics.lengths,
            total: metrics.total,
            distance: 0,
            segment: 0,
          };
          botState.currentGoal = goalLabel;
          botState.currentTargetCell = points[points.length - 1];
          botState.mode = 'CHASE';
          botState.chaseStartedCount = (botState.chaseStartedCount || 0) + 1;
        } else {
          botState.mode = 'HOLD';
          botState.holdEnteredCount = (botState.holdEnteredCount || 0) + 1;
        }
      }
    }

  } else if (botState.mode === 'ALERT') {
    // Jitter/Anticipation freeze frame
    if (elapsed >= botState.burstUntil) {
      // Transition out of freeze frame
      const { points, goalLabel } = planPath(botState, player, rows, CONFIG, width, height);
      if (points && points.length >= 2) {
        const metrics = pathMetrics(points);
        botState.travel = {
          points,
          lengths: metrics.lengths,
          total: metrics.total,
          distance: 0,
          segment: 0,
        };
        botState.currentGoal = goalLabel;
        botState.currentTargetCell = points[points.length - 1];
        botState.mode = 'CHASE';
        botState.chaseStartedCount = (botState.chaseStartedCount || 0) + 1;
      } else {
        // Pathfinding failure during discovery -> Enter HOLD instead of resetting
        botState.mode = 'HOLD';
        botState.holdEnteredCount = (botState.holdEnteredCount || 0) + 1;
      }
    }

  } else if (botState.mode === 'CHASE') {
    // Periodic repathing
    if (elapsed - botState.lastRepath > CONFIG.botRepathMs) {
      botState.lastRepath = elapsed;
      const { points, goalLabel } = planPath(botState, player, rows, CONFIG, width, height);
      if (points && points.length >= 2) {
        const metrics = pathMetrics(points);
        botState.travel = {
          points,
          lengths: metrics.lengths,
          total: metrics.total,
          distance: 0,
          segment: 0,
        };
        botState.currentGoal = goalLabel;
        botState.currentTargetCell = points[points.length - 1];
      } else {
        // Pathing lost -> Transition to threat HOLD
        botState.travel = null;
        botState.mode = 'HOLD';
        botState.holdEnteredCount = (botState.holdEnteredCount || 0) + 1;
      }
    }

    // Waypoint movement
    if (botState.travel) {
      botState.travel.distance += CONFIG.botLockSpeed * delta;
      const point = pointOnPath(botState.travel);
      botState.x = point.x;
      // Vertically, climb continuously along path nodes to keep grid alignment
      const currentSegment = point.segment;
      botState.travel.segment = currentSegment;
      
      const pts = botState.travel.points;
      const currentP = pts[currentSegment];
      const nextP = pts[currentSegment + 1] || currentP;
      const segLength = botState.travel.lengths[currentSegment] || 1;
      
      // Interpolate Y cleanly to avoid visual jumping
      const segDistance = botState.travel.distance - pts.slice(0, currentSegment).reduce((acc, _, i) => acc + botState.travel!.lengths[i], 0);
      const ratio = clamp(segDistance / segLength, 0, 1);
      botState.y = lerp(currentP.y, nextP.y, ratio);

      botState.currentWaypoint = nextP;

      // Completed chase waypoint path
      if (botState.travel.distance >= botState.travel.total) {
        botState.travel = null;
        if (botState.detected) {
          botState.mode = 'HOLD';
          botState.holdEnteredCount = (botState.holdEnteredCount || 0) + 1;
        } else {
          botState.mode = 'SEARCH';
        }
      }
    } else {
      botState.mode = 'HOLD';
      botState.holdEnteredCount = (botState.holdEnteredCount || 0) + 1;
    }

    // Direct transition back to search if awareness fully lost
    if (!botState.detected) {
      botState.mode = 'SEARCH';
    }

  } else if (botState.mode === 'HOLD') {
    // Keep pace with the rising timeline vertically
    botState.patrolY = timerLineY - CONFIG.botBaseOffsetRows * CONFIG.rowGap;
    const targetY = botState.patrolY;
    
    const dY = targetY - botState.y;
    const stepY = CONFIG.botPatrolSpeed * delta;
    if (Math.abs(dY) > stepY) {
      botState.y += Math.sign(dY) * stepY;
    } else {
      botState.y = targetY;
    }

    // Move horizontally towards player position, unless blocked
    const directionX = Math.sign(player.x - botState.x);
    if (directionX !== 0) {
      const stepX = CONFIG.botPatrolSpeed * delta * directionX;
      const nextX = botState.x + stepX;
      
      // Check for immediate obstacle block in the direction of movement
      const padding = 6;
      const rects = obstacleRectsNear(botState.y - 12, botState.y + 12, rows, CONFIG);
      if (!cellBlocked(nextX, botState.y, rects)) {
        botState.x = nextX;
      }
    }

    // Periodically retry pathing
    if (elapsed - botState.lastRepath > CONFIG.botRepathMs) {
      botState.lastRepath = elapsed;
      const { points, goalLabel } = planPath(botState, player, rows, CONFIG, width, height);
      if (points && points.length >= 2) {
        const metrics = pathMetrics(points);
        botState.travel = {
          points,
          lengths: metrics.lengths,
          total: metrics.total,
          distance: 0,
          segment: 0,
        };
        botState.currentGoal = goalLabel;
        botState.currentTargetCell = points[points.length - 1];
        botState.mode = 'CHASE'; // Re-engage chase!
        botState.chaseStartedCount = (botState.chaseStartedCount || 0) + 1;
      }
    }

    // Escape HOLD if awareness fully lost
    if (!botState.detected) {
      botState.mode = 'SEARCH';
    }

  } else if (botState.mode === 'RECOVER') {
    // Movement towards the recovery platform spot
    const dX = botState.recoveryTargetX - botState.x;
    const dY = botState.recoveryTargetY - botState.y;
    const speed = CONFIG.botPatrolSpeed;
    const step = speed * delta;

    if (Math.hypot(dX, dY) > step) {
      const angle = Math.atan2(dY, dX);
      botState.x += Math.cos(angle) * step;
      botState.y += Math.sin(angle) * step;
    } else {
      botState.x = botState.recoveryTargetX;
      botState.y = botState.recoveryTargetY;
      
      // Recovered successfully!
      botState.mode = 'SEARCH';
    }

    // Timeout recovery
    if (elapsed - botState.lastDisplacementCheckAt > 3000) {
      botState.mode = 'SEARCH';
    }
  }

  // 3. Progress Monitor implementation (protects from thrashes, deadlocks, stalls)
  if (botState.mode === 'CHASE' || botState.mode === 'SEARCH') {
    // A. Check for movement stalls (displacement)
    const displacementInterval = 1500;
    if (elapsed - botState.lastDisplacementCheckAt > displacementInterval) {
      const distanceMoved = Math.hypot(botState.x - botState.lastDisplacementX, botState.y - botState.lastDisplacementY);
      
      if (distanceMoved < 8) {
        // Stalled completely! Trigger Recovery mode
        triggerRecovery(botState, elapsed, rows, width, CONFIG);
        events.push('recover');
      } else {
        botState.lastDisplacementCheckAt = elapsed;
        botState.lastDisplacementX = botState.x;
        botState.lastDisplacementY = botState.y;
      }
    }

    // B. Check for oscillation (rapid flipping of direction)
    if (botState.travel) {
      const currentDirX = Math.sign(player.x - botState.x);
      if (currentDirX !== 0 && currentDirX !== botState.lastDirectionX) {
        if (botState.lastDirectionX !== 0) {
          botState.oscillationCounter += 1;
          if (botState.oscillationCounter > 4) {
            triggerRecovery(botState, elapsed, rows, width, CONFIG);
            events.push('recover');
          }
        }
        botState.lastDirectionX = currentDirX;
      }
    }

    // C. Check for waypoint index lock
    if (botState.travel) {
      if (botState.travel.segment === botState.lastWaypointIndex) {
        botState.waypointStallTime += delta;
        if (botState.waypointStallTime > 1800) {
          triggerRecovery(botState, elapsed, rows, width, CONFIG);
          events.push('recover');
        }
      } else {
        botState.lastWaypointIndex = botState.travel.segment;
        botState.waypointStallTime = 0;
      }
    }

    // D. Planner thrashing guard
    if (botState.consecutiveFailures > 3) {
      triggerRecovery(botState, elapsed, rows, width, CONFIG);
      events.push('recover');
    }
  }

  return {
    state: botState,
    movement: { x: botState.x, y: botState.y },
    events,
    debug: {
      mode: botState.mode,
      detected: botState.detected,
      episodeId: botState.awarenessEpisodeId,
      plannerStatus: botState.plannerStatus,
      failures: botState.plannerFailures,
      nodesExpanded: botState.nodesExpanded,
      lastPlanTime: botState.lastPlanTime,
      currentGoal: botState.currentGoal,
      oscillation: botState.oscillationCounter,
      bounds: botState.currentSearchBounds,
      // Telemetry counters
      nearSensorHits: botState.nearSensorHits,
      radarSensorHits: botState.radarSensorHits,
      awarenessOpenedCount: botState.awarenessOpenedCount,
      awarenessRefreshedCount: botState.awarenessRefreshedCount,
      alertStartedCount: botState.alertStartedCount,
      chaseStartedCount: botState.chaseStartedCount,
      planSucceededCount: botState.planSucceededCount,
      planPartialCount: botState.planPartialCount,
      planFailedCount: botState.planFailedCount,
      holdEnteredCount: botState.holdEnteredCount,
      recoverEnteredCount: botState.recoverEnteredCount,
      awarenessClosedCount: botState.awarenessClosedCount,
      captureContactCount: botState.captureContactCount,
    }
  };
}

// Initiate Recovery Mode logic
function triggerRecovery(botState: BotAIState, elapsed: number, rows: any[], width: number, CONFIG: any) {
  botState.mode = 'RECOVER';
  botState.recoverEnteredCount = (botState.recoverEnteredCount || 0) + 1;
  botState.travel = null;
  botState.oscillationCounter = 0;
  botState.consecutiveFailures = 0;
  botState.waypointStallTime = 0;
  botState.lastDisplacementCheckAt = elapsed;
  botState.lastDisplacementX = botState.x;
  botState.lastDisplacementY = botState.y;

  // Recovery goal: Nearest clear column center at current altitude
  let bestColX = width * 0.5;
  let minColDist = Infinity;
  const cols = CONFIG.columns.map((c: number) => c * width);
  const rects = obstacleRectsNear(botState.y - 15, botState.y + 15, rows, CONFIG);

  for (const cx of cols) {
    if (!cellBlocked(cx, botState.y, rects)) {
      const dist = Math.abs(cx - botState.x);
      if (dist < minColDist) {
        minColDist = dist;
        bestColX = cx;
      }
    }
  }

  botState.recoveryTargetX = bestColX;
  botState.recoveryTargetY = botState.y;
  botState.recoveryCooldownUntil = elapsed + (CONFIG.reacquireCooldownMs || 2200); // Ignore sights temporarily
}
