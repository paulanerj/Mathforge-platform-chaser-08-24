# SKINLAB SKIN-1: VISUAL RESPONSIBILITY AND EXISTING SKIN AUDIT

## 1. Corrected Baseline Confirmation

- **Exact current project root**: `.` (Root of the workspace)
- **Exact tutorial-containment source file changed during SKIN-0B**: `src/components/UI/Help/HelpMenu.tsx`
- **Static Help remains functional**: Confirmed.
- **Interactive Training Guides are visible only as a locked Coming Soon state**: Confirmed.
- **No tutorial-start controls remain exposed through normal user UI**: Confirmed.
- **Application builds and lints cleanly**: Confirmed. Both compile and lint commands succeed.
- **No application source files are modified during SKIN-1**: Confirmed.

DOCUMENTATION FILES CREATED OR MODIFIED:
- `SKINLAB_SKIN-1_VISUAL_RESPONSIBILITY_AND_EXISTING_SKIN_AUDIT.md`

## 2. Complete Visual File Inventory

### Shell and Screens
- **`src/App.tsx`**: Orchestrates `themeClass` injection (`sa-theme-dark`, `sa-theme-qmm`, `sa-theme-light`). Safe to theme global background structure, but risky for component injection.
- **`src/index.css`**: Heavy lifter. Defines core CSS tokens (`--sa-primary`, etc.), structural layout utility classes, and complex animations. Contains scattered presentation. Needs formalization into theme tokens.
- **`src/components/Layout/SceneContainer.tsx`**: Injects active visual scenes (sky, sunset, night, space) using hardcoded CSS gradients and inline SVGs. Highly safe to theme / migrate to asset slots.
- **`src/components/UI/StartScreen.tsx`**: Heavy reliance on inline Tailwind utility classes (e.g., `bg-emerald-600`, `bg-blue-600`). Safe to theme early.
- **`src/components/UI/MenuLayout.tsx`**: Uses Tailwind layout utilities. Safe, mostly layout focused.
- **Secondary Surfaces (`InstructorDashboard`, `LessonPlanBuilder`, `SessionSummary`, `OptionsMenu`, etc.)**: Extensively use utility classes and structural `.sa-card`, `.sa-btn` classes. Colors are hardcoded directly in TSX. Safe to theme but voluminous.

### Gameplay Rendering
- **`src/components/Game/GameBoard.tsx`**: Structural pivot point. Passes down render mapping configuration and mode logic. Layout-critical (Protected).
- **`src/components/Game/AnswerGrid.tsx`**: Highly complex intersection of interaction, visual presentation (Tailwind/`uiSkin`), and pedagogical rules (Fail-Safe overlays). High risk, gameplay-critical.
- **`src/components/Game/GameHeader.tsx`**: Mix of structural layout and hardcoded UI colors. Moderately safe.
- **`src/renderers/CircleRenderer.tsx`**: Dynamic inline styles (e.g., `getGlowStyles()`, `getBackgroundStyle()`) that mutate based on streak tier and difficulty. Moderately safe, but handles some motion limits.
- **`src/renderers/components/CenterCoin.tsx`**: Core presentation focal point. Owns the flip boundaries, stopwatch SVG, and inline `boxShadow`/`borderColor` injections. High risk, gameplay-critical.
- **`src/renderers/components/ModifierBadge.tsx`**: Orbiting widgets handling flip animations. Medium risk.
- **`src/components/UI/ProgressPill.tsx`**: Hardcoded `bg-blue-600` width fill. Safe to theme.
- **`src/components/UI/ParticleSystem.tsx`**: Unmanaged `canvas` drawing hardcoded arrays of hex colors (`#38BDF8`). High risk for Canvas contexts, safe to abstract the color arrays to theme variables.

### Existing Skin / Theme / Geometry
- **`src/components/UI/SkinLayer.tsx`**: Simple mapping wrapper that intercepts `uiSkin` and injects `.forge` class names.
- **`src/ui/uiGeometry.ts`**: Total authority on scale, element sizes, and coordinate systems. **Protected**.
- **`src/ui/difficultyColorMap.ts`**: Pure static dictionary resolving numerical levels to hardcoded HEX and RGBA values.

## 3. Existing `default` / `forge` Skin Pathway Audit

The SOT reveals a prototype state for visual substitution using a purely CSS-override mechanic.

* **Where `uiSkin` state originates**: `src/App.tsx` via `const [uiSkin, setUiSkin] = useState<'default' | 'forge'>('default');`.
* **Where it is stored**: Nowhere permanently (ephemeral component state).
* **How it is selected**: No active user-facing selector exists. It is hardcoded to `'default'` at mount.
* **What components receive it**: Passed explicitly to `GameBoard.tsx` -> `CircleRenderer.tsx` -> `SkinLayer.tsx`, `CenterCoin.tsx`, `ModifierBadge.tsx`, and `AnswerGrid.tsx`.
* **What logic changes**: `AnswerGrid.tsx` conditionally appends `forge` and uses `.answer-correct` / `.answer-error` over default `.sa-btn` classes. `SkinLayer.tsx` wraps the gameplay layout in `.center-skin.forge`. `ModifierBadge.tsx` appends `.modifier-forge`.
* **Affected Surfaces**: The gameplay board components (`CenterCoin`, `ModifierBadge`, `AnswerGrid`).
* **Unaffected Surfaces**: Options Menu, Start Screen, Help Panel, Lesson Builder, Dashboards, and overall App Shell atmospheres.
* **Centralized vs Distributed**: The styling is purely distributed in `src/index.css` using complex pseudo-selectors (`::before`, `::after`) to inject linear-gradients, heavy inset box-shadows, and an SVG `fractalNoise` string data URI.
* **Restoration**: Switching back to `default` cleanly strips the classes, falling back immediately to the base `.sa-card` or `.mf-coin-inner` implementations.
* **Geometry/Interaction**: The `forge` skin does not materially alter physics, geometry, or state, functioning strictly at the compositing phase (CSS `mix-blend-mode`, box-shadow, filters).

| Surface | Default Behavior | Forge Behavior | File(s) Responsible | Safe to Formalize? | Risk |
| ------- | ---------------- | -------------- | ------------------- | ------------------ | ---- |
| Center Coin | Inner glow, simple background, dynamic border. | Heavy mechanical shading inset shadows, noise texture, distinct flash colors. | `CenterCoin.tsx`, `index.css` | No (in its current string/css form) | High |
| Modifiers | Flat basic `.sa-card` style. | `.modifier-forge` gradients, deep inset shadows, noise texture layer. | `ModifierBadge.tsx`, `index.css` | No | Medium |
| Answer Grid | Uses standard `.sa-btn` transition shapes. | Deep tactile scaling, unique correct/incorrect linear gradients, shadow depth. | `AnswerGrid.tsx`, `index.css` | No | High |

### PM Question: Should `forge` become the starting alternate proof theme?

**Recommendation**: `forge` should be **treated only as experimental styling whose useful visual ideas are selectively migrated.**

**Justification**: The `forge` implementation uses scatter-shot CSS overrides tied to incredibly specific DOM structures (using `:before` and `:after` pseudo-elements over predefined standard classes) rather than a clean token/asset delivery system. Trying to promote its tangled CSS directly into architectural manifests will ruin the goal of a decoupled layout vs. theme system. We must extract the *intent* of forge (textures, physical shadows, gradients) and port it into a proper token/asset format, discarding the brittle CSS pseudo-selectors used to prototype it.

## 4. Hardcoded Visual Value Inventory

| Visual Category | Exact File | Examples | Future Abstraction Target |
| --------------- | ---------- | -------- | ------------------------- |
| **Colors** | `InstructorDashboard.tsx` | `bg-red-50`, `text-blue-600` | Theme Token (Semantic UI Palette) |
| **Colors** | `ui/difficultyColorMap.ts` | `#add8e6`, `rgba(0,128,0,0.8)` | Theme Token (Difficulty Mapping) |
| **Gradients** | `index.css` | `linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)` | Theme Token (Backgrounds) / Asset Slot |
| **Shadows** | `CircleRenderer.tsx` | `0 0 40px rgba(59, 130, 246, 0.55)` | Motion/FX Token |
| **Glow Effects** | `index.css` (.sa-btn) | `box-shadow: 0 0 0 8px rgba(74, 222, 128, 0)` | Motion/FX Token |
| **Borders** | `LessonPlanBuilder.tsx` | `border-emerald-300`, `border-blue-500` | Theme Token |
| **Textures** | `index.css` (.forge) | `url("data:image/svg+xml,...fractalNoise...")` | Asset Slot (Textures) |
| **Typography** | `index.css` | `font-family: "Fredoka", "Varela Round"` | Theme Token (Typography) |
| **Icons (Inline)** | `StartScreen.tsx` | `<span className="text-4xl">🎯</span>` | Asset Slot (Icons) |
| **SVGs (Inline)** | `SceneContainer.tsx` | `<svg ... path d="M18.5..."` | Asset Slot (SVG/Graphics) |
| **Canvas Array** | `ParticleSystem.tsx` | `['#FB7185', '#4ADE80', '#38BDF8']` | Motion/FX Token |
| **Easing Timing** | `index.css` | `--mf-spin-duration: 260ms`, `cubic-bezier(0.2, 0.82, 0.18, 1)` | Protected Layout Rule (Coupled to TS timers) |

## 5. Graphic Asset and Illustration Opportunity Map

### Global Shell
- **Application Background**: WebP or SVG Pattern. Optional. Replaces generic gradient shell.
- **Atmospheric Background Layer**: SVG / CSS tokens. Optional. Replaces `SceneContainer` hardcoded clouds/stars.
- **Panel Textures**: PNG/WebP (Tileable). Optional. Replaces solid backgrounds on `.sa-card`.

### Start / Menu Experience
- **Title Treatment**: SVG logo art. Optional (Fallback to text "MathForge").
- **Play button frame**: SVG framing. Optional.
- **Mode selection card**: SVG/Texture. Optional.
- **Settings/Help Icons**: SVG. Mandatory (Falls back to Lucide/text defaults if missing). Safe for early pilot.

### Gameplay Screen
- **Gameplay Header Frame**: Asset Slot (WebP/SVG) + CSS Tokens. Optional.
- **Progress Pill Frame / Bar**: CSS Tokens + SVG Mask. Optional. 
- **Center Coin Surface**: SVG / Texture. Mandatory (Has default fallback). Core identity element.
- **Modifier Badge Surface**: SVG / Texture. Mandatory (Has default fallback).
- **Answer Tile Surface**: SVG / Texture + CSS Tokens. Mandatory (Has default fallback). Must support state variants (disabled, correct).

### Overlays
- **Help / Settings Panel Surface**: SVG / Texture. Optional. Safe for early pilot.
- **Training Guides Coming Soon Panel**: SVG decoration. Optional. Safe for first pilot.
- **Summary Screen Reward Treat**: SVG / WebP (e.g. customized Victory Stars). Optional.

### Effects
- **Correct-Answer Burst / Particle Colors**: Motion/Canvas array variables. Optional.
- **Dark Mode Ambient / Countdown Ring**: SVG / CSS Tokens. Protected Constraint (Cannot inject bright background images).

## 6. Token Candidate Inventory

### Shell Tokens
- `color.shell.background.top` / `color.shell.background.bottom`: Replaces global layout gradients.
- `color.panel.surface`: Standardized card background.
- `color.panel.border`: Standardized card borders.
- `typography.fontFamily.primary`: General UI font.
- `typography.fontFamily.display`: Center coin / big numbers font.

### Gameplay Tokens
- `color.centerCoin.background`: Replaces difficulty mapper inside `CircleRenderer`.
- `color.centerCoin.border`: Perimeter metallic color.
- `color.modifier.background`: Background of modifier plates.
- `color.answerTile.background`: Flat color logic for grid buttons.

### State Tokens (MANDATORY & PROTECTED)
- `state.answer.default`: Rest mode.
- `state.answer.hover`: Feedback.
- `state.answer.correct`: Must visually validate selection clearly.
- `state.answer.incorrect`: Must indicate failure cleanly (e.g. red tint).
- `state.answer.failSafeCorrect`: **Protected**. Must vividly highlight the solution.
- `state.answer.failSafeDisabled`: **Protected**. Grayscale/opacity desaturation.
- `state.answer.hidden` / `state.darkConcealed`: **Protected**. Opacity 0 and pointer events none.
- `state.layer.locked`: Menu locked state.

### Mode Tokens
- `mode.normal.accent`
- `mode.qmm.background` / `mode.qmm.accent`: Handles tension parameters visually.
- `mode.dark.backdrop`: Restricted luminance domain limits.
- `mode.survival.warning`: For low lives or stakes.

### Effect Tokens
- `fx.shadow.elevation.medium`: Shadow cast parameters.
- `fx.glow.color.success`: Determines color of correct glow spikes.
- `fx.particle.palette.success`: Array of hex codes for Canvas rendering. Override freely.

## 7. Protected Visual Contracts

### Pedagogical Fail-Safe
A skin **must** preserve:
- Wrong answers are visibly de-emphasized (grayscale, opacity drop) once correction is required.
- The correct required answer is unmistakable (high contrast success formatting or prominent glow).
- The required next action is unambiguous and not purely reliant on hue shifts alone (e.g., must pulse or scale slightly).
- Text remains highly legible.

### Dark Mode Concealment
A skin **must** preserve:
- Complete concealment of answer choices when active.
- No theme texture, background shadow, frame edge, or surface gradient can accidentally highlight the boundaries of the invisible `AnswerGrid` DOM elements.

### Layout and Touch Geometry
A skin **must** preserve:
- Answer tile hit areas (`w-full` scaling within grid).
- Mathematical center-object alignment governed by `uiGeometry.ts`.
- Reachable touch zones on phones and tablets.
- Decorative assets must be strictly `pointer-events-none`.

### Motion and Timing
A skin **must** preserve:
- The exact current gameplay-linked flip timing (value swaps at explicitly mapped DOM midpoints).
- Animation durations can never interrupt input or lag game logic.
- Assets safely resolve without creating a white-flash or UI stutter during active play.

### Tutorial Containment
A skin **must not**:
- Add new buttons or links that restart the paused Tutorial Director.
- Overwrite the "Training Guides — Coming Soon" locked condition with functional events.

## 8. Formal Classification Matrix

| Visual Area | File(s) | Classification | Future Skin Control | Protected Constraint | First-Pilot Eligible? |
| ----------- | ------- | -------------- | ------------------- | -------------------- | --------------------- |
| **App Shell Backgrounds** | `SceneContainer.tsx` | A, B | Theme Token / Asset Slot | None | **Yes** |
| **Start Screen/Menus** | `StartScreen.tsx`, `HelpMenu.tsx` | A | Theme Token | Tutorial Containment | **Yes** |
| **Center Coin Engine** | `CenterCoin.tsx` | D, E, B | Asset Slot | Flip Geometry / Timing | No |
| **Modifier Badges** | `ModifierBadge.tsx` | D, B | Asset Slot | Orbital Geometry | No |
| **Answer Grid** | `AnswerGrid.tsx` | D, E, A, B | Token / Asset Slot | **Fail-Safe, Dark Mode** | No |
| **Game Animations** | `index.css`, components | C, D, E | Motion Token | Engine Transition Synchronization | No |
| **Layout Bands** | `uiGeometry.ts` | D | NONE | **Absolute Scaling Authority** | No |

## 9. Recommended Theme Architecture Direction

**Evaluated Approaches:**

- **Approach A: Extend Current `uiSkin` / CSS Override System.**
  - *Benefits*: Doesn't require new files immediately.
  - *Risks*: It will turn `index.css` into an unmaintainable dump of pseudo-selectors and inline data-URIs. Breaks React component boundaries. Cannot cleanly scale past 2 skins.
- **Approach B: Introduce Typed Theme Tokens and Asset Manifest While Retaining Current Default Styling.**
  - *Benefits*: Decouples presentation perfectly. Default styling serves as the fallback, so partial theme packs don't crash or break the UI. Allows isolated integration pilots. Eliminates `.forge` CSS bloat safely later.
  - *Risks*: Takes initial engineering effort to build the registry and proxy logic.
- **Approach C: Replace Current Skin Handling Entirely Before Any New Visual Work.**
  - *Benefits*: Clean slate.
  - *Risks*: Extremely dangerous to rip out the current UI without a working Provider. Would cause total temporary layout failure and geometry drift.

**Recommendation:**
**Approach B is the only safe and scalable direction.** 
We must introduce a typed semantic theme-token and asset-manifest system while using the current default presentation as the fallback baseline. We will treat the existing `forge` concepts as visual proof sources, eventually phasing out the brittle CSS overrides entirely.

## 10. Proposed Future Theme Folder and Manifest Structure

*(Conceptual — Not yet implemented)*

**Structure:**
```text
src/
  theme/
    themeTypes.ts         (Manifest definitions, Token schemas)
    themeRegistry.ts      (Registration/Loading mapping)
    ThemeProvider.tsx     (Context pushing active theme variables down)
    useTheme.ts           (Hook for quick access in TSX components)
    defaultTheme.ts       (A 100% complete fallback theme implementation)
  themes/
    crystal-forge-proof/
      index.ts            (Theme pack manifest exporting tokens/assets)
      assets.ts           (Imports and mappings of SVG/Textures)

public/
  themes/
    crystal-forge-proof/
      backgrounds/        (WebP environment maps)
      svg/                (Frames, coins, details)
```

**Manifest Responsibilities & Fallbacks:**
- The manifest strictly declares assets and colors.
- If an asset is missing or fails to render, `useTheme` resolves to the equivalent entry in `defaultTheme.ts`.
- Heavy assets (backgrounds) should lazy-load; core gameplay SVGs (Coins, Buttons) must be pre-fetched during theme initialization to prevent flashes during the active step rendering.

## 11. First Future Implementation Pilot Recommendation

**Pilot Target:** The global shell background (`SceneContainer.tsx`) and the Help/Settings Panel styling.

**Why this is the best pilot:**
1. It validates the complete `ThemeProvider` + `ThemeRegistry` architecture immediately.
2. We can introduce semantic background/sky tokens and replace hardcoded SVG skies with external asset slots.
3. It completely bypasses dangerous layout geometry, active answer-grid logic, Fail-Safe coloring, and Dark Mode invisibility checks.
4. Preserving the default appearance is trivial (we just map current Tailwind colors to the default theme config).

**Explicitly Deferred:**
- `AnswerGrid`, `CenterCoin`, `ModifierBadge`, particle effects, active gameplay feedbacks, and mode concealment rules.

## 12. Risk Register and No-Go Boundaries

| Severity | Risk | Likelihood | Affected Area | Mitigation Strategy | Blocks Early Implementation? |
| -------- | ---- | ---------- | ------------- | ------------------- | ---------------------------- |
| **FATAL** | Revealing Dark Mode answer geometry | High (if not careful) | `AnswerGrid.tsx` | Exclude `AnswerGrid` from initial theme pilots. Ensure `pointer-events-none opacity-0` overrides all injected CSS filters. | No (Deferred to later phase) |
| **FATAL** | Reducing fail-safe readability | High | `AnswerGrid.tsx` | Explicit state tokens (`failSafeCorrect`, `failSafeDisabled`) that enforce absolute luminance contrast. | No |
| **FATAL** | Touching geometry pursuing visual improvement | Low | `uiGeometry.ts` | Do not pass size/width/height/margin attributes through the theme payload. Restrict tokens. | **Yes** |
| High | Building uncontrolled themes beside the forge experiment | High | `index.css` | The new `ThemeProvider` must supersede hardcoded CSS rules intentionally, rather than stacking on top. | **Yes** |
| High | External assets introducing loading flashes | Medium | App Shell | Initial pilot uses lightweight SVGs. Implement a preloader for image packs later. | No |
| High | Theme assets intercepting touch events | Medium | Overlays, Scenes | Globally enforce `pointer-events-none` on decoration asset layers. | No |
| Medium | Re-exposing contained tutorial behavior | Low | `HelpMenu.tsx` | Do not refactor JSX logic structure when swapping CSS classes to theme tokens. | No |

---

PHASE: SKIN-1
STATUS: AWAITING PM REVIEW

SOURCE FILES MODIFIED DURING SKIN-1:
- NONE

DOCUMENTATION FILES CREATED OR MODIFIED:
- SKINLAB_SKIN-1_VISUAL_RESPONSIBILITY_AND_EXISTING_SKIN_AUDIT.md

THEME ARCHITECTURE IMPLEMENTATION PERFORMED:
- NONE

VISUAL APPEARANCE INTENTIONALLY CHANGED DURING SKIN-1:
- NONE

GAMEPLAY LOGIC INTENTIONALLY MODIFIED:
- NONE

GEOMETRY INTENTIONALLY MODIFIED:
- NONE

SOUND SYSTEM INTENTIONALLY MODIFIED:
- NONE

TUTORIAL CONTAINMENT INTENTIONALLY MODIFIED:
- NONE

READY FOR PM REVIEW BEFORE IMPLEMENTATION:
- YES
