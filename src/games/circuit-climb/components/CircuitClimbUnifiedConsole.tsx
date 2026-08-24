/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CircuitClimbUnifiedRecorder, ConsoleOutputMode } from '../bot-ai-v2/CircuitClimbUnifiedRecorder';

export const CircuitClimbUnifiedConsole: React.FC = () => {
  const recorder = CircuitClimbUnifiedRecorder.getInstance();

  const [isRecording, setIsRecording] = useState(recorder.getIsRecording());
  const [consoleMode, setConsoleMode] = useState<ConsoleOutputMode>(recorder.getConsoleMode());
  const [filter, setFilter] = useState('ALL');
  const [events, setEvents] = useState(recorder.getEvents(filter));
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRecording(recorder.getIsRecording());
      setEvents(recorder.getEvents(filter));
    }, 100);
    return () => clearInterval(interval);
  }, [filter]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [events]);

  const handleToggleRecording = () => {
    const next = !isRecording;
    recorder.setRecording(next);
    setIsRecording(next);
  };

  const handleClear = () => {
    recorder.resetRecorder();
    setEvents([]);
  };

  const formatEventLine = (e: any) => {
    const sec = (e.simTimeMs / 1000).toFixed(3);
    const seqStr = String(e.sequence).padStart(4, '0');
    let details = e.event;
    if (e.reason) details += ` (${e.reason})`;
    if (e.botState) details += ` [state=${e.botState}]`;
    if (e.targetVersion !== undefined) details += ` [tv=${e.targetVersion}]`;
    if (e.intendedMovement) {
      details += ` int=(${e.intendedMovement.x.toFixed(1)},${e.intendedMovement.y.toFixed(1)})`;
    }
    if (e.committedMovement) {
      details += ` com=(${e.committedMovement.x.toFixed(1)},${e.committedMovement.y.toFixed(1)})`;
    }
    return `#${seqStr} ${sec}s [${e.source}] ${details}`;
  };

  const buildExportText = (eventsToExport: any[]) => {
    const summary = recorder.buildSummary();
    const eventLines = eventsToExport.map(formatEventLine).join('\n');

    const summaryBlock = `
=== CIRCUIT CLIMB DIAGNOSTIC SUMMARY ===
Session Duration: ${(summary.session.durationMs / 1000).toFixed(2)}s (${summary.session.frameCount} frames)
Active Engine: ${summary.session.engine} | Difficulty: ${summary.session.difficulty}
Viewport: ${summary.session.viewport.width}x${summary.session.viewport.height}

User Input:
  - Platform Selections: ${summary.user.platformSelections} (Correct: ${summary.user.correctSelections}, Wrong: ${summary.user.wrongSelections})
  - Restarts: ${summary.user.restarts}

Player:
  - Moves Started: ${summary.player.moves} | Landings: ${summary.player.landings}
  - Final Row Reached: ${summary.player.finalRow}
  - Final Position: (${summary.player.finalPosition.x.toFixed(1)}, ${summary.player.finalPosition.y.toFixed(1)})

Bot Telemetry:
  - Detection Events: ${summary.bot.detectionEvents}
  - Awareness Episodes: ${summary.bot.awarenessEpisodes}
  - State Transitions -> ALERT: ${summary.bot.alertCount}, PURSUE: ${summary.bot.pursueCount}, FINAL_APPROACH: ${summary.bot.finalApproachCount}, RECOVER: ${summary.bot.recoverCount}
  - Target Version Changes: ${summary.bot.targetVersionChanges}
  - Replans Requested: ${summary.bot.replansRequested} | Suppressed: ${summary.bot.replansSuppressed} | Plans Adopted: ${summary.bot.plansAdopted}
  - Zero Intent Events: ${summary.bot.zeroIntentEvents}
  - Stale Target Warnings: ${summary.bot.staleTargetWarnings}
  - Vertical Progress Failures: ${summary.bot.verticalProgressFailures}
  - Captures: ${summary.bot.captures}

Failure Classification:
  ${summary.failureClassification.join(', ')}
========================================
`;

    return `${eventLines}\n\n${summaryBlock}`;
  };

  const handleCopyFullTrace = () => {
    const fullEvents = recorder.getEvents('ALL');
    const text = buildExportText(fullEvents);
    navigator.clipboard.writeText(text);
    setCopyStatus('Full trace copied!');
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleCopyFailureWindow = () => {
    const windowEvents = recorder.getFailureWindow();
    const text = buildExportText(windowEvents);
    navigator.clipboard.writeText(text);
    setCopyStatus('Failure window copied!');
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const displayedEvents = events.slice(-30);

  return (
    <div
      id="unifiedConsoleOverlay"
      style={{
        position: 'fixed',
        bottom: '12px',
        right: '12px',
        width: '420px',
        maxHeight: '380px',
        backgroundColor: '#0F172A',
        color: '#E2E8F0',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 9999,
        fontFamily: 'monospace',
        fontSize: '11px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', color: '#38BDF8', fontSize: '12px', letterSpacing: '0.05em' }}>
          CIRCUIT CLIMB — UNIFIED EVENT TRACE
        </div>
        <div style={{ fontSize: '10px', color: isRecording ? '#4ADE80' : '#F87171' }}>
          {isRecording ? '● REC' : '○ PAUSED'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button
          onClick={handleToggleRecording}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #475569',
            backgroundColor: isRecording ? '#1E293B' : '#059669',
            color: '#F8FAFC',
            cursor: 'pointer',
            fontSize: '10px',
          }}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <button
          onClick={handleClear}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #475569',
            backgroundColor: '#1E293B',
            color: '#CBD5E1',
            cursor: 'pointer',
            fontSize: '10px',
          }}
        >
          Clear
        </button>
        <button
          onClick={handleCopyFullTrace}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #0284C7',
            backgroundColor: '#0369A1',
            color: '#F8FAFC',
            cursor: 'pointer',
            fontSize: '10px',
          }}
        >
          Copy Full Trace
        </button>
        <button
          onClick={handleCopyFailureWindow}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #D97706',
            backgroundColor: '#B45309',
            color: '#F8FAFC',
            cursor: 'pointer',
            fontSize: '10px',
          }}
        >
          Copy Failure Window
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div>
          <label style={{ color: '#94A3B8', marginRight: '4px' }}>Console Mode:</label>
          <select
            value={consoleMode}
            onChange={(e) => {
              const m = e.target.value as ConsoleOutputMode;
              recorder.setConsoleMode(m);
              setConsoleMode(m);
            }}
            style={{
              backgroundColor: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid #475569',
              borderRadius: '4px',
              fontSize: '10px',
              padding: '2px 4px',
            }}
          >
            <option value="OFF">OFF</option>
            <option value="IMPORTANT">IMPORTANT</option>
            <option value="VERBOSE">VERBOSE</option>
          </select>
        </div>

        <div>
          <label style={{ color: '#94A3B8', marginRight: '4px' }}>Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              backgroundColor: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid #475569',
              borderRadius: '4px',
              fontSize: '10px',
              padding: '2px 4px',
            }}
          >
            <option value="ALL">ALL</option>
            <option value="USER">USER</option>
            <option value="PLAYER">PLAYER</option>
            <option value="BOT STATE">BOT STATE</option>
            <option value="BOT TARGET">BOT TARGET</option>
            <option value="BOT PLAN">BOT PLAN</option>
            <option value="BOT MOVEMENT">BOT MOVEMENT</option>
            <option value="BOT RECOVERY">BOT RECOVERY</option>
            <option value="COLLISION">COLLISION</option>
            <option value="ERRORS">ERRORS</option>
          </select>
        </div>
      </div>

      {copyStatus && <div style={{ color: '#4ADE80', fontSize: '10px' }}>{copyStatus}</div>}

      <div
        ref={logContainerRef}
        style={{
          flex: 1,
          backgroundColor: '#020617',
          border: '1px solid #1E293B',
          borderRadius: '4px',
          padding: '6px',
          overflowY: 'auto',
          minHeight: '160px',
          maxHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {displayedEvents.length === 0 ? (
          <div style={{ color: '#64748B', fontStyle: 'italic' }}>No events recorded.</div>
        ) : (
          displayedEvents.map((evt) => {
            const isError = evt.source === 'ERROR' || evt.source === 'RUNTIME';
            const isFailure =
              evt.event.includes('STOPPED') ||
              evt.event.includes('STALE') ||
              evt.event.includes('REJECTED') ||
              evt.event.includes('THRASH');

            const color = isError ? '#EF4444' : isFailure ? '#F59E0B' : '#94A3B8';

            return (
              <div key={evt.sequence} style={{ color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formatEventLine(evt)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
