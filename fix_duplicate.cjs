const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

const lines = code.split('\n');
const newLines = [...lines.slice(0, 579), ...lines.slice(607)];

code = newLines.join('\n');
fs.writeFileSync(file, code);
console.log("duplicates removed");
