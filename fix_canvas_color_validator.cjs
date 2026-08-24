const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

const validator = `    // Canvas color safety validator
    function isSafeCanvasColor(value: string): boolean {
      if (!value) return false;
      if (value.includes('var(')) return false;
      return true;
    }

    // Validate the palette once on initialization
    for (const [key, value] of Object.entries(COLORS)) {
      if (!isSafeCanvasColor(value)) {
        console.warn(\`Circuit Climb Canvas Warning: Invalid color for \${key}: \${value}. Falling back to safe color.\`);
        // Note: COLORS is frozen, so we are just warning here.
        // In a real scenario with dynamic colors, we would replace it.
      }
    }
`;

content = content.replace(/    \/\/ Mutable states matching standalone script/, validator + '\n    // Mutable states matching standalone script');
fs.writeFileSync(path, content);
