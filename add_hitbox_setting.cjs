const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

// Add state
code = code.replace(
  /const \[routeTurnCount, setRouteTurnCount\] = useState\(8\);/,
  "const [routeTurnCount, setRouteTurnCount] = useState(8);\n  const [showCollisionHitboxes, setShowCollisionHitboxes] = useState(false);"
);

// Add to returned object
code = code.replace(
  /routeTurnCount,\n\s*setRouteTurns: setRouteTurnCount,/,
  "routeTurnCount,\n    setRouteTurns: setRouteTurnCount,\n    showCollisionHitboxes,\n    setShowCollisionHitboxes,"
);

// Modify drawPlayer and drawBot to draw hitboxes if enabled
const drawPlayerReplacement = `    function drawPlayer() {
      // draw hitbox if enabled
      if (showCollisionHitboxes) {
         ctx.save();
         ctx.strokeStyle = '#00FF00';
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.arc(player.x, worldToScreenY(player.y), CONFIG.playerRadius, 0, Math.PI * 2);
         ctx.stroke();
         ctx.restore();
      }
`;
code = code.replace("    function drawPlayer() {", drawPlayerReplacement);

const drawBotReplacement = `    function drawBot() {
      if (!bot) return;

      if (showCollisionHitboxes) {
         ctx.save();
         ctx.strokeStyle = '#FF00FF';
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.arc(bot.x, worldToScreenY(bot.y), CONFIG.botRadius, 0, Math.PI * 2);
         ctx.stroke();
         ctx.restore();
      }
`;
code = code.replace("    function drawBot() {\n      if (!bot) return;", drawBotReplacement);

fs.writeFileSync(file, code);
console.log("Hitbox settings added");
