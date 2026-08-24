# SKINLAB_RESUME_12_NEXT_SAFE_UI_SURFACE_AUDIT.md

## 1. Exact files inspected

- src/components/UI/StartScreen.tsx
- src/components/UI/PauseOverlay.tsx
- src/components/UI/Help/HelpMenu.tsx
- src/components/UI/Settings/OptionsMenu.tsx
- src/theme/themeTypes.ts
- src/theme/defaultTheme.ts
- src/theme/resolveTheme.ts
- src/App.tsx
- SKINLAB_RESUME_11_PAUSE_OVERLAY_PASSIVE_VISUAL_TOKEN_FREEZE.md
- SKINLAB_RESUME_10_PAUSE_OVERLAY_TOKEN_BOUNDARY_AUDIT.md
- SKINLAB_RESUME_9_NEXT_UI_SURFACE_AUDIT.md
- SKINLAB_RESUME_8_SPACESCENE_SHADOW_STRING_TOKEN_FREEZE.md

## 2. Confirmation that no source files were modified

No source files were modified during this read-only audit phase.

## 3. Candidate UI surfaces compared

- StartScreen (`src/components/UI/StartScreen.tsx`)
- HelpMenu (`src/components/UI/Help/HelpMenu.tsx`)
- OptionsMenu (`src/components/UI/Settings/OptionsMenu.tsx`)

## 4. Risk ranking for each candidate

1. **Low Risk: StartScreen.** Highly static layout with just 4 specific buttons/cards. Contains no complex tabs, scrolling areas, or deep legacy CSS overrides. Minimal state (`hasActiveLesson` flag mapping to simple button styling swaps). Already partially token-integrated for shadows and backdrops.
2. **Medium Risk: HelpMenu.** Technically segregated from gameplay physics, but possesses a massive visual footprint with dense inline Dark Mode classes (`dark:bg-indigo-950/20`), complex state tabs, and multiple dynamic icons depending on the selected mode.
3. **High Risk: OptionsMenu.** 600+ line behemoth tied deeply into core configuration layers and legacy CSS variables.

## 5. Exact recommended surface

StartScreen (`src/components/UI/StartScreen.tsx`)

## 6. Recommended surface file path

`src/components/UI/StartScreen.tsx`

## 7. Recommended surface usage/import locations

StartScreen is imported and rendered exclusively in `src/App.tsx`.

## 8. Recommended surface props and classification

- `state: any;` (state/control)
- `actions: any;` (behavior/action)
- `setIsOptionsOpen: (v: boolean) => void;` (behavior/action)
- `config: any;` (state/control)
- `onNavigate: (s: string) => void;` (behavior/action)

There are no visual-only props.

## 9. Exact raw visual classes/values found

**Layout/Z-index:**
- `absolute inset-0 z-50 flex flex-col items-center justify-center px-6 py-12`
- `z-10 flex flex-col items-center text-center text-slate-800 w-full max-w-sm`
- `flex justify-center items-center py-4 mb-8`

**Error Banner:**
- `w-full max-w-md sa-card p-4 mb-8 text-sm leading-snug border-red-200 bg-red-50`
- `font-black mb-1 text-red-600 uppercase tracking-widest text-[10px]`
- `opacity-90 mb-0 font-bold text-red-800`

**Splash Cards Wrappers:**
- `flex flex-col gap-4 w-full`
- All buttons contain: `splash-card w-full text-left flex flex-col gap-1 border cursor-pointer`

**Splash Card Variant 1 (Resume):**
- `bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500`

**Splash Card Variant 2 (Primary / New / Continue):**
- Conditional block: `${hasActiveLesson ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-blue-600 text-white border-blue-500'}`
- Hover: `hover:bg-blue-700 hover:text-white`

**Splash Card Variant 3 (Free Practice):**
- `bg-slate-50 hover:bg-white text-slate-800 border-slate-200`

**Splash Card Variant 4 (Instructor Portal):**
- `bg-white hover:bg-slate-50 text-slate-800 border-slate-200 mt-2`

**Text Sizing/Weight inside cards:**
- `text-xl font-black`, `text-sm font-medium opacity-90`
- `text-lg font-black text-slate-700`, `text-sm font-medium text-slate-500`

**Animation (inline style):**
- `animation: 'enterUp 0.5s ease-out 0.1s both'` (and 0.15s, 0.2s, 0.3s, 0.4s)

## 10. Safe token candidates

- Button background colors: `bg-emerald-600`, `bg-blue-600`, `bg-blue-50`, `bg-slate-50`, `bg-white`
- Button border colors: `border-emerald-500`, `border-blue-500`, `border-blue-200`, `border-slate-200`
- Button base text colors: `text-white`, `text-blue-900`, `text-slate-800`

*(Note: The main background and splash card box shadow are already safely tokenized.)*

## 11. Values not safe to tokenize yet

- Conditional logic controlling rendering (`hasActiveLesson`)
- Click actions (`resumeLesson`, `onNavigate`, `setIsOptionsOpen`)
- Layout configurations (`flex`, `absolute`, `z-50`, `z-10`)
- Hover states (`hover:bg-*` cannot be natively inline-styled without helper components/JS, so must be untouched or ignored)
- Animation timelines and keys (`enterUp 0.5s ease-out`)
- Interactive error state output logic.

## 12. Recommended future token shape

Since MathForgeStartScreenTokens already exists, the safest future implementation can expand splashCard with semantic variants.

Recommended future token shape, plain-text reference:

export interface MathForgeStartScreenCardVariants {
resumeBackground: string;
resumeBorder: string;
resumeText: string;

primaryActiveBackground: string;
primaryActiveBorder: string;
primaryActiveText: string;

primaryNewBackground: string;
primaryNewBorder: string;
primaryNewText: string;

secondaryBackground: string;
secondaryBorder: string;
secondaryText: string;

tertiaryBackground: string;
tertiaryBorder: string;
tertiaryText: string;
}

export interface MathForgeStartScreenSplashCardTokens {
boxShadow: string;
background?: string;
borderColor?: string;
variants?: MathForgeStartScreenCardVariants;
}

## 13. Recommendation for whether implementation should proceed

YES — A narrow StartScreen token implementation targeting only the static button/card variant background, border, and text colors is safe and follows the exact proven model of `PauseOverlay`.

## 14. Recommended next phase name

`SKINLAB-RESUME-13 — StartScreen Passive Visual Token Implementation`

## 15. Confirmation that SpaceScene tokens remain sealed

Confirmed. SpaceScene token boundaries were not modified.

## 16. Confirmation that PauseOverlay tokens remain sealed

Confirmed. PauseOverlay tokens established in SKINLAB-RESUME-11 remain completely intact.

## 17. Confirmation that gameplay files were not modified

Confirmed. No gameplay-related files were modified.

## 18. Confirmation that no placeholder files were created

Confirmed.

## 19. Confirmation that hallucinated SceneContainer elements were not reintroduced

Confirmed. No hallucinated components or elements were added.

## 20. Build/lint/test/manual QA results

- Build: PASS
- Lint: PASS
- Theme Resolution Tests: PASS
- Theme Registry Tests: PASS
- Preview: WORKING
- Console: CLEAN
- Manual smoke QA: PASS
