# MATHFORGE SKINLAB — SKIN-3L FREEZE
## Phase: Single Passive Scene Decoration Pilot — SkyScene Cloud 1 Fill Only

### Objective
Migrate exactly one passive scene decoration visual concern (`SkyScene first cloud fill`) into the resolved theme system, verifying stability with a second SVG fill migration while limiting scope to a single decorative element.

### Expected Output
The initial CSS configuration read the fill color from `var(--sa-scene-sky-cloud1)` inside an SVG inline `fill` attribute.

### Files Modified
- `src/theme/themeTypes.ts`: Added semantic theme key `shell.scenes.sky.cloud1Fill`.
- `src/theme/defaultTheme.ts`: Populated the property with the baseline CSS variable (`var(--sa-scene-sky-cloud1)`).
- `src/components/Layout/SceneContainer.tsx`: Replaced the hardcoded inline fill with `{sky.cloud1Fill}`.
- `src/theme/resolveTheme.ts` was not modified since its existing `...(partialTheme.tokens?.shell?.scenes?.sky || {})` generic merge naturally consumed the newly added property.
