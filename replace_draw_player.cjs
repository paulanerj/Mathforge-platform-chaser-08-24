const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\} else if \(playerNumberPresentation\.phase === 'landing-reveal'\) \{\s+const progress = clamp\(phaseElapsed \/ 120, 0, 1\);\s+opacity = 0\.8 \+ progress \* 0\.2;\s+scale = 0\.9 \+ progress \* 0\.1;\s+\}/g,
  '}'
);

fs.writeFileSync(file, code);
console.log("Replaced drawPlayer successfully");
