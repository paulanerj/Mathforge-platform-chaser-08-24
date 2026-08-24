import { Vec2, Rect, BotWorldSnapshotV2, BotGoalV2, BotPlanResultV2, isBotInsideAttackEnvelope } from './BotTypesV2';
import { BOT_CONFIG_V2 } from './BotConfigV2';
import { isCellBlocked, snapToGrid, isPointInPlayerTransitCorridor } from './BotGoalSelectorV2';

interface AStarNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

function heuristic(a: Vec2, b: Vec2) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export interface PlannerResult {
  path: Vec2[] | null;
  type: 'FULL' | 'PARTIAL' | null;
  nodesExpanded: number;
  selectedGoal: Vec2 | null;
}

export function planPathV2Simplified(
  start: Vec2,
  goals: BotGoalV2[],
  inflatedObstacles: Rect[],
  navBounds: Rect,
  searchBounds: Rect,
  maxNodes: number,
  snapshot: BotWorldSnapshotV2
): BotPlanResultV2 {
  if (goals.length === 0) {
    return {
      outcome: 'UNREACHABLE',
      path: null,
      selectedGoal: null,
      nodesExpanded: 0,
      progressPx: 0,
      reason: 'NO_GOALS_PROVIDED'
    };
  }

  const startX = snapToGrid(start.x);
  const startY = snapToGrid(start.y);

  if (isCellBlocked(startX, startY, inflatedObstacles, navBounds)) {
    return {
      outcome: 'UNREACHABLE',
      path: null,
      selectedGoal: null,
      nodesExpanded: 0,
      progressPx: 0,
      reason: 'START_CELL_BLOCKED'
    };
  }

  const openList: AStarNode[] = [];
  const closedSet = new Set<string>();
  const gs = BOT_CONFIG_V2.gridSize;

  const getMinH = (pt: Vec2) => Math.min(...goals.map(g => heuristic(pt, g.cell)));

  const startNode: AStarNode = {
    x: startX,
    y: startY,
    g: 0,
    h: getMinH({ x: startX, y: startY }),
    f: 0,
    parent: null
  };
  startNode.f = startNode.h;
  openList.push(startNode);

  let nodesExpanded = 0;
  let bestPartial: AStarNode = startNode;
  let bestGoal: BotGoalV2 | null = goals[0] || null;

  while (openList.length > 0 && nodesExpanded < maxNodes) {
    let bestIdx = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[bestIdx].f) bestIdx = i;
      else if (openList[i].f === openList[bestIdx].f && openList[i].h < openList[bestIdx].h) bestIdx = i;
    }
    const current = openList.splice(bestIdx, 1)[0];
    const key = `${current.x},${current.y}`;

    if (closedSet.has(key)) continue;
    closedSet.add(key);
    nodesExpanded++;

    // Check if goal reached
    const reachedGoal = goals.find(g => g.cell.x === current.x && g.cell.y === current.y);
    if (reachedGoal) {
      const isStartCell = current.x === startX && current.y === startY;
      const insideEnvelope = isBotInsideAttackEnvelope(start, snapshot.playerPosition, inflatedObstacles).isInside;

      if (isStartCell && reachedGoal.purpose !== 'ATTACK_READY') {
        // Start cell match for non-attack goal => NOT a valid success!
        // Continue search without returning 1-node path
      } else if (isStartCell && reachedGoal.purpose === 'ATTACK_READY' && !insideEnvelope) {
        // Start cell match for attack ready but predicate is false => NOT a valid success!
        // Continue search without returning 1-node path
      } else {
        const path: Vec2[] = [];
        let curr: AStarNode | null = current;
        while (curr) {
          path.push({ x: curr.x, y: curr.y });
          curr = curr.parent;
        }
        const outcome: BotPlanResultV2['outcome'] =
          reachedGoal.purpose === 'ATTACK_READY'
            ? 'REACHED_ATTACK_READY_GOAL'
            : 'REACHED_APPROACH_PROGRESS_GOAL';

        return {
          outcome,
          path: path.reverse(),
          selectedGoal: reachedGoal,
          nodesExpanded,
          progressPx: Math.hypot(current.x - startX, current.y - startY),
          reason: `GOAL_REACHED_${reachedGoal.purpose}`
        };
      }
    }

    // Track best partial node
    const currentH = getMinH(current);
    const bestPartialH = getMinH(bestPartial);
    if (currentH < bestPartialH) {
      bestPartial = current;
      let bg = goals[0];
      let bgh = heuristic(current, goals[0].cell);
      for (const g of goals) {
        const h = heuristic(current, g.cell);
        if (h < bgh) { bgh = h; bg = g; }
      }
      bestGoal = bg;
    }

    const dirs = [
      { dx: 0, dy: -gs },
      { dx: gs, dy: 0 },
      { dx: 0, dy: gs },
      { dx: -gs, dy: 0 }
    ];

    for (const d of dirs) {
      const nx = current.x + d.dx;
      const ny = current.y + d.dy;
      const nKey = `${nx},${ny}`;

      if (closedSet.has(nKey)) continue;
      if (nx < searchBounds.left || nx > searchBounds.right || ny < searchBounds.top || ny > searchBounds.bottom) continue;

      if (isCellBlocked(nx, ny, inflatedObstacles, navBounds)) continue;

      let stepCost = gs;
      // Soft transit corridor cost penalty
      if (isPointInPlayerTransitCorridor({ x: nx, y: ny }, snapshot)) {
        stepCost += BOT_CONFIG_V2.corridorSoftCost;
      }

      const g = current.g + stepCost;
      const h = getMinH({ x: nx, y: ny });

      openList.push({ x: nx, y: ny, g, h, f: g + h, parent: current });
    }
  }

  // Handle partial path if bestPartial is distinct from startNode
  if (bestPartial !== startNode) {
    const path: Vec2[] = [];
    let curr: AStarNode | null = bestPartial;
    while (curr) {
      path.push({ x: curr.x, y: curr.y });
      curr = curr.parent;
    }
    const pathRev = path.reverse();
    const progressPx = Math.hypot(bestPartial.x - startX, bestPartial.y - startY);

    if (progressPx >= gs) {
      return {
        outcome: 'PARTIAL_PROGRESS',
        path: pathRev,
        selectedGoal: bestGoal,
        nodesExpanded,
        progressPx,
        reason: 'BEST_PARTIAL_PATH_FOUND'
      };
    }
  }

  return {
    outcome: 'NO_PROGRESS',
    path: null,
    selectedGoal: null,
    nodesExpanded,
    progressPx: 0,
    reason: 'SEARCH_EXHAUSTED_NO_PROGRESS'
  };
}

export function planPathV2(
  start: Vec2,
  goals: Vec2[],
  inflatedObstacles: Rect[],
  navBounds: Rect,
  searchBounds: Rect,
  maxNodes: number,
  snapshot?: BotWorldSnapshotV2
): PlannerResult {
  if (goals.length === 0) return { path: null, type: null, nodesExpanded: 0, selectedGoal: null };

  const startX = snapToGrid(start.x);
  const startY = snapToGrid(start.y);
  
  if (isCellBlocked(startX, startY, inflatedObstacles, navBounds, snapshot)) {
    // If start is blocked, try to find nearest unblocked neighbor or just fail
    // For now we'll just fail to let recovery handle it
    return { path: null, type: null, nodesExpanded: 0, selectedGoal: null };
  }

  const openList: AStarNode[] = [];
  const closedSet = new Set<string>();
  const gs = BOT_CONFIG_V2.gridSize;

  const startNode: AStarNode = {
    x: startX,
    y: startY,
    g: 0,
    h: Math.min(...goals.map(g => heuristic({x: startX, y: startY}, g))),
    f: 0,
    parent: null
  };
  startNode.f = startNode.h;
  openList.push(startNode);

  let nodesExpanded = 0;
  let bestPartial: AStarNode = startNode;
  let bestGoal: Vec2 = goals[0];

  while (openList.length > 0 && nodesExpanded < maxNodes) {
    // Pop best
    let bestIdx = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[bestIdx].f) bestIdx = i;
      else if (openList[i].f === openList[bestIdx].f && openList[i].h < openList[bestIdx].h) bestIdx = i; // Tie break on h
    }
    const current = openList.splice(bestIdx, 1)[0];
    const key = `${current.x},${current.y}`;

    if (closedSet.has(key)) continue;
    closedSet.add(key);
    nodesExpanded++;

    // Check if goal reached
    const reachedGoal = goals.find(g => g.x === current.x && g.y === current.y);
    if (reachedGoal) {
      const path: Vec2[] = [];
      let curr: AStarNode | null = current;
      while (curr) {
        path.push({ x: curr.x, y: curr.y });
        curr = curr.parent;
      }
      return { path: path.reverse(), type: 'FULL', nodesExpanded, selectedGoal: reachedGoal };
    }

    // Track best partial (lowest h to any goal)
    const currentH = Math.min(...goals.map(g => heuristic(current, g)));
    const bestPartialH = Math.min(...goals.map(g => heuristic(bestPartial, g)));
    if (currentH < bestPartialH) {
      bestPartial = current;
      // approximate best goal for partial
      let bg = goals[0];
      let bgh = heuristic(current, goals[0]);
      for (const g of goals) {
        const h = heuristic(current, g);
        if (h < bgh) { bgh = h; bg = g; }
      }
      bestGoal = bg;
    }

    // Neighbors (deterministic order: up, right, down, left)
    const dirs = [
      { dx: 0, dy: -gs },
      { dx: gs, dy: 0 },
      { dx: 0, dy: gs },
      { dx: -gs, dy: 0 }
    ];

    for (const d of dirs) {
      const nx = current.x + d.dx;
      const ny = current.y + d.dy;
      const nKey = `${nx},${ny}`;
      
      if (closedSet.has(nKey)) continue;
      
      // Check search bounds
      if (nx < searchBounds.left || nx > searchBounds.right || ny < searchBounds.top || ny > searchBounds.bottom) continue;

      if (isCellBlocked(nx, ny, inflatedObstacles, navBounds, snapshot)) continue;

      const g = current.g + gs;
      const h = Math.min(...goals.map(g => heuristic({x: nx, y: ny}, g)));
      
      openList.push({ x: nx, y: ny, g, h, f: g + h, parent: current });
    }
  }

  // If we exhaust or hit maxNodes, return partial
  if (bestPartial !== startNode) {
    const path: Vec2[] = [];
    let curr: AStarNode | null = bestPartial;
    while (curr) {
      path.push({ x: curr.x, y: curr.y });
      curr = curr.parent;
    }
    return { path: path.reverse(), type: 'PARTIAL', nodesExpanded, selectedGoal: bestGoal };
  }

  return { path: null, type: null, nodesExpanded, selectedGoal: null };
}

// Function to simplify collinear points
export function simplifyPath(path: Vec2[]): Vec2[] {
  if (path.length <= 2) return path;
  const res: Vec2[] = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const prev = res[res.length - 1];
    const curr = path[i];
    const next = path[i+1];
    
    // Check if collinear
    if ((curr.x - prev.x) * (next.y - curr.y) === (curr.y - prev.y) * (next.x - curr.x)) {
      continue; // Skip collinear
    }
    res.push(curr);
  }
  res.push(path[path.length - 1]);
  return res;
}
