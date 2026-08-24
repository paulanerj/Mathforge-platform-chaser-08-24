const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

// Unfreeze COLORS
content = content.replace(/const COLORS = Object\.freeze\(\{/, 'const COLORS = {');
// Remove closing brace freeze
content = content.replace(/    \}\);/, '    };');

// Replace previous validator with the new one
const oldValidatorRegex = /    \/\/ Canvas color safety validator[\s\S]*?\/\/ Mutable states matching standalone script/;
const newValidator = `    // Canvas color safety validator
    function isSafeCanvasColor(value: any): boolean {
      if (!value) return false;
      if (typeof value !== 'string') return false;
      if (value.includes('var(')) return false;
      return true;
    }

    const SAFE_FALLBACK_COLOR = '#ff00ff';

    // Validate the palette once on initialization
    for (const key of Object.keys(COLORS) as Array<keyof typeof COLORS>) {
      const val = COLORS[key];
      if (!isSafeCanvasColor(val)) {
        console.warn(\`Circuit Climb Canvas Warning: Invalid color for \${key}: \${val}. Falling back to safe known color.\`);
        COLORS[key] = SAFE_FALLBACK_COLOR;
      }
    }

    // Mutable states matching standalone script`;

content = content.replace(oldValidatorRegex, newValidator);

fs.writeFileSync(path, content);
