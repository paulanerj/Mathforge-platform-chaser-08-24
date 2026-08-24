# SKINLAB-RESUME-17 — Remaining UI Surface Strategy Audit

* Exact files inspected:
  * src/components/UI/Settings/OptionsMenu.tsx
  * src/components/UI/Help/HelpMenu.tsx
  * src/components/UI/StartScreen.tsx
  * src/components/UI/PauseOverlay.tsx
  * src/components/Layout/SceneContainer.tsx
  * src/components/UI/ProgressPill.tsx
  * src/components/UI/SessionSummary.tsx
  * src/theme/themeTypes.ts
  * src/theme/defaultTheme.ts
  * src/theme/resolveTheme.ts
  * src/App.tsx
  * SKINLAB_RESUME_16_HELPMENU_MINIMAL_PASSIVE_VISUAL_TOKEN_FREEZE.md
  * SKINLAB_RESUME_15_HELPMENU_PASSIVE_TOKEN_BOUNDARY_DESIGN.md
  * SKINLAB_RESUME_14_NEXT_SAFE_UI_SURFACE_AUDIT.md
  * SKINLAB_RESUME_13_STARTSCREEN_PASSIVE_VISUAL_TOKEN_FREEZE.md
  * SKINLAB_RESUME_11_PAUSE_OVERLAY_PASSIVE_VISUAL_TOKEN_FREEZE.md
  * SKINLAB_RESUME_8_SPACESCENE_SHADOW_STRING_TOKEN_FREEZE.md

* Confirmation that no source files were modified: Yes.

* Sealed SkinLab/UI token surfaces and their boundaries:
  * SpaceScene: Shadow strings and particle colors sealed.
  * PauseOverlay: Modal backdrop, panel background, border, text colors sealed.
  * StartScreen: Passive visual tokens (backdrop, titles, sub-text, accent cards) sealed.
  * HelpMenu: Minimal passive tokens (header/footer dividers, tab backgrounds, text colors) sealed.

* Remaining unsealed UI/token surfaces:
  * OptionsMenu (Massive core settings hub)
  * SessionSummary (Post-game summary dialog)
  * PlayMenu
  * InstructorDashboard & Portal
  * LessonPlanBuilder
  * ProgressPill & DifficultyIndicator (HUD Elements)
  * ChildDashboard
  * SkillMap
  * AchievementPopup

* OptionsMenu risk assessment:
  * High Risk. It is a 630+ line behemoth managing complex internal state, multiple sub-components (CurriculumEditor, DifficultySlider, ModeConfigurationPanel), progression rules, and heavily relies on legacy CSS variables (`var(--sa-ui-border)`, `var(--sa-ui-accent)`, etc.). Touching this directly for implementation risks destabilizing the core settings engine.

* Smaller safer target assessment:
  * ProgressPill and DifficultyIndicator are smaller, but they operate during live gameplay HUD, making them riskier to touch outside of a gameplay-specific phase.
  * SessionSummary is a static post-game panel (380 lines) but also mixes legacy CSS variables and Tailwind classes extensively.
  * PlayMenu is also an option, but OptionsMenu is the most central, critical unsealed shell UI remaining.

* Recommendation for SKINLAB-RESUME-18 phase type:
  * TOKEN BOUNDARY DESIGN.

* Recommendation for whether implementation should proceed next:
  * NO. Do not implement next.

* Explicit reason implementation is not recommended:
  * The complexity of OptionsMenu requires a strict read-only boundary mapping phase (Token Boundary Design) before any values are modified, just like HelpMenu. Doing both in one phase would risk introducing logic errors in the deeply intertwined state of OptionsMenu.

* Protected gameplay boundaries:
  * AnswerGrid
  * GameBoard
  * CenterCoin
  * HUD Elements (ProgressPill, DifficultyIndicator)
  * reducers and useGameLogic

* Protected high-risk UI boundaries:
  * CurriculumEditor
  * ModeConfigurationPanel
  * DifficultySlider

* Recommended next phase name:
  * SKINLAB-RESUME-18-OPTIONSMENU-TOKEN-BOUNDARY-DESIGN

* Confirmation that SpaceScene tokens remain sealed: Yes.
* Confirmation that PauseOverlay tokens remain sealed: Yes.
* Confirmation that StartScreen tokens remain sealed: Yes.
* Confirmation that HelpMenu minimal passive tokens remain sealed: Yes.
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
