# MATHFORGE SKINLAB — SKIN-3N SCENE DECORATION INVENTORY AND STABILITY CHECKPOINT

## 1. Current Live Theme Consumers
Searched for `useTheme(`. The exact files currently consuming the theme are:
- `src/theme/useTheme.ts` (Provider hook)
- `src/components/Layout/SceneContainer.tsx`
- `src/components/UI/StartScreen.tsx`

**Live visual consumers (Tokens):**
- `theme.tokens.shell.scenes.sky.backgroundTop`
- `theme.tokens.shell.scenes.sky.backgroundBottom`
- `theme.tokens.shell.scenes.sky.cloud1Fill`
- `theme.tokens.shell.scenes.sky.cloud2Fill`
- `theme.tokens.shell.scenes.sunset.backgroundTop`
- `theme.tokens.shell.scenes.sunset.backgroundBottom`
- `theme.tokens.shell.scenes.sunset.cloudFill`
- `theme.tokens.shell.scenes.night.backgroundTop`
- `theme.tokens.shell.scenes.night.backgroundBottom`
- `theme.tokens.shell.scenes.space.backgroundTop`
- `theme.tokens.shell.scenes.space.backgroundBottom`
- `theme.tokens.startScreen.mainPanel.background`
- `theme.tokens.startScreen.title.textShadow`
- `theme.tokens.startScreen.splashCard.boxShadow`

No unauthorized files are consuming theme values.

## 2. SceneContainer Ownership Inventory
| Scene Surface | Current Owner | Theme-Fed? | Risk | Recommendation |
| ------------- | ------------- | ---------: | ---- | -------------- |
| SkyScene gradient | Theme / React | YES | Low | N/A (Migrated) |
| SkyScene cloud 1 fill | Theme / React | YES | Low | N/A (Migrated) |
| SkyScene cloud 1 anim/opacity/pos/size/path | CSS / Tailwind | NO | High | Do NOT migrate |
| SkyScene cloud 2 fill | Theme / React | YES | Low | N/A (Migrated) |
| SkyScene cloud 2 anim/opacity/pos/size/path/shadow | CSS / Tailwind | NO | High | Do NOT migrate |
| SunsetScene gradient | Theme / React | YES | Low | N/A (Migrated) |
| SunsetScene cloud fill | Theme / React | YES | Low | N/A (Migrated) |
| SunsetScene cloud anim/opacity/pos/size/path | CSS / Tailwind | NO | High | Do NOT migrate |
| NightScene gradient | Theme / React | YES | Low | N/A (Migrated) |
| NightScene star colors | CSS / Tailwind | NO | Medium | Candidate for Decoration Pilot |
| NightScene star opacity/position/size/blur | CSS / Tailwind | NO | High | Do NOT migrate |
| SpaceScene gradient | Theme / React | YES | Low | N/A (Migrated) |
| SpaceScene star colors | CSS / Tailwind | NO | Medium | Defer |
| SpaceScene star shadows | CSS / Tailwind | NO | Medium | Defer |
| SpaceScene star opacity/position/size/blur | CSS / Tailwind | NO | High | Do NOT migrate |
| SpaceScene nebula color | CSS / Tailwind | NO | Medium | Defer |
| SpaceScene nebula opacity/position/size/blur | CSS / Tailwind | NO | High | Do NOT migrate |
| scene opacity transitions | Tailwind | NO | High | Do NOT migrate |
| activeScene switching | React State | NO | High | Do NOT migrate |
| child layout wrapper | Tailwind | NO | High | Do NOT migrate |

## 3. Start Screen Ownership Inventory
| Start Screen Surface | Current Owner | Theme-Fed? | Interaction Risk | Recommendation |
| -------------------- | ------------- | ---------: | ---------------- | -------------- |
| Root/background | Theme / React | YES | Low | N/A (Migrated) |
| Title text shadow | Theme / React | YES | Low | N/A (Migrated) |
| Title gradient | CSS | NO | Low | Passive Token Pilot Candidate |
| Title font sizing | CSS | NO | Medium | Defer |
| Title animation | Inline style | NO | Medium | Defer |
| Splash-card box shadow | Theme / React | YES | Low | N/A (Migrated) |
| Splash-card border radius | CSS | NO | Low | Passive Token Pilot Candidate |
| Splash-card padding | CSS | NO | Medium | Defer |
| Splash-card active transform | CSS pseudoclass| NO | High | Do NOT migrate |
| Resume Lesson colors | Tailwind | NO | Medium | Defer |
| Continue Training colors | Tailwind | NO | Medium | Defer |
| Free Practice colors | Tailwind | NO | Medium | Defer |
| Instructor Portal colors | Tailwind | NO | Medium | Defer |
| Button hover states | Tailwind | NO | High | Do NOT migrate inline |
| Button click handlers | React | NO | High | Do NOT migrate |
| Layout wrapper | Tailwind | NO | Medium | Defer |

## 4. Theme Token Inventory
| Token Path | Live Consumer? | Consumer File | Default Source | Notes |
| ---------- | -------------: | ------------- | -------------- | ----- |
| `shell.scenes.sky.backgroundTop` | YES | `SceneContainer.tsx` | `index.css` var | Migrated |
| `shell.scenes.sky.backgroundBottom` | YES | `SceneContainer.tsx` | `index.css` var | Migrated |
| `shell.scenes.sky.cloud1Fill` | YES | `SceneContainer.tsx` | `index.css` var | Migrated |
| `shell.scenes.sky.cloud2Fill` | YES | `SceneContainer.tsx` | `index.css` var | Migrated |
| `shell.scenes.sunset.backgroundTop` | YES | `SceneContainer.tsx` | `index.css` var | Migrated |
| `shell.scenes.sunset.backgroundBottom` | YES | `SceneContainer.tsx` | `index.css` var | Migrated |
| `shell.scenes.sunset.cloudFill` | YES | `SceneContainer.tsx` | `index.css` var | Migrated |
| `shell.scenes.night.backgroundTop` | YES | `SceneContainer.tsx` | `index.css` var | Migrated |
| `shell.scenes.night.backgroundBottom` | YES | `SceneContainer.tsx` | `index.css` var | Migrated |
| `shell.scenes.space.backgroundTop` | YES | `SceneContainer.tsx` | `index.css` var | Migrated |
| `shell.scenes.space.backgroundBottom` | YES | `SceneContainer.tsx` | `index.css` var | Migrated |
| `startScreen.mainPanel.background` | YES | `StartScreen.tsx` | `.start-bg` CSS | Migrated |
| `startScreen.title.textShadow` | YES | `StartScreen.tsx` | `.mathforge-title` | Migrated |
| `startScreen.splashCard.boxShadow` | YES | `StartScreen.tsx` | `.splash-card` CSS | Migrated |
| `panels` | NO | None | None | Generic `Record`; Unused |
| `typography` | NO | None | None | Generic `Record`; Unused |
| `controls` | NO | None | None | Generic `Record`; Unused |
| `board` | NO | None | None | Generic `Record`; Unused |
| `progressStatus` | NO | None | None | Generic `Record`; Unused |
| `feedbackStates.*` | NO | None | `index.css` vars | Scaffold definition only |
| `modePresentation` | NO | None | None | Generic `Record`; Unused |
| `effects` | NO | None | None | Generic `Record`; Unused |
| `assets.*` | NO | None | None | Scaffold groups only |
| `preload.*` | NO | None | None | Scaffold arrays only |

*Note: All generic `Record<string, string>` groups remain completely unused by live components.*

## 5. CSS Ownership Inventory
The following visual areas remain explicitly CSS-owned in `src/index.css`:
- **Remaining Scene decorations**: NightScene star colors (`--sa-scene-night-star1`, `--sa-scene-night-star2`), SpaceScene star colors (`--sa-scene-space-star1`, `--sa-scene-space-star2`, `--sa-scene-space-star3`), SpaceScene nebula color (`--sa-scene-space-nebula`).
- **`.mathforge-title`**: Non-shadow properties (font size clamp, bold weights, gradients for text clipping).
- **`.splash-card`**: Base paddings, border radius, flex layout defaults.
- **`.splash-card:active`**: The scaling transform interaction for buttons.
- **Global UI (`.sa-card`, `.sa-btn`, `.answer-button.forge`)**: Fully managed by CSS (backgrounds, interactions, pseudo-classes) and safely partitioned.
- **CSS Animations**: Keyframes for floats, drifts, shakes, pops, flips, and spins.

## 6. Stability Verification
- **Build:** PASS
- **Lint:** PASS
- **Preview:** WORKING (Not white)
- **Console:** CLEAN
- **Start Screen:** Loads correctly; all buttons remain actionable.
- **SceneContainer:** Sky, Sunset, Night, and Space scenes all toggle effectively with newly theme-coupled gradient backgrounds and newly theme-coupled SVG Sky/Sunset cloud fills, alongside CSS-bound anim/opacity/path properties.
- **Gameplay:** Active games boot successfully; Help Menu renders natively without issues; Training Guides are actively locked ("Coming Soon") as intended. No runtime crashes occurred.

## 7. Recommended Next Phase
**Option C — Theme Contract Cleanup**
*Reasoning*: We successfully migrated all four passive scene gradients alongside three passive scene decorations without breaking layout or animation. However, `MathForgeThemeColors` currently holds many loose, untested structural fields defined as generic `Record<string, string>` representations (e.g. `panels`, `typography`, `controls`, `board`). Before advancing further, we should convert these loose schemas into explicitly typed interfaces, and optionally rename `MathForgeThemeColors` to `MathForgeThemeTokens` to better reflect its growing role in tracking sizes, shadows, text-shadows, and radii in addition to simple color variables.

## 8. Source File Modifications
**No source files were modified during this checkpoint.** All actions were purely audit-based read verifications spanning the components, stylesheet maps, and token interface files.
