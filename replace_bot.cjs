const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

const startStr = "    function drawBot() {";
const endStr = "    function drawPlayer() {";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find bounds");
  process.exit(1);
}

const replacement = `    function drawBot() {
      if (!bot) return;
      const screenY = worldToScreenY(bot.y);

      const visibleBottom = height - 68;
      if (screenY > visibleBottom && screenY < height + CONFIG.rowGap * 0.95) {
        const proximity = clamp(1 - (screenY - visibleBottom) / (CONFIG.rowGap * 1.25), 0.18, 1);
        const markerX = clamp(bot.x, 22, width - 22);
        const markerY = visibleBottom;
        ctx.save();
        ctx.globalAlpha = 0.45 + proximity * 0.45;
        ctx.fillStyle = '#ff3830';
        ctx.shadowColor = '#ff3830';
        ctx.shadowBlur = 18 + proximity * 8;
        ctx.beginPath();
        ctx.arc(markerX, markerY, 6 + proximity * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff3830';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(markerX, markerY, 12 + proximity * 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ff3830';
        ctx.shadowBlur = 0;
        ctx.font = '900 8px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('TIME', markerX, markerY - 17);
        ctx.restore();
        return;
      }
      if (screenY < -70 || screenY > height + 70) return;

      const bursting = bot.mode === 'bursting';
      const locked = bot.mode === 'locked';
      const jitter = locked || bursting ? 2.1 : 0.9;
      const x = bot.x + Math.sin(elapsed / 31) * jitter;
      const y = screenY + Math.cos(elapsed / 27) * jitter;
      const radius = CONFIG.botRadius;

      ctx.save();
      ctx.shadowColor = '#ff3830';
      ctx.shadowBlur = locked || bursting ? 30 : 20;

      ctx.fillStyle = '#ff3830';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = locked || bursting ? 2 : 1.4;

      for (let i = 0; i < 6; i += 1) {
        const angle = elapsed * 0.002 + i * Math.PI / 3;
        const inner = radius + 3;
        let outer = radius + 7;
        if (locked) {
           outer += 4 * (0.5 + 0.5 * Math.sin(elapsed * 0.012 + i));
        } else if (bursting) {
           outer += 8 * (0.5 + 0.5 * Math.sin(elapsed * 0.02 + i));
        }
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
        ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
        ctx.stroke();
      }

      if (locked) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ff3830';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.arc(x, y, radius + 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff3830';
        ctx.font = '900 9px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('LOCK', x, y - radius - 15);
      } else if (bursting) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ff3830';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, radius + 14 + Math.sin(elapsed * 0.03) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (bot.contactTime > 0) {
        const progress = clamp(bot.contactTime / CONFIG.contactFuseMs, 0, 1);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = COLORS.white;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius + 6, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync(file, code);
console.log("Replaced successfully");
