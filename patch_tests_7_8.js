const fs = require('fs');
const file = 'src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /for\(let i=0; i<100; i\+\+\) \{\n        snapshot.simTimeMs \+= 16;\n        updateBotV2\(snapshot, context\);\n    \}/g,
  "for(let i=0; i<100; i++) {\n        snapshot.simTimeMs += 16;\n        const res = updateBotV2(snapshot, context);\n        snapshot.botPosition.x += res.intendedDisplacement.x;\n        snapshot.botPosition.y += res.intendedDisplacement.y;\n    }"
);

fs.writeFileSync(file, content);
