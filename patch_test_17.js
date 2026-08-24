const fs = require('fs');
const file = 'src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "act(() => { runtimeApi!.debug.update(66); });",
  "act(() => { runtimeApi!.debug.update(66); }); console.log('T17 BOT', runtimeApi!.debug.getBot()?.x, runtimeApi!.debug.getBotV2Debug()?.state, runtimeApi!.debug.getBotV2Debug()?.activeWaypoint);"
);
fs.writeFileSync(file, content);
