# MATHFORGE SKINLAB — SKIN-3I FREEZE
## Phase: Single Passive Scene Gradient Pilot — SpaceScene Only

### Objective
Migrate exactly one passive scene visual concern (`SpaceScene background gradient`) into the resolved theme system, following the pattern previously established for `SkyScene`, `SunsetScene`, and `NightScene`. No other scenes, stars, nebulae, or interaction elements were modified. 

### Expected Output
The initial CSS configuration read values from `var(--sa-scene-space-top)` and `var(--sa-scene-space-bot)` via a Tailwind arbitrary value block (`from-[...] to-[...]`).

### Files Modified
- `src/theme/themeTypes.ts`: Added semantic theme keys `shell.scenes.space.backgroundTop` and `backgroundBottom` within `MathForgeThemeColors`.
- `src/theme/defaultTheme.ts`: Populated the properties with the baseline CSS variables (`var(--sa-scene-space-top)` and `var(--sa-scene-space-bot)`).
- `src/theme/resolveTheme.ts`: Ensured the resolution deeply merges the newly implemented `shell.scenes.space` path dynamically.
- `src/components/Layout/SceneContainer.tsx`: Replaced the hardcoded gradient class string with an inline style that injects the resolved theme tokens to control `SpaceScene`'s gradient visually.
