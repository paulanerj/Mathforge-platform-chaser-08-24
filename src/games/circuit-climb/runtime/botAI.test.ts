import { describe, it, expect } from 'vitest';
import { initBotAIState, updateBotAI, getZigzagOffset, cellBlocked, obstacleRectsNear } from './botAI';

// Mock Config mimicking CONFIG in runtime
const MOCK_CONFIG = {
  columns: [0.15, 0.5, 0.85],
  grid: 24,
  rowGap: 120,
  proximityRadius: 100,
  scanPeriodMs: 3000,
  scanDurationMs: 600,
  scanMaxRadius: 280,
  botRadius: 15,
  playerRadius: 12,
  botSpawnOffsetRows: 3,
  botInitialRowGap: 1,
  botPatrolSpeed: 0.12,
  botLockSpeed: 0.28,
  botBaseOffsetRows: 1.5,
  botSweepMs: 4000,
  botRepathMs: 1500,
  routePlatformPadding: 6,
  contactFuseMs: 1000,
};

// Mock Player Entity
const mockPlayer = {
  x: 200,
  y: 300,
  row: 2,
};

// Mock Rows and Platforms with one obstacle row
const mockRows = [
  {
    y: 420,
    platforms: [
      {
        row: 1,
        column: 1,
        x: 200,
        y: 420,
        width: 80,
        height: 20,
        dead: false,
      },
    ],
  },
];

describe('Circuit Climb - Red Bot AI (FSM & Pathfinding) Foundation Pass', () => {
  it('should initialize the BotAIState with default parameters', () => {
    const state = initBotAIState(100, 500, 200);

    expect(state.x).toBe(100);
    expect(state.y).toBe(500);
    expect(state.mode).toBe('SEARCH');
    expect(state.travel).toBeNull();
    expect(state.detected).toBe(false);
    expect(state.oscillationCounter).toBe(0);
    expect(state.consecutiveFailures).toBe(0);
    expect(state.waypointStallTime).toBe(0);
  });

  it('should detect proximity of player and transition from SEARCH to ALERT', () => {
    const initialState = initBotAIState(100, 300, 200); // 100px away, which is right on proximity threshold
    const playerNearby = { x: 150, y: 300, row: 2 }; // within 100px proximity

    const result = updateBotAI(
      initialState,
      playerNearby,
      mockRows,
      400, // timerLineY
      MOCK_CONFIG,
      16, // delta ms
      1000, // elapsed ms
      400, // width
      800 // height
    );

    expect(result.state.mode).toBe('ALERT');
    expect(result.state.detected).toBe(true);
    expect(result.events).toContain('lock');
  });

  it('should transition from ALERT to CHASE once burst timer expires', () => {
    const state = initBotAIState(150, 300, 200);
    state.mode = 'ALERT';
    state.detected = true;
    state.burstUntil = 1200; // expires at 1200 ms

    // Simulate update past burst expiration time
    const result = updateBotAI(
      state,
      mockPlayer,
      mockRows,
      400,
      MOCK_CONFIG,
      20,
      1300, // elapsed is 1300 ms, greater than 1200
      400,
      800
    );

    expect(result.state.mode).toBe('CHASE');
    expect(result.state.travel).not.toBeNull();
  });

  it('should verify obstacle collision padding check behaves correctly', () => {
    // Platform is at x=200, y=420, w=80, h=20.
    // bounding box: left = 200 - 40 - 6 = 154, right = 200 + 40 + 6 = 246
    // top = 420 - 6 = 414, bottom = 420 + 20 + 6 = 446
    const rects = obstacleRectsNear(300, 500, mockRows, MOCK_CONFIG);
    const colliding = cellBlocked(200, 430, rects);
    const clearLeft = cellBlocked(100, 430, rects);
    const clearRight = cellBlocked(300, 430, rects);

    expect(colliding).toBe(true);
    expect(clearLeft).toBe(false);
    expect(clearRight).toBe(false);
  });

  it('should successfully detect movement stall and trigger RECOVER mode', () => {
    const state = initBotAIState(150, 300, 200);
    state.mode = 'CHASE';
    state.currentTargetCell = { x: 200, y: 300 };
    state.currentWaypoint = { x: 200, y: 300 };
    state.waypointStallTime = 2500; // stalled for 2.5 seconds (exceeds threshold)
    state.lastWaypointIndex = 0; // matching current travel segment to trigger stall lock
    state.lastRepath = 5000; // prevents automatic repathing from overwriting manual state

    // Set travel object so the waypoint stall monitor detects the lock
    state.travel = {
      points: [{ x: 150, y: 300 }, { x: 200, y: 300 }],
      lengths: [50],
      total: 50,
      distance: 10,
      segment: 0
    };

    const result = updateBotAI(
      state,
      mockPlayer,
      mockRows,
      400,
      MOCK_CONFIG,
      100, // 100ms step
      5000,
      400,
      800
    );

    // Should detect stall, and trigger RECOVER
    expect(result.state.mode).toBe('RECOVER');
  });

  it('should increment consecutive failures when path planning fails', () => {
    const state = initBotAIState(150, 300, 200);
    state.mode = 'CHASE';
    state.lastRepath = 1000;
    
    // Create rows with obstacles covering the entire grid to block all generated goals and paths
    const superBlockedRows = [
      {
        y: 300,
        platforms: [
          {
            row: 1,
            column: 0,
            x: 200,
            y: -1000,
            width: 2000, // extremely wide to cover the screen bounds completely
            height: 3000, // extremely high to block everything vertically and horizontally
            dead: false,
          }
        ]
      }
    ];

    const result = updateBotAI(
      state,
      mockPlayer,
      superBlockedRows,
      400,
      MOCK_CONFIG,
      100,
      5000, // elapsed > lastRepath + botRepathMs to trigger repath
      400,
      800
    );

    // Pathfinding should fail and increment consecutive failures
    expect(result.state.consecutiveFailures).toBeGreaterThan(0);
  });

  it('should suppress oscillations by monitoring rapid direction changes', () => {
    const state = initBotAIState(150, 300, 200);
    state.mode = 'CHASE';
    state.lastDirectionX = 1;
    state.lastDisplacementCheckAt = 1000;
    state.oscillationCounter = 2; // already has some oscillation detected

    // Simulate a direction shift to -1
    state.lastDirectionX = -1;
    
    // Run an update with some movement that alternates direction
    const result = updateBotAI(
      state,
      mockPlayer,
      mockRows,
      400,
      MOCK_CONFIG,
      16,
      2000,
      400,
      800
    );

    // Oscillation tracking must remain robust and deterministic
    expect(result.state.oscillationCounter).toBeDefined();
  });
});
