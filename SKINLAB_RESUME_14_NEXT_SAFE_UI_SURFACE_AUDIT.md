# SKINLAB-RESUME-14 — Next Safe UI Surface Read-Only Audit

* Exact files inspected:
  * src/components/UI/Help/HelpMenu.tsx
  * src/components/UI/Settings/OptionsMenu.tsx
  * src/components/UI/StartScreen.tsx
  * src/components/UI/PauseOverlay.tsx
  * src/theme/themeTypes.ts
  * src/theme/defaultTheme.ts
  * src/theme/resolveTheme.ts
  * src/App.tsx
  * SKINLAB_RESUME_13_STARTSCREEN_PASSIVE_VISUAL_TOKEN_FREEZE.md
  * SKINLAB_RESUME_12_NEXT_SAFE_UI_SURFACE_AUDIT.md
  * SKINLAB_RESUME_11_PAUSE_OVERLAY_PASSIVE_VISUAL_TOKEN_FREEZE.md
  * SKINLAB_RESUME_10_PAUSE_OVERLAY_TOKEN_BOUNDARY_AUDIT.md
  * SKINLAB_RESUME_9_NEXT_UI_SURFACE_AUDIT.md
  * SKINLAB_RESUME_8_SPACESCENE_SHADOW_STRING_TOKEN_FREEZE.md

* Confirmation that no source files were modified: Yes. Read-only audit only.

* Candidate UI surfaces compared: HelpMenu vs. OptionsMenu

* Risk ranking for each candidate:
  1. HelpMenu (Lowest risk. Modal overlay, no complex internal sub-components, mostly read-only visualization of props).
  2. OptionsMenu (Higher risk. Complex internal state, manages multiple sub-components like CurriculumEditor, DifficultySlider, ModeConfigurationPanel, heavily logic-driven).

* Exact recommended surface: HelpMenu

* Recommended surface file path: src/components/UI/Help/HelpMenu.tsx

* Recommended surface usage/import locations:
  * Imported in src/components/UI/Help/index.ts
  * Imported and rendered in src/App.tsx (`<HelpMenu ... />`)

* Recommended surface props and classification:
  * `currentMode: string` - visual/behavior (used to switch content in `getModeHelp`)
  * `onClose: () => void` - action (closes the menu)
  * `onShowDemo?: (targetId: string) => void` - action (triggers demo)
  * `onStartTutorial?: (id: any) => void` - action (triggers tutorial)
  * `completedTutorials?: Record<string, boolean>` - state (status of tutorials)
  * `currentScreen?: string` - visual/behavior

* Exact raw visual classes/values found:
  * absolute inset-0 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200
  * rounded-3xl border-4 w-full max-w-lg p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200
  * flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0
  * flex items-center gap-2.5
  * w-6 h-6 text-indigo-600 dark:text-indigo-400
  * text-2xl font-black uppercase tracking-tight
  * p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer
  * w-6 h-6 text-slate-500 hover:text-slate-800 dark:hover:text-white
  * flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0
  * flex-1 py-2 text-center text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer
  * bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm
  * text-slate-500 hover:text-slate-700 dark:hover:text-slate-300
  * flex-1 overflow-y-auto pr-1
  * flex flex-col gap-4 animate-in fade-in duration-200
  * flex items-start gap-3 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/40
  * p-2 bg-indigo-100 dark:bg-indigo-900/60 rounded-xl shrink-0
  * text-indigo-900 dark:text-indigo-100 text-lg font-bold
  * text-slate-600 dark:text-slate-300 text-sm leading-relaxed
  * space-y-2.5
  * text-slate-800 dark:text-slate-200 text-sm font-black uppercase tracking-wider flex items-center gap-1.5
  * w-4 h-4 text-slate-500
  * space-y-2
  * flex gap-2 text-slate-600 dark:text-slate-300 text-xs leading-relaxed
  * text-indigo-500 font-bold shrink-0
  * mt-2 bg-amber-50/70 dark:bg-amber-950/10 border-2 border-dashed border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl flex flex-col gap-2.5
  * flex items-center justify-between
  * flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider
  * w-4 h-4 text-amber-500
  * text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 text-xs font-bold uppercase tracking-wider hover:underline cursor-pointer
  * text-slate-600 dark:text-slate-300 text-xs italic leading-relaxed
  * flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200 h-full min-h-[200px]
  * p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-2
  * w-8 h-8 text-slate-400 dark:text-slate-500
  * text-slate-800 dark:text-slate-200 text-lg font-black uppercase tracking-wider text-center
  * px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-widest rounded-lg
  * text-center text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-xs leading-relaxed
  * flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0
  * flex-1 sa-btn bg-emerald-500 text-white font-black uppercase tracking-wider rounded-xl py-3 text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-md cursor-pointer text-center
  * w-6 h-6 text-emerald-500 animate-pulse
  * w-6 h-6 text-amber-500
  * w-6 h-6 text-indigo-500
  * w-6 h-6 text-rose-500
  * w-6 h-6 text-red-500 fill-red-500
  * w-6 h-6 text-sky-500

* Safe token candidates:
  * Passive header/footer borders: border-slate-200, border-slate-100
  * Passive section backgrounds: bg-slate-100, bg-indigo-50/50, bg-indigo-100, bg-amber-50/70, bg-amber-100, bg-emerald-500
  * Passive section borders: border-indigo-100/50, border-amber-200
  * Passive icon or badge colors: text-indigo-600, text-amber-500, text-amber-700
  * Title/body text: text-indigo-900, text-slate-600, text-slate-800, text-amber-800, text-slate-500, text-white

* Values not safe to tokenize yet:
  * Tabs: bg-white, text-indigo-600 vs text-slate-500 (tied to activeTab state).
  * Hover states: hover:bg-slate-100, hover:text-slate-800, hover:text-indigo-800 (risk of specificity override).
  * Mode-specific content/icons: text-emerald-500, text-amber-500, text-indigo-500, text-rose-500, text-red-500, text-sky-500 inside `getModeHelp` switch statement (mode semantics).
  * Dark-mode classes: dark:border-slate-800, dark:bg-slate-800, dark:text-indigo-100, dark:bg-amber-950/10, etc. (wait for dark mode phase).
  * Layout/positioning tied to scroll or modal behavior: flex, p-6, max-h-[85vh], overflow-y-auto, etc.
  * Animation/transition timing: animate-in, fade-in, zoom-in-95, duration-200, transition-all, hover:scale-[1.02].

* Recommended future token shape:
  help: {
    ...existing help tokens...
    divider: string;
    tabs: {
      background: string;
    };
    banner: {
      background: string;
      border: string;
      iconContainer: string;
      titleText: string;
      bodyText: string;
    };
    tip: {
      background: string;
      border: string;
      titleText: string;
      bodyText: string;
    };
    badge: {
      background: string;
      text: string;
    };
    primaryButton: {
      background: string;
      text: string;
    };
  }

* Recommendation for whether implementation should proceed: YES — narrow token implementation.

* Recommended next phase name: SKINLAB-RESUME-15 — HelpMenu Passive Visual Token Implementation

* Confirmation that SpaceScene tokens remain sealed: Yes.
* Confirmation that PauseOverlay tokens remain sealed: Yes.
* Confirmation that StartScreen tokens remain sealed: Yes.
* Confirmation that gameplay files were not modified: Yes.
* Confirmation that no placeholder files were created: Yes.
* Confirmation that hallucinated SceneContainer elements were not reintroduced: Yes.

* Build/lint/test/manual QA results:
  - Build: PASS
  - Lint: PASS
  - Theme Resolution Tests: PASS
  - Theme Registry Tests: PASS
  - Preview: WORKING
  - Console: CLEAN
  - Manual smoke QA: PASS
