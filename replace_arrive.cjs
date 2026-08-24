const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

const startStr = "    function arrive(currentTravel: any) {";
const endStr = "    function updateTravel(delta: number) {";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find bounds");
  process.exit(1);
}

const replacement = `    function arrive(currentTravel: any) {
      const platform = currentTravel.platform;
      const destination = landingPoint(platform);
      player.x = destination.x;
      player.y = destination.y;

      if (currentTravel.correct) {
        platform.powered = true;
        platform.litAt = elapsed;
        platform.selected = false;

        if (currentTravel.type === 'circuit') {
          traces.push({
            points: currentTravel.points.map((point: any) => ({ ...point })),
            born: elapsed,
          });
        }

        player.row += 1;
        player.platform = platform;
        player.pulseAt = elapsed;
        engineBestRow = Math.max(engineBestRow, player.row);
        setBestRow(engineBestRow);
        try {
          window.localStorage.setItem('circuitClimbPrototypeBest', String(engineBestRow));
        } catch {
          // Safe fallback
        }
        
        travel = null;
        resolveAt = 0; // Clear resolve block to allow immediate input

        ensureRows();
        const nextActiveRow = getRow(player.row + 1);
        if (nextActiveRow) {
          player.value = nextActiveRow.incomingPlayerValue;
        } else {
          const target = targetFor(player.row + 1);
          player.value = randomPlayerValue(target);
        }

        if (playerNumberPresentation.pendingValue !== null) {
          playerNumberPresentation.displayedValue = playerNumberPresentation.pendingValue;
          playerNumberPresentation.pendingValue = null;
        } else {
          playerNumberPresentation.displayedValue = player.value;
        }
        
        // Immediately visible on exact landing frame
        playerNumberPresentation.phase = 'visible';
        playerNumberPresentation.phaseStartedAt = elapsed;

        armNextRow();
        updateHud();

        spawnBurst(player.x, player.y, COLORS.lime, 30, 0.22);
        sound.correct();
        return;
      }

      platform.dead = true;
      platform.selected = false;
      timerLineY -= CONFIG.wrongPenalty;
      if (bot) bot.lastRepath = -1e9;
      spawnBurst(player.x, player.y, COLORS.red, 32, 0.25);
      sound.wrong();
      setMessage('Short circuit. The red timing spark gained ground.', 'error', 1300);

      const back = landingPoint(player.platform);
      travel = {
        type: 'return',
        from: { x: destination.x, y: destination.y },
        to: back,
        time: 0,
        duration: CONFIG.returnDuration,
      };
    }

    function finishCorrectResolution() {
      // Logic moved directly into arrive() for instantaneous landing frame display
    }

`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync(file, code);
console.log("Replaced arrive successfully");
