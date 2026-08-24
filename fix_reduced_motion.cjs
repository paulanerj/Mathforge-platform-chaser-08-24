const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /      const drift = parallaxOffset\(CONFIG\.farParallax, 420\) - 210;/;
const replacement = `      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        yOffset = 0;
        size = restSize + (size - restSize) * 0.3; // Less scale
      }
      const drift = prefersReducedMotion ? 0 : parallaxOffset(CONFIG.farParallax, 420) - 210;`;

content = content.replace(regex, replacement);

const floatRegex = /const floatDrift = Math\.sin\(elapsed \/ 800\) \* 4;/;
const floatReplacement = `const floatDrift = prefersReducedMotion ? 0 : Math.sin(elapsed / 800) * 4;`;
content = content.replace(floatRegex, floatReplacement);

fs.writeFileSync(path, content);
