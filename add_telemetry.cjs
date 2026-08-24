const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `
    function triggerCapture(t: number, px0: number, py0: number, px1: number, py1: number, bx0: number, by0: number, bx1: number, by1: number, delta: number) {
      if (!engineAlive) return;
      
      const r = CONFIG.playerRadius + CONFIG.botRadius;
      console.log('ENEMY_PLAYER_FIRST_TOUCH', {
        playerPrevious: { x: px0, y: py0 },
        playerIntended: { x: px1, y: py1 },
        enemyPrevious: { x: bx0, y: by0 },
        enemyIntended: { x: bx1, y: by1 },
        playerPhysicalRadius: CONFIG.playerRadius,
        enemyPhysicalRadius: CONFIG.botRadius,
        combinedRadius: r,
        startingCenterDistance: Math.hypot(px0 - bx0, py0 - by0),
        intendedEndingCenterDistance: Math.hypot(px1 - bx1, py1 - by1),
        timeOfImpact: t,
        playerState: travel ? travel.type : 'resting',
        enemyState: bot ? bot.mode : 'unknown',
        frameDelta: delta,
        detectionMethod: t === 0 ? 'static' : 'swept',
        movementClamped: t < 1
      });

      spawnBurst(player.x, player.y, COLORS.enemy, 60, 0.35);
      sound.wrong();
      endGame('Red timing spark caught you');
    }
`;

code = code.replace(
  /    function triggerCapture\(\) \{\s*if \(\!engineAlive\) return;\s*spawnBurst\(player\.x, player\.y, COLORS\.enemy, 60, 0\.35\);\s*sound\.wrong\(\);\s*endGame\('Red timing spark caught you'\);\s*\}/,
  replacement
);

code = code.replace(
  /triggerCapture\(\);/,
  "triggerCapture(t, player.x, player.y, pIntended.x, pIntended.y, bot.x, bot.y, bIntended.x, bIntended.y, delta);"
);

fs.writeFileSync(file, code);
console.log("Telemetry added");
