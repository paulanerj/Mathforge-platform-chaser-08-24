import { BotWorldSnapshotV2, Vec2, Rect, BotGoalV2, isBotInsideAttackEnvelope, DEFAULT_ATTACK_ENVELOPE_CONFIG_V2 } from './BotTypesV2';
import { BOT_CONFIG_V2 } from './BotConfigV2';
import { BotFlightRecorder } from './BotFlightRecorderV2';

function isPointInRect(pt: Vec2, r: Rect) {
  return pt.x >= r.left && pt.x <= r.right && pt.y >= r.top && pt.y <= r.bottom;
}

export function isPointInPlayerTransitCorridor(pt: Vec2, snapshot: BotWorldSnapshotV2): boolean {
  if (snapshot.playerMovementState !== 'IN_TRANSIT' && snapshot.playerMovementState !== 'MOVE_STARTED' && snapshot.playerMovementState !== 'WRONG_RETURN') {
    return false;
  }
  
  if (!snapshot.playerRouteStartPosition || !snapshot.playerRouteDestination) {
    return false;
  }
  
  const xMin = Math.min(snapshot.playerRouteStartPosition.x, snapshot.playerRouteDestination.x) - 12;
  const xMax = Math.max(snapshot.playerRouteStartPosition.x, snapshot.playerRouteDestination.x) + 12;
  const yMin = Math.min(snapshot.playerRouteStartPosition.y, snapshot.playerRouteDestination.y) - 60;
  const yMax = Math.max(snapshot.playerRouteStartPosition.y, snapshot.playerRouteDestination.y) + 60;
  
  return pt.x >= xMin && pt.x <= xMax && pt.y >= yMin && pt.y <= yMax;
}

export function isCellBlocked(
  cellX: number, 
  cellY: number, 
  inflatedObstacles: Rect[], 
  navBounds: Rect,
  snapshot?: BotWorldSnapshotV2
): boolean {
  const pt = { x: cellX, y: cellY };
  if (!isPointInRect(pt, navBounds)) return true;
  for (const obs of inflatedObstacles) {
    if (isPointInRect(pt, obs)) return true;
  }
  if (snapshot && isPointInPlayerTransitCorridor(pt, snapshot)) {
    return true;
  }
  return false;
}

export function snapToGrid(val: number): number {
  return Math.round(val / BOT_CONFIG_V2.gridSize) * BOT_CONFIG_V2.gridSize;
}

export function getSemanticGoalCandidatesV2(
  snapshot: BotWorldSnapshotV2,
  botPos: Vec2,
  playerPos: Vec2,
  inflatedObstacles: Rect[],
  targetVersion: number,
  recentCells: string[] = []
): BotGoalV2[] {
  const recorder = BotFlightRecorder.getInstance();
  const goals: BotGoalV2[] = [];
  const gs = BOT_CONFIG_V2.gridSize;

  const botCell = { x: snapToGrid(botPos.x), y: snapToGrid(botPos.y) };
  const targetEnvelopeCenter = {
    x: playerPos.x,
    y: playerPos.y + DEFAULT_ATTACK_ENVELOPE_CONFIG_V2.envelopeTargetBelowPx
  };
  const botDistToEnvelopeCenter = Math.hypot(botPos.x - targetEnvelopeCenter.x, botPos.y - targetEnvelopeCenter.y);

  // Helper to add goal with start cell check
  const tryAddGoal = (
    cell: Vec2,
    purpose: BotGoalV2['purpose'],
    validForNextState: boolean
  ) => {
    // Check basic cell blockage (by platform/bounds)
    if (isCellBlocked(cell.x, cell.y, inflatedObstacles, snapshot.navigationBounds)) {
      return;
    }

    const isStartCell = cell.x === botCell.x && cell.y === botCell.y;
    const insideEnvelope = isBotInsideAttackEnvelope(botPos, playerPos, inflatedObstacles).isInside;

    if (isStartCell) {
      if (purpose === 'ATTACK_READY' && insideEnvelope) {
        // Valid attack ready goal at start cell!
        const goalId = `${purpose}_${cell.x}_${cell.y}_v${targetVersion}`;
        goals.push({
          id: goalId,
          cell,
          worldPosition: { x: cell.x, y: cell.y },
          purpose,
          targetVersion,
          validForNextState: true,
          progressTowardEnvelopePx: 0
        });
        recorder.recordEvent(
          snapshot.simTimeMs,
          'GREENFIELD_V2',
          'PURSUE',
          'NONE',
          'GOAL_SELECTION',
          'GOAL_CANDIDATE_ACCEPTED',
          `Start cell (${cell.x}, ${cell.y}) accepted as ATTACK_READY because bot is inside attack envelope.`,
          botPos,
          playerPos,
          snapshot.botRadius,
          snapshot.playerRadius,
          0,
          snapshot.obstacleRevision,
          '',
          0,
          { goalId }
        );
      } else {
        // Start cell rejected because semantic predicate is false!
        recorder.recordEvent(
          snapshot.simTimeMs,
          'GREENFIELD_V2',
          'PURSUE',
          'NONE',
          'GOAL_SELECTION',
          'GOAL_CANDIDATE_REJECTED',
          `Start cell (${cell.x}, ${cell.y}) rejected for purpose ${purpose}. Reason: CURRENT_CELL_NO_PROGRESS (inside envelope: ${insideEnvelope})`,
          botPos,
          playerPos,
          snapshot.botRadius,
          snapshot.playerRadius,
          0,
          snapshot.obstacleRevision,
          '',
          0,
          { cell, purpose, reason: 'CURRENT_CELL_NO_PROGRESS' }
        );
      }
      return;
    }

    const goalDistToCenter = Math.hypot(cell.x - targetEnvelopeCenter.x, cell.y - targetEnvelopeCenter.y);
    const progressTowardEnvelopePx = botDistToEnvelopeCenter - goalDistToCenter;

    // For approach goals, require measurable progress toward envelope
    if (purpose === 'APPROACH_PROGRESS' && progressTowardEnvelopePx < gs) {
      return;
    }

    const goalId = `${purpose}_${cell.x}_${cell.y}_v${targetVersion}`;
    goals.push({
      id: goalId,
      cell,
      worldPosition: { x: cell.x, y: cell.y },
      purpose,
      targetVersion,
      validForNextState,
      progressTowardEnvelopePx
    });
  };

  // 1. Generate ATTACK_READY candidates inside envelope
  const minEnvX = snapToGrid(playerPos.x - DEFAULT_ATTACK_ENVELOPE_CONFIG_V2.envelopeHalfWidthPx);
  const maxEnvX = snapToGrid(playerPos.x + DEFAULT_ATTACK_ENVELOPE_CONFIG_V2.envelopeHalfWidthPx);
  const minEnvY = snapToGrid(playerPos.y + DEFAULT_ATTACK_ENVELOPE_CONFIG_V2.envelopeMinBelowPx);
  const maxEnvY = snapToGrid(playerPos.y + DEFAULT_ATTACK_ENVELOPE_CONFIG_V2.envelopeMaxBelowPx);

  for (let x = minEnvX; x <= maxEnvX; x += gs) {
    for (let y = minEnvY; y <= maxEnvY; y += gs) {
      tryAddGoal({ x, y }, 'ATTACK_READY', true);
    }
  }

  // 2. Generate APPROACH_PROGRESS candidates in rings around target envelope center
  const targetX = snapToGrid(targetEnvelopeCenter.x);
  const targetY = snapToGrid(targetEnvelopeCenter.y);

  for (let r = 0; r <= 8; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) === r || Math.abs(dy) === r || r === 0) {
          const cx = targetX + dx * gs;
          const cy = targetY + dy * gs;
          tryAddGoal({ x: cx, y: cy }, 'APPROACH_PROGRESS', false);
        }
      }
    }
    if (goals.filter(g => g.purpose === 'APPROACH_PROGRESS').length >= 12) break;
  }

  // Deduplicate goals by ID
  const uniqueGoals: BotGoalV2[] = [];
  const seenIds = new Set<string>();
  for (const g of goals) {
    if (!seenIds.has(g.id)) {
      seenIds.add(g.id);
      uniqueGoals.push(g);
    }
  }

  return uniqueGoals;
}

export function getBelowPlayerAnchor(target: Vec2, snapshot: BotWorldSnapshotV2, inflatedObstacles: Rect[]): Vec2 {
  const anchorX = target.x;
  const anchorY = target.y + (snapshot.botBaseOffsetRows * snapshot.rowGap);
  
  let testX = snapToGrid(anchorX);
  let testY = snapToGrid(anchorY);
  
  if (!isCellBlocked(testX, testY, inflatedObstacles, snapshot.navigationBounds, snapshot)) {
    return { x: testX, y: testY };
  }
  
  const gs = BOT_CONFIG_V2.gridSize;
  const maxSearchRings = 10;
  for (let r = 1; r <= maxSearchRings; r++) {
    const steps = [
      { dx: 0, dy: r * gs },
      { dx: 0, dy: -r * gs },
      { dx: -r * gs, dy: 0 },
      { dx: r * gs, dy: 0 },
      { dx: -r * gs, dy: r * gs },
      { dx: r * gs, dy: r * gs },
      { dx: -r * gs, dy: -r * gs },
      { dx: r * gs, dy: -r * gs }
    ];
    for (const step of steps) {
      const cx = testX + step.dx;
      const cy = testY + step.dy;
      if (!isCellBlocked(cx, cy, inflatedObstacles, snapshot.navigationBounds, snapshot)) {
        return { x: cx, y: cy };
      }
    }
  }
  
  return { x: testX, y: testY };
}

export function getGoalCandidates(snapshot: BotWorldSnapshotV2, targetPos: Vec2, inflatedObstacles: Rect[]): Vec2[] {
  const candidates: Vec2[] = [];
  const startX = snapToGrid(targetPos.x);
  const startY = snapToGrid(targetPos.y);
  
  const MAX_RINGS = 6;
  const gs = BOT_CONFIG_V2.gridSize;

  for (let r = 1; r <= MAX_RINGS; r++) {
    // Generate deterministic ring cells
    for (let dx = -r; dx <= r; dx++) {
      const topCell = { x: startX + dx * gs, y: startY - r * gs };
      const bottomCell = { x: startX + dx * gs, y: startY + r * gs };
      
      [topCell, bottomCell].forEach(c => {
        // Filter out by transit corridor protection
        if (isPointInPlayerTransitCorridor(c, snapshot)) {
          BotFlightRecorder.getInstance().recordEvent(
            snapshot.simTimeMs,
            'GREENFIELD_V2',
            'CHASE',
            'NONE',
            'GOAL_SELECTION',
            'PLAN_NODE_FILTERED_BY_TRANSIT_PROTECTION',
            `Goal candidate at (${c.x}, ${c.y}) filtered by transit protection. Corridor limits: X[${(Math.min(snapshot.playerRouteStartPosition!.x, snapshot.playerRouteDestination!.x) - 12).toFixed(0)} - ${(Math.max(snapshot.playerRouteStartPosition!.x, snapshot.playerRouteDestination!.x) + 12).toFixed(0)}], Y[${(Math.min(snapshot.playerRouteStartPosition!.y, snapshot.playerRouteDestination!.y) - 60).toFixed(0)} - ${(Math.max(snapshot.playerRouteStartPosition!.y, snapshot.playerRouteDestination!.y) + 60).toFixed(0)}]. Player state: ${snapshot.playerMovementState}`,
            snapshot.botPosition,
            snapshot.playerPosition,
            snapshot.botRadius,
            snapshot.playerRadius,
            0,
            snapshot.obstacleRevision,
            '',
            0,
            { coordinate: c, corridor: { xMin: Math.min(snapshot.playerRouteStartPosition!.x, snapshot.playerRouteDestination!.x) - 12, xMax: Math.max(snapshot.playerRouteStartPosition!.x, snapshot.playerRouteDestination!.x) + 12, yMin: Math.min(snapshot.playerRouteStartPosition!.y, snapshot.playerRouteDestination!.y) - 60, yMax: Math.max(snapshot.playerRouteStartPosition!.y, snapshot.playerRouteDestination!.y) + 60 } }
          );
          return;
        }

        // Filter out lateral camping candidates
        if (Math.abs(c.y - snapshot.playerPosition.y) < snapshot.rowGap * 0.85) {
          return;
        }

        if (!isCellBlocked(c.x, c.y, inflatedObstacles, snapshot.navigationBounds, snapshot)) {
          candidates.push(c);
        }
      });
    }

    for (let dy = -r + 1; dy <= r - 1; dy++) {
      const leftCell = { x: startX - r * gs, y: startY + dy * gs };
      const rightCell = { x: startX + r * gs, y: startY + dy * gs };
      
      [leftCell, rightCell].forEach(c => {
        // Filter out by transit corridor protection
        if (isPointInPlayerTransitCorridor(c, snapshot)) {
          BotFlightRecorder.getInstance().recordEvent(
            snapshot.simTimeMs,
            'GREENFIELD_V2',
            'CHASE',
            'NONE',
            'GOAL_SELECTION',
            'PLAN_NODE_FILTERED_BY_TRANSIT_PROTECTION',
            `Goal candidate at (${c.x}, ${c.y}) filtered by transit protection. Corridor limits: X[${(Math.min(snapshot.playerRouteStartPosition!.x, snapshot.playerRouteDestination!.x) - 12).toFixed(0)} - ${(Math.max(snapshot.playerRouteStartPosition!.x, snapshot.playerRouteDestination!.x) + 12).toFixed(0)}], Y[${(Math.min(snapshot.playerRouteStartPosition!.y, snapshot.playerRouteDestination!.y) - 60).toFixed(0)} - ${(Math.max(snapshot.playerRouteStartPosition!.y, snapshot.playerRouteDestination!.y) + 60).toFixed(0)}]. Player state: ${snapshot.playerMovementState}`,
            snapshot.botPosition,
            snapshot.playerPosition,
            snapshot.botRadius,
            snapshot.playerRadius,
            0,
            snapshot.obstacleRevision,
            '',
            0,
            { coordinate: c, corridor: { xMin: Math.min(snapshot.playerRouteStartPosition!.x, snapshot.playerRouteDestination!.x) - 12, xMax: Math.max(snapshot.playerRouteStartPosition!.x, snapshot.playerRouteDestination!.x) + 12, yMin: Math.min(snapshot.playerRouteStartPosition!.y, snapshot.playerRouteDestination!.y) - 60, yMax: Math.max(snapshot.playerRouteStartPosition!.y, snapshot.playerRouteDestination!.y) + 60 } }
          );
          return;
        }

        // Filter out lateral camping candidates
        if (Math.abs(c.y - snapshot.playerPosition.y) < snapshot.rowGap * 0.85) {
          return;
        }

        if (!isCellBlocked(c.x, c.y, inflatedObstacles, snapshot.navigationBounds, snapshot)) {
          candidates.push(c);
        }
      });
    }
    
    if (candidates.length >= 8) {
      break;
    }
  }

  // Sort by deterministic distance to targetPos
  candidates.sort((a, b) => {
    const da = Math.abs(a.x - targetPos.x) + Math.abs(a.y - targetPos.y);
    const db = Math.abs(b.x - targetPos.x) + Math.abs(b.y - targetPos.y);
    if (da !== db) return da - db;
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });

  const unique: Vec2[] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    const key = `${c.x},${c.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
      if (unique.length >= 8) break;
    }
  }

  return unique;
}
