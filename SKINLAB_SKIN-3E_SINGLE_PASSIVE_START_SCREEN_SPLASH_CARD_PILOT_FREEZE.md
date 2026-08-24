# MATHFORGE SKINLAB — SKIN-3E FREEZE
## Phase: Single Passive Start Screen Splash Card Surface Pilot

### Objective
Migrate exactly one passive splash-card shared visual concern (the Start Screen card `boxShadow`) into the resolved theme system while preserving the existing default appearance and the remainder of the `.splash-card` styling context.

### Expected Output
The initial PM phase review accepted `0 10px 30px rgba(0,0,0,0.08)` as the fallback derived from the `.splash-card` CSS rule. 

### Files Modified
- `src/theme/themeTypes.ts`: Added semantic theme keys `startScreen.splashCard.boxShadow` within `MathForgeThemeColors`.
- `src/theme/defaultTheme.ts`: Populated the `startScreen.splashCard.boxShadow` property with the literal CSS value extracted from `.splash-card`.
- `src/theme/resolveTheme.ts`: Ensured the resolution deeply merges the newly implemented `startScreen.splashCard.boxShadow` path dynamically.
- `src/components/UI/StartScreen.tsx`: Applied the structured value as an inline style to all `splash-card` elements on the Start Screen.
