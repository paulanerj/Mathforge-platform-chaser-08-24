const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

const startStr = "    function updateHud() {\n      const target = targetFor(player.row + 1);\n      const targetEventId = targetBandFor(player.row + 1);\n      if (targetEventId !== targetPresentation.targetEventId) {";
const replacement = `    function updateHud() {
      const activeRow = getRow(player.row + 1);
      if (!activeRow) return;
      
      const target = activeRow.targetValue;
      const targetEventId = activeRow.targetEventId !== undefined ? activeRow.targetEventId : targetBandFor(player.row + 1);

      if (targetEventId !== targetPresentation.targetEventId) {`;

code = code.replace(startStr, replacement);
fs.writeFileSync(file, code);
console.log("updateHud fixed");
