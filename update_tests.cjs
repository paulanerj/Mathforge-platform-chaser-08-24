const fs = require('fs');
const file = 'src/games/circuit-climb/tests/circuitClimbNumberTransition.test.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /enters landing-reveal phase/g,
  'enters visible phase immediately'
);
code = code.replace(
  /presentation\.phase = 'landing-reveal';/g,
  "presentation.phase = 'visible';"
);
code = code.replace(
  /expect\(presentation\.phase\)\.toBe\('landing-reveal'\);/g,
  "expect(presentation.phase).toBe('visible');"
);
code = code.replace(
  /10\. Reveal completes with the new value fully visible/g,
  '10. Reveal is instantaneous, no landing-reveal phase'
);
code = code.replace(
  /const presentation: any = \{ phase: 'landing-reveal', phaseStartedAt: 0, displayedValue: 10 \};\n    const elapsed = 150;\n    if \(presentation\.phase === 'landing-reveal' && elapsed - presentation\.phaseStartedAt >= 150\) \{\n      presentation\.phase = 'visible';\n    \}/g,
  "const presentation: any = { phase: 'visible', phaseStartedAt: 0, displayedValue: 10 };\n    const elapsed = 0;"
);


fs.writeFileSync(file, code);
console.log("Replaced test successfully");
