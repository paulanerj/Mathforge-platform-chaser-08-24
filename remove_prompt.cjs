const fs = require('fs');
const file = 'src/games/circuit-climb/CircuitClimbSurface.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /<div className="mathforge-prompt-row">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const match = code.match(/<div className="mathforge-prompt-row">[\s\S]*?<\/div>\s*<\/div>/);
if (match) {
  code = code.replace(match[0], '');
}

fs.writeFileSync(file, code);
console.log("Replaced successfully");
