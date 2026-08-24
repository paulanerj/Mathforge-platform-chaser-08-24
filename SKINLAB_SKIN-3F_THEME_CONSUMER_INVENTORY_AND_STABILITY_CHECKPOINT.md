# MATHFORGE SKINLAB — SKIN-3F THEME CONSUMER INVENTORY AND STABILITY CHECKPOINT

## 1. Current Live Theme Consumers
Searched for `useTheme(`. The only files consuming the theme are:
- `src/theme/useTheme.ts` (Provider hook)
- `src/components/UI/StartScreen.tsx`
- `src/components/Layout/SceneContainer.tsx`

**Consumed Tokens:**
- `theme.tokens.shell.scenes.sky.backgroundTop` (SceneContainer)
- `theme.tokens.shell.scenes.sky.backgroundBottom` (SceneContainer)
- `theme.tokens.startScreen.mainPanel.background` (StartScreen)
- `theme.tokens.startScreen.title.textShadow` (StartScreen)
- `theme.tokens.startScreen.splashCard.boxShadow` (StartScreen)

## 2. Current Token Inventory
| Token Path | Live Consumer? | Consumer File | Default Source | Notes |
| ---------- | -------------: | ------------- | -------------- | ----- |
| `shell.scenes.sky.backgroundTop` | YES | `SceneContainer.tsx` | `index.css` var | Fully migrated |
| `shell.scenes.sky.backgroundBottom` | YES | `SceneContainer.tsx` | `index.css` var | Fully migrated |
| `startScreen.mainPanel.background` | YES | `StartScreen.tsx` | `.start-bg` / `index.css` | Fully migrated |
| `startScreen.title.textShadow` | YES | `StartScreen.tsx` | `.mathforge-title` / `index.css` | Extracted from CSS rule |
| `startScreen.splashCard.boxShadow` | YES | `StartScreen.tsx` | `.splash-card` / `index.css` | Extracted from CSS rule |
| `feedbackStates.*` | NO | None | `index.css` vars | Scaffold-only placeholders |
| `panels`, `typography`, `controls` | NO | None | None | Empty generic scaffold buckets |
| `board`, `progressStatus`, `effects` | NO | None | None | Empty generic scaffold buckets |
| `modePresentation` | NO | None | None | Empty generic scaffold buckets |

## 3. CSS Ownership Inventory
- **`.mathforge-title`**: Partially theme-fed (`textShadow`), mostly CSS-owned (gradient, font sizing, weights, line-height). Safe for future migration of text fill gradient.
- **`.splash-card`**: Partially theme-fed (base idle `boxShadow`), mostly CSS-owned via classes (padding, borders, transitions) and Tailwind. Active pseudo-state (`transform`) is strictly CSS-managed.
- **`.splash-card:active`**: CSS-owned. Not safe to migrate inline due to interactive state complexity.
- **Scene CSS variables** (`--sa-scene-sunset-*`, `--sa-scene-night-*`, `--sa-scene-space-*`): Currently CSS-owned and safe to selectively migrate to `shell.scenes.*` paths.
- **Global UI Classes** (`.sa-card`, `.sa-btn`): Fully CSS-owned. Not safe to migrate yet due to extensive interactive and global impact across settings, help, and play menus.

## 4. Start Screen Migration Status
| Start Screen Surface | Current Owner | Theme-Fed? | Interaction Risk | Future Migration Recommendation |
| -------------------- | ------------- | ---------: | ---------------- | ------------------------------- |
| Root background | Theme / React | YES | Low | N/A (Migrated) |
| Title text shadow | Theme / React | YES | Low | N/A (Migrated) |
| Title gradient | CSS | NO | Low | Candidate for future passive migration |
| Title font sizing | CSS | NO | Medium | Defer (responsive calculations) |
| Title animation | Inline style | NO | Medium | Defer |
| Splash-card box shadow | Theme / React | YES | Low | N/A (Migrated) |
| Splash-card border radius | CSS | NO | Low | Candidate for future passive migration |
| Splash-card padding | CSS | NO | Medium | Defer (layout impact) |
| Splash-card active transform | CSS | NO | High | Do NOT migrate (must preserve interactive pseudo states) |
| Button colors / borders | Tailwind | NO | Medium | Defer (Wait for `controls` semantic structuring) |
| Button hover / active | Tailwind | NO | High | Do NOT migrate inline |

## 5. SceneContainer Migration Status
| Scene Surface | Current Owner | Theme-Fed? | Risk | Recommendation |
| ------------- | ------------- | ---------: | ---- | -------------- |
| SkyScene gradient | Theme / React | YES | Low | N/A (Migrated) |
| SkyScene clouds | Tailwind/CSS | NO | Medium | Defer (Animations involved) |
| SunsetScene gradient | CSS variables | NO | Low | Excellent candidate for next passive migration |
| SunsetScene cloud | CSS variables | NO | Medium | Defer |
| NightScene gradient | CSS variables | NO | Low | Excellent candidate for next passive migration |
| NightScene stars | CSS variables | NO | Medium | Defer |
| SpaceScene gradient | CSS variables | NO | Low | Excellent candidate for next passive migration |
| SpaceScene nebula | CSS variables | NO | Low | Candidate for next passive migration |
| activeScene switching | React State | NO | High | Defer |

## 6. Stability Verification
- **Build**: PASS
- **Lint**: PASS
- **Preview**: WORKING (App successfully loads and is not white)
- **Console**: CLEAN
- **Navigation/UX**: Start Screen loads seamlessly. Options / Instructor menus route successfully. Help Menu opens. Gameplay logic engages securely and safely without crash. Training Guides remain properly sealed. No new runtime errors introduced.

## 7. Recommended Next Phase
**Option B — Expand Scene Theme Tokens**
*Reasoning*: Migrating the passive gradients for Sunset, Night, and Space scenes (which currently still utilize CSS variables) into the `shell.scenes` token paths ensures progress expanding theme reach specifically against areas with absolute zero interaction/hover risk. This strengthens the shell presentation architecture before attempting further, riskier Start Screen element refactoring.
