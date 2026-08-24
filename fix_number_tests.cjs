const fs = require('fs');
const path = 'src/games/circuit-climb/tests/circuitClimbNumberTransition.test.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/landing-settle/g, 'landing-reveal');
content = content.replace(/revealing/g, 'landing-reveal');
fs.writeFileSync(path, content);
