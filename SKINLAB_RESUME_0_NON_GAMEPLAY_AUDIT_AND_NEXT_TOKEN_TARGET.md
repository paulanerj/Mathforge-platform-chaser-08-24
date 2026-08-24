# SKINLAB-RESUME-0 — Non-Gameplay SkinLab Resume Audit + Next Token Target Selection

## 1. SkinLab File Inventory
- `themeTypes.ts`: Present
- `defaultTheme.ts`: Present
- `resolveTheme.ts`: Present
- `useTheme.ts`: Present
- `ThemeProvider.tsx`: Present
- `themeRegistry.ts`: Present
- `proofThemes.ts`: Present
- `resolveTheme.test.ts`: Present
- `themeRegistry.test.ts`: Present
- `ThemePreviewDevPanel.tsx`: Present

## 2. Current Theme Contract Inventory
- scene tokens: Present (sky, sunset, night, space gradients/clouds)
- start screen tokens: Present (mainPanel, title textShadow, splashCard boxShadow)
- pause overlay tokens: Present (backdrop, panel, titleColor)
- help menu tokens: Present (backdrop, panel, titleColor)
- options/settings menu tokens: Present (backdrop, panel, titleColor, bodyColor)
- proof theme tokens: Present (`crystalForgeProofTheme` in `proofThemes.ts`)
- registry tokens: Present (in `themeRegistry.ts`)
- partial theme resolution: Present (in `resolveTheme.ts`)
- dev-only preview harness: Present (`ThemePreviewDevPanel.tsx`)

## 3. Current Live Theme Consumers
| File | Theme Tokens Consumed | Gameplay Risk | Notes |
|---|---|---|---|
| `SceneContainer.tsx` | `theme.tokens.shell.scenes.*` (backgroundTop/Bottom, cloud fills) | NONE | Still utilizes remaining `var(--sa-scene-night-star*)` CSS vars for passive decorators. |
| `StartScreen.tsx` | `theme.tokens.startScreen.*` (background, textShadow, boxShadow) | NONE | Still utilizes hardcoded Tailwind backgrounds and borders. |
| `PauseOverlay.tsx` | `theme.tokens.panels.pause.*` (backdrop, background, borderColor, boxShadow, titleColor) | NONE | Safely consumes from `theme.tokens.panels`. |
| `HelpMenu.tsx` | `theme.tokens.panels.help.*` (backdrop, background, borderColor, boxShadow, titleColor) | NONE | Safely consumes from `theme.tokens.panels`. |
| `OptionsMenu.tsx` | `theme.tokens.panels.settings.*` (backdrop, background, borderColor, boxShadow, titleColor, bodyColor) | NONE | Safely consumes from `theme.tokens.panels`. |

## 4. Proof Theme / Dev Preview Status
- `crystalForgeProofTheme` exists
- proof theme registered
- proof theme inactive by default
- `ThemePreviewDevPanel` exists
- `ThemePreviewDevPanel` dev-only (enforced via `import.meta.env.DEV`)
- theme preview non-persistent (uses isolated local state/events in dev panel)

## 5. Protected Gameplay Boundary
Confirmed. The next SkinLab target must NOT touch:
- `AnswerGrid`
- `GameBoard`
- `GameHeader`
- `useGameLogic`
- `gameReducer`
- timing service
- sound hook
- answer validation
- fail-safe correction
- Dark Mode concealment
- visibility pause guard
- scoring / XP / lesson progression

## 6. Not-Yet-Implemented SkinLab Areas
- gameplay board skinning
- AnswerGrid skinning
- answer button skinning
- center prompt skinning
- gameplay controls skinning
- Fail-Safe visual tokenization
- Dark Mode concealment tokenization
- production theme switcher
- persistent theme selection
- asset/SVG skin packs
- user-facing theme selection
- animation/motion behavior system
- story/progress-driven presentation
- play-surface-specific skins

## 7. Next Token Target Recommendation

**Option C — SceneContainer remaining passive decoration token only**

**Reason:** `SceneContainer.tsx` actively consumes `theme.tokens.shell.scenes`, but its `NightScene` and `SpaceScene` decorators (`star1`, `star2`, `star3`, `nebula`) still rely on raw CSS variables (e.g., `var(--sa-scene-night-star1)`). Expanding the Theme Types interface to swallow this tiny leftover styling cleanly isolates the full Scene presentation into SkinLab without any cross-contamination. This is the smallest, safest possible step to ensure all environmental scene styles are cleanly extracted before migrating inward toward the core UI or gameplay layout components, minimizing any risk of layout or structural breaks.
