const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

const targetUpdate = `
      const targetAge = elapsed - targetPresentation.phaseStartedAt;
      if (targetPresentation.phase === 'dominant-enter' && targetAge >= 180) {
        targetPresentation.phase = 'dominant-hold';
      } else if (targetPresentation.phase === 'dominant-hold' && targetAge >= 650) {
        targetPresentation.phase = 'receding';
      } else if (targetPresentation.phase === 'receding' && targetAge >= 1500) {
        targetPresentation.phase = 'resting';
      }
      targetPresentation.progress = clamp(targetAge / 1500, 0, 1);
`;
content = content.replace(/(      updateTravel\(delta\);)/, targetUpdate + '\n$1');
fs.writeFileSync(path, content);
