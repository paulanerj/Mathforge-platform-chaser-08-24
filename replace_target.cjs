const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /alpha = 0\.9 - ease \* \(0\.9 - 0\.16\);/,
  'alpha = 0.9 - ease * (0.9 - 0.22);'
);

code = code.replace(
  /alpha = 0\.16;/,
  'alpha = 0.22;'
);

code = code.replace(
  /ctx\.fillStyle = flash > 0\.25 \? COLORS\.text : COLORS\.gridLine;/,
  'ctx.fillStyle = flash > 0.25 ? COLORS.text : \'#bacde6\';' // slightly deeper blue-gray
);

fs.writeFileSync(file, code);
console.log("Replaced successfully");
