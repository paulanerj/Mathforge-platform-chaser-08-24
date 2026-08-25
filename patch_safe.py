import re

with open("src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts", "r") as f:
    code = f.read()

# 1. Add top-level constants above CONFIG
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
code = re.sub(r'function makeRow\(index: number\) \{[\s\S]*?return \{ index, y, platforms.*?\};\s*\}', make_row.strip(), code)

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
code = re.sub(r'function resize\(\) \{[\s\S]*?if\s*\(travel\)[\s\S]*?\}\s*\}\s*\}', resize.strip(), code)

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
code = re.sub(r'function pointerPosition\(event: any\) \{[\s\S]*?return \{\s*x: clientX - rect\.left,\s*y: clientY - rect\.top,\s*\};\s*\}', pointer_position.strip(), code)

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
        // drawGeometryOverlay();
      }

      ctx.restore();
    }
"""
code = re.sub(r'function render\(\) \{\s*drawBackground\(\);\s*drawTraces\(\);\s*drawPlatforms\(\);\s*drawNextRowIndicator\(\);\s*drawParticles\(\);\s*drawPlayer\(\);\s*drawForegroundParallax\(\);\s*\}', render.strip(), code)

# In drawBackground(), remove clearRect, add sum to cue text
draw_background = """
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
code = re.sub(r'function drawBackground\(\) \{[\s\S]*?drawTargetPresentation\(\);\s*\}', draw_background.strip(), code)

# Update drawTargetPresentation CX
code = code.replace("const cx = width / 2;", "const cx = LOGICAL_WIDTH / 2;")

# Update desiredCamera to use worldHeight
code = code.replace("const desiredCamera = player.y - height * CONFIG.cameraAnchor;", "const desiredCamera = player.y - worldHeight * CONFIG.cameraAnchor;")

# Now rewrite destinationCorridors
destination_corridors = """
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
code = re.sub(r'function destinationCorridors\(row: any\) \{[\s\S]*?return corridors;\s*\}', destination_corridors.strip(), code)

# Update chooseDestinationCorridor
choose_dest = """
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
code = re.sub(r'function chooseDestinationCorridor\(row: any, targetX: number, startX: number\) \{[\s\S]*?return firstScore - secondScore;\s*\}\)\[0\];\s*\}', choose_dest.strip(), code)


build_circuit_path = """
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
code = re.sub(r'function buildCircuitPath\(from: any, to: any, destinationPlatform: any = null\) \{[\s\S]*?return buildSteppedRoute\([\s\S]*?edgeCorridor,[\s\S]*?\);\s*\}', build_circuit_path.strip(), code)

# Update buildSteppedRoute crossX logic
code = re.sub(r'const crossX =.*?;\n\s+const crossingStartY', r'const crossX = corridor.center;\n      const crossingStartY', code, flags=re.DOTALL)

with open("src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts", "w") as f:
    f.write(code)
