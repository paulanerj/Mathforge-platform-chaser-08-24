const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /      let outerFill = 'rgba\(9, 17, 28, 0\.72\)';[\s\S]*?      \}\n      ctx\.restore\(\);\n    \}/;
const replacement = `      let outerFill = COLORS.platform;
      let outerEdge = COLORS.platformEdge;
      let capsuleFill = COLORS.bgDepth;
      let capsuleEdge = COLORS.structure;

      if (platform.dead) {
        outerFill = COLORS.platformDead;
        outerEdge = COLORS.platformDeadEdge;
        capsuleFill = COLORS.redDark;
        capsuleEdge = COLORS.red;
      } else if (platform.powered) {
        outerFill = COLORS.platformPowered;
        outerEdge = COLORS.platformPoweredEdge;
        capsuleFill = COLORS.cyanCore;
        capsuleEdge = COLORS.cyan;
      } else if (platform.selected) {
        outerEdge = COLORS.lime;
        capsuleEdge = COLORS.lime;
      } else if (!active && platform.value === null) {
        outerFill = COLORS.bg;
        outerEdge = COLORS.structure;
      }

      ctx.shadowColor = platform.powered
        ? COLORS.cyan
        : platform.selected
          ? COLORS.lime
          : 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = platform.powered ? 20 : platform.selected ? 16 : 8;
      ctx.shadowOffsetY = 4;

      roundedRectPath(ctx, x, drawY, platform.width, platform.height, outerRadius);
      ctx.fill();
      ctx.lineWidth = platform.powered ? 2.4 : 1.3;
      ctx.strokeStyle = outerEdge;
      ctx.stroke();

      if (platform.value !== null && platform.row > 0) {
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        roundedRectPath(
          ctx,
          x + capsuleInsetX,
          drawY + capsuleInsetY,
          capsuleWidth,
          capsuleHeight,
          Math.min(11, capsuleHeight / 2),
        );
        ctx.fillStyle = capsuleFill;
        ctx.fill();
        ctx.lineWidth = platform.powered ? 2.1 : 1.5;
        ctx.strokeStyle = capsuleEdge;
        ctx.stroke();

        if (platform.dead) {
          ctx.strokeStyle = COLORS.red;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(platform.x - 21, drawY + 11);
          ctx.lineTo(platform.x - 5, drawY + 28);
          ctx.lineTo(platform.x - 14, drawY + platform.height - 8);
          ctx.moveTo(platform.x + 18, drawY + 10);
          ctx.lineTo(platform.x + 3, drawY + 27);
          ctx.lineTo(platform.x + 18, drawY + platform.height - 7);
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = \`700 \${Math.max(23, Math.min(31, platform.width * 0.27))}px ui-monospace, monospace\`;
        ctx.fillStyle = platform.dead ? COLORS.white : COLORS.text;
        ctx.fillText(String(platform.value), platform.x, drawY + platform.height / 2 + 1);
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = COLORS.structure;
        ctx.fillRect(x + 8, drawY + 8, platform.width - 16, 2);
      }

      if (active && !platform.dead) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = platform.correct
          ? COLORS.lime
          : COLORS.cyan;
        ctx.fillRect(x + 10, drawY + platform.height - 4, Math.max(18, platform.width * 0.2), 2);
      }

      ctx.restore();
    }`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
