const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/ctx.strokeStyle = '#18324d';/, "ctx.strokeStyle = COLORS.bgDepth;");
content = content.replace(/ctx.strokeStyle = '#244b64';/, "ctx.strokeStyle = COLORS.bgDepth;");
content = content.replace(/ctx.fillStyle = '#172940';/, "ctx.fillStyle = COLORS.gridDot;");

fs.writeFileSync(path, content);
