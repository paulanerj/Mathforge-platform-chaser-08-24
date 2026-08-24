const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

// Update PlayerNumberPhase
content = content.replace(
  /type PlayerNumberPhase =\n\s*\| 'visible'\n\s*\| 'clearing'\n\s*\| 'hidden-transit'\n\s*\| 'landing-settle'\n\s*\| 'revealing';/,
  "type PlayerNumberPhase = 'visible' | 'clearing' | 'hidden-transit' | 'landing-reveal';"
);

// Update finishCorrectResolution
content = content.replace(
  /      if \(playerNumberPresentation\.pendingValue !== null\) \{\n        playerNumberPresentation\.displayedValue = playerNumberPresentation\.pendingValue;\n        playerNumberPresentation\.pendingValue = null;\n      \} else \{\n        playerNumberPresentation\.displayedValue = player\.value;\n      \}\n      playerNumberPresentation\.phase = 'landing-settle';\n      playerNumberPresentation\.phaseStartedAt = elapsed;/,
  `      if (playerNumberPresentation.pendingValue !== null) {
        playerNumberPresentation.displayedValue = playerNumberPresentation.pendingValue;
        playerNumberPresentation.pendingValue = null;
      } else {
        playerNumberPresentation.displayedValue = player.value;
      }
      playerNumberPresentation.phase = 'landing-reveal';
      playerNumberPresentation.phaseStartedAt = elapsed;`
);

// Update update() phases
content = content.replace(
  /      \} else if \(playerNumberPresentation\.phase === 'landing-settle'\) \{\n        if \(elapsed - playerNumberPresentation\.phaseStartedAt >= 70\) \{\n          playerNumberPresentation\.phase = 'revealing';\n          playerNumberPresentation\.phaseStartedAt \+= 70;\n        \}\n      \} else if \(playerNumberPresentation\.phase === 'revealing'\) \{\n        if \(elapsed - playerNumberPresentation\.phaseStartedAt >= 150\) \{\n          playerNumberPresentation\.phase = 'visible';\n          playerNumberPresentation\.phaseStartedAt \+= 150;\n        \}\n      \}/,
  `      } else if (playerNumberPresentation.phase === 'landing-reveal') {
        if (elapsed - playerNumberPresentation.phaseStartedAt >= 120) {
          playerNumberPresentation.phase = 'visible';
          playerNumberPresentation.phaseStartedAt += 120;
        }
      }`
);

// Update drawPlayer phases
content = content.replace(
  /        if \(playerNumberPresentation\.phase === 'clearing'\) \{\n          const progress = clamp\(phaseElapsed \/ 110, 0, 1\);\n          opacity = 1 - progress;\n          scale = 1 - progress \* 0\.12;\n        \} else if \(playerNumberPresentation\.phase === 'landing-settle'\) \{\n          opacity = 0;\n        \} else if \(playerNumberPresentation\.phase === 'revealing'\) \{\n          const progress = clamp\(phaseElapsed \/ 150, 0, 1\);\n          opacity = progress;\n          scale = 0\.88 \+ progress \* 0\.12;\n        \}/,
  `        if (playerNumberPresentation.phase === 'clearing') {
          const progress = clamp(phaseElapsed / 110, 0, 1);
          opacity = 1 - progress;
          scale = 1 - progress * 0.12;
        } else if (playerNumberPresentation.phase === 'landing-reveal') {
          const progress = clamp(phaseElapsed / 120, 0, 1);
          opacity = 0.8 + progress * 0.2;
          scale = 0.9 + progress * 0.1;
        }`
);

fs.writeFileSync(path, content);
