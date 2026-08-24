const fs = require('fs');
const file = 'src/games/circuit-climb/bot-ai-v2/BotControllerV2.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("export function createBotContextV2(): BotStateContextV2 {", "export function createBotContextV2(): BotStateContextV2 {\n  searchSeq = 0;");

fs.writeFileSync(file, content);
