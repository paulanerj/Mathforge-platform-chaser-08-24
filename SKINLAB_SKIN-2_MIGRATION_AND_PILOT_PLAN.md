# SKINLAB SKIN-2R: MIGRATION AND PILOT PLAN

## A. Migration Principles
- **Preserve default appearance** before proving alternate art.
- **Never migrate geometry and styling simultaneously:** `uiGeometry.ts` scaling logic remains untouched.
- **Migrate passive surfaces before active gameplay surfaces.**
- **Require build/lint and visual regression checks** after each implementation checkpoint.
- **Require rollback packages** before implementation phases.

## B. Recommended Migration Order
1. Passive shell / theme foundation (SKIN-3A)
2. Single passive shell pilot (SKIN-3B)
3. Passive start screen surface pilot (SKIN-3C)
4. Theme preview capability (dev-only toggle)
5. Board frame / background surface
6. Header / progress / control surfaces
7. Overlay surfaces (Help, Settings), preserving tutorial containment
8. Center prompt object
9. Modifier badges
10. Answer tiles and protected answer states
11. Effect / motion theming
12. Lesson builder / dashboard
13. Alternate proof theme completion

## C. First Implementation Pilot Plans

### FUTURE SKIN-3A — FOUNDATION MOUNT ONLY
- create typed theme foundation;
- mount provider/resolver safely;
- no visible token consumption yet;
- no CSS migration;
- no visible appearance change;
- no alternate theme;
- no asset additions.

### FUTURE SKIN-3B — SINGLE PASSIVE SHELL PILOT
- migrate exactly one passive atmosphere/background value;
- default visual parity required;
- no Start Screen migration in the same phase;
- no HelpMenu change;
- no gameplay-surface change.

### FUTURE SKIN-3C — SINGLE PASSIVE START SCREEN PILOT
- allowed only after SKIN-3B acceptance;
- migrate one passive Start Screen surface;
- preserve behavior and layout.

*Note: Fail-safe and concealed answer surfaces remain deferred to a much later protected-gameplay-surface migration phase.*

## D. Deferred High-Risk Targets
Explicitly deferred items that cannot be modified during initial pilots:
- `AnswerGrid.tsx`
- `CenterCoin.tsx`
- `ModifierBadge.tsx`
- `uiGeometry.ts`
- Gameplay-linked animation timing
- Dark Mode concealed-answer styling
- Fail-Safe protected answer states
- Particle response effects

## E. Rollback and Freeze Process
For every implementation phase:
1. Create a baseline zip before modifying source.
2. Implement the narrow phase.
3. Run build/lint.
4. Document exact files changed.
5. Verify protected behavior.
6. Freeze accepted result before moving further.

## F. Risk Register

| Risk | Required Mitigation |
| ---- | ------------------- |
| ThemeProvider foundation and visible migration attempted in one phase | Split into SKIN-3A foundation-only and later single-surface visible pilots. |
| Root-level concealment rule hides or disables unrelated UI | Keep concealment authority at existing answer rendering boundary. |
| Protected visual enforcement contaminates gameplay engine | Enforce only in presentation/resolved-theme boundary. |
| Alternate theme assets incorrectly treated as required | Require complete default resolution; allow sparse alternate packs. |
| Visual contract table omits declared asset slots | Formalize every slot before implementation. |
| Difficulty communication unintentionally treated as freely cosmetic | Defer difficulty-map migration pending dedicated review. |
| Recently contained HelpMenu modified too early | Exclude HelpMenu from initial visible pilots. |
