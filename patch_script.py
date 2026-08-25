import re

with open("src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts", "r") as f:
    code = f.read()

# 1. Add top-level constants
constants = """
const LOGICAL_WIDTH = 768;
const NAVIGATION_SAFETY_MARGIN = 8;
const ROW_STAGGER_OFFSET = 64;
"""
code = code.replace("const CONFIG = {", constants + "\n    const CONFIG = {")

# 2. Add local state variables
state_vars = """
    let resolveAt = 0;
    let cameraY = 0;
    let timerLineY = 0;
    let timerSpeed = CONFIG.timerBaseSpeed;
    let engineBestRow = 0;
    let viewScalePercentInternal = 100;
    let routeTurnCountInternal = 8;
    let settingsWasPaused = false;
    
    let worldScale = 1;
    let worldOffsetX = 0;
    let worldHeight = 0;
"""
code = re.sub(r'let resolveAt = 0;\s+let cameraY = 0;[\s\S]*?let settingsWasPaused = false;', state_vars.strip(), code)

# 3. Update makeRow
make_row = """
    function makeRow(index: number) {
      const y = -index * CONFIG.rowGap;
      const alignType = index % 3;
      let staggerOffset = 0;
      let alignName = 'CENTERED';
      if (alignType === 1) { staggerOffset = -ROW_STAGGER_OFFSET; alignName = 'LEFT_SHIFTED'; }
      if (alignType === 2) { staggerOffset = ROW_STAGGER_OFFSET; alignName = 'RIGHT_SHIFTED'; }

      const platforms = CONFIG.columns.map((fraction, column) => ({
        row: index,
        column,
        x: fraction * LOGICAL_WIDTH + staggerOffset,
        y,
        width: CONFIG.platformWidth,
        height: CONFIG.platformHeight,
        value: null as number | null,
        correct: false,
        dead: false,
        powered: false,
        selected: false,
      }));
      return { index, y, platforms, problemSnapshot: null, targetValue: 0, alignName, staggerOffset };
    }
"""
code = re.sub(r'function makeRow\(index: number\)\s*\{[\s\S]*?return \{ index, y, platforms.*?\};\s*\}', make_row.strip(), code)

# 4. Update resize
resize = """
    function resize() {
      const rect = app.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      worldScale = Math.min(1, width / LOGICAL_WIDTH);
      const worldDisplayWidth = LOGICAL_WIDTH * worldScale;
      worldOffsetX = (width - worldDisplayWidth) / 2;
      worldHeight = height / worldScale;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (rows.length > 0) {
        rows.forEach((row) => {
          row.platforms.forEach((platform: any) => {
            platform.x = CONFIG.columns[platform.column] * LOGICAL_WIDTH + row.staggerOffset;
            platform.width = CONFIG.platformWidth;
          });
        });
      }
    }
"""
code = re.sub(r'function resize\(\)\s*\{[\s\S]*?if\s*\(travel\)[\s\S]*?\}\s*\}\s*\}', resize.strip(), code)

# 5. Update pointerPosition
pointer_position = """
    function pointerPosition(event: any) {
      const rect = canvas.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      const displayX = clientX - rect.left;
      const displayY = clientY - rect.top;
      return {
        x: (displayX - worldOffsetX) / worldScale,
        y: displayY / worldScale,
      };
    }
"""
code = re.sub(r'function pointerPosition\(event: any\)\s*\{[\s\S]*?return\s*\{\s*x: clientX - rect\.left,\s*y: clientY - rect\.top,\s*\};\s*\}', pointer_position.strip(), code)

# 6. Update render
render = """
    function render() {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      ctx.save();
      ctx.translate(worldOffsetX, 0);
      ctx.scale(worldScale, worldScale);

      drawBackground();
      drawTraces();
      drawPlatforms();
      drawNextRowIndicator();
      drawParticles();
      drawPlayer();
      drawForegroundParallax();
      
      if (showCollisionHitboxes) {
        drawGeometryOverlay();
      }

      ctx.restore();
    }
"""
code = re.sub(r'function render\(\)\s*\{[\s\S]*?drawForegroundParallax\(\);\s*\}', render.strip(), code)

with open("src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts", "w") as f:
    f.write(code)
