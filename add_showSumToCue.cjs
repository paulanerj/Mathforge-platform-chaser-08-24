const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

// Add useState
content = content.replace(
  /const \[routeTurnCount, setRouteTurnCount\] = useState\(8\);/,
  "const [routeTurnCount, setRouteTurnCount] = useState(8);\n  const [showSumToCue, setShowSumToCue] = useState(true);"
);

// Add to returned object
content = content.replace(
  /    routeTurnCount,\n    showViewSettings,/,
  "    routeTurnCount,\n    showViewSettings,\n    showSumToCue,\n    setShowSumToCue,"
);

fs.writeFileSync(path, content);
