const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /    function drawBackground\(\) \{\n      const gradient = ctx.createLinearGradient\(0, 0, 0, height\);\n      gradient\.addColorStop\(0, '#071323'\);\n      gradient\.addColorStop\(0\.55, '#050914'\);\n      gradient\.addColorStop\(1, '#080811'\);\n      ctx\.fillStyle = gradient;\n      ctx\.fillRect\(0, 0, width, height\);/;

const replacement = `    function drawBackground() {
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, width, height);`;

content = content.replace(regex, replacement);

fs.writeFileSync(path, content);
