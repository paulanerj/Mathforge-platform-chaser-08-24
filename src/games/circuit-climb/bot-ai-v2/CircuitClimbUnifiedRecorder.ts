/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vec2 } from './BotTypesV2';

export type DiagnosticSource =
  | 'USER'
  | 'PLAYER'
  | 'BOT_SENSOR'
  | 'BOT_AWARENESS'
  | 'BOT_STATE'
  | 'BOT_TARGET'
  | 'BOT_PLANNER'
  | 'BOT_MOVEMENT'
  | 'BOT_PROGRESS'
  | 'BOT_RECOVERY'
  | 'COLLISION'
  | 'RUNTIME'
  | 'ERROR';

export interface CircuitClimbDiagnosticEvent {
  sequence: number;
  simTimeMs: number;
  realTimeMs?: number;

  source: DiagnosticSource;
  event: string;
  reason?: string;

  playerPosition?: Vec2;
  botPosition?: Vec2;

  playerRow?: number;
  playerPlatformId?: string | null;
  playerMovementState?: string;

  botState?: string;
  botEngine?: string;

  awarenessEpisodeId?: number | null;
  targetVersion?: number;
  pathTargetVersion?: number;

  currentGoalId?: string | null;
  currentGoalPurpose?: string | null;
  currentPathIndex?: number;
  currentPathLength?: number;

  intendedMovement?: Vec2;
  committedMovement?: Vec2;

  data?: Record<string, string | number | boolean | null>;
}

export interface DiagnosticSummary {
  session: {
    engine: string;
    difficulty: string;
    viewport: { width: number; height: number };
    durationMs: number;
    frameCount: number;
  };
  user: {
    platformSelections: number;
    correctSelections: number;
    wrongSelections: number;
    restarts: number;
  };
  player: {
    moves: number;
    landings: number;
    rowsClimbed: number;
    finalRow: number;
    finalPosition: Vec2;
  };
  bot: {
    detectionEvents: number;
    awarenessEpisodes: number;
    alertCount: number;
    pursueCount: number;
    finalApproachCount: number;
    recoverCount: number;
    targetVersionChanges: number;
    replansRequested: number;
    replansSuppressed: number;
    plansAdopted: number;
    zeroIntentEvents: number;
    staleTargetWarnings: number;
    verticalProgressFailures: number;
    captures: number;
  };
  failureClassification: string[];
}

export type ConsoleOutputMode = 'OFF' | 'IMPORTANT' | 'VERBOSE';

export class CircuitClimbUnifiedRecorder {
  private static instance: CircuitClimbUnifiedRecorder | null = null;

  public static getInstance(): CircuitClimbUnifiedRecorder {
    if (!CircuitClimbUnifiedRecorder.instance) {
      CircuitClimbUnifiedRecorder.instance = new CircuitClimbUnifiedRecorder();
    }
    return CircuitClimbUnifiedRecorder.instance;
  }

  private sequenceCounter = 0;
  private readonly capacity = 1000;
  private ringBuffer: CircuitClimbDiagnosticEvent[] = [];
  private isRecording = true;

  // Sampling timers/stamps
  private lastMovementSampleMs = -1000;
  private lastSensorMissSampleMs = -1000;
  private lastHealthSampleMs = -1000;
  private lastStateHeartbeatMs = -1000;

  // Target stale & landing check stamps
  private lastPlayerLandingMs = -1000;
  private lastPlayerLandingTargetVersion = -1;
  private targetVersionChangedAfterLanding = false;

  // Progress reset thrash tracker
  private monitorResetTimes: number[] = [];

  // Failure window state
  private preservedFailureWindow: CircuitClimbDiagnosticEvent[] | null = null;

  // Console output mode
  private consoleMode: ConsoleOutputMode = 'IMPORTANT';

  // Active session metadata
  public activeEngine = 'V2_SIMPLIFIED';
  public activeDifficulty = 'NORMAL';
  public viewportWidth = 400;
  public viewportHeight = 800;
  public frameCount = 0;

  // Controllers update counters
  public simplifiedUpdateCount = 0;
  public frozenUpdateCount = 0;
  public legacyUpdateCount = 0;
  public simplifiedInstanceId = Math.floor(Math.random() * 1000000);

  // User & Player counters
  public platformSelections = 0;
  public correctSelections = 0;
  public wrongSelections = 0;
  public restarts = 0;

  private constructor() {
    this.setupGlobalErrorCapture();
  }

  public recordEvent(
    source: DiagnosticSource,
    eventName: string,
    payload: Partial<Omit<CircuitClimbDiagnosticEvent, 'sequence' | 'source' | 'event'>> = {}
  ): CircuitClimbDiagnosticEvent | null {
    if (!this.isRecording) return null;

    this.sequenceCounter++;

    const event: CircuitClimbDiagnosticEvent = {
      sequence: this.sequenceCounter,
      simTimeMs: payload.simTimeMs ?? 0,
      realTimeMs: Date.now(),
      source,
      event: eventName,
      ...payload,
    };

    this.ringBuffer.push(event);
    if (this.ringBuffer.length > this.capacity) {
      this.ringBuffer.shift();
    }

    this.logToConsole(event);

    // Diagnostics checks trigger
    this.evaluateAutomaticDiagnostics(event);

    return event;
  }

  public resetRecorder(): void {
    this.sequenceCounter = 0;
    this.ringBuffer = [];
    this.preservedFailureWindow = null;
    this.lastMovementSampleMs = -1000;
    this.lastSensorMissSampleMs = -1000;
    this.lastHealthSampleMs = -1000;
    this.lastStateHeartbeatMs = -1000;
    this.lastPlayerLandingMs = -1000;
    this.lastPlayerLandingTargetVersion = -1;
    this.targetVersionChangedAfterLanding = false;
    this.monitorResetTimes = [];
    this.frameCount = 0;
    this.simplifiedUpdateCount = 0;
    this.frozenUpdateCount = 0;
    this.legacyUpdateCount = 0;
    this.platformSelections = 0;
    this.correctSelections = 0;
    this.wrongSelections = 0;
    this.restarts = 0;
  }

  public setRecording(recording: boolean): void {
    this.isRecording = recording;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public setConsoleMode(mode: ConsoleOutputMode): void {
    this.consoleMode = mode;
  }

  public getConsoleMode(): ConsoleOutputMode {
    return this.consoleMode;
  }

  public getEvents(filter: string = 'ALL'): CircuitClimbDiagnosticEvent[] {
    if (filter === 'ALL') return [...this.ringBuffer];
    const norm = filter.toUpperCase().replace('_', ' ');
    return this.ringBuffer.filter((e) => {
      if (norm === 'USER') return e.source === 'USER';
      if (norm === 'PLAYER') return e.source === 'PLAYER';
      if (norm === 'BOT SENSOR') return e.source === 'BOT_SENSOR';
      if (norm === 'BOT AWARENESS') return e.source === 'BOT_AWARENESS';
      if (norm === 'BOT STATE') return e.source === 'BOT_STATE';
      if (norm === 'BOT TARGET') return e.source === 'BOT_TARGET';
      if (norm === 'BOT PLAN' || norm === 'BOT PLANNER') return e.source === 'BOT_PLANNER';
      if (norm === 'BOT MOVEMENT') return e.source === 'BOT_MOVEMENT';
      if (norm === 'BOT RECOVERY' || norm === 'BOT PROGRESS') return e.source === 'BOT_RECOVERY' || e.source === 'BOT_PROGRESS';
      if (norm === 'COLLISION') return e.source === 'COLLISION';
      if (norm === 'ERRORS' || norm === 'ERROR') return e.source === 'ERROR' || e.source === 'RUNTIME';
      return true;
    });
  }

  public triggerFailureWindowCapture(triggerEvent: CircuitClimbDiagnosticEvent): void {
    if (this.preservedFailureWindow) return; // preserve the first failure window

    const triggerIdx = this.ringBuffer.findIndex((e) => e.sequence === triggerEvent.sequence);
    if (triggerIdx === -1) return;

    const startIdx = Math.max(0, triggerIdx - 100);
    // Keep window of preceding 100 + trigger + next 50
    this.preservedFailureWindow = this.ringBuffer.slice(startIdx);
  }

  public updateAfterTrigger(simTimeMs: number): void {
    if (this.preservedFailureWindow) {
      // Keep adding events up to 50 events after trigger
      const currentFullBuffer = this.ringBuffer;
      const triggerSeq = this.preservedFailureWindow.find((e) =>
        [
          'BOT_VERTICAL_PROGRESS_STOPPED',
          'BOT_TARGET_STALE',
          'BOT_LANDING_WITHOUT_TARGET_UPDATE',
          'BOT_LANDING_WITHOUT_REPLAN',
          'BOT_STALE_PLAN_ADOPTED',
          'BOT_MOVEMENT_NOT_COMMITTED',
          'BOT_PROGRESS_MONITOR_RESET_THRASH',
          'PROJECT_ERROR',
          'PROJECT_WARNING',
          'PROJECT_ASSERTION_FAILED',
        ].includes(e.event)
      )?.sequence;

      if (triggerSeq) {
        const triggerIdx = currentFullBuffer.findIndex((e) => e.sequence === triggerSeq);
        if (triggerIdx !== -1) {
          const startIdx = Math.max(0, triggerIdx - 100);
          const endIdx = Math.min(currentFullBuffer.length, triggerIdx + 51);
          this.preservedFailureWindow = currentFullBuffer.slice(startIdx, endIdx);
        }
      }
    }
  }

  public getFailureWindow(): CircuitClimbDiagnosticEvent[] {
    if (this.preservedFailureWindow) {
      return [...this.preservedFailureWindow];
    }
    // Fallback to last 150 events
    return this.ringBuffer.slice(Math.max(0, this.ringBuffer.length - 150));
  }

  // Sampling checks
  public shouldSampleMovement(simTimeMs: number): boolean {
    if (simTimeMs - this.lastMovementSampleMs >= 250) {
      this.lastMovementSampleMs = simTimeMs;
      return true;
    }
    return false;
  }

  public shouldSampleSensorMiss(simTimeMs: number): boolean {
    if (simTimeMs - this.lastSensorMissSampleMs >= 1000) {
      this.lastSensorMissSampleMs = simTimeMs;
      return true;
    }
    return false;
  }

  public shouldSampleHealth(simTimeMs: number): boolean {
    if (simTimeMs - this.lastHealthSampleMs >= 1000) {
      this.lastHealthSampleMs = simTimeMs;
      return true;
    }
    return false;
  }

  public shouldSampleStateHeartbeat(simTimeMs: number): boolean {
    if (simTimeMs - this.lastStateHeartbeatMs >= 1000) {
      this.lastStateHeartbeatMs = simTimeMs;
      return true;
    }
    return false;
  }

  // Diagnostic logic
  private evaluateAutomaticDiagnostics(event: CircuitClimbDiagnosticEvent): void {
    if (event.event === 'PLAYER_LANDED') {
      this.lastPlayerLandingMs = event.simTimeMs;
      this.lastPlayerLandingTargetVersion = event.targetVersion ?? -1;
      this.targetVersionChangedAfterLanding = false;
    }

    if (event.event === 'BOT_TARGET_VERSION_CHANGED') {
      this.targetVersionChangedAfterLanding = true;
    }

    if (event.event === 'BOT_PROGRESS_MONITOR_RESET') {
      this.monitorResetTimes.push(event.simTimeMs);
      this.monitorResetTimes = this.monitorResetTimes.filter((t) => event.simTimeMs - t <= 1000);
      if (this.monitorResetTimes.length > 5) {
        const thrashEvent = this.recordEvent('BOT_PROGRESS', 'BOT_PROGRESS_MONITOR_RESET_THRASH', {
          simTimeMs: event.simTimeMs,
          reason: 'Monitor reset more than 5 times in 1 second without meaningful progress',
          botPosition: event.botPosition,
          playerPosition: event.playerPosition,
        });
        if (thrashEvent) this.triggerFailureWindowCapture(thrashEvent);
      }
    }

    if (
      [
        'BOT_VERTICAL_PROGRESS_STOPPED',
        'BOT_TARGET_STALE',
        'BOT_LANDING_WITHOUT_TARGET_UPDATE',
        'BOT_LANDING_WITHOUT_REPLAN',
        'BOT_STALE_PLAN_ADOPTED',
        'BOT_MOVEMENT_NOT_COMMITTED',
        'BOT_PROGRESS_MONITOR_RESET_THRASH',
        'PROJECT_ERROR',
        'PROJECT_WARNING',
        'PROJECT_ASSERTION_FAILED',
      ].includes(event.event)
    ) {
      this.triggerFailureWindowCapture(event);
    }
  }

  private logToConsole(event: CircuitClimbDiagnosticEvent): void {
    if (this.consoleMode === 'OFF') return;

    const isSampledNoise =
      event.event === 'BOT_MOVEMENT_SAMPLE' ||
      event.event === 'BOT_NEAR_SENSOR_MISS_SAMPLE' ||
      event.event === 'PLAYER_POSITION_SAMPLE' ||
      event.event === 'BOT_CONTROLLER_UPDATE_HEALTH' ||
      event.event === 'BOT_STATE_HEARTBEAT';

    if (this.consoleMode === 'IMPORTANT' && isSampledNoise) return;

    const sec = (event.simTimeMs / 1000).toFixed(3);
    const seqStr = String(event.sequence).padStart(4, '0');
    const prefix = `[CIRCUIT-BOT #${seqStr} ${sec}s ${event.source}]`;

    let details = `${event.event}`;
    if (event.reason) details += ` | ${event.reason}`;
    if (event.botState) details += ` | state=${event.botState}`;
    if (event.targetVersion !== undefined) details += ` | tv=${event.targetVersion}`;
    if (event.intendedMovement) {
      details += ` | int=(${event.intendedMovement.x.toFixed(1)},${event.intendedMovement.y.toFixed(1)})`;
    }
    if (event.committedMovement) {
      details += ` | com=(${event.committedMovement.x.toFixed(1)},${event.committedMovement.y.toFixed(1)})`;
    }

    console.log(`${prefix} ${details}`);
  }

  private setupGlobalErrorCapture(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (e) => {
      const msg = e.message || '';
      const filename = e.filename || '';
      if (
        msg.includes('makersuite') ||
        msg.includes('google.alkali') ||
        msg.includes('WebSocket') ||
        msg.includes('vite') ||
        msg.includes('hmr') ||
        filename.includes('gstatic.com') ||
        filename.includes('chrome-extension')
      ) {
        return;
      }

      this.recordEvent('ERROR', 'PROJECT_ERROR', {
        simTimeMs: 0,
        reason: msg,
        data: {
          stack: e.error?.stack || '',
          filename,
          lineno: e.lineno,
        },
      });
    });

    window.addEventListener('unhandledrejection', (e) => {
      const reason = e.reason;
      const msg = reason?.message || String(reason);
      if (msg.includes('makersuite') || msg.includes('google.alkali') || msg.includes('WebSocket')) return;

      this.recordEvent('ERROR', 'PROJECT_ERROR', {
        simTimeMs: 0,
        reason: `Unhandled Rejection: ${msg}`,
        data: { stack: reason?.stack || '' },
      });
    });
  }

  public buildSummary(): DiagnosticSummary {
    const events = this.ringBuffer;
    const lastEvent = events[events.length - 1];

    let alertCount = 0;
    let pursueCount = 0;
    let finalApproachCount = 0;
    let recoverCount = 0;
    let targetVersionChanges = 0;
    let replansRequested = 0;
    let replansSuppressed = 0;
    let plansAdopted = 0;
    let zeroIntentEvents = 0;
    let staleTargetWarnings = 0;
    let verticalProgressFailures = 0;
    let captures = 0;
    let detectionEvents = 0;
    let awarenessEpisodes = 0;

    let finalPlayerRow = 0;
    let finalPlayerPos = { x: 0, y: 0 };
    let playerLandings = 0;
    let playerMoves = 0;

    events.forEach((e) => {
      if (e.event === 'BOT_STATE_TRANSITION_ACCEPTED') {
        if (e.data?.requestedState === 'ALERT') alertCount++;
        if (e.data?.requestedState === 'PURSUE') pursueCount++;
        if (e.data?.requestedState === 'FINAL_APPROACH') finalApproachCount++;
        if (e.data?.requestedState === 'RECOVER') recoverCount++;
      }
      if (e.event === 'BOT_TARGET_VERSION_CHANGED') targetVersionChanges++;
      if (e.event === 'BOT_REPLAN_REQUESTED') replansRequested++;
      if (e.event === 'BOT_REPLAN_SUPPRESSED') replansSuppressed++;
      if (e.event === 'BOT_PLAN_ADOPTED') plansAdopted++;
      if (e.event === 'BOT_ZERO_INTENT') zeroIntentEvents++;
      if (e.event === 'BOT_TARGET_STALE') staleTargetWarnings++;
      if (e.event === 'BOT_VERTICAL_PROGRESS_STOPPED') verticalProgressFailures++;
      if (e.event === 'BOT_PLAYER_CONTACT' || e.event === 'PLAYER_CAPTURED') captures++;
      if (e.event === 'BOT_NEAR_SENSOR_HIT' || e.event === 'BOT_RADAR_SENSOR_HIT') detectionEvents++;
      if (e.event === 'BOT_AWARENESS_OPENED') awarenessEpisodes++;

      if (e.event === 'PLAYER_LANDED') {
        playerLandings++;
        if (e.playerRow) finalPlayerRow = Math.max(finalPlayerRow, e.playerRow);
      }
      if (e.event === 'PLAYER_MOVE_STARTED') playerMoves++;
      if (e.playerPosition) finalPlayerPos = e.playerPosition;
    });

    const failureClassification = this.classifyFailures();

    return {
      session: {
        engine: this.activeEngine,
        difficulty: this.activeDifficulty,
        viewport: { width: this.viewportWidth, height: this.viewportHeight },
        durationMs: lastEvent ? lastEvent.simTimeMs : 0,
        frameCount: this.frameCount,
      },
      user: {
        platformSelections: this.platformSelections,
        correctSelections: this.correctSelections,
        wrongSelections: this.wrongSelections,
        restarts: this.restarts,
      },
      player: {
        moves: playerMoves,
        landings: playerLandings,
        rowsClimbed: finalPlayerRow,
        finalRow: finalPlayerRow,
        finalPosition: finalPlayerPos,
      },
      bot: {
        detectionEvents,
        awarenessEpisodes,
        alertCount,
        pursueCount,
        finalApproachCount,
        recoverCount,
        targetVersionChanges,
        replansRequested,
        replansSuppressed,
        plansAdopted,
        zeroIntentEvents,
        staleTargetWarnings,
        verticalProgressFailures,
        captures,
      },
      failureClassification,
    };
  }

  public classifyFailures(): string[] {
    const events = this.ringBuffer;
    const classifications = new Set<string>();

    const hasErrors = events.some((e) => e.source === 'ERROR');
    if (hasErrors) classifications.add('PROJECT_RUNTIME_ERROR');

    const wrongController = events.some((e) => e.event === 'WRONG_CONTROLLER_CALLED');
    if (wrongController) classifications.add('WRONG_CONTROLLER_ACTIVE');

    const detection = events.some((e) => e.event === 'BOT_NEAR_SENSOR_HIT' || e.event === 'BOT_RADAR_SENSOR_HIT');
    if (!detection && events.length > 20) classifications.add('BOT_NEVER_DETECTED');

    const awarenessStale = events.some((e) => e.event === 'BOT_AWARENESS_POSITION_STALE');
    if (awarenessStale) classifications.add('BOT_AWARENESS_STALE');

    const targetNotUpdated = events.some((e) => e.event === 'BOT_LANDING_WITHOUT_TARGET_UPDATE');
    if (targetNotUpdated) classifications.add('BOT_TARGET_NOT_UPDATED');

    const noReplan = events.some((e) => e.event === 'BOT_LANDING_WITHOUT_REPLAN');
    if (noReplan) classifications.add('BOT_REPLAN_NOT_REQUESTED');

    const replanSuppressed = events.some((e) => e.event === 'BOT_REPLAN_SUPPRESSED');
    if (replanSuppressed) classifications.add('BOT_REPLAN_SUPPRESSED');

    const stalePlanAdopted = events.some((e) => e.event === 'BOT_STALE_PLAN_ADOPTED');
    if (stalePlanAdopted) classifications.add('BOT_PLAN_TARGET_STALE');

    const zeroMove = events.some((e) => e.event === 'BOT_ZERO_INTENT');
    if (zeroMove) classifications.add('BOT_ZERO_MOVEMENT');

    const notCommitted = events.some((e) => e.event === 'BOT_MOVEMENT_NOT_COMMITTED');
    if (notCommitted) classifications.add('BOT_MOVEMENT_NOT_COMMITTED');

    const lateralOnly = events.some((e) => e.event === 'BOT_LATERAL_ONLY_MOVEMENT');
    if (lateralOnly) classifications.add('BOT_LATERAL_ONLY');

    const resetThrash = events.some((e) => e.event === 'BOT_PROGRESS_MONITOR_RESET_THRASH');
    if (resetThrash) classifications.add('BOT_PROGRESS_MONITOR_RESET');

    const vertStopped = events.some((e) => e.event === 'BOT_VERTICAL_PROGRESS_STOPPED');
    if (vertStopped) classifications.add('BOT_PATH_COMPLETE_NO_EXIT');

    if (classifications.size === 0) {
      classifications.add('NO_FAILURE_DETECTED');
    }

    return Array.from(classifications);
  }
}
