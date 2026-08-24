const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

const replacement = `
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function drawTargetPresentation() {
      const p = targetPresentation;
      const targetAge = elapsed - p.phaseStartedAt;
      let alpha = 0.055;
      let sizeScale = 1;
      let yOffset = 0;
      
      const restSize = Math.min(width * 0.62, height * 0.31);
      const domSize = Math.min(width * 0.75, height * 0.45);
      let size = restSize;
      
      let flash = 0;
      let haloAlpha = 0;
      
      if (p.phase === 'dominant-enter') {
        const pr = clamp(targetAge / 180, 0, 1);
        alpha = 0.055 + pr * 0.85; // up to ~0.9
        size = domSize;
        flash = pr;
        yOffset = (1 - pr) * 20; // slight drop in
        haloAlpha = pr * 0.6;
      } else if (p.phase === 'dominant-hold') {
        alpha = 0.9;
        size = domSize;
        flash = 1;
        haloAlpha = 0.6;
      } else if (p.phase === 'receding') {
        const pr = clamp((targetAge - 650) / 850, 0, 1);
        const ease = pr < 0.5 ? 2 * pr * pr : 1 - Math.pow(-2 * pr + 2, 2) / 2;
        alpha = 0.9 - ease * (0.9 - 0.055);
        size = domSize - ease * (domSize - restSize);
        flash = 1 - ease;
        haloAlpha = 0.6 - ease * 0.6;
      } else {
        alpha = 0.055;
        size = restSize;
        flash = 0;
        haloAlpha = 0;
      }

      const drift = parallaxOffset(CONFIG.farParallax, 420) - 210;
      const baseY = height * 0.42 + drift * 0.10 + yOffset;
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = \`900 \${size}px ui-monospace, monospace\`;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = flash > 0.25 ? COLORS.text : COLORS.gridLine;
      ctx.shadowColor = flash > 0.25 ? COLORS.targetGlow : COLORS.gridDot;
      ctx.shadowBlur = 12 + flash * 46;
      ctx.fillText(String(p.targetValue), width / 2, baseY);
      ctx.restore();

      // SUM TO cue
      if (showSumToCue) {
        let cueAlpha = alpha * 1.5;
        if (cueAlpha > 1) cueAlpha = 1;
        
        const floatDrift = Math.sin(elapsed / 800) * 4;
        const cueY = baseY - size * 0.55 - 30 + floatDrift;
        
        ctx.save();
        ctx.globalAlpha = cueAlpha;
        
        // Background chip
        const chipW = 90;
        const chipH = 28;
        const chipX = width / 2 - chipW / 2;
        const chipY = cueY - chipH / 2;
        
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        
        ctx.fillStyle = COLORS.cueSurface;
        roundRect(chipX, chipY, chipW, chipH, 14);
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = COLORS.cueBorder;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = COLORS.text;
        ctx.font = '900 12px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = '1px';
        ctx.fillText('SUM TO', width / 2, cueY + 1);
        ctx.restore();
      }
    }
`;
content = content.replace(/    function drawDistantTarget\(\) \{[\s\S]*?    \}/, replacement);
// Also rename drawDistantTarget to drawTargetPresentation in drawBackground
content = content.replace(/drawDistantTarget\(\);/, 'drawTargetPresentation();');
fs.writeFileSync(path, content);
