const fs = require('fs');
const file = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let code = fs.readFileSync(file, 'utf8');

const startStr = "    function drawTrace(points: any[], alpha = 1, color = COLORS.lime) {";
const endStr = "    function drawPlatform(platform: any, activeRow: number) {";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find bounds");
  process.exit(1);
}

const replacement = `    function drawTrace(points: any[], alpha = 1, color = '#007BFF') {
      if (!points || points.length < 2) return;
      ctx.save();
      ctx.translate(0, -cameraY);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.globalAlpha = alpha;
      
      // Outline
      ctx.strokeStyle = '#0E1B33';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();

      // Inner fill
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();

      ctx.restore();
    }

    function drawTraces() {
      traces.forEach((trace) => {
        const age = elapsed - trace.born;
        const alpha = clamp(age / 240, 0.32, 0.88);
        drawTrace(trace.points, alpha, '#007BFF');
      });

      if (travel && travel.type === 'circuit') {
        const current = pointOnPath(travel);
        const partial = [];
        let remaining = travel.distance;
        partial.push({ ...travel.points[0] });
        for (let i = 0; i < travel.lengths.length; i += 1) {
          const length = travel.lengths[i];
          if (remaining >= length) {
            partial.push({ ...travel.points[i + 1] });
            remaining -= length;
          } else {
            partial.push({ x: current.x, y: current.y });
            break;
          }
        }
        drawTrace(partial, 1, '#007BFF');
      }
    }

`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync(file, code);
console.log("Replaced successfully");
