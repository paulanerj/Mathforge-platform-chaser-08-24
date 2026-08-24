/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BotStateV2, Vec2 } from './BotTypesV2';
import { CircuitClimbUnifiedRecorder, DiagnosticSource } from './CircuitClimbUnifiedRecorder';

export interface FlightRecordEvent {
  seq: number;
  simTimeMs: number;
  realTimeMs: number;
  activeAi: 'GREENFIELD_V2' | 'LEGACY';
  currentState: BotStateV2;
  previousState: BotStateV2 | 'NONE';
  category: 'LIFECYCLE' | 'FRAME_INVARIANTS' | 'SEARCH' | 'SENSING' | 'AWARENESS' | 'STATE_MACHINE' | 'GOAL_SELECTION' | 'PLANNING' | 'MOVEMENT' | 'PROGRESS_RECOVERY' | 'ERROR';
  eventName: string;
  triggerReason: string;
  botPos: Vec2;
  playerPos: Vec2;
  centerDist: number;
  edgeGap: number;
  awarenessEpisodeId: number;
  targetVersion: number;
  plannerStatus: string;
  waypointIndex: number;
  extraDetails?: Record<string, any>;
}

export interface ProjectErrorRecord {
  id: number;
  timestamp: number;
  message: string;
  stack?: string;
  sourceFile?: string;
  line?: number;
  snapshot?: string;
}

export class BotFlightRecorder {
  private static instance: BotFlightRecorder | null = null;

  public static getInstance(): BotFlightRecorder {
    if (!BotFlightRecorder.instance) {
      BotFlightRecorder.instance = new BotFlightRecorder();
    }
    return BotFlightRecorder.instance;
  }

  // Ring Buffer
  private readonly capacity = 1000;
  private events: FlightRecordEvent[] = [];
  private seqCounter = 0;
  private isPaused = false;

  // Project Error Capture
  private errors: ProjectErrorRecord[] = [];
  private errorCounter = 0;

  // Counters for report summary
  public counters = {
    nearChecks: 0,
    nearHits: 0,
    radarPulses: 0,
    radarHits: 0,
    awarenessEpisodes: 0,
    alertEntries: 0,
    chaseEntries: 0,
    holdEntries: 0,
    recoverEntries: 0,
    fullPlans: 0,
    partialPlans: 0,
    failedPlans: 0,
    zeroMovementIntents: 0,
    noProgressTriggers: 0,
    oscillationTriggers: 0,
    captures: 0,
    legacyUpdatesInV2: 0,
    radarMaxCrossedPlayer: 0,
  };

  private constructor() {
    this.setupGlobalErrorHandler();
  }

  public recordEvent(
    simTimeMs: number,
    activeAi: 'GREENFIELD_V2' | 'LEGACY',
    currentState: BotStateV2,
    previousState: BotStateV2 | 'NONE',
    category: FlightRecordEvent['category'],
    eventName: string,
    triggerReason: string,
    botPos: Vec2,
    playerPos: Vec2,
    botRadius: number,
    playerRadius: number,
    awarenessEpisodeId: number,
    targetVersion: number,
    plannerStatus: string,
    waypointIndex: number,
    extraDetails?: Record<string, any>
  ): void {
    if (this.isPaused) return;

    const dx = playerPos.x - botPos.x;
    const dy = playerPos.y - botPos.y;
    const centerDist = Math.sqrt(dx * dx + dy * dy);
    const edgeGap = centerDist - botRadius - playerRadius;

    this.seqCounter++;

    // Increment counters based on event
    this.updateCounters(eventName, extraDetails);

    const event: FlightRecordEvent = {
      seq: this.seqCounter,
      simTimeMs,
      realTimeMs: Date.now(),
      activeAi,
      currentState,
      previousState,
      category,
      eventName,
      triggerReason,
      botPos: { ...botPos },
      playerPos: { ...playerPos },
      centerDist,
      edgeGap,
      awarenessEpisodeId,
      targetVersion,
      plannerStatus,
      waypointIndex,
      extraDetails,
    };

    this.events.push(event);
    if (this.events.length > this.capacity) {
      this.events.shift();
    }

    // Forward to unified recorder
    let source: DiagnosticSource = 'BOT_STATE';
    if (category === 'SEARCH' || category === 'SENSING') source = 'BOT_SENSOR';
    else if (category === 'AWARENESS') source = 'BOT_AWARENESS';
    else if (category === 'STATE_MACHINE') source = 'BOT_STATE';
    else if (category === 'GOAL_SELECTION') source = 'BOT_TARGET';
    else if (category === 'PLANNING') source = 'BOT_PLANNER';
    else if (category === 'MOVEMENT') source = 'BOT_MOVEMENT';
    else if (category === 'PROGRESS_RECOVERY') source = 'BOT_PROGRESS';
    else if (category === 'LIFECYCLE') source = 'RUNTIME';
    else if (category === 'ERROR') source = 'ERROR';

    CircuitClimbUnifiedRecorder.getInstance().recordEvent(source, eventName, {
      simTimeMs,
      reason: triggerReason,
      playerPosition: { ...playerPos },
      botPosition: { ...botPos },
      botState: currentState,
      botEngine: activeAi,
      awarenessEpisodeId,
      targetVersion,
      data: extraDetails,
    });
  }

  private updateCounters(eventName: string, extraDetails?: Record<string, any>): void {
    if (eventName === 'NEAR_SENSOR_CHECK_SAMPLE') this.counters.nearChecks++;
    if (eventName === 'NEAR_SENSOR_HIT') this.counters.nearHits++;
    if (eventName === 'RADAR_PULSE_STARTED') this.counters.radarPulses++;
    if (eventName === 'RADAR_SENSOR_HIT') this.counters.radarHits++;
    if (eventName === 'AWARENESS_EPISODE_OPENED') this.counters.awarenessEpisodes++;
    if (eventName === 'ALERT_ENTERED') this.counters.alertEntries++;
    if (eventName === 'CHASE_ENTERED') this.counters.chaseEntries++;
    if (eventName === 'HOLD_ENTERED') this.counters.holdEntries++;
    if (eventName === 'RECOVER_ENTERED') this.counters.recoverEntries++;
    if (eventName === 'PLAN_STAGE_1_FULL' || eventName === 'PLAN_STAGE_2_FULL' || eventName === 'PATH_ADOPTED') {
      if (extraDetails?.pathType === 'FULL' || eventName === 'PATH_ADOPTED') {
        this.counters.fullPlans++;
      } else if (extraDetails?.pathType === 'PARTIAL') {
        this.counters.partialPlans++;
      }
    }
    if (eventName === 'PLAN_STAGE_2_FAILED' || eventName === 'PLAN_STAGE_1_FAILED') {
      this.counters.failedPlans++;
    }
    if (eventName === 'ZERO_MOVEMENT_INTENT') this.counters.zeroMovementIntents++;
    if (eventName === 'NO_PROGRESS_DETECTED') this.counters.noProgressTriggers++;
    if (eventName === 'TWO_CELL_OSCILLATION_DETECTED') this.counters.oscillationTriggers++;
    if (eventName === 'BOT_CAPTURED' || eventName === 'CAPTURE') this.counters.captures++;
    if (eventName === 'LEGACY_UPDATE_CALLED_WHILE_V2_SELECTED') this.counters.legacyUpdatesInV2++;
    if (eventName === 'RADAR_WAVE_CROSSED_PLAYER') this.counters.radarMaxCrossedPlayer++;
  }

  public getEvents(): FlightRecordEvent[] {
    return [...this.events];
  }

  public getErrors(): ProjectErrorRecord[] {
    return [...this.errors];
  }

  public clearLog(): void {
    this.events = [];
    this.seqCounter = 0;
    Object.keys(this.counters).forEach((k) => {
      (this.counters as any)[k] = 0;
    });
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  // Auto classification
  public classify(): string {
    const c = this.counters;
    
    // Check for invalid position
    const hasInvalidPos = this.events.some(e => isNaN(e.botPos.x) || isNaN(e.botPos.y));
    if (hasInvalidPos) return 'INVALID_POSITION';

    // Legacy conflict
    if (c.legacyUpdatesInV2 > 0) return 'LEGACY_V2_STATE_CONFLICT';

    // Check errors
    if (this.errors.length > 0) return 'RUNTIME_EXCEPTION';

    // State machine classifications
    if (c.nearChecks === 0 && c.radarPulses === 0) return 'SEARCH_DID_NOT_RUN';
    if (c.nearChecks > 0 && c.nearHits === 0) {
      if (c.radarPulses > 0 && c.radarHits === 0) {
        if (c.radarMaxCrossedPlayer === 0) {
          return 'RADAR_NEVER_REACHED_PLAYER';
        }
        return 'NEAR_SENSOR_ALWAYS_MISSED';
      }
    }
    
    if (c.radarPulses > 0 && c.radarMaxCrossedPlayer > 0 && c.radarHits === 0 && c.nearHits === 0) {
      return 'RADAR_CROSSED_BUT_DO_NOT_HIT';
    }

    if ((c.nearHits > 0 || c.radarHits > 0) && c.awarenessEpisodes === 0) {
      return 'SENSOR_HIT_BUT_NO_AWARENESS';
    }

    if (c.awarenessEpisodes > 0 && c.alertEntries === 0) {
      return 'AWARENESS_OPENED_BUT_NO_ALERT';
    }

    if (c.alertEntries > 0 && c.chaseEntries === 0) {
      return 'ALERT_ENTERED_BUT_NO_CHASE';
    }

    if (c.chaseEntries > 0 && (c.fullPlans + c.partialPlans === 0)) {
      return 'CHASE_ENTERED_BUT_NO_PLAN';
    }

    if ((c.fullPlans + c.partialPlans > 0) && c.zeroMovementIntents > 40) {
      return 'PLAN_FOUND_BUT_NO_MOVEMENT';
    }

    if (c.noProgressTriggers > 0 || c.oscillationTriggers > 0) {
      return 'MOVEMENT_COMMITTED_BUT_NO_PROGRESS';
    }

    // Side to side movement in search
    const onlySearch = this.events.every(e => e.currentState === 'SEARCH');
    if (onlySearch && this.events.length > 10) {
      return 'SEARCH_SIDE_TO_SIDE_ONLY';
    }

    // Repeated state changes without holding CHASE
    if (c.alertEntries > 3 && c.chaseEntries === 0) {
      return 'REPEATED_STATE_RESET';
    }

    return 'UNKNOWN';
  }

  // Setup unhandled error capture
  private setupGlobalErrorHandler(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      const msg = event.message || '';
      const stack = event.error?.stack || '';
      const filename = event.filename || '';
      const lineno = event.lineno || 0;

      // Filter MakerSuite / AI Studio / WebSocket host noise
      if (
        msg.includes('makersuite') ||
        msg.includes('google.alkali') ||
        msg.includes('WebSocket') ||
        msg.includes('vite') ||
        msg.includes('hmr') ||
        filename.includes('gstatic.com') ||
        filename.includes('chrome-extension')
      ) {
        return; // Filter out host platform noise
      }

      this.errorCounter++;
      this.errors.push({
        id: this.errorCounter,
        timestamp: Date.now(),
        message: msg,
        stack,
        sourceFile: filename,
        line: lineno,
        snapshot: JSON.stringify({
          eventsCount: this.events.length,
          lastState: this.events[this.events.length - 1]?.currentState || 'SEARCH',
        }),
      });

      if (this.errors.length > 50) {
        this.errors.shift();
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const msg = reason?.message || String(reason);
      const stack = reason?.stack || '';

      if (
        msg.includes('makersuite') ||
        msg.includes('google.alkali') ||
        msg.includes('WebSocket')
      ) {
        return;
      }

      this.errorCounter++;
      this.errors.push({
        id: this.errorCounter,
        timestamp: Date.now(),
        message: `Unhandled Promise Rejection: ${msg}`,
        stack,
        sourceFile: 'PromiseRejection',
        snapshot: JSON.stringify({
          eventsCount: this.events.length,
        }),
      });

      if (this.errors.length > 50) {
        this.errors.shift();
      }
    });
  }

  // Manual project-error log
  public logProjectError(message: string, stack?: string, sourceFile?: string, line?: number): void {
    this.errorCounter++;
    this.errors.push({
      id: this.errorCounter,
      timestamp: Date.now(),
      message,
      stack,
      sourceFile,
      line,
    });
    if (this.errors.length > 50) {
      this.errors.shift();
    }
  }
}
