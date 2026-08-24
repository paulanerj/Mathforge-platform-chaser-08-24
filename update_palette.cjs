const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /    const COLORS = \{[\s\S]*?\n    \};/;
const colorsReplacement = `    const COLORS = {
      bg: '#f0f6fc',
      bgDepth: '#e1edf7',
      structure: '#c7d9e8',
      text: '#0f172a',
      player: '#2563eb',
      playerHighlight: '#93c5fd',
      enemy: '#ef4444',
      target: '#0f172a',
      targetGlow: 'rgba(37, 99, 235, 0.25)',
      cueSurface: '#ffffff',
      cueBorder: '#3b82f6',
      background: '#f0f6fc',
      gridDot: '#c7d9e8',
      gridLine: '#dbeafe',
      platform: '#ffffff',
      platformEdge: '#bfdbfe',
      platformFace: '#ffffff',
      platformDead: '#f1f5f9',
      platformDeadEdge: '#cbd5e1',
      platformPowered: '#eff6ff',
      platformPoweredEdge: '#3b82f6',
      number: '#1e293b',
      numberDim: '#64748b',
      cyan: '#0ea5e9',
      cyanCore: '#bae6fd',
      lime: '#2563eb',
      limeCore: '#93c5fd',
      amber: '#f59e0b',
      red: '#ef4444',
      redDark: '#991b1b',
      white: '#ffffff',
    };`;

content = content.replace(regex, colorsReplacement);
fs.writeFileSync(path, content);
