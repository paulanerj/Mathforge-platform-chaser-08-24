const fs = require('fs');
const path = 'src/games/circuit-climb/styles/circuit-climb.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/:root \{[\s\S]*?\}/, `:root {
  --circuit-climb-bg: #f0f6fc;
  --circuit-climb-bg-depth: #e1edf7;
  --circuit-climb-structure: rgba(199, 217, 232, 0.5);
  --circuit-climb-text: #0f172a;
  --circuit-climb-player: #2563eb;
  --circuit-climb-player-highlight: #93c5fd;
  --circuit-climb-enemy: #ef4444;
  --circuit-climb-target: #0f172a;
  --circuit-climb-target-glow: rgba(37, 99, 235, 0.25);
  --circuit-climb-cue-surface: #ffffff;
  --circuit-climb-cue-border: #3b82f6;
}`);

fs.writeFileSync(path, css);
