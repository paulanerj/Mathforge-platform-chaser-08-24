/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CircuitClimbUnifiedRecorder } from '../bot-ai-v2/CircuitClimbUnifiedRecorder';

describe('CircuitClimbUnifiedRecorder', () => {
  let recorder: CircuitClimbUnifiedRecorder;

  beforeEach(() => {
    recorder = CircuitClimbUnifiedRecorder.getInstance();
    recorder.resetRecorder();
  });

  it('1. should maintain monotonic sequence numbering across multiple subsystems', () => {
    const e1 = recorder.recordEvent('USER', 'USER_GAME_STARTED', { simTimeMs: 100 });
    const e2 = recorder.recordEvent('PLAYER', 'PLAYER_MOVE_STARTED', { simTimeMs: 120 });
    const e3 = recorder.recordEvent('BOT_SENSOR', 'BOT_NEAR_SENSOR_HIT', { simTimeMs: 150 });
    const e4 = recorder.recordEvent('BOT_STATE', 'BOT_STATE_TRANSITION_ACCEPTED', { simTimeMs: 200 });

    expect(e1?.sequence).toBe(1);
    expect(e2?.sequence).toBe(2);
    expect(e3?.sequence).toBe(3);
    expect(e4?.sequence).toBe(4);
  });

  it('2. should maintain ring buffer capacity limit of 1000 events without overflow', () => {
    for (let i = 0; i < 1050; i++) {
      recorder.recordEvent('BOT_MOVEMENT', 'BOT_MOVEMENT_SAMPLE', { simTimeMs: i * 16 });
    }

    const events = recorder.getEvents('ALL');
    expect(events.length).toBe(1000);
    expect(events[0].sequence).toBe(51);
    expect(events[999].sequence).toBe(1050);
  });

  it('3. should correctly sample movement at maximum 4 Hz rate (250ms)', () => {
    expect(recorder.shouldSampleMovement(0)).toBe(true);
    expect(recorder.shouldSampleMovement(100)).toBe(false);
    expect(recorder.shouldSampleMovement(249)).toBe(false);
    expect(recorder.shouldSampleMovement(250)).toBe(true);
    expect(recorder.shouldSampleMovement(300)).toBe(false);
    expect(recorder.shouldSampleMovement(500)).toBe(true);
  });

  it('4. should correctly sample sensor miss at maximum 1 Hz rate (1000ms)', () => {
    expect(recorder.shouldSampleSensorMiss(0)).toBe(true);
    expect(recorder.shouldSampleSensorMiss(500)).toBe(false);
    expect(recorder.shouldSampleSensorMiss(999)).toBe(false);
    expect(recorder.shouldSampleSensorMiss(1000)).toBe(true);
  });

  it('5. should capture user inputs with correct payload parameters', () => {
    recorder.recordEvent('USER', 'USER_PLATFORM_POINTER_DOWN', {
      simTimeMs: 500,
      data: { platformId: 'p_1_2', row: 1, column: 2 },
    });

    const events = recorder.getEvents('USER');
    expect(events.length).toBe(1);
    expect(events[0].event).toBe('USER_PLATFORM_POINTER_DOWN');
    expect(events[0].data?.platformId).toBe('p_1_2');
  });

  it('6. should capture player movement and landing events', () => {
    recorder.recordEvent('PLAYER', 'PLAYER_MOVE_STARTED', {
      simTimeMs: 1000,
      playerPosition: { x: 200, y: 700 },
    });
    recorder.recordEvent('PLAYER', 'PLAYER_LANDED', {
      simTimeMs: 1200,
      playerPosition: { x: 200, y: 500 },
      playerRow: 1,
      targetVersion: 2,
    });

    const events = recorder.getEvents('PLAYER');
    expect(events.length).toBe(2);
    expect(events[1].event).toBe('PLAYER_LANDED');
    expect(events[1].playerRow).toBe(1);
    expect(events[1].targetVersion).toBe(2);
  });

  it('7. should capture bot sensor hit and awareness events', () => {
    recorder.recordEvent('BOT_SENSOR', 'BOT_NEAR_SENSOR_HIT', {
      simTimeMs: 1500,
      botPosition: { x: 200, y: 800 },
      playerPosition: { x: 200, y: 500 },
    });
    recorder.recordEvent('BOT_AWARENESS', 'BOT_AWARENESS_OPENED', {
      simTimeMs: 1516,
      awarenessEpisodeId: 1,
    });

    const sensorEvents = recorder.getEvents('BOT_SENSOR');
    expect(sensorEvents.length).toBe(1);
    expect(sensorEvents[0].event).toBe('BOT_NEAR_SENSOR_HIT');

    const awarenessEvents = recorder.getEvents('BOT_AWARENESS');
    expect(awarenessEvents.length).toBe(1);
    expect(awarenessEvents[0].awarenessEpisodeId).toBe(1);
  });

  it('8. should capture bot state transitions and heartbeats', () => {
    recorder.recordEvent('BOT_STATE', 'BOT_STATE_TRANSITION_ACCEPTED', {
      simTimeMs: 2000,
      botState: 'PURSUE',
      data: { previousState: 'ALERT', requestedState: 'PURSUE' },
    });

    const stateEvents = recorder.getEvents('BOT STATE');
    expect(stateEvents.length).toBe(1);
    expect(stateEvents[0].botState).toBe('PURSUE');
  });

  it('9. should capture target version increment and position changes', () => {
    recorder.recordEvent('BOT_TARGET', 'BOT_TARGET_VERSION_CHANGED', {
      simTimeMs: 2200,
      targetVersion: 3,
      playerPosition: { x: 300, y: 300 },
    });

    const targetEvents = recorder.getEvents('BOT TARGET');
    expect(targetEvents.length).toBe(1);
    expect(targetEvents[0].targetVersion).toBe(3);
  });

  it('10. should capture planner replan requests and plan adoption', () => {
    recorder.recordEvent('BOT_PLANNER', 'BOT_REPLAN_REQUESTED', {
      simTimeMs: 2500,
      targetVersion: 3,
      reason: 'Player changed platform',
    });
    recorder.recordEvent('BOT_PLANNER', 'BOT_PLAN_ADOPTED', {
      simTimeMs: 2516,
      currentPathLength: 4,
      targetVersion: 3,
    });

    const planEvents = recorder.getEvents('BOT PLAN');
    expect(planEvents.length).toBe(2);
    expect(planEvents[1].currentPathLength).toBe(4);
  });

  it('11. should capture bot movement samples with intended and committed vectors', () => {
    recorder.recordEvent('BOT_MOVEMENT', 'BOT_MOVEMENT_SAMPLE', {
      simTimeMs: 3000,
      intendedMovement: { x: 2.5, y: -5.0 },
      committedMovement: { x: 2.5, y: -5.0 },
    });

    const moveEvents = recorder.getEvents('BOT MOVEMENT');
    expect(moveEvents.length).toBe(1);
    expect(moveEvents[0].intendedMovement?.x).toBe(2.5);
    expect(moveEvents[0].committedMovement?.y).toBe(-5.0);
  });

  it('12. should capture progress monitor stall and recovery transitions', () => {
    recorder.recordEvent('BOT_PROGRESS', 'BOT_NO_PROGRESS_DETECTED', {
      simTimeMs: 3500,
      reason: 'Bot displacement below threshold for 800ms',
    });
    recorder.recordEvent('BOT_RECOVERY', 'BOT_RECOVER_ENTERED', {
      simTimeMs: 3516,
      reason: 'Stall detected in PURSUE',
    });

    const recoveryEvents = recorder.getEvents('BOT RECOVERY');
    expect(recoveryEvents.length).toBe(2);
    expect(recoveryEvents[1].event).toBe('BOT_RECOVER_ENTERED');
  });

  it('13. should capture collision sweep and capture events', () => {
    recorder.recordEvent('COLLISION', 'BOT_COLLISION_SWEEP_STARTED', {
      simTimeMs: 4000,
    });
    recorder.recordEvent('COLLISION', 'BOT_PLAYER_CONTACT', {
      simTimeMs: 4016,
      reason: 'Bot center dist 20px within capture radius',
    });

    const collisionEvents = recorder.getEvents('COLLISION');
    expect(collisionEvents.length).toBe(2);
    expect(collisionEvents[1].event).toBe('BOT_PLAYER_CONTACT');
  });

  it('14. should preserve failure window of 100 preceding and 50 following events on failure trigger', () => {
    for (let i = 0; i < 150; i++) {
      recorder.recordEvent('BOT_MOVEMENT', 'BOT_MOVEMENT_SAMPLE', { simTimeMs: i * 16 });
    }

    const failureEvent = recorder.recordEvent('BOT_PROGRESS', 'BOT_VERTICAL_PROGRESS_STOPPED', {
      simTimeMs: 2500,
      reason: 'Bot stopped ascending while player climbed 3 rows higher',
    });

    for (let i = 0; i < 30; i++) {
      recorder.recordEvent('BOT_MOVEMENT', 'BOT_MOVEMENT_SAMPLE', { simTimeMs: 2516 + i * 16 });
    }

    if (failureEvent) recorder.updateAfterTrigger(2500);

    const failureWindow = recorder.getFailureWindow();
    expect(failureWindow.length).toBeGreaterThanOrEqual(100);
    const triggerInWindow = failureWindow.some((e) => e.event === 'BOT_VERTICAL_PROGRESS_STOPPED');
    expect(triggerInWindow).toBe(true);
  });

  it('15. should build valid summary block and classify failure modes accurately', () => {
    recorder.recordEvent('USER', 'USER_GAME_STARTED', { simTimeMs: 0 });
    recorder.recordEvent('BOT_SENSOR', 'BOT_NEAR_SENSOR_HIT', { simTimeMs: 100 });
    recorder.recordEvent('BOT_AWARENESS', 'BOT_AWARENESS_OPENED', { simTimeMs: 116 });
    recorder.recordEvent('BOT_STATE', 'BOT_STATE_TRANSITION_ACCEPTED', {
      simTimeMs: 120,
      data: { requestedState: 'PURSUE' },
    });
    recorder.recordEvent('BOT_PROGRESS', 'BOT_VERTICAL_PROGRESS_STOPPED', {
      simTimeMs: 1000,
      reason: 'Bot vertical progress stopped',
    });

    const summary = recorder.buildSummary();
    expect(summary.bot.pursueCount).toBe(1);
    expect(summary.bot.verticalProgressFailures).toBe(1);
    expect(summary.failureClassification).toContain('BOT_PATH_COMPLETE_NO_EXIT');
  });
});
