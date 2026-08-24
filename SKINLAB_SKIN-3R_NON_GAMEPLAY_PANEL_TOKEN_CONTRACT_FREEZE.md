# MATHFORGE SKINLAB — SKIN-3R FREEZE

## Phase: Non-Gameplay Panel Token Contract Expansion

### Objective
Replace generic panel scaffold typing with explicit non-gameplay panel token contracts, while preserving current visuals and avoiding live component migration.

### Files Inspected
- `src/components/UI/Help/HelpMenu.tsx`
- `src/components/UI/Settings/OptionsMenu.tsx`
- `src/components/UI/PauseOverlay.tsx`

### Files Modified
- `src/theme/themeTypes.ts`
- `src/theme/defaultTheme.ts`
- `src/theme/resolveTheme.ts`
- `src/theme/resolveTheme.test.ts`

### Token Contract Changes
Replaced generic `panels: Record<string, string>;` with `panels: MathForgeNonGameplayPanelTokens;` which provides the following robust structural types:
- `MathForgePanelSurfaceTokens` (background, borderColor, boxShadow, backdrop)
- `MathForgeOverlayPanelTokens` (backdrop, panel, titleColor, bodyColor)
- `MathForgeNonGameplayPanelTokens` consisting of explicit categories (`base`, `modal`, `help`, `settings`, `pause`).

### Default Theme Updates
Added explicit default styling properties mapping to the newly exposed `panels` contract branches in `defaultTheme.ts`. Defaults were mapped safely and conservatively to existing CSS variables (`var(--sa-ui-bg)`, `var(--sa-ui-border)`, `var(--color-overlay-scrim)`) or hardcoded values matching current components to preserve current visual appearances exactly.

### Resolve Theme Updates
Implemented detailed recursive deep merge behavior in `resolveTheme.ts` for the `panels` object to preserve individual partial overrides correctly without blowing away sibling properties or entire categorical structures (e.g., correctly merging `panels.help.panel` while maintaining `panels.settings`).

### Test Updates
- Added: `1. default resolved theme includes complete panel tokens`
- Added: `2. partial panel override preserves sibling fields`
- Added: `3. partial modal backdrop override preserves nested panel`
- Passed correctly without impacting StartScreen tests, mutation tests or hidden-answer concealment logic proofs.

### Live Consumer Status
No new live UI panel consumers were added in this phase. The tokens await the formalized layout/migration components. Only type/default/resolve/test usage.

### Protected Systems
Untouched. (No changes applied to AnswerGrid, GameBoard, CenterCoin, reducers, useGameLogic, HelpMenu, tutorials, sound/music, CSS, deployment config, or visual assets.)

### Visual Behavior
Default visual appearance intentionally changed: NONE.

### Build/Test Result
- `npx vitest run src/theme/resolveTheme.test.ts`: PASS (10 tests passed)
- `npm run lint` (tsc --noEmit): PASS
- `npm run build`: PASS

### Ready For PM Review
YES.
