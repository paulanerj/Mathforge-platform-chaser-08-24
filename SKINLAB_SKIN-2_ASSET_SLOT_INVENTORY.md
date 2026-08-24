# SKINLAB SKIN-2R: ASSET SLOT INVENTORY

## Required Asset Slot Groups

### Shell and Background
- base background
- atmosphere layer
- foreground decoration
- global frame
- global texture
- primary logo
- compact logo

### Start and Menu Screens
- title treatment
- primary button frame
- secondary button frame
- mode-selector frame
- decorative left/right elements
- help icon
- settings icon

### Gameplay Header and Board
- header frame
- progress-pill frame
- life/status icon
- board frame
- board background
- board texture
- board corner decorations

### Center Prompt Object
- normal frame/surface
- QMM frame/surface
- Dark frame/surface
- Hidden frame/surface
- Survival frame/surface
- correct accent
- incorrect accent
- idle decoration

### Modifier Badges
- badge frame
- badge surface
- badge icon treatment
- badge glow decoration

### Answer Tiles
- default frame
- default surface
- hover surface
- pressed surface
- selected surface
- correct surface
- incorrect surface
- fail-safe required surface
- fail-safe disabled surface

### Controls and Overlays
- control button frame
- pause icon
- home icon
- restart icon
- Help panel frame
- Settings panel frame
- Pause panel frame
- Training Guides Coming Soon decoration
- summary screen frame
- lesson-builder card frame
- instructor-dashboard card frame

### Effects and Decorations
- correct burst
- incorrect feedback
- fail-safe emphasis
- QMM momentum accent
- Dark Mode ambient layer
- Survival warning accent
- completion reward decoration

## Required Asset Slot Table

| Semantic Slot Name | Surface | Recommended Asset Type | Optional in Alternate Theme? | Default Resolved Presentation | Mode-Sensitive? | Protected Constraints | Initial Pilot Eligible? | Future Migration Phase |
| ------------------ | ------- | ---------------------- | ---------------------------: | ----------------------------- | --------------: | --------------------- | ----------------------: | ---------------------- |
| **Shell and Background** |||||||||
| `shell.baseBackground` | Global Shell | WebP / SVG | Yes | CSS Gradient | No | None | Yes | SKIN-3B |
| `shell.atmosphereLayer`| Global Shell | SVG | Yes | CSS / Inline SVGs | No | None | Yes | SKIN-3B |
| `shell.foregroundDecoration`| Global Shell| SVG | Yes | Null / Empty | No | None | Yes | SKIN-3B |
| `shell.globalFrame`| Global Shell | SVG | Yes | Null / Empty | No | Cannot obscure bounds | No | Shell |
| `shell.globalTexture`| Global Shell | PNG / WebP | Yes | Null / Empty | No | None | Yes | SKIN-3B |
| `shell.primaryLogo`| Start Screen | SVG | Yes | Text representation | No | None | Yes | SKIN-3C |
| `shell.compactLogo`| Header | SVG | Yes | Text representation | No | None | No | Header |
| **Start and Menu Screens** |||||||||
| `menu.titleTreatment`| Start Screen | SVG | Yes | Text representation | No | None | Yes | SKIN-3C |
| `menu.primaryButtonFrame`| Start Screen | SVG | Yes | Standard Button CSS | No | None | Yes | SKIN-3C |
| `menu.secondaryButtonFrame`| Start Screen | SVG | Yes | Standard Button CSS | No | None | Yes | SKIN-3C |
| `menu.modeSelectorFrame`| Start Screen | SVG | Yes | CSS Border | No | None | Yes | SKIN-3C |
| `menu.decorativeLeftRight`| Menu Shell | SVG | Yes | Null | No | None | No | Menus |
| `menu.helpIcon` | Floating Controls | SVG | Yes | Lucide Icon / Text | No | None | No | Overlays |
| `menu.settingsIcon`| Floating Controls | SVG | Yes | Lucide Icon / Text | No | None | No | Overlays |
| **Gameplay Header and Board** |||||||||
| `board.headerFrame`| Gameplay Header | SVG / WebP | Yes | Null / CSS | No | None | No | Header |
| `board.progressPillFrame`| Gameplay Header | SVG | Yes | CSS Pill | No | None | No | Header |
| `board.lifeStatusIcon`| Gameplay Header | SVG | Yes | Text Icon | Yes | None | No | Header |
| `board.boardFrame` | Main Gameplay Area| SVG / WebP | Yes | Null / CSS | No | Clip bounds via geometry | No | Board |
| `board.boardBackground`| Main Gameplay Area| WebP / CSS | Yes | CSS Gradient | Yes | Cannot map grid positions | No| Board |
| `board.boardTexture`| Main Gameplay Area| PNG / WebP | Yes | CSS Gradient / Null | No | Cannot map grid positions | No| Board |
| `board.boardCornerDecorations`| Main Gameplay Area| SVG | Yes | Null | No | `pointer-events: none` | No | Board |
| **Center Prompt Object** |||||||||
| `prompt.normalFrameSurface`| Center Coin Base | SVG / CSS | Yes | Default CSS | No | Flip animation integrity | No | CenterCoin |
| `prompt.qmmFrameSurface`| Center Coin Base | SVG / CSS | Yes | Default CSS | No | Minimal visual noise | No | CenterCoin |
| `prompt.darkFrameSurface`| Center Coin Base | SVG / CSS | Yes | Default CSS | No | Rhythm cues only | No | CenterCoin |
| `prompt.hiddenFrameSurface`| Center Coin Base | SVG / CSS | Yes | Default CSS | No | Mystery marker bounds | No | CenterCoin |
| `prompt.survivalFrameSurface`| Center Coin Base | SVG / CSS | Yes | Default CSS | No | Tension emphasis | No | CenterCoin |
| `prompt.correctAccent`| Center Coin Base | SVG | Yes | Default Glow CSS | No | Must affirm success | No | CenterCoin |
| `prompt.incorrectAccent`| Center Coin Base| SVG | Yes | Default Shake CSS | No | Must affirm failure | No | CenterCoin |
| `prompt.idleDecoration`| Center Coin Base | SVG | Yes | Default Empty | No | `pointer-events: none` | No | CenterCoin |
| **Modifier Badges** |||||||||
| `badges.badgeFrame`| Orbiting Modifiers| SVG / CSS | Yes | Default CSS | No | Transform stacking limits | No | Badges |
| `badges.badgeSurface`| Orbiting Modifiers| SVG / CSS | Yes | Default CSS | No | None | No | Badges |
| `badges.badgeIconTreatment`| Orbiting Modifiers| SVG | Yes | Text | No | None | No | Badges |
| `badges.badgeGlowDecoration`| Orbiting Modifiers| SVG | Yes | Default Shadow | No | None | No | Badges |
| **Answer Tiles** |||||||||
| `tiles.defaultFrame`| Grid Buttons | SVG / CSS | Yes | Default CSS | No | Scale constraint | No | Answers |
| `tiles.defaultSurface`| Grid Buttons | SVG / CSS | Yes | Default CSS | No | None | No | Answers |
| `tiles.hoverSurface`| Grid Buttons | SVG / CSS | Yes | Default CSS Hover | No | None | No | Answers |
| `tiles.pressedSurface`| Grid Buttons | SVG / CSS | Yes | Default CSS Active| No | None | No | Answers |
| `tiles.selectedSurface`| Grid Buttons | SVG / CSS | Yes | Default CSS Active| No | None | No | Answers |
| `tiles.correctSurface`| Grid Buttons | SVG / CSS | Yes | Default CSS Correct| No | Must read clearly as success | No | Protected |
| `tiles.incorrectSurface`| Grid Buttons | SVG / CSS | Yes | Default CSS Error | No | Must read clearly as incorrect | No | Protected |
| `tiles.failSafeRequiredSurface`| Grid Buttons | SVG / CSS | Yes | CSS Green Tint | No | Must be unmistakable required action | No | Protected |
| `tiles.failSafeDisabledSurface`| Grid Buttons | SVG / CSS | Yes | CSS Grayscale Opacity| No | Must remain clearly inactive/subordinate | No | Protected |
| **Controls and Overlays** |||||||||
| `controls.controlButtonFrame`| Lower Controls | SVG | Yes | Default CSS Pill | No | None | No | Controls |
| `controls.pauseIcon`| Lower Controls | SVG | Yes | Text / Lucide | No | None | No | Controls |
| `controls.homeIcon`| Lower Controls | SVG | Yes | Text / Lucide | No | None | No | Controls |
| `controls.restartIcon`| Lower Controls | SVG | Yes | Text | No | None | No | Controls |
| `overlay.helpPanelFrame`| Overlay Shell | SVG / WebP | Yes | Default CSS | No | None | No | Overlays |
| `overlay.settingsPanelFrame`| Overlay Shell | SVG / WebP | Yes | Default CSS | No | None | No | Overlays |
| `overlay.pausePanelFrame`| Overlay Shell | SVG / WebP | Yes | Default CSS | No | None | No | Overlays |
| `overlay.trainingGuidesComingSoonDecoration`| Help Menu | SVG | Yes | Default CSS Text | No | **Cannot be actionable** | No | Overlays |
| `overlay.summaryScreenFrame`| Session Summary | SVG / CSS | Yes | Default CSS | No | None | No | Summary |
| `overlay.lessonBuilderCardFrame`| Lesson Builder | SVG / CSS | Yes | Default CSS Card | No | None | No | Dashboard |
| `overlay.instructorDashboardCardFrame`| Dashboard | SVG / CSS | Yes | Default CSS Card | No | None | No | Dashboard |
| **Effects and Decorations** |||||||||
| `fx.correctBurst`| Particle Array | SVG / Array | Yes | `#4ADE80` Canvas | No | Ties to reducer state | No | FX |
| `fx.incorrectFeedback`| Particle/Shake | SVG / CSS | Yes | Shake Animation | No | Ties to reducer state | No | FX |
| `fx.failSafeEmphasis`| Highlight Effect | SVG / CSS | Yes | CSS Pulse / Color| No | Unmistakable prompt | No | FX |
| `fx.qmmMomentumAccent`| Pulse Ring | CSS / SVG | Yes | Null | Yes | Minimal visual weight | No | FX |
| `fx.darkModeAmbientLayer`| Background | SVG / WebP | Yes | CSS Color / Image| Yes | Cannot expose answers | No | FX |
| `fx.survivalWarningAccent`| Warning Border | SVG / CSS | Yes | Color tint | Yes | High contrast | No | FX |
| `fx.completionRewardDecoration`| Summary View | SVG / WebP | Yes | Stars text | No | Distinct from failure | No | FX |

## Asset Type Rules

- **SVG Use:** Heavily preferred for UI frames, center coins, answer grid perimeters, and logos. Extremely sharp, hardware-accelerated, lightweight.
- **WebP Use:** Preferred for heavy atmospheric backgrounds and rich texturing (e.g. wood, stone, nebula).
- **PNG Transparency Use:** Acceptable only when alpha-channel fidelity on massive graphics fails in WebP.
- **CSS-Only Presentation:** Highly encouraged for shadows, glows, and simple gradients to prevent HTTP requests rendering flash delays.
- **Canvas/Motion-Based Effects:** Allowed strictly for non-layout affecting particle arrays or canvas bursts. 
- **Forbidden from Images:** The numerals themselves, countdown timers (stopwatch), dynamic streaks, and interactive hitbox bounds MUST NEVER be rendered natively into static image packs. They must remain DOM text/SVG nodes driven by state.
