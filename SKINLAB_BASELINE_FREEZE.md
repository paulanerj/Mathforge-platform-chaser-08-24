# MATHFORGE SKINLAB INTAKE AUDIT

## 1. Modification Confirmation
I explicitly confirm that zero files were modified, added, deleted, or auto-fixed during this pass. This was a strict read-only intake audit.

## 2. Build / Lint Result
Executed: `npm run lint` and `npm run build`
Result: Both completed successfully with no errors. The project compiles cleanly.

## 3. Exact Files Inspected
The entire source tree was cross-referenced, specifically identifying:
- `src/App.tsx`
- `src/index.css`
- `src/components/Layout/SceneContainer.tsx`
- `src/components/UI/StartScreen.tsx`
- `src/components/Game/GameBoard.tsx`
- `src/components/Game/AnswerGrid.tsx`
- `src/renderers/components/CenterCoin.tsx`
- `src/renderers/components/ModifierBadge.tsx`
- `src/components/Game/GameHeader.tsx`
- `src/components/UI/ProgressPill.tsx`
- `src/components/UI/Help/HelpMenu.tsx`
- `src/components/UI/Settings/OptionsMenu.tsx`
- `src/components/UI/LessonBuilder/LessonPlanBuilder.tsx`
- `src/components/UI/InstructorDashboard.tsx`
- `src/hooks/useSound.ts` (Sound logic)
- `src/store/gameReducer.ts` (State and Fail-Safe rules)

## 4. Current Visual Architecture
Current presentation lives in a combination of:
- **Tailwind Utility Classes**: Heavily used inline across components (e.g., `bg-blue-600`, `text-slate-800`).
- **Global CSS (`src/index.css`)**: 840+ lines doing heavy lifting. It defines CSS custom properties (`--sa-primary`, `--mf-surface-top`), custom classes (`.sa-btn`, `.sa-card`, `.mf-coin-inner`), and complex CSS animations (flips, pulses, background gradients).
- **Inline Styles**: Used for dynamic properties, especially in `AnswerGrid.tsx`, `CenterCoin.tsx`, and `ModifierBadge.tsx` where layout geometry and scaling factors are calculated via React state and `uiGeometry.ts`.
- **`SkinLayer.tsx`**: Existing lightweight wrapper that injects a `skin` prop (used currently for `forge`), toggling CSS overrides in `src/index.css` (e.g., `.center-skin.forge`).
- **`uiGeometry.ts`**: The strict layout/geometry authority defining radii, widget sizes, gaps, and scaling constants.

## 5. Visual Responsibility Matrix

| Visual Area | File(s) | Current Technique | Safe Theme Candidate? | Risk |
| ----------- | ------- | ----------------- | --------------------- | ---- |
| App Shell / Backgrounds | `SceneContainer.tsx`, `index.css` | Hardcoded CSS gradients (`.sa-bg-grad`, inline SVGs) | **Yes (Class A)** | Low |
| Panels & Overlays | `OptionsMenu.tsx`, `HelpMenu.tsx`, etc. | Utility classes (`bg-white`, `border-slate-200`) and `.sa-card` | **Yes (Class A)** | Low |
| Answer Grid Tiles | `AnswerGrid.tsx`, `index.css` | `.sa-btn` classes, inline colors from `uiSkin="forge"`, Fail-Safe logic | **Yes (Class B)** | High (Fail-Safe legibility) |
| Center Coin Surface | `CenterCoin.tsx`, `index.css` | CSS gradients, `DifficultyColorMapper`, inline Box Shadows | **Yes (Class B)** | High (Dark Mode overlaps) |
| Modifiers | `ModifierBadge.tsx`, `index.css` | Inline transforms, custom classes (`.mf-modifier-body`) | **Yes (Class B)** | Medium |
| Geometry & Rings | `uiGeometry.ts`, `CenterCoin.tsx` | TS constants mapped to inline `style={{ width, height }}` | **No (Class D)** | Extreme (Layout critical) |
| Flips & Motion | `index.css` | CSS Keyframes (`coinFlipOut`, `mf-motion-base` variables) | **Yes (Class C)** | High (Timing limits) |

## 6. Asset Inventory
- **SVG / Icons**: Relies on `lucide-react` (used in `HelpMenu.tsx`), native inline text emojis (e.g., `⭐`, `🎯`, `✨`), and large inline SVGs used for background scenes (Clouds, Stars, Nebula in `SceneContainer.tsx`) and the Dark Mode Stopwatch (`CenterCoin.tsx`).
- **Images/Textures**: Exclusively using `linear-gradient`, `radial-gradient`, and a single inline SVG noise filter data URI (`url("data:image/svg+xml...")`) in `index.css` to simulate "forge" module textures. No external PNG/WebP files exist.
- **Particles**: Painted dynamically via Canvas API in `ParticleSystem.tsx`.

## 7. Hardcoded Style Inventory
Visual themes are not completely centralized yet:
- Hardcoded hex codes exist in components and inline styles (e.g., `ArithmeticConfig.tsx`, `DifficultySlider.tsx`).
- `sa-theme-dark`, `sa-theme-qmm`, and `sa-theme-light` modify global CSS variables (`--sa-bg`, `--sa-text`, etc.) in `index.css`.
- The `uiSkin === 'forge'` logic selectively switches classes (e.g., `answer-button.forge`, `modifier-forge`) relying on heavy nested pseudo-selectors and complex box-shadows in `index.css`.
- Colors per level rely strictly on `DifficultyColorMap.ts`, generating exact hex codes used across borders.

## 8. Layout-Critical / Gameplay-Critical Boundaries
- **`uiGeometry.ts`**: Governs core coordinates. *Do not abstract or touch.*
- **Responsive Layout Constraints**: Inline styles injecting `scaleFactor`, `containerRef` width updates, and viewport bands in `GameLayout.tsx` are critical to clipping protections.
- **Gameplay Timing**: Timing of the central coin text swap (130ms midpoint, 260ms duration) is intrinsically linked to `FlipPhase` logic in `CenterCoin.tsx` and `ModifierBadge.tsx`. Do not displace this.
- **Dark Mode Interactions**: `div` clicks directly wired to `actions.advanceDarkStepNow` in `GameBoard`.

## 9. Protected System Verification
✅ **Training Guides**: Disabled. `TutorialOverlay` is present in `App.tsx` and controlled by `useTutorialDirector`, but there are no main menu triggers to launch tutorial campaigns visible to users, honoring "Coming Soon".
✅ **Crystal Math Sound State**: Maintained via `useSound.ts` producing raw web audio tones (oscillators/sine waves). (Note: The `src/audio` directory does not exist in the source of truth, relying entirely on internal oscillators, which represents the current identity).
✅ **Pedagogical Fail-Safe**: Active. Detected in `AnswerGrid.tsx` via `state.failedCurrentStep` (wrong buttons get `grayscale opacity-30`, correct gets `bg-green-100`).
✅ **Dark Mode Concealment**: Active. `AnswerGrid.tsx` checks `isDark` and applies `opacity-0 pointer-events-none`.
❗ **Runtime Debug Log**: *Not found.* `src/utils/runtimeDebugLog.ts` doesn't exist in the provided source of truth.
❗ **Optional Music Layer**: *Not found.* `src/audio/musicManifest.ts` & `src/hooks/useMusicPlayer.ts` do not exist in the provided source of truth. 

## 10. Recommended Theme Architecture Entry Point
**Smallest Safe Next Phase (SKIN-1 or SKIN-2):**
Establish the formal Theme Contract (`themeTypes.ts`) and Theme System Shell (e.g., a `ThemeProvider` wrapper and token registry base). The very first visual components migrated should solely be the Start Screen/Menu Panels (`StartScreen.tsx`, `PlayMenu.tsx`) and the global CSS background mapping out of `SceneContainer.tsx`. Leave the active `GameBoard` rendering untouched.

## 11. Files Recommended For Next Phase
- `src/theme/themeTypes.ts` (New file)
- `src/theme/defaultTheme.ts` (New file)
- `src/components/UI/SkinLayer.tsx` (Expanding existing file)
- `src/components/Layout/SceneContainer.tsx` (Migrating inline SVG skies to asset tokens)
- `src/index.css` (Extracting structural CSS variables to match new tokens)

## 12. Risks / Unknowns
- **Animation Decoupling Risk**: Extricating `CenterCoin.tsx` flips (`animate-coin-flip-*`) from hardcoded timing might break the exact value swap midpoint (`MATHFORGE_FLIP_MIDPOINT_MS`) which is currently tightly coupled to `useEffect` code.
- **Inline SVGs vs Fetching**: Loading SVGs dynamically from a local theme folder might introduce slight delays compared to the current inline React SVG components, potentially resulting in momentary blank assets on fast mounting.
- **Missing Audio/Logs**: The missing `src/audio/` directory and debug logger means any plans attempting to skin/affect audio systems must be deferred.

SKIN-0 read-only audit complete. Awaiting project manager approval before any theme architecture changes.
