const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\s*function finishCorrectResolution\(\) \{\s*\/\/ Logic moved directly into arrive\(\) for instantaneous landing frame display\s*\}/g,
  ''
);

code = code.replace(
  /\s*finishCorrectResolution\(\);/g,
  ''
);

fs.writeFileSync(file, code);
console.log("Replaced update successfully");
