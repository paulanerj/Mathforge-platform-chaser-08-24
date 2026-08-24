const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /showViewSettings,/,
  "showViewSettings,\n      showCollisionHitboxes,"
);

code = code.replace(
  /exportViewConfig,\n\s*setShowConfig,/,
  "exportViewConfig,\n    setShowConfig,\n    setShowCollisionHitboxes,"
);

fs.writeFileSync(file, code);

// In CircuitClimbSurface.tsx
const file2 = 'src/games/circuit-climb/CircuitClimbSurface.tsx';
let code2 = fs.readFileSync(file2, 'utf8');

code2 = code2.replace(
  /showCollisionHitboxes,\n\s*setShowCollisionHitboxes,/,
  ""
);

code2 = code2.replace(
  /exportViewConfig,\n\s*setShowConfig,\n\s*} = runtime;/,
  "exportViewConfig,\n    setShowConfig,\n    setShowCollisionHitboxes,\n  } = runtime;"
);

code2 = code2.replace(
  /showViewSettings,\n\s*showSumToCue,/,
  "showViewSettings,\n    showCollisionHitboxes,\n    showSumToCue,"
);

// Remove the ? type we accidentally added
code2 = code2.replace(
  /showCollisionHitboxes\?: boolean;\n\s*setShowCollisionHitboxes\?: \(show: boolean\) => void;/,
  ""
);

fs.writeFileSync(file2, code2);
