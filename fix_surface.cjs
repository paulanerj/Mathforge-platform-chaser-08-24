const fs = require('fs');
const file = 'src/games/circuit-climb/CircuitClimbSurface.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /showCollisionHitboxes: boolean;\n  setShowCollisionHitboxes: \(show: boolean\) => void;/,
  "showCollisionHitboxes?: boolean;\n  setShowCollisionHitboxes?: (show: boolean) => void;"
);

fs.writeFileSync(file, code);

const tests = 'src/games/circuit-climb/tests/circuitClimbArithmetic.test.ts';
let testCode = fs.readFileSync(tests, 'utf8');
testCode = testCode.replace("import { renderHook } from '@testing-library/react-hooks';", "");
fs.writeFileSync(tests, testCode);

