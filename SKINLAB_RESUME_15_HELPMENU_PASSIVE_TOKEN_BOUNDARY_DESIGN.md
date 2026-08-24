# SKINLAB-RESUME-15 — HelpMenu Passive Token Boundary Design

* Exact files inspected:
  * src/components/UI/Help/HelpMenu.tsx
  * src/components/UI/Help/index.ts
  * src/App.tsx
  * src/theme/themeTypes.ts
  * src/theme/defaultTheme.ts
  * src/theme/resolveTheme.ts
  * SKINLAB_RESUME_14_NEXT_SAFE_UI_SURFACE_AUDIT.md
  * SKINLAB_RESUME_13_STARTSCREEN_PASSIVE_VISUAL_TOKEN_FREEZE.md
  * SKINLAB_RESUME_11_PAUSE_OVERLAY_PASSIVE_VISUAL_TOKEN_FREEZE.md
  * SKINLAB_RESUME_8_SPACESCENE_SHADOW_STRING_TOKEN_FREEZE.md

* Confirmation that no source files were modified: Yes. This is a documentation-only design phase.

## 1. Current HelpMenu Token Usage

HelpMenu currently uses the following tokens via direct inline styles:
* theme.tokens.panels.help.backdrop
* theme.tokens.panels.help.panel.background
* theme.tokens.panels.help.panel.borderColor
* theme.tokens.panels.help.panel.boxShadow
* theme.tokens.panels.help.titleColor

## 2. Minimum Safe Token Target

The smallest safe passive target focuses on static layout boundaries and structural text:
* headerDividerColor
* footerDividerColor
* tabContainerBackground
* sectionTitleColor
* bodyTextColor
* mutedTextColor

## 3. Values Excluded From Next Implementation

Explicitly excluded:
* tabs active/inactive colors (bg-white, text-indigo-600 vs text-slate-500)
* hover classes (hover:bg-slate-100, hover:text-slate-800, hover:text-indigo-800, hover:scale-[1.02])
* dark-mode variants (dark:border-slate-800, dark:bg-slate-800, dark:text-indigo-400, etc.)
* mode-specific icon colors (text-emerald-500, text-amber-500, text-indigo-500, text-rose-500, text-red-500, text-sky-500)
* tutorial completion states
* demo button behavior
* close button behavior
* layout and scroll classes (absolute inset-0, flex, overflow-y-auto, max-h-[85vh], etc.)
* animation and transition classes (animate-in, fade-in, zoom-in-95, transition-all, etc.)
* conditional rendering (tab content switching)
* instructional text/content

## 4. Token Shape Recommendation

export interface MathForgeHelpMenuPassiveTokens extends MathForgeOverlayPanelTokens {
  headerDividerColor: string;
  footerDividerColor: string;
  tabContainerBackground: string;
  sectionTitleColor: string;
  bodyTextColor: string;
  mutedTextColor: string;
}

## 5. Future Implementation Mapping

headerDividerColor:
* replaces border-slate-200 in the header div only
* does not replace dark:border-slate-800 yet

footerDividerColor:
* replaces border-slate-100 in the footer div only
* does not replace dark:border-slate-800 yet

tabContainerBackground:
* replaces bg-slate-100 in the tab controls container div only
* does not replace dark:bg-slate-800 yet

sectionTitleColor:
* replaces text-slate-800 in the "Key Instructions" and "Training Guides" headings only
* does not replace dark:text-slate-200 yet

bodyTextColor:
* replaces text-slate-600 in the mode description, guideline items, and tip body only
* does not replace dark:text-slate-300 yet

mutedTextColor:
* replaces text-slate-500 in the "Coming Soon" body text only
* does not replace dark:text-slate-400 yet

## 6. Hover Safety Plan

Future implementation will avoid breaking hover states by avoiding direct inline styles for standard layout colors. Instead, it will use a CSS-variable plus Tailwind arbitrary base class strategy (e.g., text-[var(--mf-help-body-text)] with the CSS property passed in the style object). This ensures Tailwind hover utilities retain their proper CSS specificity and correctly override the base colors when triggered.

## 7. Dark-Mode Safety Plan

Dark-mode variants are explicitly excluded from the next implementation. They will remain as hardcoded Tailwind dark: classes (e.g., dark:text-slate-300) until a dedicated, authorized dark-mode token phase is initiated.

## 8. Implementation Recommendation

YES — narrow passive implementation may proceed after this design is accepted.

## 9. Recommended Next Phase

SKINLAB-RESUME-16 — HelpMenu Minimal Passive Visual Token Implementation

* Confirmation that SpaceScene tokens remain sealed: Yes.
* Confirmation that PauseOverlay tokens remain sealed: Yes.
* Confirmation that StartScreen tokens remain sealed: Yes.
* Confirmation that gameplay files were not modified: Yes.
* Confirmation that no placeholder files were created: Yes.
* Confirmation that hallucinated SceneContainer elements were not reintroduced: Yes.
* Build/lint/test/manual QA results:
  * Build: PASS
  * Lint: PASS
  * Theme Resolution Tests: PASS
  * Theme Registry Tests: PASS
  * Preview: WORKING
  * Console: CLEAN
  * Manual smoke QA: PASS
