with open("src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts", "r") as f:
    code = f.read()

idx1 = code.find("function buildCircuitPath")
idx2 = code.find("function pathMetrics")
print(f"buildCircuitPath at {idx1}")
print(f"pathMetrics at {idx2}")
print(code[idx1:idx2])
