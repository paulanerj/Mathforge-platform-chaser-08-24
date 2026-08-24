const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `
    function validateActiveCircuitClimbRow(row: any, committedPlayerValue: number) {
      if (!row) return;
      let error = null;
      if (row.incomingPlayerValue !== committedPlayerValue) error = 'incomingPlayerValue mismatch';
      else if (row.correctPlatformValue !== row.targetValue - row.incomingPlayerValue) error = 'correctPlatformValue mismatch';
      else if (row.options[row.correctOptionIndex] !== row.correctPlatformValue) error = 'correctOptionIndex mismatch';
      else if (row.options.filter((o: number) => o === row.correctPlatformValue).length !== 1) error = 'multiple or zero correct options';
      
      if (error) {
        console.error('CIRCUIT_CLIMB_INVALID_ACTIVE_ROW', {
          id: row.id,
          index: row.index,
          targetEventId: row.targetEventId,
          targetValue: row.targetValue,
          incomingPlayerValue: row.incomingPlayerValue,
          options: row.options,
          correctOptionIndex: row.correctOptionIndex,
          computedRequiredOption: row.targetValue - row.incomingPlayerValue,
          reason: error
        });
      }
    }

    function armNextRow() {`;

code = code.replace("    function armNextRow() {", replacement);

// And call it in armNextRow
code = code.replace(
  "    function armNextRow() {\n      const row = rowAbove();\n      if (!row) return;",
  "    function armNextRow() {\n      const row = rowAbove();\n      if (!row) return;\n      validateActiveCircuitClimbRow(row, player.value);"
);

fs.writeFileSync(file, code);
console.log("Validator added");
