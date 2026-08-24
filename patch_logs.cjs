const fs = require('fs');
const file = 'src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/ console\.log\("BOTY", runtimeApi!\.debug\.getBot\(\)\.y\);/g, "");
content = content.replace(/ console\.log\('T17 BOT', runtimeApi!\.debug\.getBot\(\)\.x\);/g, "");

fs.writeFileSync(file, content);
