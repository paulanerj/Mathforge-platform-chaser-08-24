const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/    \}\);\n    \/\/ Canvas color safety validator/, '    };\n    // Canvas color safety validator');

fs.writeFileSync(path, content);
