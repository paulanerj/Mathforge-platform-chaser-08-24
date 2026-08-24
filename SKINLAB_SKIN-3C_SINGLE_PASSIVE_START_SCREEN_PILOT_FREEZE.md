# MATHFORGE SKINLAB — SKIN-3C FREEZE
## Phase: Single Passive Start Screen Pilot

### Objective Achieved
Proved that one passive Start Screen visual surface (the top-level panel background) can consume resolved theme values while preserving the existing default appearance. Only that single passive surface was migrated. Interaction handlers, geometry, mode selection, and layout remain unchanged.

### Selected Start Screen Surface
The main Start Screen absolute container background pattern (`.start-bg` gradient).

### Modified the following files
- `src/theme/themeTypes.ts`: Added semantic theme keys `startScreen.mainPanel.background` within `MathForgeThemeColors`.
- `src/theme/defaultTheme.ts`: Populated the `startScreen.mainPanel.background` property with the literal CSS value previously used in the `.start-bg` Tailwind class (`radial-gradient(circle at center, rgba(37,99,235,0.08), transparent 60%), #f8fafc`).
- `src/theme/resolveTheme.ts`: Ensured the resolution deeply merges the narrow `startScreen` values alongside `shell`.
- `src/components/UI/StartScreen.tsx`: Imported `useTheme` and applied the inline style using `theme.tokens.startScreen.mainPanel.background`, replacing the hardcoded `start-bg` class on the outermost `div`.

### Constraints Verified
- No CSS stylesheet changes have been made to `src/index.css`.
- `.start-bg` was removed from the element, replaced perfectly by identical theme data.
- Buttons, gameplay logic, modes, HelpMenu, CenterCoin, constraints and other features are completely untouched.
- Default visual parity is strictly preserved.
