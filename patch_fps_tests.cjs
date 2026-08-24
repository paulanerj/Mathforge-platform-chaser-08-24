const fs = require('fs');
const file = 'src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/update\(16\)/g, "update(0.016)");
content = content.replace(/update\(33\)/g, "update(0.033)");
content = content.replace(/update\(66\)/g, "update(0.066)");

fs.writeFileSync(file, content);
