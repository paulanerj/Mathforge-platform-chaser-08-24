const fs = require('fs');
const content = fs.readFileSync('src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts', 'utf8');
const searchString = `    const player = {
      row: 0,
      x: 0,
      y: 0,
      value: 4,
      platform: null as any,
      pulseAt: -1000,
    };`;

const replacementString = `    type PlayerNumberPhase =
      | 'visible'
      | 'clearing'
      | 'hidden-transit'
      | 'landing-settle'
      | 'revealing';

    const playerNumberPresentation = {
      phase: 'visible' as PlayerNumberPhase,
      phaseStartedAt: 0,
      displayedValue: 4 as number | null,
      pendingValue: null as number | null,
    };

    const player = {
      row: 0,
      x: 0,
      y: 0,
      value: 4,
      platform: null as any,
      pulseAt: -1000,
    };`;
fs.writeFileSync('src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts', content.replace(searchString, replacementString));
