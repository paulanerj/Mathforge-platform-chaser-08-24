const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace enemy colors
content = content.replace(/ctx\.fillStyle = '#ff9aae';/g, "ctx.fillStyle = COLORS.red;");
content = content.replace(/ctx\.strokeStyle = '#ff9aae';/g, "ctx.strokeStyle = COLORS.red;");
content = content.replace(/ctx\.fillStyle = '#ffb3c2';/g, "ctx.fillStyle = COLORS.red;");
content = content.replace(/gradient\.addColorStop\(0, '#fff2f5'\);/, "gradient.addColorStop(0, COLORS.white);");
content = content.replace(/gradient\.addColorStop\(0\.28, '#ff9aae'\);/, "gradient.addColorStop(0.28, COLORS.red);");
content = content.replace(/gradient\.addColorStop\(0\.66, '#ff456a'\);/, "gradient.addColorStop(0.66, COLORS.red);");
content = content.replace(/gradient\.addColorStop\(1, '#8d1534'\);/, "gradient.addColorStop(1, COLORS.redDark);");
content = content.replace(/ctx\.strokeStyle = locked \? '#ffdce4' : '#ff718d';/, "ctx.strokeStyle = locked ? COLORS.white : COLORS.red;");
content = content.replace(/ctx\.strokeStyle = 'rgba\(255,220,228,0\.72\)';/, "ctx.strokeStyle = COLORS.red;");
content = content.replace(/ctx\.strokeStyle = '#ffffff';/, "ctx.strokeStyle = COLORS.white;");

// Replace player colors
content = content.replace(/ctx\.fillStyle = '#23351d';/, "ctx.fillStyle = COLORS.bgDepth;");
content = content.replace(/ctx\.fillStyle = '#efffd5';/, "ctx.fillStyle = COLORS.limeCore;");
content = content.replace(/ctx\.strokeStyle = '#dfffbc';/, "ctx.strokeStyle = COLORS.limeCore;");

content = content.replace(/glow\.addColorStop\(0\.2, '#8ce7ff'\);/, "glow.addColorStop(0.2, COLORS.cyanCore);");
content = content.replace(/glow\.addColorStop\(0\.72, '#168bc7'\);/, "glow.addColorStop(0.72, COLORS.cyan);");
content = content.replace(/glow\.addColorStop\(1, '#063e6b'\);/, "glow.addColorStop(1, COLORS.player);");
content = content.replace(/ctx\.strokeStyle = '#86ebff';/, "ctx.strokeStyle = COLORS.cyanCore;");
content = content.replace(/ctx\.strokeStyle = '#dff8ff';/, "ctx.strokeStyle = COLORS.cyanCore;");
content = content.replace(/ctx\.fillStyle = '#06111d';/, "ctx.fillStyle = COLORS.white;");

// Particles and UI text
content = content.replace(/ctx\.fillStyle = 'rgba\(146, 181, 208, 0\.46\)';/, "ctx.fillStyle = COLORS.structure;");

fs.writeFileSync(path, content);
