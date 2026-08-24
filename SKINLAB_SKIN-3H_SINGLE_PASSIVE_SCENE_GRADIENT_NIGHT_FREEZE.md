# MATHFORGE SKINLAB — SKIN-3H FREEZE
## Phase: Single Passive Scene Gradient Pilot — NightScene Only

### Objective
Migrate exactly one passive scene visual concern (`NightScene background gradient`) into the resolved theme system, following the pattern previously established for `SkyScene` and `SunsetScene`. No other scenes or interaction elements were modified. 

### Expected Output
The initial CSS configuration read values from `var(--sa-scene-night-top)` and `var(--sa-scene-night-bot)` via a Tailwind arbitrary value block (`from-[...] to-[...]`).

### Files Modified
- `src/theme/themeTypes.ts`: Added semantic theme keys `shell.scenes.night.backgroundTop` and `backgroundBottom` within `MathForgeThemeColors`.
- `src/theme/defaultTheme.ts`: Populated the properties with the baseline CSS variables (`var(--sa-scene-night-top)` and `var(--sa-scene-night-bot)`).
- `src/theme/resolveTheme.ts`: Ensured the resolution deeply merges the newly implemented `shell.scenes.night` path dynamically.
- `src/components/Layout/SceneContainer.tsx`: Replaced the hardcoded gradient class string with an inline style that injects the resolved theme tokens to control `NightScene`'s gradient visually.
