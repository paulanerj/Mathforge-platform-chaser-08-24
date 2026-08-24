# MATHFORGE SKINLAB — SKIN-3K FREEZE
## Phase: Single Passive Scene Decoration Pilot — SunsetScene Cloud Fill Only

### Objective
Migrate exactly one passive scene decoration visual concern (`SunsetScene cloud fill`) into the resolved theme system, establishing a structurally typed pattern for managing vector asset "fills" and decoration variables within the theme boundary before dealing with structurally complex layout gradients.

### Expected Output
The initial CSS configuration read the fill color from `var(--sa-scene-sunset-cloud)` inside an SVG inline `fill` attribute.

### Files Modified
- `src/theme/themeTypes.ts`: Added semantic theme key `shell.scenes.sunset.cloudFill`.
- `src/theme/defaultTheme.ts`: Populated the property with the baseline CSS variable (`var(--sa-scene-sunset-cloud)`).
- `src/components/Layout/SceneContainer.tsx`: Replaced the hardcoded inline fill with `{sunset.cloudFill}`.
- `src/theme/resolveTheme.ts` was not modified since its existing `...(partialTheme.tokens?.shell?.scenes?.sunset || {})` generic merge naturally consumed the newly added property. 
