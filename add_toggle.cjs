const fs = require('fs');
const file = 'src/games/circuit-climb/CircuitClimbSurface.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add props type
code = code.replace(
  /routeTurnCount: number;\n\s*setRouteTurns: \(count: number\) => void;/,
  "routeTurnCount: number;\n  setRouteTurns: (count: number) => void;\n  showCollisionHitboxes: boolean;\n  setShowCollisionHitboxes: (show: boolean) => void;"
);

// Destructure
code = code.replace(
  /routeTurnCount,\n\s*setRouteTurns,/,
  "routeTurnCount,\n    setRouteTurns,\n    showCollisionHitboxes,\n    setShowCollisionHitboxes,"
);

// Add the checkbox to the UI
const toggleReplacement = `          <div className="rangeEnds">
            <span>Calmer</span>
            <span>More chaotic</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B3B3B3', marginTop: '16px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <input 
              type="checkbox" 
              checked={showCollisionHitboxes} 
              onChange={(e) => setShowCollisionHitboxes(e.target.checked)} 
              style={{ accentColor: '#4CAF50' }}
            />
            Show Collision Shapes
          </label>`;
code = code.replace(
  /          <div className="rangeEnds">\n            <span>Calmer<\/span>\n            <span>More chaotic<\/span>\n          <\/div>/,
  toggleReplacement
);

fs.writeFileSync(file, code);
console.log("Toggle added");
