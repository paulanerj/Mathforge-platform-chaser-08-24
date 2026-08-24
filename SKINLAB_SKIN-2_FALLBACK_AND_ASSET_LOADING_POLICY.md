# SKINLAB SKIN-2R: FALLBACK AND ASSET LOADING POLICY

## A. Default Theme Completeness Rule
The `defaultTheme.ts` implementation MUST provide a fully functional, complete manifestation of every required token and asset semantic slot. It serves as the indestructible foundation of the visual architecture, presenting a usable fallback result for every required visual surface.

## B. Partial Alternate Theme Rule
Alternate theme declarations are allowed to be sparsely populated. If an alternate theme omits an optional visual asset or token, the `ThemeProvider` or `useTheme` dispatcher MUST transparently fall back to the equivalent token/asset in the Default Theme. 
Alternate skins must never be required to supply answer states, center objects, or other assets for the app to function.

## C. Missing Asset Resolution
- **Omitted Optional Assets:** If safely omitted by an alternate theme, it inherits the default resolved presentation.
- **Invalid Asset Paths / Failed SVG:** If loading fails, React must use a safe `onError` fallback to swap to the master default structural asset or text variant.
- **Critical Visuals Absent:** For mandatory slots conceptually (like Answer Tile rendering rules), omission immediately borrows from the Master Default array via the Resolved Runtime Theme.
- **Unsupported Asset Slots:** Ignored entirely by the resolving hook.

## D. Asset Loading and Flash Prevention
- **Lazy Loading:** Heavy `WebP` shell backgrounds and non-gameplay overlay graphics may load lazily.
- **Render-Blocking Loading (Preloading):** Core gameplay interactives (Center Coin SVG, Answer Tile SVGs) must be resolved securely without blank flashes. 
- **Flash Protection:** Switching themes should behave smoothly. If an external graphic asset fails or lags, the CSS-only fallback presentation handles immediate visualization.
- **Resolved Theme Safety:** Components consume the fully Resolved Runtime Theme, not raw incomplete theme packs.

## E. Interaction Safety
All theme-provided decorative elements MUST:
- use `pointer-events: none`;
- use non-layout-affecting positioning;
- avoid unexpected overflow or viewport clipping;
- avoid modifying HTML hitboxes governed by `uiGeometry.ts`.

## F. Protected-State Fallback
Game state determines pedagogical and mode semantics. The presentation boundary renders those semantics safely. Themes provide permitted visual identity. Protected presentation rules constrain theme output. Concealment states exclude direct theme customization of hidden answer elements.

Pedagogical feedback states are themeable within non-negotiable presentation safety constraints. A future validation/presentation safety layer may reject or supplement alternate protected-feedback styling that fails readability rules. This enforcement belongs outside gameplay logic.

- **Fail-Safe Required:** The correct choice must be unmistakable; a theme may use custom frame, surface, or non-blocking motion if it maintains high contrast and readability. If a theme omits this or it fails validation, the presentation boundary defaults to the established standard.
- **Fail-Safe Disabled:** Incorrect unavailable alternatives must remain clearly inactive or unavailable and visually subordinate.
- **Hidden / Dark Mode Concealed:** Current concealment authority remains at the answer rendering boundary. No theme may provide a custom frame, texture, border, glow, shadow, or hover treatment on a concealed answer element. No background or decorative asset may visibly map hidden answer-grid positions.
- **Warning / Locked States:** Text must remain firmly contrasting and visibly inert.
