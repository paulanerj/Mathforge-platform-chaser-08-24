import { CircuitClimbMathAdapter } from '../services/CircuitClimbMathAdapter';
import { initBotAIState, updateBotAI, getZigzagOffset, BotAIState, BOT_DETECTION_PROFILES } from './botAI';
import { createBotContextV2, updateBotV2 } from '../bot-ai-v2/BotControllerV2';
import { BotStateContextV2 } from '../bot-ai-v2/BotTypesV2';
import { BotFlightRecorder } from '../bot-ai-v2/BotFlightRecorderV2';
import { createBotContextV3, resetBotContextV3, updateBotV3 } from '../bot-ai-v3/BotControllerV3';
import { BotContextV3 } from '../bot-ai-v3/BotTypesV3';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';

export interface CircuitClimbViewModel {
  started: boolean;
  alive: boolean;
  paused: boolean;
  score: number;
  bestRow: number;
  movementMode: 'circuit' | 'hop';
  soundEnabled: boolean;
  playerValue: number;
  targetValue: number;
  messageText: string;
  messageTone: 'neutral' | 'success' | 'error';
  viewScalePercent: number;
  routeTurnCount: number;
  showViewSettings: boolean;
  showCollisionHitboxes: boolean;
  showSumToCue: boolean;
  showConfig: boolean;
  configText: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  aiImplementation: 'PLATFORM_GRAPH_V3' | 'V2_SIMPLIFIED' | 'V2_FROZEN' | 'LEGACY';
  showV2Telemetry: boolean;
  bringUpStage: 'NORMAL' | 'STAGE_A' | 'STAGE_B' | 'STAGE_C' | 'STAGE_D' | 'STAGE_E';
  debug?: any;
}

export function useCircuitClimbPrototypeRuntime() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<HTMLDivElement | null>(null);

  // React state to feed back into the HUD overlays
  const [started, setStarted] = useState(false);
  const [alive, setAlive] = useState(true);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [bestRow, setBestRow] = useState(0);
  const [movementMode, setMovementMode] = useState<'circuit' | 'hop'>('circuit');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [playerValue, setPlayerValue] = useState(4);
  const [targetValue, setTargetValue] = useState(10);
  const [messageText, setMessageText] = useState('');
  const [messageTone, setMessageTone] = useState<'neutral' | 'success' | 'error'>('neutral');
  const [viewScalePercent, setViewScalePercent] = useState(100);
  const [routeTurnCount, setRouteTurnCount] = useState(8);
  const [showCollisionHitboxes, setShowCollisionHitboxes] = useState(false);
  const [showSumToCue, setShowSumToCue] = useState(true);
  const [showViewSettings, setShowViewSettings] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configText, setConfigText] = useState('');
  const [difficulty, setDifficultyState] = useState<'EASY' | 'NORMAL' | 'HARD'>('NORMAL');
  const [aiImplementation, setAiImplementationState] = useState<'PLATFORM_GRAPH_V3' | 'V2_SIMPLIFIED' | 'V2_FROZEN' | 'LEGACY'>('PLATFORM_GRAPH_V3');
  const [showV2Telemetry, setShowV2Telemetry] = useState(false);
  const [bringUpStage, setBringUpStageState] = useState<'NORMAL' | 'STAGE_A' | 'STAGE_B' | 'STAGE_C' | 'STAGE_D' | 'STAGE_E'>('NORMAL');
  const settingsWasPausedRef = useRef(false);

  // Control reference to trigger game engine actions from React components
  const loopControlRef = useRef<{
    beginGame?: () => void;
    restart?: (opts?: { preserveOverlay?: boolean }) => void;
    togglePause?: (force?: boolean) => void;
    toggleMode?: () => void;
    toggleSound?: () => void;
    selectByIndex?: (idx: number) => void;
    applyViewScale?: (val: number, opts?: { reflow?: boolean; persist?: boolean }) => void;
    applyRouteTurnCount?: (val: number, opts?: { persist?: boolean }) => void;
    applyDifficulty?: (diff: 'EASY' | 'NORMAL' | 'HARD') => void;
    applyAiImplementation?: (impl: 'PLATFORM_GRAPH_V3' | 'V2_SIMPLIFIED' | 'V2_FROZEN' | 'LEGACY') => void;
    applyBringUpStage?: (stage: 'NORMAL' | 'STAGE_A' | 'STAGE_B' | 'STAGE_C' | 'STAGE_D' | 'STAGE_E') => void;
    resetViewSettings?: () => void;
    exportSettings?: () => void;
    closeViewSettings?: () => void;
  }>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    const app = appRef.current;
    if (!canvas || !app) { console.log("SUCCESS!", {canvas: !!canvas, app: !!app}); return; }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- GAME ENGINE INTERNAL CONFIGURATION & VARIABLES ---
    const CONFIG = {
      grid: 16,
      rowGap: 205,
      routeSegmentGrid: 14,
      routeTurnCount: 8,
      routeMaxStraightRun: 72,
      routeHorizontalJitter: 46,
      routePlatformPadding: 8,
      targetFlashDuration: 1500,
      farParallax: 0.08,
      midParallax: 0.24,
      foregroundParallax: 0.62,
      platformWidth: 104,
      platformHeight: 62,
      columns: [0.18, 0.50, 0.82],
      playerRadius: 32,
      routeSpeed: 0.62,
      hopDuration: 470,
      hopHeight: 82,
      returnDuration: 360,
      cullMargin: 240,
      resolveDelay: 520,

      timerBaseSpeed: 0.018,
      timerRamp: 0.0000015,
      timerCatchGapRows: 2.3,
      timerStartRows: 1.15,
      wrongPenalty: 56,

      botSpawnOffsetRows: 0.78,
      botInitialRowGap: 2, // represents complete platform-row intervals, not pixels
      botBaseOffsetRows: 0.55,
      botPatrolSpeed: 0.18,
      botLockSpeed: 0.46,
      botRepathMs: 620,
      botSweepMs: 1450,
      proximityRadius: 112,
      contactRadius: 54,
      contactFuseMs: 360,
      scanPeriodMs: 2700,
      scanDurationMs: 680,
      scanMaxRadius: 235,
      botRadius: 30,
      difficulty: 'NORMAL',
      aiImplementation: 'PLATFORM_GRAPH_V3',
      bringUpStage: 'NORMAL',
      nearDetectionGapPx: 50,
      radarWaveThicknessPx: 16,
      awarenessMemoryMs: 3200,
      loseDistancePx: 450,
      reacquireCooldownMs: 2000,

      cameraAnchor: 0.25,
    };

    const BASE_VIEW = Object.freeze({
      rowGap: 205,
      platformWidth: 104,
      platformHeight: 62,
      playerRadius: 32,
      botRadius: 30,
      routeSegmentGrid: 14,
      routeTurnCount: 8,
      routeMaxStraightRun: 72,
      routeHorizontalJitter: 46,
      routePlatformPadding: 8,
      hopHeight: 82,
      wrongPenalty: 56,
      proximityRadius: 112,
      contactRadius: 54,
      scanMaxRadius: 235,
    });

    const COLORS = {
      bg: '#f0f6fc',
      bgDepth: '#e2eef7',
      structure: '#cbd5e1',
      text: '#0E1B33',
      player: '#2563eb',
      playerHighlight: '#93c5fd',
      enemy: '#ff3830',
      target: '#0f172a',
      targetGlow: 'rgba(37, 99, 235, 0.15)',
      cueSurface: '#ffffff',
      cueBorder: '#D8E4F7',
      background: '#f0f6fc',
      gridDot: '#cbd5e1',
      gridLine: '#e2effc',
      platform: '#ffffff',
      platformEdge: '#cbd5e1',
      platformFace: '#ffffff',
      platformDead: '#f1f5f9',
      platformDeadEdge: '#cbd5e1',
      platformPowered: '#f0fdf4',
      platformPoweredEdge: '#22c55e',
      number: '#0f172a',
      numberDim: '#94a3b8',
      cyan: '#0ea5e9',
      cyanCore: '#e0f2fe',
      lime: '#2563eb',
      limeCore: '#93c5fd',
      amber: '#f59e0b',
      red: '#ef4444',
      redDark: '#991b1b',
      white: '#ffffff',
    };

    // Canvas color safety validator
    function isSafeCanvasColor(value: any): boolean {
      if (!value) return false;
      if (typeof value !== 'string') return false;
      if (value.includes('var(')) return false;
      return true;
    }

    const SAFE_FALLBACK_COLOR = '#ff00ff';

    // Validate the palette once on initialization
    for (const key of Object.keys(COLORS) as Array<keyof typeof COLORS>) {
      const val = COLORS[key];
      if (!isSafeCanvasColor(val)) {
        console.warn(`Circuit Climb Canvas Warning: Invalid color for ${key}): ${val}. Falling back to safe known color.`);
        COLORS[key] = SAFE_FALLBACK_COLOR;
      }
    }

    // Mutable states matching standalone script
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    let lastTimestamp = 0;
    let elapsed = 0;
    let engineStarted = false;
    let engineAlive = true;
    let enginePaused = false;
    let engineSoundEnabled = true;
    let engineMovementMode: 'circuit' | 'hop' = 'circuit';
    let rows: any[] = [];
    let obstacleRevision = 0;
    let firstFrameTraced = false;
    let nextRowIndex = 0;
    let traces: any[] = [];
    let particles: any[] = [];
    let travel: any = null;
    let resolveAt = 0;
    let cameraY = 0;
    let timerLineY = 0;
    let timerSpeed = CONFIG.timerBaseSpeed;
    let bot: BotAIState | null = null;
    let botContextV2: BotStateContextV2 | null = null;
    let botContextV3: BotContextV3 | null = null;
    let v3UpdateCount = 0;
    let v2FrozenUpdateCount = 0;
    let v2SimplifiedUpdateCount = 0;
    let legacyUpdateCount = 0;
    let actualControllerCalled = 'NONE';
    let lastIntendedDisplacement = { x: 0, y: 0 };
    let lastCollisionResolvedDisplacement = { x: 0, y: 0 };
    let lastCommittedDisplacement = { x: 0, y: 0 };
    let lastFailureReason = '';
    let botTrail: any[] = [];
    let echoes: any[] = [];
    let engineBestRow = 0;
    let viewScalePercentInternal = 100;
    let routeTurnCountInternal = 8;
    let settingsWasPaused = false;

    // Load High Scores
    try {
      engineBestRow = Number(window.localStorage.getItem('circuitClimbPrototypeBest') || 0);
      setBestRow(engineBestRow);
    } catch {
      engineBestRow = 0;
    }

    let audioContext: AudioContext | null = null;
    let messageTimer = 0;
    

    type PlayerNumberPhase = 'visible' | 'clearing' | 'hidden-transit';

    const playerNumberPresentation = {
      phase: 'visible' as PlayerNumberPhase,
      phaseStartedAt: 0,
      displayedValue: 4 as number | null,
      pendingValue: null as number | null,
    };
    type TargetRevealPhase = 'dominant-enter' | 'dominant-hold' | 'receding' | 'resting';
    const targetPresentation = {
      targetValue: 10,
      targetEventId: 0,
      phase: 'resting' as TargetRevealPhase,
      phaseStartedAt: 0,
      progress: 0,
    };


    const player = {
      row: 0,
      x: 0,
      y: 0,
      value: 4,
      platform: null as any,
      pulseAt: -1000,
    };

    function clamp(value: number, min: number, max: number) {
      return Math.max(min, Math.min(max, value));
    }

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }

    function roundTo(value: number, digits = 1) {
      const multiplier = 10 ** digits;
      return Math.round(value * multiplier) / multiplier;
    }

    function readSavedViewScale() {
      try {
        const saved = Number(window.localStorage.getItem('circuitClimbViewScale'));
        if (Number.isFinite(saved)) {
          return clamp(saved, 80, 120);
        }
      } catch {
        // Safe fallback
      }
      return 100;
    }

    function readSavedRouteTurns() {
      try {
        const saved = Number(window.localStorage.getItem('circuitClimbRouteTurns'));
        if (Number.isFinite(saved)) {
          return clamp(Math.round(saved / 2) * 2, 6, 12);
        }
      } catch {
        // Safe fallback
      }
      return 8;
    }

    function saveViewScale() {
      try {
        window.localStorage.setItem('circuitClimbViewScale', String(viewScalePercentInternal));
        window.localStorage.setItem('circuitClimbRouteTurns', String(routeTurnCountInternal));
      } catch {
        // Safe fallback
      }
    }

    function refreshTravelMetrics(activeTravel: any) {
      if (!activeTravel || !activeTravel.points || activeTravel.points.length < 2) {
        return;
      }
      const progress = activeTravel.total > 0
        ? clamp(activeTravel.distance / activeTravel.total, 0, 1)
        : 0;
      const metrics = pathMetrics(activeTravel.points);
      activeTravel.lengths = metrics.lengths;
      activeTravel.total = metrics.total;
      activeTravel.distance = metrics.total * progress;
    }

    function reflowWorldForView(oldRowGap: number) {
      if (!rows.length || !oldRowGap || oldRowGap === CONFIG.rowGap) {
        return;
      }
      obstacleRevision += 1;
      const verticalRatio = CONFIG.rowGap / oldRowGap;

      rows.forEach((row) => {
        row.y = -row.index * CONFIG.rowGap;
        row.platforms.forEach((platform: any) => {
          platform.y = row.y;
          platform.width = Math.min(CONFIG.platformWidth, width * 0.30);
          platform.height = CONFIG.platformHeight;
        });
      });

      traces.forEach((trace) => {
        trace.points.forEach((point: any) => { point.y *= verticalRatio; });
      });

      particles.forEach((particle) => {
        particle.y *= verticalRatio;
        particle.vy *= verticalRatio;
      });

      botTrail.forEach((point) => { point.y *= verticalRatio; });
      echoes.forEach((echo) => {
        echo.y0 *= verticalRatio;
        echo.y1 *= verticalRatio;
      });

      if (travel) {
        if (travel.points) {
          travel.points.forEach((point: any) => { point.y *= verticalRatio; });
          refreshTravelMetrics(travel);
        }
        if (travel.from) travel.from.y *= verticalRatio;
        if (travel.to) travel.to.y *= verticalRatio;
      }

      player.y *= verticalRatio;
      timerLineY *= verticalRatio;

      if (bot) {
        bot.y *= verticalRatio;
        bot.patrolY *= verticalRatio;
        if (bot.travel) {
          bot.travel.points.forEach((point: any) => { point.y *= verticalRatio; });
          refreshTravelMetrics(bot.travel);
        }
      }

      if (!travel && player.platform) {
        player.x = player.platform.x;
        player.y = landingPoint(player.platform).y;
      }
      cameraY = player.y - height * CONFIG.cameraAnchor;
    }

    function updateViewReadouts() {
      setViewScalePercent(viewScalePercentInternal);
      setRouteTurnCount(routeTurnCountInternal);
    }

    function applyViewScale(percent: number, { reflow = true, persist = true } = {}) {
      const nextPercent = clamp(Math.round(Number(percent) || 100), 80, 120);
      const oldRowGap = CONFIG.rowGap;
      const zoom = nextPercent / 100;

      viewScalePercentInternal = nextPercent;

      CONFIG.rowGap = BASE_VIEW.rowGap * zoom;
      CONFIG.platformWidth = BASE_VIEW.platformWidth * (0.98 + 0.02 * zoom);
      CONFIG.platformHeight = BASE_VIEW.platformHeight * Math.pow(zoom, 0.48);
      CONFIG.playerRadius = BASE_VIEW.playerRadius * zoom;
      CONFIG.botRadius = BASE_VIEW.botRadius * zoom;
      CONFIG.routeSegmentGrid = BASE_VIEW.routeSegmentGrid * zoom;
      CONFIG.routeMaxStraightRun = BASE_VIEW.routeMaxStraightRun * zoom;
      CONFIG.routeHorizontalJitter = BASE_VIEW.routeHorizontalJitter * zoom;
      CONFIG.routePlatformPadding = BASE_VIEW.routePlatformPadding;
      CONFIG.hopHeight = BASE_VIEW.hopHeight * zoom;
      CONFIG.wrongPenalty = BASE_VIEW.wrongPenalty * zoom;

      // Dynamic difficulty profile lookup and scaling
      const diffMode = CONFIG.difficulty || 'NORMAL';
      const profile = BOT_DETECTION_PROFILES[diffMode as 'EASY' | 'NORMAL' | 'HARD'] || BOT_DETECTION_PROFILES.NORMAL;

      CONFIG.nearDetectionGapPx = profile.nearDetectionGapPx * zoom;
      CONFIG.scanMaxRadius = profile.radarMaxRadiusPx * zoom;
      CONFIG.scanPeriodMs = profile.radarPeriodMs;
      CONFIG.radarWaveThicknessPx = profile.radarWaveThicknessPx * zoom;
      CONFIG.awarenessMemoryMs = profile.awarenessMemoryMs;
      CONFIG.loseDistancePx = profile.loseDistancePx * zoom;
      CONFIG.reacquireCooldownMs = profile.reacquireCooldownMs;

      // Proximity/contact radius are derived from the profile gaps/radii to match perfectly
      CONFIG.proximityRadius = (CONFIG.botRadius + CONFIG.playerRadius + CONFIG.nearDetectionGapPx);
      CONFIG.contactRadius = BASE_VIEW.contactRadius * zoom;

      CONFIG.routeTurnCount = routeTurnCountInternal;
      CONFIG.cameraAnchor = lerp(0.585, 0.615, (nextPercent - 80) / 40);

      const hudScale = lerp(0.93, 1.03, (nextPercent - 80) / 40);
      document.documentElement.style.setProperty('--live-ui-scale', hudScale.toFixed(3));

      if (reflow) {
        reflowWorldForView(oldRowGap);
      }
      updateViewReadouts();
      if (persist) {
        saveViewScale();
      }
    }

    function applyRouteTurnCount(value: number, { persist = true } = {}) {
      routeTurnCountInternal = clamp(Math.round(Number(value) / 2) * 2 || 8, 6, 12);
      CONFIG.routeTurnCount = routeTurnCountInternal;
      updateViewReadouts();
      if (persist) {
        saveViewScale();
      }
    }

    function exportedViewConfig() {
      return {
        prototype: 'Circuit Climb V3.6',
        viewScalePercent: viewScalePercentInternal,
        routeTurnCount: routeTurnCountInternal,
        derived: {
          rowGap: roundTo(CONFIG.rowGap),
          platformWidth: roundTo(CONFIG.platformWidth),
          platformHeight: roundTo(CONFIG.platformHeight),
          playerRadius: roundTo(CONFIG.playerRadius),
          botRadius: roundTo(CONFIG.botRadius),
          routeSegmentGrid: roundTo(CONFIG.routeSegmentGrid),
          routeTurnCount: CONFIG.routeTurnCount,
          routeMaxStraightRun: roundTo(CONFIG.routeMaxStraightRun),
          cameraAnchor: roundTo(CONFIG.cameraAnchor, 3),
          proximityRadius: roundTo(CONFIG.proximityRadius),
          contactRadius: roundTo(CONFIG.contactRadius),
          scanMaxRadius: roundTo(CONFIG.scanMaxRadius),
        },
        instruction: 'Paste this JSON back into the project-manager chat so the framing and corner count can be frozen into the next build.',
      };
    }

    function refreshConfigOutput() {
      const config = exportedViewConfig();
      setConfigText(JSON.stringify(config, null, 2));
    }

    function randomInt(min: number, max: number) {
      return Math.floor(min + Math.random() * (max - min + 1));
    }

    function shuffle(values: any[]) {
      for (let i = values.length - 1; i > 0; i -= 1) {
        const j = randomInt(0, i);
        [values[i], values[j]] = [values[j], values[i]];
      }
      return values;
    }

    function roundedRectPath(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
      const r = Math.min(radius, w / 2, h / 2);
      context.beginPath();
      context.moveTo(x + r, y);
      context.arcTo(x + w, y, x + w, y + h, r);
      context.arcTo(x + w, y + h, x, y + h, r);
      context.arcTo(x, y + h, x, y, r);
      context.arcTo(x, y, x + w, y, r);
      context.closePath();
    }

    function targetBandFor(rowIndex: number) {
      return Math.floor(Math.max(0, rowIndex - 1) / 6);
    }
    function targetFor(rowIndex: number) {
      return Math.min(20, 10 + 2 * targetBandFor(rowIndex));
    }


    function makeRow(index: number) {
      const y = -index * CONFIG.rowGap;
      const platforms = CONFIG.columns.map((fraction, column) => ({
        row: index,
        column,
        x: fraction * width,
        y,
        width: Math.min(CONFIG.platformWidth, width * 0.30),
        height: CONFIG.platformHeight,
        value: null as number | null,
        correct: false,
        dead: false,
        powered: false,
        selected: false,
        litAt: -1000,
      }));

      const row: any = {
        index,
        y,
        platforms,
        id: `row-${index}`,
        disabledOptionIndexes: [] as number[],
        status: 'future' as 'buffer' | 'future' | 'active' | 'resolved-correct' | 'resolved-wrong' | 'passed',
      };

      if (index >= 1) {
        const targetEventId = targetBandFor(index);
        const maxTargetValue = Math.min(20, 10 + 2 * targetEventId);

        let incomingPlayerValue = 0;
        if (index === 1) {
          incomingPlayerValue = randomInt(1, Math.max(2, maxTargetValue - 1));
        } else {
          const prev = rows[index - 1];
          if (prev && prev.problemSnapshot) {
            incomingPlayerValue = randomInt(1, Math.max(2, maxTargetValue - 1));
          } else {
            incomingPlayerValue = randomInt(1, Math.max(2, maxTargetValue - 1));
          }
        }
        
        let snapshot = CircuitClimbMathAdapter.requestAdditionProblem(
          index,
          incomingPlayerValue,
          maxTargetValue,
          targetEventId
        );

        if (!snapshot) {
          console.error("CIRCUIT_CLIMB_MATH_ENGINE_FAILURE", { index, incomingPlayerValue, maxTargetValue });
          snapshot = {
            problemId: `fallback-${index}`,
            operation: "addition",
            rowIndex: index,
            targetEventId,
            playerValue: incomingPlayerValue,
            targetValue: incomingPlayerValue + 1,
            choices: [1, 2, 3],
            correctChoiceIndex: 0,
            correctPlatformValue: 1
          };
          snapshot.choices[0] = 1;
          snapshot.choices[1] = 2;
          snapshot.choices[2] = 3;
        }

        row.problemSnapshot = snapshot;
        row.targetEventId = snapshot.targetEventId;
        row.targetValue = snapshot.targetValue;
        row.incomingPlayerValue = snapshot.playerValue;
        row.correctPlatformValue = snapshot.correctPlatformValue;
        row.correctOptionIndex = snapshot.correctChoiceIndex;
        row.options = snapshot.choices;

        row.platforms.forEach((platform: any, colIdx: number) => {
          if (colIdx < 3) {
            platform.value = snapshot!.choices[colIdx];
            platform.correct = colIdx === snapshot!.correctChoiceIndex;
          }
        });
      }

      return row;
    }

    function ensureRows() {
      let added = false;
      while (nextRowIndex <= player.row + 6) {
        rows.push(makeRow(nextRowIndex));
        nextRowIndex += 1;
        added = true;
      }
      if (added) {
        obstacleRevision += 1;
      }
    }

    function getRow(index: number) {
      return rows.find((row) => row.index === index) || null;
    }

    function rowAbove() {
      return getRow(player.row + 1);
    }


    function validateActiveCircuitClimbRow(row: any, committedPlayerValue: number) {
      if (!row) return;
      let error = null;
      if (row.incomingPlayerValue !== committedPlayerValue) error = 'incomingPlayerValue mismatch';
      else if (row.correctPlatformValue !== row.targetValue - row.incomingPlayerValue) error = 'correctPlatformValue mismatch';
      else if (row.options[row.correctOptionIndex] !== row.correctPlatformValue) error = 'correctOptionIndex mismatch';
      else if (row.options.filter((o: number) => o === row.correctPlatformValue).length !== 1) error = 'multiple or zero correct options';
      
      if (error) {
        console.error('CIRCUIT_CLIMB_INVALID_ACTIVE_ROW', {
          id: row.id,
          index: row.index,
          targetEventId: row.targetEventId,
          targetValue: row.targetValue,
          incomingPlayerValue: row.incomingPlayerValue,
          options: row.options,
          correctOptionIndex: row.correctOptionIndex,
          computedRequiredOption: row.targetValue - row.incomingPlayerValue,
          reason: error
        });
      }
    }

    function armNextRow() {
      const row = rowAbove();
      if (!row) return;
      validateActiveCircuitClimbRow(row, player.value);
      row.platforms.forEach((platform) => {
        platform.dead = false;
        platform.selected = false;
      });
    }

    function updateHud() {
      const activeRow = getRow(player.row + 1);
      if (!activeRow) return;
      
      const target = activeRow.targetValue;
      const targetEventId = activeRow.targetEventId !== undefined ? activeRow.targetEventId : targetBandFor(player.row + 1);

      if (targetEventId !== targetPresentation.targetEventId) {
        targetPresentation.targetValue = target;
        targetPresentation.targetEventId = targetEventId;
        targetPresentation.phase = 'dominant-enter';
        targetPresentation.phaseStartedAt = elapsed;
      }
      setPlayerValue(player.value);
      setTargetValue(target);
      setScore(player.row);
      setMovementMode(engineMovementMode);
    }

    function setMessage(text: string, tone: 'neutral' | 'success' | 'error' = 'neutral', duration = 0) {
      setMessageText(text);
      setMessageTone(tone);
      messageTimer = duration > 0 ? elapsed + duration : 0;
    }

    function getAudioContext() {
      if (!engineSoundEnabled) return null;
      if (!audioContext) {
        try {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch {
          engineSoundEnabled = false;
          setSoundEnabled(false);
          return null;
        }
      }
      if (audioContext.state === 'suspended') audioContext.resume();
      return audioContext;
    }

    function tone(frequency: number, duration = 0.16, volume = 0.05, type: OscillatorType = 'sine', delay = 0) {
      const audio = getAudioContext();
      if (!audio) return;
      const start = audio.currentTime + delay;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    }

    const sound = {
      launch() {
        tone(310, 0.12, 0.045, 'sine');
        tone(465, 0.18, 0.035, 'triangle', 0.05);
      },
      corner() {
        tone(1300, 0.04, 0.018, 'triangle');
      },
      correct() {
        tone(392, 0.36, 0.05, 'sine');
        tone(494, 0.38, 0.045, 'sine', 0.07);
        tone(659, 0.48, 0.05, 'sine', 0.15);
      },
      wrong() {
        tone(230, 0.28, 0.055, 'sawtooth');
        tone(174, 0.35, 0.045, 'triangle', 0.08);
      },
      scan() {
        tone(760, 0.34, 0.026, 'sine');
        tone(770, 0.38, 0.018, 'sine');
      },
      lock() {
        tone(1046, 0.16, 0.048, 'triangle');
        tone(1318, 0.22, 0.035, 'sine', 0.05);
      },
      danger() {
        tone(90, 0.7, 0.07, 'sine');
        tone(55, 0.9, 0.05, 'triangle');
      },
    };

    function resize() { console.log("resize CALLED!", {app: !!app, rect: app?.getBoundingClientRect()});
      const rect = app.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const oldWidth = width;
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (rows.length > 0) {
        const ratio = oldWidth > 0 ? width / oldWidth : 1;
        rows.forEach((row) => {
          row.platforms.forEach((platform: any) => {
            platform.x = CONFIG.columns[platform.column] * width;
            platform.width = Math.min(CONFIG.platformWidth, width * 0.30);
          });
        });

        if (oldWidth > 0 && ratio !== 1) {
          traces.forEach((trace) => trace.points.forEach((point: any) => { point.x *= ratio; }));
          particles.forEach((particle) => { particle.x *= ratio; });
          botTrail.forEach((point) => { point.x *= ratio; });
          echoes.forEach((echo) => { echo.x0 *= ratio; echo.x1 *= ratio; });
          if (bot) {
            bot.x *= ratio;
            bot.patrolX *= ratio;
            if (bot.travel) bot.travel.points.forEach((point: any) => { point.x *= ratio; });
          }
          if (travel) {
            if (travel.points) travel.points.forEach((point: any) => { point.x *= ratio; });
            if (travel.from) travel.from.x *= ratio;
            if (travel.to) travel.to.x *= ratio;
          }
        }
        if (!travel && player.platform) player.x = player.platform.x;
        else player.x *= ratio;
      }
      if (!engineStarted || player.row === 0) cameraY = player.y - height * CONFIG.cameraAnchor;
    }

    function isBotPositionBlocked(x: number, y: number) {
      const margin = CONFIG.botRadius + 4; // botRadius + navMarginPx
      return rows.some((row) => row.platforms.some((platform: any) => {
        if (platform.row === 0 && platform.column !== 1) return false;
        const left = platform.x - platform.width / 2 - margin;
        const right = platform.x + platform.width / 2 + margin;
        const top = platform.y - margin;
        const bottom = platform.y + platform.height + margin;
        return x > left && x < right && y > top && y < bottom;
      }));
    }

    function calculateRepairedBotSpawn(forceBringUp = false) {
      const isBringUp = forceBringUp || CONFIG.bringUpStage !== 'NORMAL';
      if (isBringUp) {
        return {
          x: width / 2,
          y: player.y + 140
        };
      }

      // 1. Desired dramatic spawn below the player: exactly 2 complete platform-row intervals
      const desiredY = player.y + 2.0 * CONFIG.rowGap;

      // 2. Lowest visible legal bot center (derived from viewport constraints)
      const maxScreenY = height - 68 - CONFIG.botRadius - 10;
      const maxVisibleWorldY = cameraY + maxScreenY;

      // Desired spawn clamped to the visible legal range.
      const minWorldY = player.y + CONFIG.playerRadius + CONFIG.botRadius + 30;
      let clampedY = clamp(desiredY, minWorldY, maxVisibleWorldY);

      // Columns are: CONFIG.columns[randomInt(0, CONFIG.columns.length - 1)] * width
      const columnsX = CONFIG.columns.map(c => c * width);
      
      let bestX = columnsX[randomInt(0, columnsX.length - 1)];
      let bestY = clampedY;
      let found = false;

      const searchOffsetsY = [0, -15, 15, -30, 30, -45, 45, -60, 60];
      const candidatesX = [columnsX[1], columnsX[0], columnsX[2], width / 2];

      for (const dy of searchOffsetsY) {
        const testY = clampedY + dy;
        if (testY < minWorldY || testY > maxVisibleWorldY) continue;

        for (const testX of candidatesX) {
          if (!isBotPositionBlocked(testX, testY)) {
            bestX = testX;
            bestY = testY;
            found = true;
            break;
          }
        }
        if (found) break;
      }

      return { x: bestX, y: bestY };
    }

    function restart({ preserveOverlay = false } = {}) {
      setShowViewSettings(false);
      rows = [];
      obstacleRevision = 0;
      firstFrameTraced = false;
      traces = [];
      particles = [];
      travel = null;
      resolveAt = 0;
      nextRowIndex = 0;
      elapsed = 0;
      lastTimestamp = 0;
      
      
      engineAlive = true;
      enginePaused = false;
      setAlive(true);
      setPaused(false);

      ensureRows();
      const baseRow = getRow(0);
      const basePlatform = baseRow.platforms[1];
      baseRow.platforms[0].dead = true;
      baseRow.platforms[2].dead = true;
      basePlatform.value = null;
      basePlatform.powered = true;

      player.row = 0;
      player.platform = basePlatform;
      player.x = basePlatform.x;
      player.y = basePlatform.y - CONFIG.playerRadius - 3;
      const firstRow = getRow(1);
      player.value = firstRow && firstRow.problemSnapshot ? firstRow.problemSnapshot.playerValue : 4;
      player.pulseAt = -1000;

      playerNumberPresentation.phase = 'visible';
      playerNumberPresentation.phaseStartedAt = 0;
      playerNumberPresentation.displayedValue = player.value;
      playerNumberPresentation.pendingValue = null;
      targetPresentation.targetValue = firstRow && firstRow.problemSnapshot ? firstRow.problemSnapshot.targetValue : 10;
      targetPresentation.targetEventId = targetBandFor(1);
      targetPresentation.phase = 'dominant-enter';
      targetPresentation.phaseStartedAt = 0;
      targetPresentation.progress = 0;


      timerSpeed = CONFIG.timerBaseSpeed;
      timerLineY = player.y + CONFIG.rowGap * CONFIG.timerStartRows;
      cameraY = player.y - height * CONFIG.cameraAnchor;

      const spawnPos = calculateRepairedBotSpawn();

      v3UpdateCount = 0;
      v2FrozenUpdateCount = 0;
      v2SimplifiedUpdateCount = 0;
      legacyUpdateCount = 0;
      actualControllerCalled = 'NONE';
      bot = initBotAIState(spawnPos.x, spawnPos.y, player.x);
      botContextV3 = CONFIG.aiImplementation === 'PLATFORM_GRAPH_V3' ? createBotContextV3(spawnPos) : null;
      botContextV2 = (CONFIG.aiImplementation === 'V2_SIMPLIFIED' || CONFIG.aiImplementation === 'V2_FROZEN') ? createBotContextV2() : null;
      botTrail = [];
      echoes = [];

      BotFlightRecorder.getInstance().recordEvent(
        0,
        CONFIG.aiImplementation as 'GREENFIELD_V2' | 'LEGACY',
        botContextV2?.currentState || 'SEARCH',
        'NONE',
        'LIFECYCLE',
        'SIMULATION_RESTARTED',
        `Simulation restarted. Resetting game states, player position, platforms, and bot context.`,
        spawnPos,
        { x: player.x, y: player.y },
        CONFIG.botRadius,
        CONFIG.playerRadius,
        botContextV2?.awareness?.id || 0,
        obstacleRevision,
        botContextV2?.debug?.plannerStatus || '',
        botContextV2?.pathIndex || 0
      );

      ensureRows();
      armNextRow();
      updateHud();
      setMessage('Tap the platform that completes the equation.');

      if (!preserveOverlay) {
        setStarted(true);
        engineStarted = true;
      }
    }

    function beginGame() {
      setStarted(true);
      engineStarted = true;
      restart();
      try { getAudioContext(); } catch { engineSoundEnabled = false; setSoundEnabled(false); }
    }

    function landingPoint(platform: any) {
      return {
        x: platform.x,
        y: platform.y - CONFIG.playerRadius - 3,
      };
    }

    function platformCollisionRects() {
      const pad = CONFIG.routePlatformPadding;
      const rects: any[] = [];
      rows.forEach((row) => row.platforms.forEach((platform) => {
        if (platform.row === 0 && platform.column !== 1) return;
        rects.push({
          left: platform.x - platform.width / 2 - pad,
          right: platform.x + platform.width / 2 + pad,
          top: platform.y - pad,
          bottom: platform.y + platform.height + pad,
        });
      }));
      return rects;
    }

    function segmentHitsRect(a: any, b: any, rect: any) {
      if (a.x === b.x) {
        if (a.x <= rect.left || a.x >= rect.right) return false;
        const top = Math.min(a.y, b.y);
        const bottom = Math.max(a.y, b.y);
        return bottom > rect.top && top < rect.bottom;
      }
      if (a.y === b.y) {
        if (a.y <= rect.top || a.y >= rect.bottom) return false;
        const left = Math.min(a.x, b.x);
        const right = Math.max(a.x, b.x);
        return right > rect.left && left < rect.right;
      }
      return true;
    }

    function pathIsClear(points: any[]) {
      const rects = platformCollisionRects();
      for (let i = 1; i < points.length; i += 1) {
        for (const rect of rects) {
          if (segmentHitsRect(points[i - 1], points[i], rect)) return false;
        }
      }
      return true;
    }

    function cleanCircuitPath(points: any[]) {
      const out = [points[0]];
      for (let i = 1; i < points.length; i += 1) {
        const point = points[i];
        const last = out[out.length - 1];
        if (point.x === last.x && point.y === last.y) continue;
        if (out.length >= 2) {
          const previous = out[out.length - 2];
          if ((previous.x === last.x && last.x === point.x) ||
              (previous.y === last.y && last.y === point.y)) {
            out[out.length - 1] = point;
            continue;
          }
        }
        out.push(point);
      }
      return out;
    }

    function destinationCorridors(row: any) {
      const padding = CONFIG.routePlatformPadding;
      const rectangles = row.platforms
        .map((platform: any) => ({
          left: platform.x - platform.width / 2 - padding,
          right: platform.x + platform.width / 2 + padding,
        }))
        .sort((first: any, second: any) => first.left - second.left);

      const corridors: any[] = [];
      let cursor = 2;

      rectangles.forEach((rectangle: any) => {
        if (rectangle.left - cursor >= 12) {
          corridors.push({
            left: cursor,
            right: rectangle.left,
            center: (cursor + rectangle.left) / 2,
          });
        }
        cursor = Math.max(cursor, rectangle.right);
      });

      const rightEdge = width - 2;
      if (rightEdge - cursor >= 12) {
        corridors.push({
          left: cursor,
          right: rightEdge,
          center: (cursor + rightEdge) / 2,
        });
      }
      return corridors;
    }

    function chooseDestinationCorridor(row: any, targetX: number, startX: number) {
      const corridors = destinationCorridors(row);
      if (!corridors.length) {
        const edge = targetX < width / 2 ? width * 0.965 : width * 0.035;
        return {
          left: edge - 12,
          right: edge + 12,
          center: edge,
        };
      }
      return corridors
        .slice()
        .sort((first, second) => {
          const firstScore =
            Math.abs(first.center - targetX) * 0.72 +
            Math.abs(first.center - startX) * 0.28;
          const secondScore =
            Math.abs(second.center - targetX) * 0.72 +
            Math.abs(second.center - startX) * 0.28;
          return firstScore - secondScore;
        })[0];
    }

    function buildSteppedRoute(from: any, to: any, destinationPlatform: any, corridor: any) {
      const turns = clamp(Math.round(CONFIG.routeTurnCount / 2) * 2, 6, 12);
      const horizontalCount = turns / 2;
      const verticalCount = horizontalCount + 1;
      const destinationRow = getRow(destinationPlatform.row);

      const landingY = to.y;
      const apexY =
        destinationRow.y -
        CONFIG.playerRadius -
        Math.max(18, CONFIG.routePlatformPadding * 1.8);

      const crossingStartY =
        destinationRow.y +
        CONFIG.platformHeight +
        CONFIG.routePlatformPadding +
        9;

      const midCrossY =
        destinationRow.y +
        CONFIG.platformHeight * 0.34;

      const verticalEndpoints = [];
      const preCorridorVerticalCount = verticalCount - 3;

      for (let index = 1; index <= preCorridorVerticalCount; index += 1) {
        verticalEndpoints.push(
          lerp(from.y, crossingStartY, index / preCorridorVerticalCount),
        );
      }
      verticalEndpoints.push(midCrossY, apexY, landingY);

      const corridorInset = Math.min(
        16,
        Math.max(3, (corridor.right - corridor.left) * 0.2),
      );

      let corridorA = clamp(
        corridor.center - corridorInset,
        corridor.left + 2,
        corridor.right - 2,
      );

      let corridorB = clamp(
        corridor.center + corridorInset,
        corridor.left + 2,
        corridor.right - 2,
      );

      if (Math.abs(corridorB - corridorA) < 4) {
        corridorA = corridor.center;
        corridorB = clamp(
          corridor.center + (to.x < corridor.center ? -4 : 4),
          corridor.left + 1.5,
          corridor.right - 1.5,
        );
      }

      if (to.x < corridor.center) {
        [corridorA, corridorB] = [corridorB, corridorA];
      }

      const horizontalEndpoints = [];
      const freeHorizontalCount = horizontalCount - 3;
      let currentX = from.x;

      for (let index = 0; index < freeHorizontalCount; index += 1) {
        const progress = (index + 1) / (freeHorizontalCount + 1);
        const guide = lerp(from.x, corridorA, progress);
        const alternatingDirection = index % 2 === 0 ? -1 : 1;
        const targetDirection = Math.sign(corridorA - from.x) || 1;

        let candidate =
          guide +
          alternatingDirection *
            targetDirection *
            CONFIG.routeHorizontalJitter;

        candidate = clamp(
          candidate,
          width * 0.045,
          width * 0.955,
        );

        const deltaX = candidate - currentX;
        const maximumRun = CONFIG.routeMaxStraightRun;
        const minimumRun = Math.min(24, maximumRun * 0.42);

        if (Math.abs(deltaX) > maximumRun) {
          candidate = currentX + Math.sign(deltaX) * maximumRun;
        } else if (Math.abs(deltaX) < minimumRun) {
          candidate = currentX + alternatingDirection * minimumRun;
          candidate = clamp(candidate, width * 0.045, width * 0.955);
        }

        horizontalEndpoints.push(candidate);
        currentX = candidate;
      }

      horizontalEndpoints.push(corridorA, corridorB, to.x);

      const points = [{ x: from.x, y: from.y }];
      let currentPoint = points[0];

      for (let segmentIndex = 0; segmentIndex < horizontalCount; segmentIndex += 1) {
        const nextY = verticalEndpoints[segmentIndex];
        if (nextY !== currentPoint.y) {
          currentPoint = { x: currentPoint.x, y: nextY };
          points.push(currentPoint);
        }
        const nextX = horizontalEndpoints[segmentIndex];
        if (nextX !== currentPoint.x) {
          currentPoint = { x: nextX, y: currentPoint.y };
          points.push(currentPoint);
        }
      }

      const finalY = verticalEndpoints[verticalEndpoints.length - 1];
      if (finalY !== currentPoint.y) {
        points.push({ x: currentPoint.x, y: finalY });
      }
      return cleanCircuitPath(points);
    }

    function buildCircuitPath(from: any, to: any, destinationPlatform: any = null) {
      const platform = destinationPlatform || rowAbove()?.platforms.find(
        (candidate) => candidate.x === to.x,
      );
      const destinationRow = platform ? getRow(platform.row) : rowAbove();

      if (!platform || !destinationRow) {
        return cleanCircuitPath([
          { x: from.x, y: from.y },
          { x: from.x, y: to.y - 24 },
          { x: to.x, y: to.y - 24 },
          { x: to.x, y: to.y },
        ]);
      }

      const corridors = destinationCorridors(destinationRow);
      const preferred = chooseDestinationCorridor(
        destinationRow,
        platform.x,
        from.x,
      );

      const orderedCorridors = [
        preferred,
        ...corridors.filter((corridor) => corridor !== preferred),
      ];

      for (const corridor of orderedCorridors) {
        const candidate = buildSteppedRoute(
          from,
          to,
          platform,
          corridor,
        );
        if (pathIsClear(candidate)) {
          return candidate;
        }
      }

      const edgeCorridor = {
        left: from.x < width / 2 ? 1 : width - 15,
        right: from.x < width / 2 ? 15 : width - 1,
        center: from.x < width / 2 ? 8 : width - 8,
      };

      return buildSteppedRoute(
        from,
        to,
        platform,
        edgeCorridor,
      );
    }

    function pathMetrics(points: any[]) {
      const lengths = [];
      let total = 0;
      for (let i = 1; i < points.length; i += 1) {
        const length = Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
        lengths.push(length);
        total += length;
      }
      return { lengths, total };
    }

    function pointOnPath(currentTravel: any) {
      let distance = currentTravel.distance;
      for (let i = 0; i < currentTravel.lengths.length; i += 1) {
        const length = currentTravel.lengths[i];
        if (distance <= length || i === currentTravel.lengths.length - 1) {
          const a = currentTravel.points[i];
          const b = currentTravel.points[i + 1];
          const amount = length === 0 ? 1 : clamp(distance / length, 0, 1);
          return { x: lerp(a.x, b.x, amount), y: lerp(a.y, b.y, amount), segment: i };
        }
        distance -= length;
      }
      const end = currentTravel.points[currentTravel.points.length - 1];
      return { x: end.x, y: end.y, segment: currentTravel.lengths.length - 1 };
    }

    function obstacleRectsNear(y0: number, y1: number) {
      const padding = 6;
      const rects: any[] = [];
      rows.forEach((row) => {
        if (row.y < y0 - CONFIG.rowGap || row.y > y1 + CONFIG.rowGap) return;
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

    function cellBlocked(x: number, y: number, rects: any[]) {
      return rects.some((rect) => x > rect.left && x < rect.right && y > rect.top && y < rect.bottom);
    }



    function updateTimerLine(delta: number) {
      timerSpeed += CONFIG.timerRamp * delta;
      const gap = timerLineY - player.y;
      const hurry = gap > CONFIG.rowGap * CONFIG.timerCatchGapRows ? 2.1 : 1;
      timerLineY -= timerSpeed * hurry * delta;

      const closestLine = player.y + (CONFIG.botBaseOffsetRows + 0.65) * CONFIG.rowGap;
      if (timerLineY < closestLine) timerLineY = closestLine;
    }

     function updateBot(delta: number) {
      if (!bot || !engineAlive) return;

      let legacyCalled = false;
      let v2Called = false;
      let v3Called = false;

      if (CONFIG.aiImplementation === 'PLATFORM_GRAPH_V3') {
        v3Called = true;
        v3UpdateCount++;
        actualControllerCalled = 'updateBotV3';
        if (v2FrozenUpdateCount > 0 || v2SimplifiedUpdateCount > 0 || legacyUpdateCount > 0) {
          console.error('CRITICAL ENGINE VIOLATION: Non-V3 engine updated while PLATFORM_GRAPH_V3 active');
        }
        if ((bot as any).v3IntendedDisplacement) {
          const disp = (bot as any).v3IntendedDisplacement;
          lastIntendedDisplacement = { ...disp };
          lastCollisionResolvedDisplacement = { ...disp };
          lastCommittedDisplacement = { ...disp };

          bot.x += disp.x;
          bot.y += disp.y;
          botTrail.push({ x: bot.x, y: bot.y, born: elapsed });

          if (botContextV3) {
            bot.mode = botContextV3.currentState as any;
          }

          const events = (bot as any).v3Events || [];
          events.forEach((evt: any) => {
            if (evt.type === 'PLAY_EXCITEMENT_SOUND') {
              sound.scan();
            } else if (evt.type === 'SHOW_ALERT_REACTION') {
              echoes.push({ x0: player.x, y0: player.y, x1: bot!.x, y1: bot!.y, born: elapsed });
              sound.lock();
              setMessage('RED SPARK ALERT!', 'error', 1050);
            } else if (evt.type === 'CAPTURE') {
              endGame('Captured');
            }
          });

          (bot as any).v3IntendedDisplacement = null;
          (bot as any).v3Events = null;
        }
      } else if (CONFIG.bringUpStage !== 'NORMAL') {
        v2Called = true;
        v2FrozenUpdateCount++;
        actualControllerCalled = 'bringUpStage';
        if ((bot as any).v2IntendedDisplacement) {
          bot.x += (bot as any).v2IntendedDisplacement.x;
          bot.y += (bot as any).v2IntendedDisplacement.y;
          botTrail.push({ x: bot.x, y: bot.y, born: elapsed });
          if (botContextV2) {
            bot.mode = botContextV2.currentState as any;
          }
          (bot as any).v2IntendedDisplacement = null;
          (bot as any).v2Events = null;
        }
      } else if (CONFIG.aiImplementation === 'LEGACY') {
        legacyCalled = true;
        legacyUpdateCount++;
        actualControllerCalled = 'updateBotAI_Legacy';
        const res = updateBotAI(bot, player, rows, timerLineY, CONFIG, delta, elapsed, width, height);
        bot = res.state;
        botTrail.push({ x: bot.x, y: bot.y, born: elapsed });

        res.events.forEach((evt) => {
          if (evt === 'scan') {
            sound.scan();
          } else if (evt === 'lock') {
            echoes.push({ x0: player.x, y0: player.y, x1: bot!.x, y1: bot!.y, born: elapsed });
            sound.lock();
            setMessage('RED SPARK LOCKED — move before it reaches that position.', 'error', 1050);
          } else if (evt === 'recover') {
            sound.danger();
            setMessage('STALL DETECTED — timing spark recovering...', 'neutral', 1200);
          }
        });
      } else if (botContextV2 && (bot as any).v2IntendedDisplacement) {
        v2Called = true;
        if (CONFIG.aiImplementation === 'V2_FROZEN') {
          v2FrozenUpdateCount++;
          actualControllerCalled = 'updateBotV2_Frozen';
        } else {
          v2SimplifiedUpdateCount++;
          actualControllerCalled = 'updateBotV2_Simplified';
        }
        // Greenfield V2 - displacement and events were generated at start of update()
        bot.x += (bot as any).v2IntendedDisplacement.x;
        bot.y += (bot as any).v2IntendedDisplacement.y;
        botTrail.push({ x: bot.x, y: bot.y, born: elapsed });

        // Update legacy bot state for drawing
        bot.mode = botContextV2.currentState as any;

        const events = (bot as any).v2Events || [];
        events.forEach((evt: any) => {
          if (evt.type === 'PLAY_EXCITEMENT_SOUND') {
             sound.scan();
          } else if (evt.type === 'SHOW_ALERT_REACTION') {
             echoes.push({ x0: player.x, y0: player.y, x1: bot!.x, y1: bot!.y, born: elapsed });
             sound.lock();
             setMessage('RED SPARK ALERT!', 'error', 1050);
          } else if (evt.type === 'CAPTURE') {
             endGame('Captured');
          }
        });
        
        // Clear them so they aren't processed twice
        (bot as any).v2IntendedDisplacement = null;
        (bot as any).v2Events = null;
      }

      const activeControllers = (legacyCalled ? 1 : 0) + (v2Called ? 1 : 0) + (v3Called ? 1 : 0);
      if (activeControllers === 0) {
        console.error('DEVELOPMENT ERROR: NO_CONTROLLER_CALLED during active frame');
      } else if (activeControllers > 1) {
        console.error('DEVELOPMENT ERROR: MULTIPLE_CONTROLLERS_CALLED during active frame');
      }
    }

    function selectPlatform(platform: any) {
      if (!engineStarted || !engineAlive || enginePaused || travel || resolveAt || platform.dead) return;
      if (platform.row !== player.row + 1) return;

      getAudioContext();
      platform.selected = true;
      const destination = landingPoint(platform);
      const from = { x: player.x, y: player.y };

      if (engineMovementMode === 'circuit') {
        const points = buildCircuitPath(from, destination);
        const metrics = pathMetrics(points);
        travel = {
          type: 'circuit',
          platform,
          points,
          lengths: metrics.lengths,
          total: metrics.total,
          distance: 0,
          segment: 0,
          correct: platform.correct,
        };
      } else {
        travel = {
          type: 'hop',
          platform,
          from,
          to: destination,
          duration: CONFIG.hopDuration,
          time: 0,
          correct: platform.correct,
        };
      }

      if (platform.correct) {
        playerNumberPresentation.phase = 'clearing';
        playerNumberPresentation.phaseStartedAt = elapsed;
        const nextActiveRow = getRow(platform.row + 1);
        if (nextActiveRow && nextActiveRow.problemSnapshot) {
          playerNumberPresentation.pendingValue = nextActiveRow.problemSnapshot.playerValue;
        } else {
          // Fallback if somehow not prepared
          playerNumberPresentation.pendingValue = 4;
        }
      }

      setMessage(`${player.value}) + ${platform.value} = ${player.value + platform.value}`, platform.correct ? 'success' : 'error', 800);
      sound.launch();
    }

    function spawnBurst(x: number, y: number, color: string, amount = 24, speed = 0.18) {
      for (let i = 0; i < amount; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = speed * (0.45 + Math.random());
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          radius: 1.5 + Math.random() * 2.8,
          life: 0,
          maxLife: 350 + Math.random() * 420,
          color,
        });
      }
    }

    function arrive(currentTravel: any) {
      const platform = currentTravel.platform;
      const destination = landingPoint(platform);
      player.x = destination.x;
      player.y = destination.y;

      if (currentTravel.correct) {
        platform.powered = true;
        platform.litAt = elapsed;
        platform.selected = false;

        if (currentTravel.type === 'circuit') {
          traces.push({
            points: currentTravel.points.map((point: any) => ({ ...point })),
            born: elapsed,
          });
        }

        player.row += 1;
        player.platform = platform;
        player.pulseAt = elapsed;
        engineBestRow = Math.max(engineBestRow, player.row);
        setBestRow(engineBestRow);
        try {
          window.localStorage.setItem('circuitClimbPrototypeBest', String(engineBestRow));
        } catch {
          // Safe fallback
        }
        
        travel = null;
        resolveAt = 0; // Clear resolve block to allow immediate input

        ensureRows();
        const nextActiveRow = getRow(player.row + 1);
        if (nextActiveRow && nextActiveRow.problemSnapshot) {
          player.value = nextActiveRow.problemSnapshot.playerValue;
        } else {
          player.value = 4;
        }

        if (playerNumberPresentation.pendingValue !== null) {
          playerNumberPresentation.displayedValue = playerNumberPresentation.pendingValue;
          playerNumberPresentation.pendingValue = null;
        } else {
          playerNumberPresentation.displayedValue = player.value;
        }
        
        // Immediately visible on exact landing frame
        playerNumberPresentation.phase = 'visible';
        playerNumberPresentation.phaseStartedAt = elapsed;

        armNextRow();
        updateHud();

        spawnBurst(player.x, player.y, COLORS.lime, 30, 0.22);
        sound.correct();
        return;
      }

      platform.dead = true;
      platform.selected = false;
      timerLineY -= CONFIG.wrongPenalty;
      if (bot) bot.lastRepath = -1e9;
      spawnBurst(player.x, player.y, COLORS.red, 32, 0.25);
      sound.wrong();
      setMessage('Short circuit. The red timing spark gained ground.', 'error', 1300);

      const back = landingPoint(player.platform);
      travel = {
        type: 'return',
        from: { x: destination.x, y: destination.y },
        to: back,
        time: 0,
        duration: CONFIG.returnDuration,
      };
    }

    function updateTravel(delta: number) {
      if (!travel) return;

      if (travel.type === 'circuit') {
        travel.distance += CONFIG.routeSpeed * delta;
        const point = pointOnPath(travel);
        if (point.segment > travel.segment) {
          travel.segment = point.segment;
          sound.corner();
        }
        player.x = point.x;
        player.y = point.y;
        if (travel.distance >= travel.total) arrive(travel);
        return;
      }

      if (travel.type === 'hop') {
        travel.time += delta;
        const amount = clamp(travel.time / travel.duration, 0, 1);
        player.x = lerp(travel.from.x, travel.to.x, amount);
        player.y = lerp(travel.from.y, travel.to.y, amount) - Math.sin(amount * Math.PI) * CONFIG.hopHeight;
        if (amount >= 1) arrive(travel);
        return;
      }

      if (travel.type === 'return') {
        travel.time += delta;
        const amount = clamp(travel.time / travel.duration, 0, 1);
        player.x = lerp(travel.from.x, travel.to.x, amount);
        player.y = lerp(travel.from.y, travel.to.y, amount) - Math.sin(amount * Math.PI) * 72;
        if (amount >= 1) {
          player.x = travel.to.x;
          player.y = travel.to.y;
          travel = null;
        }
      }
    }

    function updateParticles(delta: number) {
      particles.forEach((particle) => {
        particle.life += delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vy += 0.00042 * delta;
      });
      particles = particles.filter((particle) => particle.life < particle.maxLife);
    }

    function cullWorld() {
      const bottom = cameraY + height + CONFIG.cullMargin;
      const originalCount = rows.length;
      rows = rows.filter((row) => row.y < bottom || row.index >= player.row - 2);
      if (rows.length !== originalCount) {
        obstacleRevision += 1;
      }
      traces = traces.filter((trace) => Math.min(...trace.points.map((point: any) => point.y)) < bottom);
      botTrail = botTrail.filter((point) => elapsed - point.born < 900 && point.y < bottom);
      echoes = echoes.filter((echo) => elapsed - echo.born < 300);
    }

    function getIntendedPlayer(delta: number) {
      if (!travel) return { x: player.x, y: player.y };
      if (travel.type === 'circuit') {
        const nextDistance = travel.distance + CONFIG.routeSpeed * delta;
        if (nextDistance >= travel.total) {
           const dest = landingPoint(travel.platform);
           return { x: dest.x, y: dest.y };
        }
        return pointOnPath({ ...travel, distance: nextDistance });
      }
      if (travel.type === 'hop') {
        const nextTime = travel.time + delta;
        const amount = clamp(nextTime / travel.duration, 0, 1);
        return {
          x: lerp(travel.from.x, travel.to.x, amount),
          y: lerp(travel.from.y, travel.to.y, amount) - Math.sin(amount * Math.PI) * CONFIG.hopHeight
        };
      }
      if (travel.type === 'return') {
        const nextTime = travel.time + delta;
        const amount = clamp(nextTime / travel.duration, 0, 1);
        return {
          x: lerp(travel.from.x, travel.to.x, amount),
          y: lerp(travel.from.y, travel.to.y, amount) - Math.sin(amount * Math.PI) * 72
        };
      }
      return { x: player.x, y: player.y };
    }

    function getIntendedBot(delta: number) {
      if (!bot || !engineAlive) return { x: 0, y: 0 };
      
      if (CONFIG.aiImplementation === 'PLATFORM_GRAPH_V3') {
        if ((bot as any).v3IntendedDisplacement) {
          return {
            x: bot.x + (bot as any).v3IntendedDisplacement.x,
            y: bot.y + (bot as any).v3IntendedDisplacement.y
          };
        }
        return { x: bot.x, y: bot.y };
      }

      const isV2 = CONFIG.aiImplementation !== 'LEGACY' || CONFIG.bringUpStage !== 'NORMAL';
      if (isV2) {
        if ((bot as any).v2IntendedDisplacement) {
            return {
                x: bot.x + (bot as any).v2IntendedDisplacement.x,
                y: bot.y + (bot as any).v2IntendedDisplacement.y
            };
        }
        return { x: bot.x, y: bot.y };
      }

      if ((bot.mode !== 'CHASE' && bot.mode !== 'SEARCH') || !bot.travel) {
        return { x: bot ? bot.x : 0, y: bot ? bot.y : 0 };
      }
      const speed = bot.mode === 'CHASE' ? CONFIG.botLockSpeed : CONFIG.botPatrolSpeed;
      const nextDistance = bot.travel.distance + speed * delta;
      if (nextDistance >= bot.travel.total) {
        return pointOnPath({ ...bot.travel, distance: bot.travel.total });
      }
      return pointOnPath({ ...bot.travel, distance: nextDistance });
    }

    function sweptCollision(px0: number, py0: number, px1: number, py1: number, bx0: number, by0: number, bx1: number, by1: number, r: number) {
        const vx = (bx1 - bx0) - (px1 - px0);
        const vy = (by1 - by0) - (py1 - py0);
        const sx = bx0 - px0;
        const sy = by0 - py0;
        
        const a = vx*vx + vy*vy;
        const b = 2 * (sx*vx + sy*vy);
        const c = sx*sx + sy*sy - r*r;
        
        if (c <= 0) return 0; // already intersecting
        if (a === 0) return -1; // no relative movement
        
        const disc = b*b - 4*a*c;
        if (disc < 0) return -1;
        
        const t = (-b - Math.sqrt(disc)) / (2*a);
        if (t >= 0 && t <= 1) return t;
        return -1;
    }


    function triggerCapture(t: number, px0: number, py0: number, px1: number, py1: number, bx0: number, by0: number, bx1: number, by1: number, delta: number) {
      if (!engineAlive) return;
      
      const r = CONFIG.playerRadius + CONFIG.botRadius;
      console.log('ENEMY_PLAYER_FIRST_TOUCH', {
        playerPrevious: { x: px0, y: py0 },
        playerIntended: { x: px1, y: py1 },
        enemyPrevious: { x: bx0, y: by0 },
        enemyIntended: { x: bx1, y: by1 },
        playerPhysicalRadius: CONFIG.playerRadius,
        enemyPhysicalRadius: CONFIG.botRadius,
        combinedRadius: r,
        startingCenterDistance: Math.hypot(px0 - bx0, py0 - by0),
        intendedEndingCenterDistance: Math.hypot(px1 - bx1, py1 - by1),
        timeOfImpact: t,
        playerState: travel ? travel.type : 'resting',
        enemyState: bot ? bot.mode : 'unknown',
        frameDelta: delta,
        detectionMethod: t === 0 ? 'static' : 'swept',
        movementClamped: t < 1
      });

      BotFlightRecorder.getInstance().recordEvent(
        elapsed,
        CONFIG.aiImplementation as 'GREENFIELD_V2' | 'LEGACY',
        botContextV2?.currentState || 'SEARCH',
        'NONE',
        'LIFECYCLE',
        'LIFECYCLE_CAPTURE_TRIGGERED',
        `Lifecycle capture triggered on swept/static collision touch. Time of impact: ${t}. Center distance: ${Math.hypot(px0 - bx0, py0 - by0).toFixed(1)}px.`,
        { x: bx1, y: by1 },
        { x: px1, y: py1 },
        CONFIG.botRadius,
        CONFIG.playerRadius,
        botContextV2?.awareness?.id || 0,
        obstacleRevision,
        botContextV2?.debug?.plannerStatus || '',
        botContextV2?.pathIndex || 0,
        { sweptT: t, preDist: Math.hypot(px0 - bx0, py0 - by0), postDist: Math.hypot(px1 - bx1, py1 - by1) }
      );

      spawnBurst(player.x, player.y, COLORS.enemy, 60, 0.35);
      sound.wrong();
      endGame('Red timing spark caught you');
    }


    function update(delta: number) {
      elapsed += delta;
      if (messageTimer && elapsed >= messageTimer) {
        messageTimer = 0;
        if (!resolveAt) setMessage('Tap the platform that completes the equation.');
      }

      if (!firstFrameTraced && bot && engineAlive && engineStarted) {
        firstFrameTraced = true;
        const scanValues = (CONFIG.aiImplementation === 'LEGACY') ? (
          bot.detected ? {
            detected: bot.detected,
            lastDetectedAt: bot.lastDetectedAt
          } : null
        ) : (CONFIG.aiImplementation === 'PLATFORM_GRAPH_V3') ? (
          botContextV3?.awareness ? {
            detected: botContextV3.awareness.discovered,
            lastDetectedAt: botContextV3.awareness.lastDetectedAtMs
          } : null
        ) : (
          botContextV2?.awareness ? {
            detected: true,
            lastDetectedAt: botContextV2.awareness.lastConfirmedAtMs
          } : null
        );
        const bIntended = getIntendedBot(delta);
        const bDisplacement = { x: bIntended.x - bot.x, y: bIntended.y - bot.y };
        
        console.log('--- PRODUCTION FRAME TRACE (FIRST ACTIVE FRAME) ---', {
          viewport: { width, height },
          player: { world: { x: player.x, y: player.y }, screen: { x: player.x, y: worldToScreenY(player.y) } },
          bot: { world: { x: bot.x, y: bot.y }, screen: { x: bot.x, y: worldToScreenY(bot.y) } },
          cameraScrollY: cameraY,
          deltaTimeMs: delta,
          scanValues,
          rawPhysicsDisplacement: bDisplacement
        });
      }

      if (bot && engineAlive) {
        if (CONFIG.aiImplementation === 'PLATFORM_GRAPH_V3' || (CONFIG.aiImplementation !== 'LEGACY' && botContextV2)) {
          const platforms: any[] = [];
          const viewTop = cameraY - height;
          const viewBottom = cameraY + height * 2;
          rows.forEach(r => {
            if (r.y > viewTop && r.y < viewBottom) {
               r.platforms.forEach((p: any) => {
                 platforms.push({
                   id: p.id || (r.y + '-' + p.x),
                   rect: {
                     left: p.x - CONFIG.platformWidth / 2,
                     right: p.x + CONFIG.platformWidth / 2,
                     top: r.y - CONFIG.platformHeight / 2,
                     bottom: r.y + CONFIG.platformHeight / 2,
                   }
                 });
               });
            }
          });

          let playerMovementState: 'SETTLED' | 'MOVE_STARTED' | 'IN_TRANSIT' | 'LANDING' | 'WRONG_RETURN' | 'CAPTURED' = 'SETTLED';
          if (!engineAlive) {
            playerMovementState = 'CAPTURED';
          } else if (!travel) {
            playerMovementState = 'SETTLED';
          } else if (travel.type === 'return') {
            playerMovementState = 'WRONG_RETURN';
          } else {
            const progress = travel.type === 'circuit'
              ? (travel.total > 0 ? travel.distance / travel.total : 0)
              : (travel.duration > 0 ? travel.time / travel.duration : 0);
            if (progress === 0) {
              playerMovementState = 'MOVE_STARTED';
            } else if (progress >= 1) {
              playerMovementState = 'LANDING';
            } else {
              playerMovementState = 'IN_TRANSIT';
            }
          }

          const playerSettledPlatformId = !travel && player.platform ? (player.platform.id || `${player.platform.row}-${player.platform.column}`) : null;
          const playerDestinationPlatformId = travel && travel.platform ? (travel.platform.id || `${travel.platform.row}-${travel.platform.column}`) : null;
          
          let playerRoutePolyline: any[] | null = null;
          let playerRouteStartPosition: any | null = null;
          let playerRouteDestination: any | null = null;
          let playerRouteProgress = 0;
          let playerEstimatedRemainingTransitTimeMs = 0;

          if (travel) {
            if (travel.type === 'circuit') {
              playerRoutePolyline = travel.points;
              playerRouteStartPosition = travel.points[0];
              playerRouteDestination = travel.points[travel.points.length - 1];
              playerRouteProgress = travel.total > 0 ? Math.min(1, Math.max(0, travel.distance / travel.total)) : 0;
              playerEstimatedRemainingTransitTimeMs = travel.total > 0 ? Math.max(0, (travel.total - travel.distance) / CONFIG.routeSpeed * 16.666) : 0;
            } else {
              playerRoutePolyline = [travel.from, travel.to];
              playerRouteStartPosition = travel.from;
              playerRouteDestination = travel.to;
              playerRouteProgress = travel.duration > 0 ? Math.min(1, Math.max(0, travel.time / travel.duration)) : 0;
              playerEstimatedRemainingTransitTimeMs = Math.max(0, travel.duration - travel.time);
            }
          }

          // Record player movement state events
          if (playerMovementState !== (bot as any).lastPlayerStateRecorded) {
            const prevState = (bot as any).lastPlayerStateRecorded || 'SETTLED';
            (bot as any).lastPlayerStateRecorded = playerMovementState;
            
            let eventName = '';
            let triggerReason = '';
            
            if (playerMovementState === 'MOVE_STARTED') {
              BotFlightRecorder.getInstance().recordEvent(
                elapsed,
                CONFIG.aiImplementation as 'GREENFIELD_V2' | 'LEGACY',
                botContextV2?.currentState || 'SEARCH',
                'NONE',
                'MOVEMENT',
                'PLAYER_MOVE_STARTED',
                `Player started moving. From platform: ${playerSettledPlatformId}, Destination: ${playerDestinationPlatformId}`,
                { x: bot.x, y: bot.y },
                { x: player.x, y: player.y },
                CONFIG.botRadius,
                CONFIG.playerRadius,
                botContextV2?.awareness?.id || 0,
                obstacleRevision,
                botContextV2?.debug?.plannerStatus || '',
                botContextV2?.pathIndex || 0
              );
              
              BotFlightRecorder.getInstance().recordEvent(
                elapsed,
                CONFIG.aiImplementation as 'GREENFIELD_V2' | 'LEGACY',
                botContextV2?.currentState || 'SEARCH',
                'NONE',
                'MOVEMENT',
                'PLAYER_DESTINATION_IDENTIFIED',
                `Player destination identified: ${playerDestinationPlatformId}`,
                { x: bot.x, y: bot.y },
                { x: player.x, y: player.y },
                CONFIG.botRadius,
                CONFIG.playerRadius,
                botContextV2?.awareness?.id || 0,
                obstacleRevision,
                botContextV2?.debug?.plannerStatus || '',
                botContextV2?.pathIndex || 0,
                { destinationId: playerDestinationPlatformId }
              );
            } else if (playerMovementState === 'IN_TRANSIT') {
              eventName = 'PLAYER_IN_TRANSIT';
              triggerReason = `Player is in transit towards ${playerDestinationPlatformId}`;
            } else if (playerMovementState === 'LANDING') {
              eventName = 'PLAYER_LANDED';
              triggerReason = `Player is landing on platform ${playerDestinationPlatformId}`;
            } else if (playerMovementState === 'SETTLED') {
              eventName = 'PLAYER_LANDED';
              triggerReason = `Player settled on platform ${playerSettledPlatformId}`;
            }

            if (eventName) {
              BotFlightRecorder.getInstance().recordEvent(
                elapsed,
                CONFIG.aiImplementation as 'GREENFIELD_V2' | 'LEGACY',
                botContextV2?.currentState || 'SEARCH',
                'NONE',
                'MOVEMENT',
                eventName,
                triggerReason,
                { x: bot.x, y: bot.y },
                { x: player.x, y: player.y },
                CONFIG.botRadius,
                CONFIG.playerRadius,
                botContextV2?.awareness?.id || 0,
                obstacleRevision,
                botContextV2?.debug?.plannerStatus || '',
                botContextV2?.pathIndex || 0,
                { destination: playerDestinationPlatformId, settled: playerSettledPlatformId }
              );
            }
          }

          const snapshot = {
            simTimeMs: elapsed,
            deltaMs: delta,
            playerPosition: { x: player.x, y: player.y },
            playerRadius: CONFIG.playerRadius,
            playerRowId: player.row,
            playerSupportingPlatformId: player.platform ? (player.platform.id || `${player.platform.row}-${player.platform.column}`) : null,
            botPosition: { x: bot.x, y: bot.y },
            botRadius: CONFIG.botRadius,
            platforms,
            navigationBounds: { left: 0, right: width, top: player.y - height * 2, bottom: player.y + height * 2 },
            obstacleRevision: obstacleRevision,
            paused: enginePaused,
            gameOver: !engineAlive,
            difficulty: CONFIG.difficulty as 'EASY' | 'NORMAL' | 'HARD',
            rowGap: CONFIG.rowGap,
            botBaseOffsetRows: CONFIG.botBaseOffsetRows,
            playerMovementState,
            playerSettledPlatformId,
            playerDestinationPlatformId,
            playerRoutePolyline,
            playerRouteStartPosition,
            playerRouteDestination,
            playerRouteProgress,
            playerEstimatedRemainingTransitTimeMs
          };

          if (CONFIG.aiImplementation === 'PLATFORM_GRAPH_V3') {
            if (!botContextV3) {
              botContextV3 = createBotContextV3();
            }
            const res = updateBotV3(snapshot, botContextV3);
            (bot as any).v3IntendedDisplacement = res.intendedDisplacement;
            (bot as any).v3Events = res.events;
          } else {
            const runV2Update = CONFIG.bringUpStage !== 'STAGE_A' && CONFIG.bringUpStage !== 'STAGE_B';

            if (runV2Update) {
              const res = updateBotV2(snapshot, botContextV2);
              if (CONFIG.bringUpStage === 'STAGE_C' || CONFIG.bringUpStage === 'STAGE_D') {
                (bot as any).v2IntendedDisplacement = { x: 0, y: 0 };
              } else {
                (bot as any).v2IntendedDisplacement = res.intendedDisplacement;
              }
              (bot as any).v2Events = res.events;
            } else if (CONFIG.bringUpStage === 'STAGE_A') {
              bot.x = width / 2;
              bot.y = player.y + 140;
              (bot as any).v2IntendedDisplacement = { x: 0, y: 0 };
              (bot as any).v2Events = [];
            } else if (CONFIG.bringUpStage === 'STAGE_B') {
              if (typeof (bot as any).diagDirection === 'undefined') {
                (bot as any).diagDirection = 1;
              }
              bot.y = player.y + 140;
              const speedPxPerMs = 0.12;
              let dx = (bot as any).diagDirection * speedPxPerMs * delta;
              const nextX = bot.x + dx;
              if (nextX > width * 0.8) {
                (bot as any).diagDirection = -1;
                dx = (width * 0.8) - bot.x;
              } else if (nextX < width * 0.2) {
                (bot as any).diagDirection = 1;
                dx = (width * 0.2) - bot.x;
              }
              (bot as any).v2IntendedDisplacement = { x: dx, y: 0 };
              (bot as any).v2Events = [];
            }
          }
        }

        // Pre-check for existing static contact or sweeping contact
        const r = CONFIG.playerRadius + CONFIG.botRadius;
        
        const pIntended = getIntendedPlayer(delta);
        const bIntended = getIntendedBot(delta);
        
        const t = sweptCollision(player.x, player.y, pIntended.x, pIntended.y, bot.x, bot.y, bIntended.x, bIntended.y, r);
        
        if (t >= 0 && t <= 1) {
          // Collision happened at fraction t of the frame.
          // Advance simulation only up to time of impact.
          const impactDelta = delta * t;
          updateTravel(impactDelta);
          updateBot(impactDelta);
          triggerCapture(t, player.x, player.y, pIntended.x, pIntended.y, bot.x, bot.y, bIntended.x, bIntended.y, delta);
          return;
        }
      }

      if (playerNumberPresentation.phase === 'clearing') {
        if (elapsed - playerNumberPresentation.phaseStartedAt >= 110) {
          playerNumberPresentation.phase = 'hidden-transit';
          playerNumberPresentation.phaseStartedAt += 110;
        }
      }

      const targetAge = elapsed - targetPresentation.phaseStartedAt;
      if (targetPresentation.phase === 'dominant-enter' && targetAge >= 180) {
        targetPresentation.phase = 'dominant-hold';
      } else if (targetPresentation.phase === 'dominant-hold' && targetAge >= 650) {
        targetPresentation.phase = 'receding';
      } else if (targetPresentation.phase === 'receding' && targetAge >= 1500) {
        targetPresentation.phase = 'resting';
      }
      targetPresentation.progress = clamp(targetAge / 1500, 0, 1);

      updateTravel(delta);
      updateTimerLine(delta);
      updateBot(delta);
      updateParticles(delta);

      const desiredCamera = player.y - height * CONFIG.cameraAnchor;
      cameraY += (desiredCamera - cameraY) * (1 - Math.pow(0.0008, delta / 1000));

      cullWorld();
      updateHud();
    }

    function worldToScreenY(worldY: number) {
      return worldY - cameraY;
    }

    function parallaxOffset(factor: number, period: number) {
      return ((-cameraY * factor) % period + period) % period;
    }

    function drawFarParallax() {
      const offset = parallaxOffset(CONFIG.farParallax, 260);
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = COLORS.bgDepth;
      ctx.lineWidth = 2;
      for (let i = -1; i < 6; i += 1) {
        const y = i * 260 + offset;
        ctx.beginPath();
        ctx.arc(width * 0.18, y + 70, 78, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(width * 0.82, y + 160, 112, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }


    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function drawTargetPresentation() {
      const p = targetPresentation;
      const targetAge = elapsed - p.phaseStartedAt;
      let alpha = 0.22;
      let sizeScale = 1;
      let yOffset = 0;
      
      const restSize = Math.min(width * 0.62, height * 0.31);
      const domSize = Math.min(width * 0.75, height * 0.45);
      let size = restSize;
      
      let flash = 0;
      let haloAlpha = 0;
      
      if (p.phase === 'dominant-enter') {
        const pr = clamp(targetAge / 180, 0, 1);
        alpha = 0.22 + pr * 0.68; // up to ~0.9
        size = domSize;
        flash = pr;
        yOffset = (1 - pr) * 20; // slight drop in
        haloAlpha = pr * 0.6;
      } else if (p.phase === 'dominant-hold') {
        alpha = 0.9;
        size = domSize;
        flash = 1;
        haloAlpha = 0.6;
      } else if (p.phase === 'receding') {
        const pr = clamp((targetAge - 650) / 850, 0, 1);
        const ease = pr < 0.5 ? 2 * pr * pr : 1 - Math.pow(-2 * pr + 2, 2) / 2;
        alpha = 0.9 - ease * (0.9 - 0.22);
        size = domSize - ease * (domSize - restSize);
        flash = 1 - ease;
        haloAlpha = 0.6 - ease * 0.6;
      } else {
        alpha = 0.22;
        size = restSize;
        flash = 0;
        haloAlpha = 0;
      }

      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        yOffset = 0;
        size = restSize + (size - restSize) * 0.3; // Less scale
      }
      const drift = prefersReducedMotion ? 0 : parallaxOffset(CONFIG.farParallax, 420) - 210;
      const baseY = height * 0.42 + drift * 0.10 + yOffset;
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${size}px ui-monospace, monospace`;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = flash > 0.25 ? COLORS.text : '#bacde6';
      ctx.shadowColor = flash > 0.25 ? COLORS.targetGlow : COLORS.gridDot;
      ctx.shadowBlur = 12 + flash * 46;
      ctx.fillText(String(p.targetValue), width / 2, baseY);
      ctx.restore();

      // SUM TO cue
      if (showSumToCue) {
        let cueAlpha = alpha * 1.5;
        if (cueAlpha > 1) cueAlpha = 1;
        
        const floatDrift = prefersReducedMotion ? 0 : Math.sin(elapsed / 800) * 4;
        const cueY = baseY - size * 0.55 - 30 + floatDrift;
        
        ctx.save();
        ctx.globalAlpha = cueAlpha;
        
        // Background chip
        const chipW = 90;
        const chipH = 28;
        const chipX = width / 2 - chipW / 2;
        const chipY = cueY - chipH / 2;
        
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        
        ctx.fillStyle = COLORS.cueSurface;
        roundRect(chipX, chipY, chipW, chipH, 14);
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = COLORS.cueBorder;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = COLORS.text;
        ctx.font = '900 12px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = '1px';
        ctx.fillText('SUM TO', width / 2, cueY + 1);
        ctx.restore();
      }
    }


    function drawMidParallax() {
      const grid = 30;
      const offsetY = parallaxOffset(CONFIG.midParallax, grid);
      ctx.strokeStyle = COLORS.gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += grid) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
      }
      for (let y = offsetY; y <= height; y += grid) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }
      ctx.stroke();

      ctx.fillStyle = COLORS.gridDot;
      for (let x = 15; x < width; x += grid) {
        for (let y = offsetY + 15; y < height; y += grid) {
          ctx.globalAlpha = 0.24 + 0.10 * Math.sin((x + y + elapsed * 0.02) * 0.04);
          ctx.beginPath();
          ctx.arc(x, y, 1.15, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    function drawForegroundParallax() {
      const offset = parallaxOffset(CONFIG.foregroundParallax, 190);
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = COLORS.bgDepth;
      ctx.lineWidth = 5;
      for (let i = -1; i < 7; i += 1) {
        const y = i * 190 + offset;
        ctx.beginPath();
        ctx.moveTo(8, y);
        ctx.lineTo(8, y + 68);
        ctx.lineTo(30, y + 68);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(width - 8, y + 92);
        ctx.lineTo(width - 8, y + 162);
        ctx.lineTo(width - 32, y + 162);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawBackground() {
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, width, height);
      drawFarParallax();
      drawTargetPresentation();
      drawMidParallax();
    }

    function drawTrace(points: any[], alpha = 1, color = '#007BFF') {
      if (!points || points.length < 2) return;
      ctx.save();
      ctx.translate(0, -cameraY);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.globalAlpha = alpha;
      
      // Outline
      ctx.strokeStyle = '#0E1B33';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();

      // Inner fill
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();

      ctx.restore();
    }

    function drawTraces() {
      traces.forEach((trace) => {
        const age = elapsed - trace.born;
        const alpha = clamp(age / 240, 0.32, 0.88);
        drawTrace(trace.points, alpha, '#007BFF');
      });

      if (travel && travel.type === 'circuit') {
        const current = pointOnPath(travel);
        const partial = [];
        let remaining = travel.distance;
        partial.push({ ...travel.points[0] });
        for (let i = 0; i < travel.lengths.length; i += 1) {
          const length = travel.lengths[i];
          if (remaining >= length) {
            partial.push({ ...travel.points[i + 1] });
            remaining -= length;
          } else {
            partial.push({ x: current.x, y: current.y });
            break;
          }
        }
        drawTrace(partial, 1, '#007BFF');
      }
    }

    function drawPlatform(platform: any, activeRow: number) {
      if (platform.row === 0 && platform.column !== 1) {
        return;
      }
      const x = platform.x - platform.width / 2;
      const y = worldToScreenY(platform.y);

      if (y < -110 || y > height + 110) {
        return;
      }

      const active = platform.row === activeRow;
      const bob = active && !travel && !platform.dead
        ? Math.sin(elapsed * 0.003 + platform.column) * 1.5
        : 0;

      const drawY = y + bob;
      const cornerRadius = 4;

      ctx.save();
      
      let fill = '#ffffff';
      let border = '#D8E4F7';
      let bottomBar = '#D8E4F7';
      let textColor = '#0E1B33';
      let shadowColor = 'rgba(14, 27, 51, 0.04)';
      
      if (platform.dead) {
        fill = '#f1f5f9';
        border = '#cbd5e1';
        bottomBar = '#cbd5e1';
        textColor = '#94a3b8';
        shadowColor = 'transparent';
      } else if (platform.powered || platform.selected) {
        fill = '#ffffff';
        border = '#007BFF';
        bottomBar = '#007BFF';
        textColor = '#007BFF';
        shadowColor = 'rgba(0, 123, 255, 0.1)';
      } else if (active) {
        fill = '#ffffff';
        border = '#D8E4F7';
        bottomBar = '#007BFF';
        textColor = '#0E1B33';
        shadowColor = 'rgba(14, 27, 51, 0.08)';
      }

      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = platform.dead ? 0 : 8;
      ctx.shadowOffsetY = platform.dead ? 0 : 4;

      // Draw Main Box
      roundedRectPath(ctx, x, drawY, platform.width, platform.height, cornerRadius);
      ctx.fillStyle = fill;
      ctx.fill();
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = border;
      ctx.stroke();

      // Draw Bottom Bar
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = bottomBar;
      
      ctx.beginPath();
      ctx.moveTo(x + cornerRadius, drawY + platform.height - 4);
      ctx.lineTo(x + platform.width - cornerRadius, drawY + platform.height - 4);
      ctx.lineTo(x + platform.width, drawY + platform.height - cornerRadius);
      ctx.lineTo(x + platform.width, drawY + platform.height - cornerRadius);
      ctx.arcTo(x + platform.width, drawY + platform.height, x + platform.width - cornerRadius, drawY + platform.height, cornerRadius);
      ctx.lineTo(x + cornerRadius, drawY + platform.height);
      ctx.arcTo(x, drawY + platform.height, x, drawY + platform.height - cornerRadius, cornerRadius);
      ctx.lineTo(x, drawY + platform.height - 4);
      ctx.fill();

      // Draw Text
      if (platform.value !== null && platform.row > 0) {
        if (platform.dead) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(platform.x - 18, drawY + 13);
          ctx.lineTo(platform.x - 4, drawY + 26);
          ctx.lineTo(platform.x - 12, drawY + platform.height - 11);
          ctx.moveTo(platform.x + 16, drawY + 12);
          ctx.lineTo(platform.x + 3, drawY + 25);
          ctx.lineTo(platform.x + 14, drawY + platform.height - 11);
          ctx.stroke();
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${Math.max(22, Math.min(29, platform.width * 0.26))}px ui-sans-serif, system-ui, sans-serif`;
        ctx.fillStyle = textColor;
        ctx.fillText(String(platform.value), platform.x, drawY + platform.height / 2);
      }

      ctx.restore();
    }

    function drawPlatforms() {
      const activeRow = player.row + 1;
      rows.forEach((row) => row.platforms.forEach((platform) => drawPlatform(platform, activeRow)));
    }

    function drawBotTrail() {
      botTrail.forEach((point) => {
        const age = elapsed - point.born;
        const alpha = clamp(1 - age / 760, 0, 1);
        if (alpha <= 0) return;
        ctx.globalAlpha = alpha * 0.72;
        ctx.fillStyle = COLORS.enemy;
        ctx.beginPath();
        ctx.arc(point.x, worldToScreenY(point.y), 1.5 + alpha * 5.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function drawBotScanRing() {
      if (!bot) return;
      const scanTimeInCycle = bot.scanTime % CONFIG.scanPeriodMs;
      if (scanTimeInCycle >= CONFIG.scanDurationMs) return;
      const progress = scanTimeInCycle / CONFIG.scanDurationMs;
      const radius = progress * CONFIG.scanMaxRadius;
      ctx.save();
      ctx.strokeStyle = COLORS.red;
      ctx.globalAlpha = (1 - progress) * 0.48;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = COLORS.red;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(bot.x, worldToScreenY(bot.y), radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    function drawBotEchoes() {
      echoes.forEach((echo) => {
        const progress = clamp((elapsed - echo.born) / 250, 0, 1);
        const x = lerp(echo.x0, echo.x1, progress);
        const y = lerp(echo.y0, echo.y1, progress);
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = COLORS.red;
        ctx.beginPath();
        ctx.arc(x, worldToScreenY(y), 5 - progress * 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function drawBot() {
      if (!bot) return;

      if (showCollisionHitboxes) {
         ctx.save();
         // Draw physical collision body
         ctx.strokeStyle = '#FF00FF';
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.arc(bot.x, worldToScreenY(bot.y), CONFIG.botRadius, 0, Math.PI * 2);
         ctx.stroke();

         // 1. Draw continuous near detection orange ring
         ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
         ctx.lineWidth = 1.5;
         ctx.setLineDash([6, 4]);
         ctx.beginPath();
         ctx.arc(bot.x, worldToScreenY(bot.y), CONFIG.proximityRadius || 112, 0, Math.PI * 2);
         ctx.stroke();
         ctx.setLineDash([]);

         // 2. Draw thick radar sweep wavefront
         const scanTimeInCycle = bot.scanTime % CONFIG.scanPeriodMs;
         if (scanTimeInCycle < CONFIG.scanDurationMs) {
           const progress = scanTimeInCycle / CONFIG.scanDurationMs;
           const radius = progress * CONFIG.scanMaxRadius;
           const thickness = CONFIG.radarWaveThicknessPx !== undefined ? CONFIG.radarWaveThicknessPx : 16;
           ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
           ctx.lineWidth = thickness;
           ctx.beginPath();
           ctx.arc(bot.x, worldToScreenY(bot.y), radius, 0, Math.PI * 2);
           ctx.stroke();
         }

         // 3. Draw line between player and bot centers
         ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
         ctx.lineWidth = 1.2;
         ctx.setLineDash([3, 3]);
         ctx.beginPath();
         ctx.moveTo(bot.x, worldToScreenY(bot.y));
         ctx.lineTo(player.x, worldToScreenY(player.y));
         ctx.stroke();
         ctx.setLineDash([]);

         // Draw distance text in the middle of the line
         const midX = (bot.x + player.x) / 2;
         const midY = (worldToScreenY(bot.y) + worldToScreenY(player.y)) / 2;
         const distance = Math.hypot(player.x - bot.x, player.y - bot.y);
         const edgeGap = Math.round(distance - CONFIG.playerRadius - CONFIG.botRadius);
         ctx.save();
         ctx.fillStyle = '#0284c7';
         ctx.shadowBlur = 0;
         ctx.fillRect(midX - 55, midY - 7, 110, 14);
         ctx.fillStyle = '#f8fafc';
         ctx.font = '9px ui-monospace, SFMono-Regular, monospace';
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText(`C:${Math.round(distance)}px E:${edgeGap}px`, midX, midY);
         ctx.restore();

         // Draw planned path waypoints
         if (bot.travel && bot.travel.points) {
           ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
           ctx.lineWidth = 1.6;
           ctx.setLineDash([4, 4]);
           ctx.beginPath();
           bot.travel.points.forEach((pt: any, idx: number) => {
             const sx = pt.x;
             const sy = worldToScreenY(pt.y);
             if (idx === 0) ctx.moveTo(sx, sy);
             else ctx.lineTo(sx, sy);
           });
           ctx.stroke();
           ctx.setLineDash([]);
         }

         // Draw Diagnostics Info Box
         ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
         ctx.strokeStyle = '#38bdf8';
         ctx.lineWidth = 1.2;
         ctx.shadowBlur = 4;
         ctx.shadowColor = '#000000';
         
         const boxX = 10;
         const boxY = 135;
         const boxW = 250;
         const boxH = 345;
         
         roundedRectPath(ctx, boxX, boxY, boxW, boxH, 6);
         ctx.fill();
         ctx.stroke();
         
         ctx.fillStyle = '#38bdf8';
         ctx.font = 'bold 10px ui-monospace, SFMono-Regular, monospace';
         ctx.textAlign = 'left';
         ctx.textBaseline = 'top';
         ctx.fillText('AI AGENT TELEMETRY (06B-AUDIT)', boxX + 12, boxY + 12);
         
         ctx.fillStyle = '#cbd5e1';
         ctx.font = '9px ui-monospace, SFMono-Regular, monospace';
         
         let py = boxY + 34;
         const dy = 14;
         
         const cellStr = (cell: any) => cell ? `(${Math.round(cell.x)},${Math.round(cell.y)})` : 'null';
         const boundsStr = (b: any) => b ? `L:${Math.round(b.left)} R:${Math.round(b.right)} T:${Math.round(b.top)} B:${Math.round(b.bottom)}` : 'null';

         const msRemaining = bot.detected ? Math.max(0, Math.round(bot.lastDetectedAt + (CONFIG.awarenessMemoryMs || 3200) - elapsed)) : 0;

         const lines = [
           ['Current State:', bot.mode],
           ['Active Sense:', bot.detected ? `AWARE (${msRemaining}ms)` : 'BLIND'],
           ['NEAR_SENSOR_HIT:', String(bot.nearSensorHits || 0)],
           ['RADAR_SENSOR_HIT:', String(bot.radarSensorHits || 0)],
           ['AWARENESS_OPENED:', String(bot.awarenessOpenedCount || 0)],
           ['AWARENESS_REFRESHED:', String(bot.awarenessRefreshedCount || 0)],
           ['ALERT_STARTED:', String(bot.alertStartedCount || 0)],
           ['CHASE_STARTED:', String(bot.chaseStartedCount || 0)],
           ['PLAN_SUCCEEDED:', String(bot.planSucceededCount || 0)],
           ['PLAN_PARTIAL:', String(bot.planPartialCount || 0)],
           ['PLAN_FAILED:', String(bot.planFailedCount || 0)],
           ['HOLD_ENTERED:', String(bot.holdEnteredCount || 0)],
           ['RECOVER_ENTERED:', String(bot.recoverEnteredCount || 0)],
           ['AWARENESS_CLOSED:', String(bot.awarenessClosedCount || 0)],
           ['CAPTURE_CONTACT:', String(bot.captureContactCount || 0)],
           ['Distance / EdgeGap:', `${Math.round(distance)}px / ${edgeGap}px`],
           ['Planner Status:', bot.plannerStatus],
           ['Oscillation Tracker:', String(bot.oscillationCounter)],
           ['Stall Tracker Time:', `${Math.round(bot.waypointStallTime)}ms`],
         ];
         
         lines.forEach(([label, value]) => {
           ctx.fillStyle = '#94a3b8';
           ctx.fillText(label, boxX + 12, py);
           ctx.fillStyle = '#f8fafc';
           if (label === 'Current State:' || label === 'Planner Status:' || label === 'Active Sense:') {
             ctx.fillStyle = value === 'SEARCH' || value === 'BLIND' ? '#10b981' : (value.startsWith('CHASE') || value.startsWith('AWARE') ? '#ef4444' : '#f59e0b');
           }
           ctx.fillText(value, boxX + 132, py);
           py += dy;
         });

         ctx.restore();
      }

      

      // Draw Greenfield V2 A* path waypoints
      if (CONFIG.aiImplementation !== 'LEGACY' && botContextV2 && botContextV2.currentPath && (showCollisionHitboxes || CONFIG.bringUpStage !== 'NORMAL')) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        botContextV2.currentPath.forEach((pt: any, idx: number) => {
          const sx = pt.x;
          const sy = worldToScreenY(pt.y);
          if (idx === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw small circles at waypoints
        botContextV2.currentPath.forEach((pt: any) => {
          ctx.fillStyle = '#ff3830';
          ctx.beginPath();
          ctx.arc(pt.x, worldToScreenY(pt.y), 4, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      const screenY = worldToScreenY(bot.y);

      // DEVELOPMENT OVERLAY MARKER
      if (showV2Telemetry && CONFIG.aiImplementation !== 'LEGACY') {
        ctx.save();
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(bot.x - 20, screenY);
        ctx.lineTo(bot.x + 20, screenY);
        ctx.stroke();
        
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(bot.x, screenY - 20);
        ctx.lineTo(bot.x, screenY + 20);
        ctx.stroke();
        
        // Ring
        ctx.beginPath();
        ctx.arc(bot.x, screenY, 15, 0, Math.PI * 2);
        ctx.stroke();
        
        // Auth Pos Text
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`AUTH POS: (${Math.round(bot.x)}, ${Math.round(bot.y)})`, bot.x + 25, screenY);
        
        ctx.restore();
      }

      const visibleBottom = height - 68;
      const FORCE_RENDER_BOT = CONFIG.bringUpStage !== 'NORMAL';
      const isDiagnosticActive = FORCE_RENDER_BOT || showCollisionHitboxes || showV2Telemetry;

      if (!isDiagnosticActive && screenY > visibleBottom && screenY < height + CONFIG.rowGap * 0.95) {
        const proximity = clamp(1 - (screenY - visibleBottom) / (CONFIG.rowGap * 1.25), 0.18, 1);
        const markerX = clamp(bot.x, 22, width - 22);
        const markerY = visibleBottom;
        ctx.save();
        ctx.globalAlpha = 0.45 + proximity * 0.45;
        ctx.fillStyle = '#ff3830';
        ctx.shadowColor = '#ff3830';
        ctx.shadowBlur = 18 + proximity * 8;
        ctx.beginPath();
        ctx.arc(markerX, markerY, 6 + proximity * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff3830';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(markerX, markerY, 12 + proximity * 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ff3830';
        ctx.shadowBlur = 0;
        ctx.font = '900 8px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('TIME', markerX, markerY - 17);
        ctx.restore();
        return;
      }
      if (!isDiagnosticActive && (screenY < -70 || screenY > height + 70)) return;

      const isV2 = CONFIG.aiImplementation !== 'LEGACY' || CONFIG.bringUpStage !== 'NORMAL';
      const bursting = bot.mode === 'ALERT';
      const locked = bot.mode === 'CHASE';
      let x = bot.x;
      let y = screenY;

      if (!isV2) {
        const jitter = bursting ? 2.1 : locked ? 0.9 : 0.4;
        const zigzagX = getZigzagOffset(bot, elapsed, rows, player);
        x = FORCE_RENDER_BOT ? player.x : bot.x + Math.sin(elapsed / 31) * jitter + zigzagX;
        y = FORCE_RENDER_BOT ? (worldToScreenY(player.y) - 100) : screenY + Math.cos(elapsed / 27) * jitter;
      } else {
        if (FORCE_RENDER_BOT) {
          x = player.x;
          y = worldToScreenY(player.y) - 100;
        }
      }
      const radius = CONFIG.botRadius;

      ctx.save();
      ctx.shadowColor = '#ff3830';
      ctx.shadowBlur = locked || bursting ? 30 : 20;

      ctx.fillStyle = '#ff3830';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = locked || bursting ? 2 : 1.4;

      for (let i = 0; i < 6; i += 1) {
        const angle = elapsed * 0.002 + i * Math.PI / 3;
        const inner = radius + 3;
        let outer = radius + 7;
        if (locked) {
           outer += 4 * (0.5 + 0.5 * Math.sin(elapsed * 0.012 + i));
        } else if (bursting) {
           outer += 8 * (0.5 + 0.5 * Math.sin(elapsed * 0.02 + i));
        }
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
        ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
        ctx.stroke();
      }

      if (locked) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ff3830';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.arc(x, y, radius + 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff3830';
        ctx.font = '900 9px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('CHASE', x, y - radius - 15);
      } else if (bursting) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ff3830';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, radius + 14 + Math.sin(elapsed * 0.03) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ff3830';
        ctx.font = '900 9px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('LOCK', x, y - radius - 15);
      }

      if (bot.contactTime > 0) {
        const progress = clamp(bot.contactTime / CONFIG.contactFuseMs, 0, 1);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = COLORS.white;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius + 6, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawPlayer() {
      // draw hitbox if enabled
      if (showCollisionHitboxes) {
         ctx.save();
         ctx.strokeStyle = '#00FF00';
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.arc(player.x, worldToScreenY(player.y), CONFIG.playerRadius, 0, Math.PI * 2);
         ctx.stroke();
         ctx.restore();
      }

      const screenY = worldToScreenY(player.y);
      const pulseAge = elapsed - player.pulseAt;
      const pulse = pulseAge >= 0 && pulseAge < 700 ? Math.sin((pulseAge / 700) * Math.PI) : 0;
      const radius = CONFIG.playerRadius + pulse * 5;

      ctx.save();
      ctx.translate(player.x, screenY);

      if (engineMovementMode === 'hop') {
        ctx.shadowColor = COLORS.lime;
        ctx.shadowBlur = 24;
        ctx.fillStyle = COLORS.bgDepth;
        ctx.strokeStyle = COLORS.lime;
        ctx.lineWidth = 2.4;
        roundedRectPath(ctx, -radius, -radius * 0.84, radius * 2, radius * 1.68, radius * 0.68);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#007bff';
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '1000 24px ui-monospace, monospace';
      ctx.fillStyle = COLORS.white;

      if (playerNumberPresentation.phase !== 'hidden-transit' && playerNumberPresentation.displayedValue !== null) {
        let opacity = 1;
        let scale = 1;
        const phaseElapsed = elapsed - playerNumberPresentation.phaseStartedAt;

        if (playerNumberPresentation.phase === 'clearing') {
          const progress = clamp(phaseElapsed / 110, 0, 1);
          opacity = 1 - progress;
          scale = 1 - progress * 0.12;
        }

        if (opacity > 0) {
          ctx.save();
          ctx.globalAlpha = opacity;
          if (scale !== 1) {
            ctx.scale(scale, scale);
          }
          ctx.fillText(String(playerNumberPresentation.displayedValue), 0, engineMovementMode === 'hop' ? 2 : 1);
          ctx.restore();
        }
      }

      ctx.restore();
    }

    function drawParticles() {
      particles.forEach((particle) => {
        const alpha = 1 - particle.life / particle.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(particle.x, worldToScreenY(particle.y), particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    function drawNextRowIndicator() {
      const row = rowAbove();
      if (!row) return;
      const y = worldToScreenY(row.y) - 23;
      if (y < 105 || y > height - 80) return;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 9px ui-monospace, monospace';
      ctx.fillStyle = COLORS.structure;
      ctx.fillText(`TARGET ${row.targetValue}`, width / 2, y);
      ctx.restore();
    }

    function render() {
      drawBackground();
      drawBotTrail();
      drawTraces();
      drawPlatforms();
      drawNextRowIndicator();
      drawBotScanRing();
      drawBotEchoes();
      drawParticles();
      drawBot();
      drawPlayer();
      drawForegroundParallax();
    }

    function endGame(title: string) {
      if (!engineAlive) return;
      engineAlive = false;
      travel = null;
      setAlive(false);
      sound.danger();
    }

    function togglePause(force?: boolean) {
      if (!showViewSettings) {
        closeViewSettings();
      }
      if (!engineStarted || !engineAlive) return;
      enginePaused = typeof force === 'boolean' ? force : !enginePaused;
      setPaused(enginePaused);
      if (!enginePaused) lastTimestamp = performance.now();

      BotFlightRecorder.getInstance().recordEvent(
        elapsed,
        CONFIG.aiImplementation as 'GREENFIELD_V2' | 'LEGACY',
        botContextV2?.currentState || 'SEARCH',
        'NONE',
        'LIFECYCLE',
        enginePaused ? 'SIMULATION_PAUSED' : 'SIMULATION_RESUMED',
        `Simulation ${enginePaused ? 'paused' : 'resumed'}.`,
        { x: bot?.x || 0, y: bot?.y || 0 },
        { x: player.x, y: player.y },
        CONFIG.botRadius,
        CONFIG.playerRadius,
        botContextV2?.awareness?.id || 0,
        obstacleRevision,
        botContextV2?.debug?.plannerStatus || '',
        botContextV2?.pathIndex || 0
      );
    }

    function toggleMode() {
      if (travel || resolveAt) {
        setMessage('Change movement after the current jump.');
        return;
      }
      engineMovementMode = engineMovementMode === 'circuit' ? 'hop' : 'circuit';
      setMovementMode(engineMovementMode);
      setMessage(
        engineMovementMode === 'circuit'
          ? 'Circuit mode routes the spark through powered traces.'
          : 'Hop mode shows the same math loop as a direct platform jump.',
        'neutral',
        1600,
      );
    }

    function chooseByIndex(index: number) {
      const row = rowAbove();
      if (!row) return;
      const platform = row.platforms[index];
      if (platform) selectPlatform(platform);
    }

    function pointerPosition(event: any) {
      const rect = canvas.getBoundingClientRect();
      const touch = event.touches && event.touches[0];
      const clientX = touch ? touch.clientX : event.clientX;
      const clientY = touch ? touch.clientY : event.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }

    function handlePointer(event: any) {
      if (!engineStarted || !engineAlive || enginePaused || travel || resolveAt) return;
      const point = pointerPosition(event);
      const row = rowAbove();
      if (!row) return;

      for (const platform of row.platforms) {
        const screenY = worldToScreenY(platform.y);
        const left = platform.x - platform.width / 2 - 9;
        const right = platform.x + platform.width / 2 + 9;
        const top = screenY - 12;
        const bottom = screenY + platform.height + 18;
        if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom) {
          selectPlatform(platform);
          event.preventDefault();
          return;
        }
      }
    }

    function frame(timestamp: number) {
      animationFrame = requestAnimationFrame(frame);
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = clamp(timestamp - lastTimestamp, 0, 34);
      lastTimestamp = timestamp;

      if (engineStarted && engineAlive && !enginePaused) update(delta);
      render();
    }

    function closeViewSettings() {
      setShowViewSettings(false);
      enginePaused = settingsWasPausedRef.current;
      setPaused(enginePaused);
      if (!enginePaused) {
        lastTimestamp = performance.now();
      }
    }

    // Connect Engine callbacks to React Ref controllers
    loopControlRef.current = {
      beginGame,
      restart,
      togglePause,
      toggleMode,
      toggleSound() {
        engineSoundEnabled = !engineSoundEnabled;
        setSoundEnabled(engineSoundEnabled);
        if (engineSoundEnabled) getAudioContext();
      },
      selectByIndex(idx) {
        chooseByIndex(idx);
      },
      applyViewScale(val, opts) {
        applyViewScale(val, opts);
      },
      applyRouteTurnCount(val, opts) {
        applyRouteTurnCount(val, opts);
      },
      applyDifficulty(diff) {
        setDifficultyState(diff);
        CONFIG.difficulty = diff;
        applyViewScale(viewScalePercentInternal, { reflow: false, persist: false });
      },
      applyAiImplementation(impl) {
        setAiImplementationState(impl);
        CONFIG.aiImplementation = impl;
        // Re-init bot contexts to clear state completely
        const spawnPos = calculateRepairedBotSpawn();
        if (bot) {
          bot = initBotAIState(spawnPos.x, spawnPos.y, player.x);
        }
        botContextV3 = impl === 'PLATFORM_GRAPH_V3' ? createBotContextV3(spawnPos) : null;
        botContextV2 = (impl === 'V2_SIMPLIFIED' || impl === 'V2_FROZEN') ? createBotContextV2() : null;
      },
      applyBringUpStage(stage) {
        setBringUpStageState(stage);
        CONFIG.bringUpStage = stage;
        // Re-initialize bot and reset game loop elements to let the user immediately see the selected stage behavior!
        const spawnPos = calculateRepairedBotSpawn(stage !== 'NORMAL');
        if (bot) {
          bot = initBotAIState(spawnPos.x, spawnPos.y, player.x);
        }
        botContextV3 = CONFIG.aiImplementation === 'PLATFORM_GRAPH_V3' ? createBotContextV3(spawnPos) : null;
        botContextV2 = (CONFIG.aiImplementation === 'V2_SIMPLIFIED' || CONFIG.aiImplementation === 'V2_FROZEN') ? createBotContextV2() : null;
        botTrail = [];
        echoes = [];
      },
      resetViewSettings() {
        applyRouteTurnCount(8, { persist: false });
        applyViewScale(100);
      },
      exportSettings() {
        refreshConfigOutput();
        setShowConfig(true);
      },
      closeViewSettings() {
        closeViewSettings();
      },
      debugGetRows: () => rows,
      debugGetPlayer: () => player,
      debugGetPlayerPresentation: () => playerNumberPresentation,
      debugGetBot: () => bot,
      debugGetBotV2Debug: () => botContextV2?.debug || null,
      debugGetBotV3Debug: () => botContextV3,
      debugGetV3Diagnostics: () => ({
        activeUiEngine: CONFIG.aiImplementation,
        actualControllerCalled,
        v3UpdateCount,
        v2FrozenUpdateCount,
        v2SimplifiedUpdateCount,
        legacyUpdateCount,
        playerPosition: player ? { x: player.x, y: player.y } : null,
        playerSupportingPlatformId: player?.platform ? (player.platform.id || `${player.platform.row}-${player.platform.column}`) : null,
        playerDestinationPlatformId: travel?.platform ? (travel.platform.id || `${travel.platform.row}-${travel.platform.column}`) : null,
        botPosition: bot ? { x: bot.x, y: bot.y } : null,
        intendedMovement: lastIntendedDisplacement,
        collisionResolvedMovement: lastCollisionResolvedDisplacement,
        committedMovement: lastCommittedDisplacement,
        lastFailureReason,
      }),
      debugGetCONFIG: () => CONFIG,
      debugGetTravel: () => travel,
      debugGetResolveAt: () => resolveAt,
      setShowSumToCue: (v: boolean) => setShowSumToCue(v),
      debugGetElapsed: () => elapsed,
      debugMakeRow: makeRow,
      debugEnsureRows: ensureRows,
      debugGetRow: getRow,
      debugArrive: arrive,
      
      debugSelectPlatform: selectPlatform,
      debugUpdate: (delta: number) => { update(delta); },
      debugDraw: () => { render(); }
    };

    // DOM Event Listeners matching index.html
    canvas.addEventListener('pointerdown', handlePointer, { passive: false });
    window.addEventListener('resize', resize);

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(resize)
      : null;
    if (observer) {
      observer.observe(app);
    }

    // Set initial values
    const savedScale = readSavedViewScale();
    const savedTurns = readSavedRouteTurns();
    applyRouteTurnCount(savedTurns, { persist: false });
    applyViewScale(savedScale, { reflow: false, persist: false });
    resize();
    restart({ preserveOverlay: true });

    animationFrame = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animationFrame);
      canvas.removeEventListener('pointerdown', handlePointer);
      window.removeEventListener('resize', resize);
      if (observer) {
        observer.disconnect();
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

  // Expose callbacks to React components
  const beginGame = () => loopControlRef.current.beginGame?.();
  const restartGame = () => loopControlRef.current.restart?.();
  const togglePause = (force?: boolean) => loopControlRef.current.togglePause?.(force);
  const toggleMode = () => loopControlRef.current.toggleMode?.();
  const toggleSound = () => loopControlRef.current.toggleSound?.();
  const selectByIndex = (idx: number) => loopControlRef.current.selectByIndex?.(idx);

  const openViewSettings = () => {
    settingsWasPausedRef.current = paused;
    loopControlRef.current.togglePause?.(true);
    setShowViewSettings(true);
    setShowConfig(false);
  };

  const closeViewSettings = () => {
    loopControlRef.current.closeViewSettings?.();
  };

  const setViewScale = (val: number) => {
    loopControlRef.current.applyViewScale?.(val);
    if (showConfig) loopControlRef.current.exportSettings?.();
  };

  const setRouteTurns = (val: number) => {
    loopControlRef.current.applyRouteTurnCount?.(val);
    if (showConfig) loopControlRef.current.exportSettings?.();
  };

  const setDifficulty = (val: 'EASY' | 'NORMAL' | 'HARD') => {
    loopControlRef.current.applyDifficulty?.(val);
  };

  const setAiImplementation = (impl: 'V2_SIMPLIFIED' | 'V2_FROZEN' | 'LEGACY' | 'GREENFIELD_V2') => {
    loopControlRef.current.applyAiImplementation?.(impl);
  };

  const setBringUpStage = (stage: 'NORMAL' | 'STAGE_A' | 'STAGE_B' | 'STAGE_C' | 'STAGE_D' | 'STAGE_E') => {
    loopControlRef.current.applyBringUpStage?.(stage);
  };

  const resetViewSettings = () => {
    loopControlRef.current.resetViewSettings?.();
    if (showConfig) loopControlRef.current.exportSettings?.();
  };

  const exportViewConfig = () => {
    loopControlRef.current.exportSettings?.();
  };

  return {
    canvasRef,
    appRef,
    viewModel: {
      started,
      alive,
      paused,
      score,
      bestRow,
      movementMode,
      soundEnabled,
      playerValue,
      targetValue,
      messageText,
      messageTone,
      viewScalePercent,
      routeTurnCount,
      showViewSettings,
      showCollisionHitboxes,
      showSumToCue,
      showConfig,
      configText,
      difficulty,
      aiImplementation,
      showV2Telemetry,
      bringUpStage,
      debug: {
        getBotV2Debug: () => (loopControlRef.current as any).debugGetBotV2Debug?.() || null,
        getBotV3Debug: () => (loopControlRef.current as any).debugGetBotV3Debug?.() || null,
        getV3Diagnostics: () => (loopControlRef.current as any).debugGetV3Diagnostics?.() || null,
      },
    } as CircuitClimbViewModel,
    beginGame,
    restartGame,
    togglePause,
    toggleMode,
    toggleSound,
    selectByIndex,
    openViewSettings,
    closeViewSettings,
    setViewScale,
    setRouteTurns,
    setDifficulty,
    setAiImplementation,
    setBringUpStage,
    setShowV2Telemetry,
    resetViewSettings,
    exportViewConfig,
    setShowConfig,
    setShowCollisionHitboxes,
    setShowSumToCue: (v: boolean) => setShowSumToCue(v),
    debug: {
      getRows: () => (loopControlRef.current as any).debugGetRows?.() || [],
      getPlayer: () => (loopControlRef.current as any).debugGetPlayer?.() || null,
      getPlayerPresentation: () => (loopControlRef.current as any).debugGetPlayerPresentation?.() || null,
      getBot: () => (loopControlRef.current as any).debugGetBot?.() || null,
      getBotV2Debug: () => (loopControlRef.current as any).debugGetBotV2Debug?.() || null,
      getCONFIG: () => (loopControlRef.current as any).debugGetCONFIG?.() || null,
      getTravel: () => (loopControlRef.current as any).debugGetTravel?.() || null,
      getResolveAt: () => (loopControlRef.current as any).debugGetResolveAt?.() || 0,
      getElapsed: () => (loopControlRef.current as any).debugGetElapsed?.() || 0,
      makeRow: (idx: number) => (loopControlRef.current as any).debugMakeRow?.(idx),
      ensureRows: () => (loopControlRef.current as any).debugEnsureRows?.(),
      getRow: (idx: number) => (loopControlRef.current as any).debugGetRow?.(idx) || null,
      arrive: (currentTravel: any) => (loopControlRef.current as any).debugArrive?.(currentTravel),
      selectPlatform: (platform: any) => (loopControlRef.current as any).debugSelectPlatform?.(platform),
      update: (delta: number) => (loopControlRef.current as any).debugUpdate?.(delta),
      draw: () => (loopControlRef.current as any).debugDraw?.(),
    },
  };
};
