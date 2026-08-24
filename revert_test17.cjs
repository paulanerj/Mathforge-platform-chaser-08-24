const fs = require('fs');
const file = 'src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/act\(\(\) => { runtimeApi!\.debug\.update\(66\); }\);/g, "act(() => { runtimeApi!.debug.update(33); runtimeApi!.debug.update(33); });");
fs.writeFileSync(file, content);
