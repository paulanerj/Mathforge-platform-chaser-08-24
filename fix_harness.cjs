const fs = require('fs');
const file = 'src/games/circuit-climb/CircuitClimbDevHarness.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /routeTurnCount=\{engine\.routeTurnCount\}\n\s*setRouteTurns=\{engine\.setRouteTurns\}/,
  "routeTurnCount={engine.routeTurnCount}\n        setRouteTurns={engine.setRouteTurns}\n        showCollisionHitboxes={engine.showCollisionHitboxes}\n        setShowCollisionHitboxes={engine.setShowCollisionHitboxes}"
);

fs.writeFileSync(file, code);
