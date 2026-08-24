# MATHFORGE SKINLAB — SKIN-3O FREEZE
## Phase: Theme Contract Cleanup

### Objective
Refactor the theme type contract (naming and explicit scaffold boundaries) so it more accurately describes what the system now contains, without changing any visible appearance, behavior, or adding new theme consumers.

### Type Contract Cleanup Performed
- Renamed `MathForgeThemeColors` to `MathForgeThemeTokens` reflecting the broader usage of CSS values including textShadow and boxShadow.
- Created explicit token types for all currently tracked tokens:
  - `MathForgeSceneGradientTokens`
  - `MathForgeSkySceneTokens`
  - `MathForgeSunsetSceneTokens`
  - `MathForgeNightSceneTokens`
  - `MathForgeSpaceSceneTokens`
  - `MathForgeStartScreenMainPanelTokens`
  - `MathForgeStartScreenTitleTokens`
  - `MathForgeStartScreenSplashCardTokens`
  - `MathForgeStartScreenTokens`
- Marked loosely typed (generic `Record<string, string>`) attributes as scaffold-only components (via JSDoc).
- Maintained comment highlighting that concealed answer elements are not intended for theme representations.

### Source Files Inspected & Modified
- `src/theme/themeTypes.ts`: Modified to replace `MathForgeThemeColors` with `MathForgeThemeTokens`, added explicit structure types, and marked remaining generic `Record<string, string>` tokens as scaffold-only.
- `src/theme/defaultTheme.ts`: Inspected. Requires no modification, as it derives structurally from `DefaultMathForgeTheme`.
- `src/theme/resolveTheme.ts`: Inspected. Requires no modification, as it merges objects complying with `DefaultMathForgeTheme` and `PartialMathForgeTheme`.
- No other files were modified or needed modification. No live consumers were added or changed. Build passes, lint passes, and visuals remain identically unaffected.
