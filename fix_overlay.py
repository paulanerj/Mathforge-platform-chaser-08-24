import sys

with open("src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts", "r") as f:
    code = f.read()

overlay = """
    function drawGeometryOverlay() {
      ctx.save();
      
      // Draw corridors
      const row = getRow(player.row + 1) || getRow(player.row);
      if (row) {
        const corridors = destinationCorridors(row);
        corridors.forEach((corr: any) => {
          ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
          ctx.fillRect(corr.left, player.y - 200, corr.right - corr.left, 400);
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(corr.center, player.y - 200);
          ctx.lineTo(corr.center, player.y + 200);
          ctx.stroke();
          
          ctx.fillStyle = '#00FF00';
          ctx.font = '16px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(corr.id, corr.center, player.y - 100);
        });
        
        // Draw inflated obstacles
        const obstacles = getInflatedObstacles(row);
        obstacles.forEach((obs: any) => {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
          ctx.fillRect(obs.left, obs.top, obs.right - obs.left, obs.bottom - obs.top);
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 1;
          ctx.strokeRect(obs.left, obs.top, obs.right - obs.left, obs.bottom - obs.top);
        });
      }
      
      ctx.restore();
    }
"""

if "function drawGeometryOverlay" not in code:
    # insert before drawTargetPresentation
    idx = code.find("function drawTargetPresentation")
    code = code[:idx] + overlay + code[idx:]
    
    # uncomment call in render
    code = code.replace("// drawGeometryOverlay();", "drawGeometryOverlay();")

with open("src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts", "w") as f:
    f.write(code)

