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

old_make_row, s, e = get_block(code, "function makeRow(index: number) {", "return { index, y, platforms, problemSnapshot: null, targetValue: 0 };\n    }")
if not old_make_row:
    # Maybe it ends differently? Let's check how it ends.
    start = code.find("function makeRow(index: number) {")
    if start != -1:
        end = code.find("}", start) + 1
        print("Found makeRow, it looks like:")
        print(code[start:end+100])

old_bg, s, e = get_block(code, "function drawBackground() {", "drawTargetPresentation();\n    }")
if not old_bg:
    start = code.find("function drawBackground() {")
    if start != -1:
        end = code.find("}", start) + 1
        print("Found bg, it looks like:")
        print(code[start:end+100])

