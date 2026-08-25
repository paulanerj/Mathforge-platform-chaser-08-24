import sys

def get_block(code, start_marker, end_marker):
    start = code.find(start_marker)
    if start == -1: return None, None, None
    end = code.find(end_marker, start)
    if end == -1: return None, None, None
    end += len(end_marker)
    return code[start:end], start, end

with open("src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts", "r") as f:
    code = f.read()

# 1. CONSTANTS
constants = """
    const LOGICAL_WIDTH = 768;
    const NAVIGATION_SAFETY_MARGIN = 8;
    const ROW_STAGGER_OFFSET = 64;
"""
code = code.replace("const CONFIG = {", constants + "\n    const CONFIG = {")

# 2. STATE VARS
old_vars, s, e = get_block(code, "let resolveAt = 0;", "let settingsWasPaused = false;")
new_vars = """
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
if old_vars: code = code[:s] + new_vars.strip() + code[e:]

# 3. MAKEROW
old_make_row, s, e = get_block(code, "function makeRow(index: number) {", "return { index, y, platforms, problemSnapshot: null, targetValue: 0 };\n    }")
new_make_row = """
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
if old_make_row: code = code[:s] + new_make_row.strip("\n") + code[e:]

# 4. RESIZE
old_resize, s, e = get_block(code, 'function resize() { console.log("resize CALLED!"', "if (!engineStarted || player.row === 0) cameraY = player.y - height * CONFIG.cameraAnchor;\n    }")
new_resize = """
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
      
      if (!engineStarted || player.row === 0) cameraY = player.y - worldHeight * CONFIG.cameraAnchor;
    }
"""
if old_resize: code = code[:s] + new_resize.strip("\n") + code[e:]

# 5. POINTER POSITION
old_pointer, s, e = get_block(code, "function pointerPosition(event: any) {", "return {\n        x: clientX - rect.left,\n        y: clientY - rect.top,\n      };\n    }")
new_pointer = """
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
if old_pointer: code = code[:s] + new_pointer.strip("\n") + code[e:]

# 6. RENDER
old_render, s, e = get_block(code, "function render() {", "drawForegroundParallax();\n    }")
new_render = """
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
        // drawGeometryOverlay();
      }

      ctx.restore();
    }
"""
if old_render: code = code[:s] + new_render.strip("\n") + code[e:]

# 7. DRAW BACKGROUND
old_bg, s, e = get_block(code, "function drawBackground() {", "drawTargetPresentation();\n    }")
new_bg = """
    function drawBackground() {
      if (showSumToCue && currentProblem) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.font = 'bold 240px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`SUM TO ${targetValue}`, LOGICAL_WIDTH / 2, worldHeight * 0.5);
        ctx.restore();
      }
      drawTargetPresentation();
    }
"""
if old_bg: code = code[:s] + new_bg.strip("\n") + code[e:]

# Other small replacements
code = code.replace("const cx = width / 2;", "const cx = LOGICAL_WIDTH / 2;")
code = code.replace("const desiredCamera = player.y - height * CONFIG.cameraAnchor;", "const desiredCamera = player.y - worldHeight * CONFIG.cameraAnchor;")

# 8. DESTINATION CORRIDORS
old_dest, s, e = get_block(code, "function destinationCorridors(row: any) {", "return corridors;\n    }")
new_dest = """
    function getInflatedObstacles(row: any) {
      const inflation = CONFIG.playerRadius + NAVIGATION_SAFETY_MARGIN;
      return row.platforms.map((platform: any) => ({
        left: platform.x - platform.width / 2 - inflation,
        right: platform.x + platform.width / 2 + inflation,
        top: platform.y - platform.height / 2 - inflation,
        bottom: platform.y + platform.height / 2 + inflation,
      }));
    }

    function destinationCorridors(row: any) {
      const obstacles = getInflatedObstacles(row)
        .sort((a: any, b: any) => a.left - b.left);
      
      const corridors: any[] = [];
      let cursor = 0; 
      
      obstacles.forEach((obs: any, index: number) => {
        if (obs.left - cursor >= 1) {
          corridors.push({
            id: index === 0 ? 'A' : (index === 1 ? 'B' : 'C'),
            left: cursor,
            right: obs.left,
            center: (cursor + obs.left) / 2,
          });
        }
        cursor = Math.max(cursor, obs.right);
      });
      
      if (LOGICAL_WIDTH - cursor >= 1) {
        corridors.push({
          id: 'D',
          left: cursor,
          right: LOGICAL_WIDTH,
          center: (cursor + LOGICAL_WIDTH) / 2,
        });
      }
      return corridors;
    }
"""
if old_dest: code = code[:s] + new_dest.strip("\n") + code[e:]

# 9. CHOOSE DESTINATION CORRIDOR
old_choose, s, e = get_block(code, "function chooseDestinationCorridor(row: any, targetX: number, startX: number) {", "return firstScore - secondScore;\n        })[0];\n    }")
new_choose = """
    function chooseDestinationCorridor(row: any, targetX: number, startX: number) {
      const corridors = destinationCorridors(row);
      if (!corridors.length) {
        console.warn('NO VALID CORRIDORS!');
        return { center: LOGICAL_WIDTH / 2 };
      }
      return corridors
        .slice()
        .sort((first, second) => {
          const firstScore =
            Math.abs(first.center - targetX) * 0.72 +
            Math.abs(first.center - startX) * 0.28;
          const secondScore =
            Math.abs(second.center - targetX) * 0.72 +
            Math.abs(second.center - startX) * 0.28;
          return firstScore - secondScore;
        })[0];
    }
"""
if old_choose: code = code[:s] + new_choose.strip("\n") + code[e:]

# 10. BUILD CIRCUIT PATH
old_circuit, s, e = get_block(code, "function buildCircuitPath(from: any, to: any, destinationPlatform: any = null) {", "edgeCorridor,\n      );\n    }")
new_circuit = """
    function buildCircuitPath(from: any, to: any, destinationPlatform: any = null) {
      const platform = destinationPlatform || rowAbove()?.platforms.find(
        (candidate) => candidate.x === to.x,
      );
      const destinationRow = platform ? getRow(platform.row) : rowAbove();

      if (!platform || !destinationRow) {
        return cleanCircuitPath([
          { x: from.x, y: from.y },
          { x: from.x, y: to.y - 24 },
          { x: to.x, y: to.y - 24 },
          { x: to.x, y: to.y },
        ]);
      }

      const corridors = destinationCorridors(destinationRow);
      const preferred = chooseDestinationCorridor(
        destinationRow,
        platform.x,
        from.x,
      );
      const orderedCorridors = [
        preferred,
        ...corridors.filter((corridor) => corridor !== preferred),
      ];

      for (const corridor of orderedCorridors) {
        const candidate = buildSteppedRoute(
          from,
          to,
          platform,
          corridor,
        );
        if (pathIsClear(candidate)) {
          return candidate;
        }
      }

      console.warn("No clear circuit path found to platform!");
      return buildSteppedRoute(
        from,
        to,
        platform,
        preferred,
      );
    }
"""
if old_circuit: code = code[:s] + new_circuit.strip("\n") + code[e:]

# Fix crossX in buildSteppedRoute
code = code.replace(
    """const destinationRow = getRow(destinationPlatform.row);

      const landingY = to.y;
      const apexY =""",
    """const destinationRow = getRow(destinationPlatform.row);

      const landingY = to.y;
      const crossX = corridor.center;
      const apexY ="""
)

# And crossingStartY
code = code.replace(
    """const crossingStartY =
        destinationRow.y +
        CONFIG.platformHeight +
        CONFIG.routePlatformPadding +
        9;""",
    """const crossingStartY =
        destinationRow.y +
        CONFIG.platformHeight +
        CONFIG.playerRadius + 
        NAVIGATION_SAFETY_MARGIN + 2;"""
)


with open("src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts", "w") as f:
    f.write(code)

print("Blocks replaced:")
print("vars", bool(old_vars))
print("makerow", bool(old_make_row))
print("resize", bool(old_resize))
print("pointer", bool(old_pointer))
print("render", bool(old_render))
print("bg", bool(old_bg))
print("dest", bool(old_dest))
print("choose", bool(old_choose))
print("circuit", bool(old_circuit))
