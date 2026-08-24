# MATHFORGE SKINLAB — SKIN-3G FREEZE
## Phase: Single Passive Scene Gradient Pilot — SunsetScene Only

### Objective
Migrate exactly one passive scene visual concern (`SunsetScene background gradient`) into the resolved theme system, following the pattern previously established for `SkyScene`. No other scenes or interaction elements were modified. 

### Expected Output
The initial CSS configuration read values from `var(--sa-scene-sunset-top)` and `var(--sa-scene-sunset-bot)` via a Tailwind arbitrary value block (`from-[...] to-[...]`).

### Files Modified
- `src/theme/themeTypes.ts`: Added semantic theme keys `shell.scenes.sunset.backgroundTop` and `backgroundBottom` within `MathForgeThemeColors`.
- `src/theme/defaultTheme.ts`: Populated the properties with the baseline CSS variables (`var(--sa-scene-sunset-top)` and `var(--sa-scene-sunset-bot)`).
- `src/theme/resolveTheme.ts`: Ensured the resolution deeply merges the newly implemented `shell.scenes.sunset` path dynamically, mirroring the sky scene structural map.
- `src/components/Layout/SceneContainer.tsx`: Replaced the hardcoded gradient class string with an inline style that injects the resolved theme tokens to control `SunsetScene`'s gradient visually.
