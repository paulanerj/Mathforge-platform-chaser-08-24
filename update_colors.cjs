const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /const COLORS = Object\.freeze\(\{[\s\S]*?white: '#ffffff',\n    \}\);/;
const colorsReplacement = `const COLORS = Object.freeze({
      bg: 'var(--circuit-climb-bg)',
      bgDepth: 'var(--circuit-climb-bg-depth)',
      structure: 'var(--circuit-climb-structure)',
      text: 'var(--circuit-climb-text)',
      player: 'var(--circuit-climb-player)',
      playerHighlight: 'var(--circuit-climb-player-highlight)',
      enemy: 'var(--circuit-climb-enemy)',
      target: 'var(--circuit-climb-target)',
      targetGlow: 'var(--circuit-climb-target-glow)',
      cueSurface: 'var(--circuit-climb-cue-surface)',
      cueBorder: 'var(--circuit-climb-cue-border)',
      background: 'var(--circuit-climb-bg)',
      gridDot: 'var(--circuit-climb-structure)',
      gridLine: 'var(--circuit-climb-structure)',
      platform: 'var(--circuit-climb-cue-surface)',
      platformEdge: 'var(--circuit-climb-cue-border)',
      platformFace: 'var(--circuit-climb-cue-surface)',
      platformDead: 'var(--circuit-climb-bg-depth)',
      platformDeadEdge: 'var(--circuit-climb-structure)',
      platformPowered: 'var(--circuit-climb-player)',
      platformPoweredEdge: 'var(--circuit-climb-player-highlight)',
      number: 'var(--circuit-climb-text)',
      numberDim: 'var(--circuit-climb-structure)',
      cyan: 'var(--circuit-climb-player)',
      cyanCore: 'var(--circuit-climb-player-highlight)',
      lime: 'var(--circuit-climb-player)',
      limeCore: 'var(--circuit-climb-player-highlight)',
      amber: '#ffbf57',
      red: 'var(--circuit-climb-enemy)',
      redDark: '#7a1430',
      white: '#ffffff',
    });`;

content = content.replace(regex, colorsReplacement);
fs.writeFileSync(path, content);
