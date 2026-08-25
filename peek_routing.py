with open("src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts") as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    if "function buildCircuitPath" in l:
        for j in range(i, i+150):
            print(lines[j].rstrip())
        break
