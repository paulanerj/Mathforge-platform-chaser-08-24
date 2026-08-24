const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

// replace distantTargetValue references
content = content.replace(/let distantTargetValue[\s\S]*?let targetFlashAt = -10000;/, '');
content = content.replace(/distantTargetValue = null;/, '');
content = content.replace(/targetFlashAt = -10000;/, '');

// updateHud
content = content.replace(
  /      const target = targetFor\(player\.row \+ 1\);\n      if \(target !== distantTargetValue\) \{\n        distantTargetValue = target;\n        targetFlashAt = elapsed;\n      \}/,
  `      const target = targetFor(player.row + 1);
      if (target !== targetPresentation.targetValue) {
        targetPresentation.targetValue = target;
        targetPresentation.targetEventId = Date.now() + Math.random();
        targetPresentation.phase = 'dominant-enter';
        targetPresentation.phaseStartedAt = elapsed;
      }`
);

fs.writeFileSync(path, content);
