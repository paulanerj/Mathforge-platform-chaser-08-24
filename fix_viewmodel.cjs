const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

// The previous script added it at the bottom, which is outside viewModel.
// Remove the ones I added earlier at the bottom of the return statement
content = content.replace(/\s*showSumToCue,\n\s*setShowSumToCue,/g, '');

content = content.replace(
  /      showViewSettings,\n      showConfig,/,
  "      showViewSettings,\n      showSumToCue,\n      showConfig,"
);

// Add setShowSumToCue to the main return object
content = content.replace(
  /    setShowConfig,\n    debug:/,
  "    setShowConfig,\n    setShowSumToCue,\n    debug:"
);

fs.writeFileSync(path, content);
