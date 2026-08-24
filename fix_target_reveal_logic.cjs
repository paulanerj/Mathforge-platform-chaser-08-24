const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

const targetForFuncRegex = /    function targetFor\(rowIndex: number\) \{[\s\S]*?\}/;
const replacementFunc = `    function targetBandFor(rowIndex: number) {
      return Math.floor(Math.max(0, rowIndex - 1) / 6);
    }
    function targetFor(rowIndex: number) {
      return Math.min(20, 10 + 2 * targetBandFor(rowIndex));
    }`;

content = content.replace(targetForFuncRegex, replacementFunc);

// Fix updateHud
const updateHudRegex = /      const target = targetFor\(player\.row \+ 1\);\n      if \(target !== targetPresentation\.targetValue\) \{\n        targetPresentation\.targetValue = target;\n        targetPresentation\.targetEventId = Date\.now\(\) \+ Math\.random\(\);\n        targetPresentation\.phase = 'dominant-enter';\n        targetPresentation\.phaseStartedAt = elapsed;\n      \}/;
const replacementHud = `      const target = targetFor(player.row + 1);
      const targetEventId = targetBandFor(player.row + 1);
      if (targetEventId !== targetPresentation.targetEventId) {
        targetPresentation.targetValue = target;
        targetPresentation.targetEventId = targetEventId;
        targetPresentation.phase = 'dominant-enter';
        targetPresentation.phaseStartedAt = elapsed;
      }`;
content = content.replace(updateHudRegex, replacementHud);

// Fix initialization in restart()
const restartInitRegex = /      targetPresentation\.targetValue = targetFor\(1\);\n      targetPresentation\.targetEventId = Date\.now\(\) \+ Math\.random\(\);\n      targetPresentation\.phase = 'dominant-enter';\n      targetPresentation\.phaseStartedAt = 0;\n      targetPresentation\.progress = 0;/;
const replacementRestart = `      targetPresentation.targetValue = targetFor(1);
      targetPresentation.targetEventId = targetBandFor(1);
      targetPresentation.phase = 'dominant-enter';
      targetPresentation.phaseStartedAt = 0;
      targetPresentation.progress = 0;`;
content = content.replace(restartInitRegex, replacementRestart);

fs.writeFileSync(path, content);
