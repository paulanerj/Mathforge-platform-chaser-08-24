const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const \[showViewSettings,\s*const \[showViewSettings, setShowViewSettings\] = useState\(false\);/,
  "const [showViewSettings, setShowViewSettings] = useState(false);"
);

fs.writeFileSync(file, code);
