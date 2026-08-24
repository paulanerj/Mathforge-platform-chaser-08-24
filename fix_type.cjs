const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /showViewSettings: boolean;/,
  "showViewSettings: boolean;\n  showCollisionHitboxes: boolean;"
);

fs.writeFileSync(file, code);
