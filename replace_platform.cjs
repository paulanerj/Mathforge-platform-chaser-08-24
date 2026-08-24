const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

const startStr = "    function drawPlatform(platform: any, activeRow: number) {";
const endStr = "    function drawPlatforms() {";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find bounds");
  process.exit(1);
}

const replacement = `    function drawPlatform(platform: any, activeRow: number) {
      if (platform.row === 0 && platform.column !== 1) {
        return;
      }
      const x = platform.x - platform.width / 2;
      const y = worldToScreenY(platform.y);

      if (y < -110 || y > height + 110) {
        return;
      }

      const active = platform.row === activeRow;
      const bob = active && !travel && !platform.dead
        ? Math.sin(elapsed * 0.003 + platform.column) * 1.5
        : 0;

      const drawY = y + bob;
      const cornerRadius = 4;

      ctx.save();
      
      let fill = '#ffffff';
      let border = '#D8E4F7';
      let bottomBar = '#D8E4F7';
      let textColor = '#0E1B33';
      let shadowColor = 'rgba(14, 27, 51, 0.04)';
      
      if (platform.dead) {
        fill = '#f1f5f9';
        border = '#cbd5e1';
        bottomBar = '#cbd5e1';
        textColor = '#94a3b8';
        shadowColor = 'transparent';
      } else if (platform.powered || platform.selected) {
        fill = '#ffffff';
        border = '#007BFF';
        bottomBar = '#007BFF';
        textColor = '#007BFF';
        shadowColor = 'rgba(0, 123, 255, 0.1)';
      } else if (active) {
        fill = '#ffffff';
        border = '#D8E4F7';
        bottomBar = '#007BFF';
        textColor = '#0E1B33';
        shadowColor = 'rgba(14, 27, 51, 0.08)';
      }

      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = platform.dead ? 0 : 8;
      ctx.shadowOffsetY = platform.dead ? 0 : 4;

      // Draw Main Box
      roundedRectPath(ctx, x, drawY, platform.width, platform.height, cornerRadius);
      ctx.fillStyle = fill;
      ctx.fill();
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = border;
      ctx.stroke();

      // Draw Bottom Bar
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = bottomBar;
      
      ctx.beginPath();
      ctx.moveTo(x + cornerRadius, drawY + platform.height - 4);
      ctx.lineTo(x + platform.width - cornerRadius, drawY + platform.height - 4);
      ctx.lineTo(x + platform.width, drawY + platform.height - cornerRadius);
      ctx.lineTo(x + platform.width, drawY + platform.height - cornerRadius);
      ctx.arcTo(x + platform.width, drawY + platform.height, x + platform.width - cornerRadius, drawY + platform.height, cornerRadius);
      ctx.lineTo(x + cornerRadius, drawY + platform.height);
      ctx.arcTo(x, drawY + platform.height, x, drawY + platform.height - cornerRadius, cornerRadius);
      ctx.lineTo(x, drawY + platform.height - 4);
      ctx.fill();

      // Draw Text
      if (platform.value !== null && platform.row > 0) {
        if (platform.dead) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(platform.x - 18, drawY + 13);
          ctx.lineTo(platform.x - 4, drawY + 26);
          ctx.lineTo(platform.x - 12, drawY + platform.height - 11);
          ctx.moveTo(platform.x + 16, drawY + 12);
          ctx.lineTo(platform.x + 3, drawY + 25);
          ctx.lineTo(platform.x + 14, drawY + platform.height - 11);
          ctx.stroke();
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = \`700 \${Math.max(22, Math.min(29, platform.width * 0.26))}px ui-sans-serif, system-ui, sans-serif\`;
        ctx.fillStyle = textColor;
        ctx.fillText(String(platform.value), platform.x, drawY + platform.height / 2);
      }

      ctx.restore();
    }

`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync(file, code);
console.log("Replaced successfully");
