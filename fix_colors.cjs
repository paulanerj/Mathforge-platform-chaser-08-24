const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /    const COLORS = Object\.freeze\(\{[\s\S]*?white: '#ffffff',\n    \}\);/;
const colorsReplacement = `    const COLORS = Object.freeze({
      bg: '#03080e',
      bgDepth: '#0a1320',
      structure: '#172940',
      text: '#ffffff',
      player: '#baf32d',
      playerHighlight: '#efffd5',
      enemy: '#ff3366',
      target: '#baf32d',
      targetGlow: 'rgba(186, 243, 45, 0.4)',
      cueSurface: '#0a1320',
      cueBorder: '#172940',
      background: '#03080e',
      gridDot: '#172940',
      gridLine: '#172940',
      platform: '#101e2e',
      platformEdge: '#18324d',
      platformFace: '#101e2e',
      platformDead: '#0a1320',
      platformDeadEdge: '#18324d',
      platformPowered: '#0a1320',
      platformPoweredEdge: '#18324d',
      number: '#ffffff',
      numberDim: '#3e5c7a',
      cyan: '#2df3e2',
      cyanCore: '#d5ffff',
      lime: '#baf32d',
      limeCore: '#efffd5',
      amber: '#ffbf57',
      red: '#ff3366',
      redDark: '#7a1430',
      white: '#ffffff',
    });`;

content = content.replace(regex, colorsReplacement);
fs.writeFileSync(path, content);
