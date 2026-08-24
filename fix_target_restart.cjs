const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

const targetInit = `
      targetPresentation.targetValue = targetFor(1);
      targetPresentation.targetEventId = Date.now() + Math.random();
      targetPresentation.phase = 'dominant-enter';
      targetPresentation.phaseStartedAt = 0;
      targetPresentation.progress = 0;
`;
content = content.replace(/(      playerNumberPresentation\.pendingValue = null;)/, '$1' + targetInit);
fs.writeFileSync(path, content);
