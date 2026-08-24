# SKINLAB SKIN-2R: THEME CONTRACT

## A. Theme Design Principles
* Gameplay owns behavior: Reducers and timing services dictate logic.
* Geometry owns coordinates and hitboxes: `uiGeometry.ts` determines all layout scaling and bounds.
* Themes own visual identity only: A skin affects colors, typography, textures, and non-blocking decorative graphics.
* Default theme is always complete: The base theme MUST cover every token and asset slot, providing a usable fallback result for every required visual surface.
* Alternate themes may be partial: They override what they supply, and inherit absent values from the default theme.
* Missing optional assets fall back safely: The system resolves omissions to the default theme automatically.
* Dark Mode concealment cannot be overridden by a theme.
* Pedagogical Fail-Safe meaning cannot be overridden by a theme.
* Decorative assets must never intercept interaction: All injected decorative graphics must use `pointer-events-none`.

## B. Theme Capability Boundaries
| Concern | Theme May Control? | Theme Must Never Control? | Notes |
| ------- | :----------------: | :-----------------------: | ----- |
| Shell colors | Yes | No | Background gradients/hex colors |
| Backgrounds | Yes | No | WebP/SVG injected backdrops |
| Panel surfaces | Yes | No | Card backgrounds and borders |
| Logos | Yes | No | Main title and headers |
| Decorative SVG | Yes | No | Particles, floating accents |
| Texture assets | Yes | No | Overlays injected on surfaces |
| Answer tile decorative presentation | Yes | No | Color/texture layers inside the button |
| Answer correctness state meaning | No | Yes | Success/failure classification belongs to GameState/Reducer |
| Fail-safe visibility | No | Yes | Pedagogical emphasis MUST remain distinct and explicitly protected |
| Dark Mode concealment | No | Yes | Cannot inject bright backgrounds or outlines revealing boundaries |
| Center-coin decorative frame | Yes | No | Bezels, rings, outlines |
| Center-coin flip timing | No | Yes | Duration and swap timing invariant |
| Modifier appearance | Yes | No | Internal padding, texture, text colors |
| Modifier coordinates | No | Yes | Orbit radius defined by `uiGeometry.ts` |
| Progress-pill appearance | Yes | No | Track colors, inner shadows |
| Answer hitboxes | No | Yes | Strict scale and gap integrity |
| Responsive dimensions | No | Yes | Base components handle scaling factors |
| Particle colors | Yes | No | Palette arrays for Canvas context |
| Particle gameplay timing | No | Yes | Trigger conditions rest in GameState |
| Sound behavior | No | Yes | Handled by existing audio mechanisms |
| Tutorial launch behavior | No | Yes | Launchers remain disabled/hidden |
| Difficulty presentation | No | Yes | Difficulty color mapping must remain protected until specifically reviewed |

## C. Proposed Typed Theme Manifest (Conceptual)
```typescript
interface ThemeMetadata {
  id: string;
  version: number;
  label: string;
}

interface ShellTokens {
  backgroundTop: string;
  backgroundBottom: string;
  globalAccent: string;
  globalText: string;
}

interface PanelTokens {
  surface: string;
  border: string;
}

interface TypographyTokens {
  fontFamilyPrimary: string;
  fontFamilyDisplay: string;
}

interface ControlTokens {
  default: string;
  disabled: string;
  locked: string;
}

interface GameplayBoardTokens {
  surface: string;
  frame: string;
}

interface ProgressStatusTokens {
  pillBackground: string;
  pillFill: string;
  statusWarning: string;
  statusComplete: string;
}

interface StateTokens {
  answerDefault: string;
  answerHover: string;
  answerSelected: string;
  answerCorrect: string;
  answerIncorrect: string;
  answerFailSafeRequired: string;
  answerFailSafeDisabled: string;
  answerHidden: string;
  answerDarkModeConcealed: string;
}

interface ModeVariantTokens {
  qmmAccent: string;
  darkBackdrop: string;
}

interface EffectsMotionTokens {
  shadowSoft: string;
  shadowDeep: string;
  glowSuccess: string;
  glowError: string;
  particleSuccess: string[];
}

interface ShellAssets {
  globalBackground?: string;
  atmosphericLayer?: string;
  foregroundDecoration?: string;
  globalFrame?: string;
  globalTexture?: string;
  primaryLogo?: string;
  compactLogo?: string;
}

interface MenuAssets {
  titleTreatment?: string;
  primaryButtonFrame?: string;
  secondaryButtonFrame?: string;
  modeSelectorFrame?: string;
  decorLeftRight?: string;
  helpIcon?: string;
  settingsIcon?: string;
}

interface GameplayHeaderBoardAssets {
  headerFrame?: string;
  progressPillFrame?: string;
  lifeStatusIcon?: string;
  boardFrame?: string;
  boardBackground?: string;
  boardTexture?: string;
  boardCornerDecorations?: string;
}

interface CenterPromptObjectAssets {
  normalFrameSurface?: string;
  qmmFrameSurface?: string;
  darkFrameSurface?: string;
  hiddenFrameSurface?: string;
  survivalFrameSurface?: string;
  correctAccent?: string;
  incorrectAccent?: string;
  idleDecoration?: string;
}

interface ModifierAssets {
  badgeFrame?: string;
  badgeSurface?: string;
  badgeIconTreatment?: string;
  badgeGlowDecoration?: string;
}

interface AnswerTileAssets {
  defaultFrame?: string;
  defaultSurface?: string;
  hoverSurface?: string;
  pressedSurface?: string;
  selectedSurface?: string;
  correctSurface?: string;
  incorrectSurface?: string;
  failSafeRequiredSurface?: string;
  failSafeDisabledSurface?: string;
}

interface ControlOverlayAssets {
  controlButtonFrame?: string;
  pauseIcon?: string;
  homeIcon?: string;
  restartIcon?: string;
  helpPanelFrame?: string;
  settingsPanelFrame?: string;
  pausePanelFrame?: string;
  trainingGuidesComingSoonDecoration?: string;
  summaryScreenFrame?: string;
  lessonBuilderCardFrame?: string;
  instructorDashboardCardFrame?: string;
}

interface EffectDecorativeAssets {
  correctBurst?: string;
  incorrectFeedback?: string;
  failSafeEmphasis?: string;
  qmmMomentumAccent?: string;
  darkModeAmbientLayer?: string;
  survivalWarningAccent?: string;
  completionRewardDecoration?: string;
}

interface FallbackPreloadMetadata {
  preloadGameplayAssets: boolean;
}

// 1. Complete Default Theme
// Must provide complete required semantic tokens and usable fallback results.
interface DefaultMathForgeTheme {
  metadata: ThemeMetadata;
  tokens: {
    shell: ShellTokens;
    panels: PanelTokens;
    typography: TypographyTokens;
    controls: ControlTokens;
    gameplayBoard: GameplayBoardTokens;
    progressStatus: ProgressStatusTokens;
    state: StateTokens;
    modeVariants: ModeVariantTokens;
    effectsMotion: EffectsMotionTokens;
  };
  assets: {
    shell: ShellAssets;
    menu: MenuAssets;
    gameplayHeaderBoard: GameplayHeaderBoardAssets;
    centerPromptObject: CenterPromptObjectAssets;
    modifiers: ModifierAssets;
    answerTiles: AnswerTileAssets;
    controlsOverlays: ControlOverlayAssets;
    effectsDecorative: EffectDecorativeAssets;
  };
  fallbackPreload: FallbackPreloadMetadata;
}

// 2. Partial Alternate Theme Pack
// May override cosmetic pieces. Omits optional values. Must never override geometry or protected behavior.
// Never required to supply core assets in order for the app to function.
// A future validation/presentation safety layer may reject or supplement alternate protected-feedback styling that fails readability rules. This enforcement belongs outside gameplay logic.
type PartialMathForgeTheme = Partial<DefaultMathForgeTheme>;

// 3. Resolved Runtime Theme
// Produced by merging DefaultTheme + PartialTheme. Completely populated for render components.
// Must already satisfy protected rendering constraints before components consume it.
type ResolvedMathForgeTheme = DefaultMathForgeTheme;
```

## D. Semantic Token Contract
*Note: Protected rendering states are enforced by the presentation boundary and resolved-theme safety policy, never by changing gameplay logic. Gameplay state and reducers determine whether a tile is correct, incorrect, fail-safe required, fail-safe disabled, hidden, or Dark Mode concealed; themes only style already-determined semantic visual states.*

| Token | Purpose | Current Visual Source | Override Safety | Protected Notes |
| ----- | ------- | --------------------- | --------------- | --------------- |
| `shell.backgroundTop` | Main bg gradient | `SceneContainer.tsx` | Safe | |
| `shell.backgroundBottom` | Main bg gradient | `SceneContainer.tsx` | Safe | |
| `panels.surface` | UI card backgrounds | `.sa-card` | Safe | |
| `typography.fontFamilyPrimary` | General font | `index.css` | Safe | |
| `controls.disabled` | System disabled state | `.opacity-50` | Safe | Must look inactive |
| `controls.locked` | Menu / Progress lock | `Training guides` | Safe | Must not be clickable |
| `gameplayBoard.surface`| Gameplay area bg | Inline classes | Safe | |
| `progressStatus.statusWarning`| Low lives / warning | `text-red-500` | Safe | High contrast needed |
| `progressStatus.statusComplete`| Level finished | `text-emerald-500` | Safe | Vivid differentiation |
| `state.answerDefault` | Normal unselected tile | `.sa-btn` | Safe | |
| `state.answerSelected`| User selected | Component state | Safe | |
| `state.answerHover` | Hover feedback | CSS `:hover` | Safe | |
| `state.answerCorrect` | Validated selection | `.sa-btn--correct` | Safe | Must be distinct from error |
| `state.answerIncorrect`| Failed selection | `.sa-btn--incorrect` | Safe | Must emphasize error |
| `state.answerFailSafeRequired`| Required next tap | `.bg-green-100` inline | **Protected** | Must be unmistakable required action |
| `state.answerFailSafeDisabled`| Ignored wrong tap | `.opacity-30` | **Protected** | Must remain clearly inactive/subordinate |
| `state.answerHidden` | Hidden tile | `.opacity-0` | **Protected** | Must remain unrevealed; No theme styling permitted on concealed tile |
| `state.answerDarkModeConcealed`| Dark Mode tile | `.pointer-events-none`| **Protected** | Must remain fully concealed; No theme styling permitted on concealed tile |

## E. Mode Variant Contract
- **Normal:** Standard active theme logic. All tokens available.
- **QMM:** Allowed to shift accent colors or adjust board backdrop. Prohibited from overriding minimal timing demands with complex animations.
- **Dark:** **Strictly Protected.** Current concealment authority remains at the answer rendering boundary. No theme may restore opacity, borders, shadows, textures, hover effects, outlines, frames, or contrast cues for concealed answer elements. No root-level global concealment implementation is authorized.
- **Hidden:** Allowed to stylize the mystery markers or question prompts.
- **Survival:** Allowed to accentuate warning UI elements.
- **Multiplication / Pattern / Skip Count:** Stylistic header/icons permitted, but gameplay mechanics are strictly normal mode variants.
