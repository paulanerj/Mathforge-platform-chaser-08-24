sed -i 's/console.log("BAILING OUT!", {canvas: !!canvas, app: !!app});/console.log("SUCCESS!", {canvas: !!canvas, app: !!app});/g' src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts
sed -i 's/function resize() {/function resize() { console.log("resize CALLED!", {app: !!app, rect: app?.getBoundingClientRect()});/g' src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts
