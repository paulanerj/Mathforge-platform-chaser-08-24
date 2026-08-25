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

# makeRow replacement: replace from `function makeRow` to `return row;\n    }`
old_make_row, s, e = get_block(code, "function makeRow(index: number) {", "return row;\n    }")
if old_make_row:
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
        litAt: -1000,
      }));
      const row: any = {
        index,
        y,
        platforms,
        id: `row-${index}`,
        problemSnapshot: null,
        targetValue: 0,
        staggerOffset,
        alignName,
      };
      return row;
    }
"""
    code = code[:s] + new_make_row.strip("\n") + code[e:]
else:
    print("Failed to replace makeRow!")

# drawBackground replacement: replace from `function drawBackground` to `drawMidParallax();\n    }`
old_bg, s, e = get_block(code, "function drawBackground() {", "drawMidParallax();\n    }")
if old_bg:
    new_bg = """
    function drawBackground() {
      drawFarParallax();
      
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
      drawMidParallax();
    }
"""
    code = code[:s] + new_bg.strip("\n") + code[e:]
else:
    print("Failed to replace drawBackground!")

with open("src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts", "w") as f:
    f.write(code)

