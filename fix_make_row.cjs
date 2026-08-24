const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

const startStr = "    function makeRow(index: number) {";
const endStr = "    function ensureRows() {";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);
if (startIndex === -1 || endIndex === -1) { console.log("bounds not found"); process.exit(1); }

let replacement = `    function makeRow(index: number) {
      const y = -index * CONFIG.rowGap;
      const platforms = CONFIG.columns.map((fraction, column) => ({
        row: index,
        column,
        x: fraction * width,
        y,
        width: Math.min(CONFIG.platformWidth, width * 0.30),
        height: CONFIG.platformHeight,
        value: null as number | null,
        correct: false,
        dead: false,
        powered: false,
        selected: false,
        litAt: -1000,
      }));

      const row: any = {
        index,
        y,
        platforms,
        id: \`row-\${index}\`,
        disabledOptionIndexes: [] as number[],
        status: 'future' as 'buffer' | 'future' | 'active' | 'resolved-correct' | 'resolved-wrong' | 'passed',
      };

      if (index >= 1) {
        const targetValue = targetFor(index);
        row.targetValue = targetValue;
        row.targetEventId = targetBandFor(index);

        // Link with previous row
        let incomingPlayerValue = 0;
        if (index === 1) {
          incomingPlayerValue = randomPlayerValue(targetValue);
        } else {
          const prev = rows[index - 1];
          if (prev && prev.resultingPlayerValue !== undefined) {
            incomingPlayerValue = prev.resultingPlayerValue;
          } else {
            incomingPlayerValue = randomPlayerValue(targetValue);
          }
        }
        
        // Safeguard impossible combinations
        if (incomingPlayerValue >= targetValue) {
           incomingPlayerValue = randomPlayerValue(targetValue);
        }
        
        row.incomingPlayerValue = incomingPlayerValue;
        const resultingPlayerValue = randomPlayerValue(targetFor(index + 1));
        row.resultingPlayerValue = resultingPlayerValue;

        const needed = targetValue - incomingPlayerValue;
        row.correctPlatformValue = needed;
        const values = [needed];
        while (values.length < 3) {
          let candidate = needed + (Math.random() < 0.5 ? -1 : 1) * randomInt(1, 3);
          if (candidate < 1) candidate = needed + randomInt(1, 3);
          if (candidate > targetValue + 2) candidate = Math.max(1, needed - randomInt(1, 3));
          if (!values.includes(candidate)) values.push(candidate);
        }
        shuffle(values);
        row.options = [...values];
        
        row.platforms.forEach((platform: any, colIdx: number) => {
          platform.value = values[colIdx];
          platform.correct = platform.value === needed;
        });
        row.correctOptionIndex = row.platforms.findIndex((p: any) => p.correct);
      }
      return row;
    }

`;
code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync(file, code);
console.log("makeRow replaced");
