const fs = require('fs');
const file = 'src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "act(() => { runtimeApi!.debug.update(16); });",
  "act(() => { runtimeApi!.debug.update(16); }); if (i % 10 === 0) console.log('BOTY', runtimeApi!.debug.getBot()?.y, runtimeApi!.debug.getBotV2Debug()?.state, runtimeApi!.debug.getBot()?.x);"
);
fs.writeFileSync(file, content);
