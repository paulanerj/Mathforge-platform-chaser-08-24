const fs = require('fs');
const file = 'src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "for (let i = 0; i < 50; i++) {\n      act(() => { runtimeApi!.debug.update(16); });\n    }",
  "for (let i = 0; i < 50; i++) {\n      act(() => { runtimeApi!.debug.update(16); });\n      console.log('BOT_POS', i, runtimeApi!.debug.getBot().y);\n    }"
);
fs.writeFileSync(file, content);
