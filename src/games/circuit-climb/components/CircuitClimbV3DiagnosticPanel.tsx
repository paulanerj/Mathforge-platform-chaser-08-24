/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BotContextV3 } from '../bot-ai-v3/BotTypesV3';
import { CircuitClimbUnifiedRecorder } from '../bot-ai-v2/CircuitClimbUnifiedRecorder';

interface V3DiagnosticPanelProps {
  activeUiEngine: string;
  actualControllerCalled: string;
  botContextV3: BotContextV3 | null;
  v3UpdateCount: number;
  v2FrozenUpdateCount: number;
  v2SimplifiedUpdateCount: number;
  legacyUpdateCount: number;
  playerPosition: { x: number; y: number } | null;
  playerSupportingPlatformId: string | null;
  playerDestinationPlatformId: string | null;
  botPosition: { x: number; y: number } | null;
  intendedMovement: { x: number; y: number } | null;
  collisionResolvedMovement: { x: number; y: number } | null;
  committedMovement: { x: number; y: number } | null;
  lastFailureReason: string;
}

export const CircuitClimbV3DiagnosticPanel: React.FC<V3DiagnosticPanelProps> = ({
  activeUiEngine,
  actualControllerCalled,
  botContextV3,
  v3UpdateCount,
  v2FrozenUpdateCount,
  v2SimplifiedUpdateCount,
  legacyUpdateCount,
  playerPosition,
  playerSupportingPlatformId,
  playerDestinationPlatformId,
  botPosition,
  intendedMovement,
  collisionResolvedMovement,
  committedMovement,
  lastFailureReason,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(true);

  useEffect(() => {
    const recorder = CircuitClimbUnifiedRecorder.getInstance();
    setIsRecording(recorder.getIsRecording());
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 2000);
  };

  if (!botContextV3 && activeUiEngine !== 'PLATFORM_GRAPH_V3') {
    return null;
  }

  const activeWp =
    botContextV3?.currentRoute?.waypoints &&
    botContextV3.currentWaypointIndex < botContextV3.currentRoute.waypoints.length
      ? botContextV3.currentRoute.waypoints[botContextV3.currentWaypointIndex]
      : null;

  const distToWp =
    activeWp && botPosition
      ? Math.hypot(activeWp.x - botPosition.x, activeWp.y - botPosition.y)
      : 0;

  const validEdgeCount =
    botContextV3?.graph?.edges.filter((e) => e.physicallyValidated).length ?? 0;

  const formatSnapshot = () => {
    return [
      `ACTIVE UI ENGINE: ${activeUiEngine}`,
      `ACTUAL CONTROLLER CALLED: ${actualControllerCalled}`,
      `V3 CONTEXT INSTANCE ID: ${botContextV3?.instanceId ?? 'NONE'}`,
      `V3 UPDATE COUNT: ${v3UpdateCount}`,
      `OTHER ENGINE UPDATES: V2F:${v2FrozenUpdateCount} V2S:${v2SimplifiedUpdateCount} LEG:${legacyUpdateCount}`,
      `V3 STATE: ${botContextV3?.currentState ?? 'UNINITIALIZED'}`,
      `TIME IN STATE: ${((botContextV3?.stateTimeMs ?? 0) / 1000).toFixed(2)}s`,
      `PLAYER POSITION: ${playerPosition ? `(${playerPosition.x.toFixed(1)}, ${playerPosition.y.toFixed(1)})` : 'N/A'}`,
      `PLAYER SUPPORTING PLATFORM: ${playerSupportingPlatformId ?? 'NONE'}`,
      `PLAYER DESTINATION PLATFORM: ${playerDestinationPlatformId ?? 'NONE'}`,
      `BOT POSITION: ${botPosition ? `(${botPosition.x.toFixed(1)}, ${botPosition.y.toFixed(1)})` : 'N/A'}`,
      `DETECTION RESULT: ${botContextV3?.awareness.discovered ? 'DETECTED' : 'UNDETECTED'}`,
      `AWARENESS ACTIVE: ${botContextV3?.awareness.discovered ? 'ACTIVE' : 'INACTIVE'}`,
      `TARGET VERSION: ${botContextV3?.target.targetVersion ?? 0}`,
      `TARGET PLATFORM ID: ${botContextV3?.target.targetPlatformId ?? 'NONE'}`,
      `TARGET NODE ID: ${botContextV3?.target.targetNodeId ?? 'NONE'}`,
      `GRAPH REVISION: ${botContextV3?.graph?.revision ?? -1}`,
      `GRAPH NODE COUNT: ${botContextV3?.graph?.nodes.size ?? 0}`,
      `GRAPH EDGE COUNT: ${botContextV3?.graph?.edges.length ?? 0}`,
      `VALID EDGE COUNT: ${validEdgeCount}`,
      `ROUTE STATUS: ${botContextV3?.currentRoute?.status ?? 'NO_ROUTE'}`,
      `ROUTE NODE COUNT: ${botContextV3?.currentRoute?.nodeIds.length ?? 0}`,
      `CURRENT WAYPOINT INDEX: ${botContextV3?.currentWaypointIndex ?? 0}`,
      `CURRENT WAYPOINT: ${activeWp ? `(${activeWp.x.toFixed(1)}, ${activeWp.y.toFixed(1)})` : 'NONE'}`,
      `DISTANCE TO WAYPOINT: ${distToWp.toFixed(1)}px`,
      `INTENDED MOVEMENT: ${intendedMovement ? `(${intendedMovement.x.toFixed(2)}, ${intendedMovement.y.toFixed(2)})` : '(0.00, 0.00)'}`,
      `COLLISION-RESOLVED MOVEMENT: ${collisionResolvedMovement ? `(${collisionResolvedMovement.x.toFixed(2)}, ${collisionResolvedMovement.y.toFixed(2)})` : '(0.00, 0.00)'}`,
      `COMMITTED MOVEMENT: ${committedMovement ? `(${committedMovement.x.toFixed(2)}, ${committedMovement.y.toFixed(2)})` : '(0.00, 0.00)'}`,
      `WATCHDOG STATUS: ${botContextV3 ? `triggers=${botContextV3.watchdog.totalTriggers}, esc=${botContextV3.watchdog.escalated}` : 'N/A'}`,
      `LAST FAILURE REASON: ${lastFailureReason || botContextV3?.currentRoute?.reason || 'NONE'}`,
    ].join('\n');
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => showToast(`COPIED ${label}`),
        () => showToast('COPY FAILED')
      );
    } else {
      showToast('CLIPBOARD NOT AVAILABLE');
    }
  };

  const handleCopySnapshot = () => {
    copyToClipboard(formatSnapshot(), 'SNAPSHOT');
  };

  const handleCopyTrace = () => {
    const recorder = CircuitClimbUnifiedRecorder.getInstance();
    const events = recorder.getEvents('ALL');
    const formatted = events
      .map((e) => `[#${e.sequence} ${e.source}] ${e.event}: ${e.reason || ''}`)
      .join('\n');
    copyToClipboard(formatted || 'NO EVENTS IN TRACE', 'EVENT TRACE');
  };

  const handleCopyFailureWindow = () => {
    const recorder = CircuitClimbUnifiedRecorder.getInstance();
    const windowEvents = recorder.getFailureWindow();
    const formatted = windowEvents
      .map((e) => `[#${e.sequence} ${e.source}] ${e.event}: ${e.reason || ''}`)
      .join('\n');
    copyToClipboard(formatted || 'NO FAILURE WINDOW EVENTS', 'FAILURE WINDOW');
  };

  const handleClearTrace = () => {
    const recorder = CircuitClimbUnifiedRecorder.getInstance();
    recorder.resetRecorder();
    showToast('TRACE CLEARED');
  };

  const handleToggleRecording = () => {
    const recorder = CircuitClimbUnifiedRecorder.getInstance();
    const nextState = !isRecording;
    recorder.setRecording(nextState);
    setIsRecording(nextState);
    showToast(nextState ? 'RECORDING STARTED' : 'RECORDING STOPPED');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '12px',
        right: '12px',
        width: collapsed ? '220px' : '370px',
        maxHeight: '88vh',
        overflowY: 'auto',
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        border: '1px solid #38BDF8',
        borderRadius: '8px',
        padding: '12px',
        color: '#E2E8F0',
        fontFamily: 'monospace',
        fontSize: '11px',
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          borderBottom: '1px solid #1E293B',
          paddingBottom: '6px',
        }}
      >
        <div style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: '12px' }}>
          PLATFORM GRAPH V3 DIAGNOSTICS
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: '#1E293B',
            border: '1px solid #475569',
            color: '#94A3B8',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            cursor: 'pointer',
          }}
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>

      {notification && (
        <div
          style={{
            backgroundColor: '#0284C7',
            color: '#FFFFFF',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '4px 8px',
            borderRadius: '4px',
            marginBottom: '8px',
            fontSize: '10px',
            letterSpacing: '0.5px',
          }}
        >
          {notification}
        </div>
      )}

      {!collapsed && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px',
              marginBottom: '10px',
            }}
          >
            <button
              onClick={handleCopySnapshot}
              style={{
                backgroundColor: '#0284C7',
                border: 'none',
                color: '#FFF',
                borderRadius: '4px',
                padding: '5px 4px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              COPY SNAPSHOT
            </button>
            <button
              onClick={handleCopyTrace}
              style={{
                backgroundColor: '#0369A1',
                border: 'none',
                color: '#FFF',
                borderRadius: '4px',
                padding: '5px 4px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              COPY TRACE
            </button>
            <button
              onClick={handleCopyFailureWindow}
              style={{
                backgroundColor: '#075985',
                border: 'none',
                color: '#FFF',
                borderRadius: '4px',
                padding: '5px 4px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              COPY FAIL WINDOW
            </button>
            <button
              onClick={handleClearTrace}
              style={{
                backgroundColor: '#334155',
                border: 'none',
                color: '#CBD5E1',
                borderRadius: '4px',
                padding: '5px 4px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              CLEAR TRACE
            </button>
            <button
              onClick={handleToggleRecording}
              style={{
                gridColumn: 'span 2',
                backgroundColor: isRecording ? '#15803D' : '#B91C1C',
                border: 'none',
                color: '#FFF',
                borderRadius: '4px',
                padding: '5px 4px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {isRecording ? 'PAUSE RECORDING' : 'START RECORDING'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3px' }}>
            <Row label="ACTIVE UI ENGINE" value={activeUiEngine} highlight={activeUiEngine === 'PLATFORM_GRAPH_V3'} />
            <Row label="ACTUAL CONTROLLER CALLED" value={actualControllerCalled} highlight={actualControllerCalled === 'updateBotV3'} />
            <Row label="V3 CONTEXT INSTANCE ID" value={botContextV3?.instanceId ?? 'NONE'} />
            <Row label="V3 UPDATE COUNT" value={v3UpdateCount} />
            <Row label="OTHER ENGINE UPDATES" value={`V2F:${v2FrozenUpdateCount} V2S:${v2SimplifiedUpdateCount} LEG:${legacyUpdateCount}`} warning={v2FrozenUpdateCount > 0 || v2SimplifiedUpdateCount > 0 || legacyUpdateCount > 0} />
            <Row label="V3 STATE" value={botContextV3?.currentState ?? 'UNINITIALIZED'} highlight={botContextV3?.currentState === 'CHASE'} />
            <Row label="TIME IN STATE" value={`${((botContextV3?.stateTimeMs ?? 0) / 1000).toFixed(2)}s`} />
            <Row label="PLAYER POSITION" value={playerPosition ? `(${playerPosition.x.toFixed(1)}, ${playerPosition.y.toFixed(1)})` : 'N/A'} />
            <Row label="PLAYER SUPPORTING PLATFORM" value={playerSupportingPlatformId ?? 'NONE'} />
            <Row label="PLAYER DESTINATION PLATFORM" value={playerDestinationPlatformId ?? 'NONE'} />
            <Row label="BOT POSITION" value={botPosition ? `(${botPosition.x.toFixed(1)}, ${botPosition.y.toFixed(1)})` : 'N/A'} />
            <Row label="DETECTION RESULT" value={botContextV3?.awareness.discovered ? 'DETECTED' : 'UNDETECTED'} />
            <Row label="AWARENESS ACTIVE" value={botContextV3?.awareness.discovered ? 'ACTIVE' : 'INACTIVE'} />
            <Row label="TARGET VERSION" value={botContextV3?.target.targetVersion ?? 0} />
            <Row label="TARGET PLATFORM ID" value={botContextV3?.target.targetPlatformId ?? 'NONE'} />
            <Row label="TARGET NODE ID" value={botContextV3?.target.targetNodeId ?? 'NONE'} />
            <Row label="GRAPH REVISION" value={botContextV3?.graph?.revision ?? -1} />
            <Row label="GRAPH NODE COUNT" value={botContextV3?.graph?.nodes.size ?? 0} />
            <Row label="GRAPH EDGE COUNT" value={botContextV3?.graph?.edges.length ?? 0} />
            <Row label="VALID EDGE COUNT" value={validEdgeCount} />
            <Row label="ROUTE STATUS" value={botContextV3?.currentRoute?.status ?? 'NO_ROUTE'} highlight={botContextV3?.currentRoute?.status === 'ROUTE_FOUND'} />
            <Row label="ROUTE NODE COUNT" value={botContextV3?.currentRoute?.nodeIds.length ?? 0} />
            <Row label="CURRENT WAYPOINT INDEX" value={botContextV3?.currentWaypointIndex ?? 0} />
            <Row label="CURRENT WAYPOINT" value={activeWp ? `(${activeWp.x.toFixed(1)}, ${activeWp.y.toFixed(1)})` : 'NONE'} />
            <Row label="DISTANCE TO WAYPOINT" value={`${distToWp.toFixed(1)}px`} />
            <Row label="INTENDED MOVEMENT" value={intendedMovement ? `(${intendedMovement.x.toFixed(2)}, ${intendedMovement.y.toFixed(2)})` : '(0.00, 0.00)'} />
            <Row label="COLLISION-RESOLVED MOVEMENT" value={collisionResolvedMovement ? `(${collisionResolvedMovement.x.toFixed(2)}, ${collisionResolvedMovement.y.toFixed(2)})` : '(0.00, 0.00)'} />
            <Row label="COMMITTED MOVEMENT" value={committedMovement ? `(${committedMovement.x.toFixed(2)}, ${committedMovement.y.toFixed(2)})` : '(0.00, 0.00)'} />
            <Row label="WATCHDOG STATUS" value={botContextV3 ? `triggers=${botContextV3.watchdog.totalTriggers}, esc=${botContextV3.watchdog.escalated}` : 'N/A'} />
            <Row label="LAST FAILURE REASON" value={lastFailureReason || botContextV3?.currentRoute?.reason || 'NONE'} warning={!!lastFailureReason} />
          </div>
        </>
      )}
    </div>
  );
};

const Row: React.FC<{
  label: string;
  value: string | number;
  highlight?: boolean;
  warning?: boolean;
}> = ({ label, value, highlight, warning }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '2px 4px',
        backgroundColor: highlight
          ? 'rgba(56, 189, 248, 0.15)'
          : warning
          ? 'rgba(239, 68, 68, 0.2)'
          : 'transparent',
        borderRadius: '3px',
      }}
    >
      <span style={{ color: '#94A3B8' }}>{label}:</span>
      <span
        style={{
          color: warning ? '#EF4444' : highlight ? '#38BDF8' : '#F8FAFC',
          fontWeight: highlight || warning ? 'bold' : 'normal',
        }}
      >
        {String(value)}
      </span>
    </div>
  );
};
