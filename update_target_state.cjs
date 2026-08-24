const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

const targetStateCode = `
    type TargetRevealPhase = 'dominant-enter' | 'dominant-hold' | 'receding' | 'resting';
    const targetPresentation = {
      targetValue: 10,
      targetEventId: 0,
      phase: 'resting' as TargetRevealPhase,
      phaseStartedAt: 0,
      progress: 0,
    };
`;

content = content.replace(/(    const playerNumberPresentation = {[\s\S]*?    };)/, '$1' + targetStateCode);
fs.writeFileSync(path, content);
