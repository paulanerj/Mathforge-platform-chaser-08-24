const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\} else if \(playerNumberPresentation\.phase === 'landing-reveal'\) \{\s+if \(elapsed - playerNumberPresentation\.phaseStartedAt >= 120\) \{\s+playerNumberPresentation\.phase = 'visible';\s+playerNumberPresentation\.phaseStartedAt \+= 120;\s+\}\s+\}/g,
  '}'
);

fs.writeFileSync(file, code);
console.log("Replaced update successfully");
