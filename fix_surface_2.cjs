const fs = require('fs');
const file = 'src/games/circuit-climb/CircuitClimbSurface.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /setViewScale,\n    setRouteTurns,\n    resetViewSettings,/,
  "setViewScale,\n    setRouteTurns,\n    showCollisionHitboxes,\n    setShowCollisionHitboxes,\n    resetViewSettings,"
);

fs.writeFileSync(file, code);
