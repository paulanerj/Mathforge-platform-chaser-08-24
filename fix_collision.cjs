const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove contactFuseMs logic from updateBot
code = code.replace(
  /\s*distance = Math\.hypot\(player\.x - bot\.x, player\.y - bot\.y\);\s*if \(distance < CONFIG\.contactRadius\) {[\s\S]*?} else {\s*bot\.contactTime = 0;\s*}/,
  ''
);

// 2. Add swept collision check in update()
const startStr = "    function update(delta: number) {";
const endStr = "      const targetAge = elapsed - targetPresentation.phaseStartedAt;";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);
if (startIndex === -1 || endIndex === -1) { console.log("bounds not found"); process.exit(1); }

let replacement = `    function getIntendedPlayer(delta: number) {
      if (!travel) return { x: player.x, y: player.y };
      if (travel.type === 'circuit') {
        const nextDistance = travel.distance + CONFIG.routeSpeed * delta;
        if (nextDistance >= travel.total) {
           const dest = landingPoint(travel.platform);
           return { x: dest.x, y: dest.y };
        }
        return pointOnPath({ ...travel, distance: nextDistance });
      }
      if (travel.type === 'hop') {
        const nextTime = travel.time + delta;
        const amount = clamp(nextTime / travel.duration, 0, 1);
        return {
          x: lerp(travel.from.x, travel.to.x, amount),
          y: lerp(travel.from.y, travel.to.y, amount) - Math.sin(amount * Math.PI) * CONFIG.hopHeight
        };
      }
      if (travel.type === 'return') {
        const nextTime = travel.time + delta;
        const amount = clamp(nextTime / travel.duration, 0, 1);
        return {
          x: lerp(travel.from.x, travel.to.x, amount),
          y: lerp(travel.from.y, travel.to.y, amount) - Math.sin(amount * Math.PI) * 72
        };
      }
      return { x: player.x, y: player.y };
    }

    function getIntendedBot(delta: number) {
      if (!bot || (bot.mode !== 'locked' && bot.mode !== 'patrol') || !bot.travel) {
        return { x: bot ? bot.x : 0, y: bot ? bot.y : 0 };
      }
      const speed = bot.mode === 'locked' ? CONFIG.botLockSpeed : CONFIG.botPatrolSpeed;
      const nextDistance = bot.travel.distance + speed * delta;
      if (nextDistance >= bot.travel.total) {
        return pointOnPath({ ...bot.travel, distance: bot.travel.total });
      }
      return pointOnPath({ ...bot.travel, distance: nextDistance });
    }

    function sweptCollision(px0: number, py0: number, px1: number, py1: number, bx0: number, by0: number, bx1: number, by1: number, r: number) {
        const vx = (bx1 - bx0) - (px1 - px0);
        const vy = (by1 - by0) - (py1 - py0);
        const sx = bx0 - px0;
        const sy = by0 - py0;
        
        const a = vx*vx + vy*vy;
        const b = 2 * (sx*vx + sy*vy);
        const c = sx*sx + sy*sy - r*r;
        
        if (c <= 0) return 0; // already intersecting
        if (a === 0) return -1; // no relative movement
        
        const disc = b*b - 4*a*c;
        if (disc < 0) return -1;
        
        const t = (-b - Math.sqrt(disc)) / (2*a);
        if (t >= 0 && t <= 1) return t;
        return -1;
    }

    function triggerCapture() {
      if (!engineAlive) return;
      spawnBurst(player.x, player.y, COLORS.enemy, 60, 0.35);
      sound.wrong();
      endGame('Red timing spark caught you');
    }

    function update(delta: number) {
      elapsed += delta;
      if (messageTimer && elapsed >= messageTimer) {
        messageTimer = 0;
        if (!resolveAt) setMessage('Tap the platform that completes the equation.');
      }

      if (bot && engineAlive) {
        // Pre-check for existing static contact or sweeping contact
        const r = CONFIG.playerRadius + CONFIG.botRadius;
        
        const pIntended = getIntendedPlayer(delta);
        const bIntended = getIntendedBot(delta);
        
        const t = sweptCollision(player.x, player.y, pIntended.x, pIntended.y, bot.x, bot.y, bIntended.x, bIntended.y, r);
        
        if (t >= 0 && t <= 1) {
          // Collision happened at fraction t of the frame.
          // Advance simulation only up to time of impact.
          const impactDelta = delta * t;
          updateTravel(impactDelta);
          updateBot(impactDelta);
          triggerCapture();
          return;
        }
      }

      if (playerNumberPresentation.phase === 'clearing') {
        if (elapsed - playerNumberPresentation.phaseStartedAt >= 110) {
          playerNumberPresentation.phase = 'hidden-transit';
          playerNumberPresentation.phaseStartedAt += 110;
        }
      }

`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync(file, code);
console.log("collision logic replaced");
