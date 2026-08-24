# SKINLAB-RESUME-18 — OptionsMenu Token Boundary Design

* Exact files inspected:
  * src/components/UI/Settings/OptionsMenu.tsx
  * src/components/UI/Settings/CurriculumEditor.tsx (via reference)
  * src/components/UI/Settings/DifficultySlider.tsx (via reference)
  * src/components/UI/Settings/modes/ModeConfigurationPanel.tsx (via reference)
  * src/theme/themeTypes.ts
  * src/theme/defaultTheme.ts
  * src/theme/resolveTheme.ts
  * src/App.tsx
  * SKINLAB_RESUME_17_REMAINING_UI_SURFACE_STRATEGY_AUDIT.md
  * SKINLAB_RESUME_16_HELPMENU_MINIMAL_PASSIVE_VISUAL_TOKEN_FREEZE.md
  * SKINLAB_RESUME_13_STARTSCREEN_PASSIVE_VISUAL_TOKEN_FREEZE.md
  * SKINLAB_RESUME_11_PAUSE_OVERLAY_PASSIVE_VISUAL_TOKEN_FREEZE.md
  * SKINLAB_RESUME_8_SPACESCENE_SHADOW_STRING_TOKEN_FREEZE.md

* Confirmation that no source files were modified: Yes.

## 1. OptionsMenu ownership and usage
* Exact file path: `/src/components/UI/Settings/OptionsMenu.tsx`
* Where exported: `export const OptionsMenu`
* Where imported/rendered: `src/App.tsx` imports and renders `<OptionsMenu />` at the root layout level.
* Ownership: OptionsMenu owns the root settings overlay and overall configuration shell, but delegates specific complex configuration visuals and state to imported subcomponents (CurriculumEditor, DifficultySlider, ModeConfigurationPanel).

## 2. OptionsMenu props and classification
* `config: AppConfig` — config/gameplay-adjacent
* `isOpen: boolean` — state/control
* `onClose: () => void` — behavior/action
* `onApply: (c: AppConfig) => void` — behavior/action

## 3. Imported subcomponents and risk classification
* `CurriculumEditor` (`./CurriculumEditor`): Manages complex lesson plan curriculum sequences. It should NOT be touched in a future minimal passive token implementation because of its heavy logic and mode-dependent structure.
* `DifficultySlider` (`../DifficultySlider`): Renders the slider track and thumb for difficulty. It should NOT be touched, as it relies on precise positional styling and custom visual elements.
* `ModeConfigurationPanel` (`./modes/ModeConfigurationPanel`): Manages operation and mode-specific configurations. It should NOT be touched because it varies significantly depending on the active game mode.

## 4. Current OptionsMenu token usage
OptionsMenu already consumes existing legacy theme tokens directly in inline styles for its outermost shell:
* `theme.tokens.panels.settings.backdrop`
* `theme.tokens.panels.settings.panel.background`
* `theme.tokens.panels.settings.panel.borderColor`
* `theme.tokens.panels.settings.panel.boxShadow`
* `theme.tokens.panels.settings.titleColor`
* `theme.tokens.panels.settings.bodyColor`

## 5. Existing raw classes/values for parent OptionsMenu shell areas
* Overlay/backdrop: Uses style `backdrop` token.
* Panel surface: Uses style `background`, `borderColor`, `boxShadow` tokens.
* Header/title: Uses style `titleColor`, `bodyColor` tokens, and `border-[var(--sa-ui-border)]`.
* Section containers: `bg-[var(--sa-ui-bg)]`, `bg-[var(--sa-card)]`, `border-[var(--sa-ui-border)]`, `bg-white/60`, `bg-white/80`.
* Labels/body text: `text-[var(--sa-ui-text-muted)]`, `text-[var(--sa-ui-text)]`, `text-slate-500`.
* Dividers/borders: `border-[var(--sa-ui-border)]`, `border-t-[var(--sa-primary)]`, `border-t-[var(--sa-warning)]`, `border-t-[#8B5CF6]`.
* Buttons: `bg-[var(--sa-ui-panel)]`, `text-[var(--sa-ui-accent)]`, `bg-white`, `bg-slate-50`.
* Active/selected states: `mode-standard`, `mode-multiply`, `sa-tab-active`, `border-[var(--sa-ui-accent)]`.
* Hover states: `hover:bg-slate-50`, `hover:border-[var(--sa-ui-accent)]`, `hover:shadow-md`, `hover:scale-110`, `hover:bg-slate-200`.
* Dark-mode variants: Relies natively on CSS variable definitions (e.g., `--sa-ui-bg`, `--sa-ui-border`) swapping at the root. No explicit `dark:` classes are used on text in the shell.
* Spacing/layout/scroll: `p-6`, `pb-4`, `flex`, `gap-4`, `max-h-[95vh]`, `grid grid-cols-2`.
* Animation/transition: `transition-all`, `transition-shadow`, `animate-pop`, `transition-transform`.
* Imported subcomponent visual ownership: DifficultySlider controls its own tracks; CurriculumEditor controls its own sequence lists.

## 6. Minimum safe token target
The smallest possible safe future implementation target includes only passive parent OptionsMenu shell values directly within the component:
* section title color
* section divider color
* passive section background
* muted text color

## 7. Values excluded from next implementation
Explicitly excluded:
* imported subcomponents
* sliders
* toggles
* active/selected states
* hover classes
* dark-mode variants
* config-dependent colors
* operation/mode badges
* curriculum editor visuals
* mode configuration visuals
* button behavior
* save/apply behavior
* close behavior
* layout and scroll classes
* animation and transition classes
* conditional rendering
* gameplay-adjacent settings

## 8. Recommended token shape
export interface MathForgeOptionsMenuPassiveTokens extends MathForgeOverlayPanelTokens {
  sectionTitleColor: string;
  sectionDividerColor: string;
  passiveSectionBackground: string;
  mutedTextColor: string;
}

## 9. Future implementation mapping
* `sectionTitleColor`:
  * replaces `text-[var(--sa-ui-text-muted)]` in static headings and minor block labels only.
* `sectionDividerColor`:
  * replaces `border-[var(--sa-ui-border)]` in passive inner section borders and dividers only.
* `passiveSectionBackground`:
  * replaces `bg-[var(--sa-ui-bg)]` on static wrappers (e.g., tabbar container base background, Curriculum Preset Library wrapper base background).
* `mutedTextColor`:
  * replaces `text-slate-500` in the Pedagogical Fail-Safe description paragraph and similar static descriptive text.

## 10. Hover safety plan
Future implementation will avoid breaking hover states by injecting a CSS variable in an outermost inline `style` prop (e.g., `'--mf-opt-sec-bg': theme.tokens.panels.settings.passiveSectionBackground`) and referencing it via Tailwind arbitrary classes (e.g., `bg-[var(--mf-opt-sec-bg)]`). This strategy allows standard `hover:bg-slate-50` or similar hover classes to continue working unhindered, exactly as achieved in StartScreen 13R and HelpMenu 16.

## 11. Dark-mode safety plan
Dark-mode variants are explicitly excluded from the next minimal passive implementation. Because OptionsMenu relies on dynamic legacy CSS variables (like `--sa-ui-bg`) that swap automatically in dark mode, mapping these static values to plain strings means they will lose automatic dark-mode reactivity until a dedicated dark-mode token phase is authorized. This is expected for SkinLab phase freezes.

## 12. Subcomponent safety plan
Imported subcomponents (`CurriculumEditor`, `DifficultySlider`, `ModeConfigurationPanel`) are completely excluded from the first OptionsMenu implementation. They will retain their existing legacy styling. If they require tokenization later, they must receive separate, dedicated audits and designs.

## 13. Implementation recommendation
* YES — a narrow parent-shell passive implementation may proceed after this design is accepted, using the proven CSS variable injection technique.

## 14. Recommended next phase
SKINLAB-RESUME-19 — OptionsMenu Minimal Parent-Shell Passive Visual Token Implementation

## 15. Confirmations
* SpaceScene tokens remain sealed: Yes.
* PauseOverlay tokens remain sealed: Yes.
* StartScreen tokens remain sealed: Yes.
* HelpMenu minimal passive tokens remain sealed: Yes.
* Gameplay files were not modified: Yes.
* No placeholder files were created: Yes.
* Hallucinated SceneContainer elements were not reintroduced: Yes.

## 16. QA Results
* Build: PASS
* Lint: PASS
* Theme Resolution Tests: PASS
* Theme Registry Tests: PASS
* Preview: WORKING
* Console: CLEAN
* Manual smoke QA: PASS
