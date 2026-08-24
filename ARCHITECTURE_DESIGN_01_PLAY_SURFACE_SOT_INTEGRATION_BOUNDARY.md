# ARCHITECTURE-DESIGN-01R — Play Surface SOT Integration Boundary Documentation Repair

## 1. Exact files inspected
* ARCHITECTURE_AUDIT_01_PLAY_SURFACE_GAME_MODE_INTEGRATION.md
* src/App.tsx
* src/types.ts
* src/store/gameReducer.ts
* src/hooks/useGameLogic.ts
* src/components/Game/GameBoard.tsx
* src/components/Game/AnswerGrid.tsx
* src/components/Game/GameHeader.tsx
* src/adapters/gameToVisualAdapter.ts
* src/config/activityPresets.ts
* src/services/practicePlanController.ts
* src/theme/themeTypes.ts
* src/theme/defaultTheme.ts
* src/theme/resolveTheme.ts
* src/experimental/README.md
* STABILIZATION_QA_01_SKINLAB_UI_TOKEN_MANUAL_QA_BASELINE.md
* SKINLAB_RESUME_22_SKINLAB_UI_TOKEN_STABILIZATION_HOLD.md

## 2. Confirmation that no source files were modified
Confirmed. No source files were modified during this phase.

## 3. Confirmation that no theme files were modified
Confirmed. No theme files were modified.

## 4. Definition of a Play Surface
A Play Surface in MathForge is a stateless or locally-stateful presentation component responsible for:
* Rendering a specific gameplay step or prompt to the user.
* Presenting an interaction model for the user to select or formulate an answer.
* Accepting read-only runtime and game state data from the central application logic.
* Emitting controlled user interaction events back to the application.

A Play Surface must NOT own:
* curriculum
* assignments
* progress
* attempts
* scoring
* XP
* storage
* reporting
* teacher dashboards
* lesson progression
* problem generation source of truth
* answer correctness source of truth
* timers
* reducer transitions
* global app state
* SkinLab theme state

## 5. Learning Mode vs Play Surface vs Runtime Mode vs Theme/Skin
* Learning Mode: What math concept or curriculum behavior is being practiced.
* Play Surface: How the learner interacts and responds visually to the problem.
* Runtime Mode: The wrapper, pacing, pressure, or specific gameplay condition (e.g., normal, dark mode, survival).
* Theme / Skin: The visual presentation layer and aesthetic styling.
These concepts must remain conceptually separated to allow modular composition without intertwining presentation and core game logic.

## 6. Current Center-Circle Surface Boundary
The current center-circle gameplay is the absolute SOT baseline. It represents the first and currently only surface.
* Inside the conceptual boundary: The GameBoard layout, the center prompt, the AnswerGrid, current discrete answer selection interaction, fail-safe visual states, and dark-mode visual concealment logic.
* Outside the conceptual boundary: Reducer state transitions, ProblemGenerator, scoring, XP, timers, storage, lesson progression, configuration mutation, and assignment/reporting systems.

## 7. Gear/Cog and Number Line Future Embedding Implications
* Gear/Cog and Number Line are future Play Surface candidates only. They are not current integration targets.
* No alternate surface should be integrated before the current center-circle extraction risk is fully audited.
* Future embeddings should own their visual representation and internal animation states.
* Future embeddings must not duplicate curriculum data generation, validation of correctness, XP/scoring, timers, storage, or assignment systems.
* They should act purely as presentation layers that receive read-only data and emit simple interaction events back to the SOT runtime.

## 8. Proposed Play Surface Registry Shape
The future registry should be defined conceptually as a mechanism to map a configuration identifier to a specific surface component.
* The registry would match a surface identifier to a specific UI wrapper.
* The current center-circle mode must remain the default and safe fallback.
* No registry code, interfaces, or types should be created at this time.

## 9. Proposed Surface Input Contract
A Play Surface should conceptually expect standardized, read-only data from the runtime:
* The formatted visual step data.
* Current configuration snapshot.
* Active learning mode and runtime mode context.
* Fail-safe status and selection states.
* Read-only timer or theme context if required.

## 10. Proposed Surface Output/Event Contract
A Play Surface should conceptually communicate back to the SOT runtime through simple events:
* Answer submission events.
* Interaction payload events.
* Pause requests or surface readiness indicators.
Surfaces must not directly mutate global state, storage, or assignments.

## 11. Adapter Boundary
* The adapter layer should translate SOT step data into surface-specific visual formats.
* The SOT problem generator remains unchanged, while surface-specific adapters handle presentation requirements without duplicating generation logic.

## 12. Fail-Safe and Dark Mode Boundary
* Current behavior must remain protected.
* Future surfaces should receive fail-safe and dark mode contexts as read-only states and dictate their own visual presentation for those states.
* Surfaces must not decide correctness or timing for these states.

## 13. SkinLab Relationship
* SkinLab token migration remains paused.
* Play Surface architecture and theming are separate layers.
* Future surfaces may eventually consume semantic visual tokens, but this phase does not restart token migration.

## 14. Migration Strategy
1. The SOT center-circle gameplay is the baseline.
2. The current center-circle extraction risk must be audited before any code changes.
3. Once safe, a conceptual boundary can be drawn around the center-circle mode.
4. The registry would eventually route the current center-circle components exactly as they behave today.
5. Only after comprehensive regression testing of the center-circle boundary would any alternate surface (like Gear/Cog or Number Line) be considered for integration.

## 15. Experimental Surface Guardrails
* Experimental surfaces (Gear/Cog, Number Line) are future candidates only.
* They must avoid owning progress, scoring, storage, or duplicate SOT logic.
* They must expose clean input/output boundaries conceptually aligned with the SOT.

## 16. First Implementation Candidate
* The safest first implementation candidate is auditing the center-circle extraction risk.
* No implementation is recommended during this design phase.

## 17. Required Tests For Future Implementation
Before any registry or surface extraction is accepted:
* Current gameplay still starts successfully.
* Correct answer behavior and animations are unchanged.
* Wrong answer / fail-safe pedagogical states are unchanged.
* Dark mode concealment works exactly as before.
* Timer precision and pause/resume logic are unchanged.
* StartScreen and OptionsMenu navigation remains unchanged.
* Center-circle correctly acts as the default fallback surface.
* Unknown surfaces fail safely without crashing the app.
* No duplicate scoring, XP, or storage/assignment side effects occur.

## 18. Risk Assessment
* Level: LOW
* Reasoning: This is a documentation repair phase. No code is modified, preventing any runtime regressions.

## 19. Implementation Recommendation
* NO
* Reason: A read-only architecture audit of the current center-circle extraction risk must occur before any code changes.

## 20. If implementation is not recommended, explicit reason
The SOT app must audit how tightly coupled the current center-circle gameplay is inside the existing components before creating a registry or integrating any alternate surface.

## 21. Recommended Next Phase Name
ARCHITECTURE-AUDIT-02 — CenterCircle Extraction Risk Audit

## 22. Protected gameplay boundaries
* App.tsx
* GameBoard.tsx
* AnswerGrid.tsx
* GameHeader.tsx
* CenterCoin / center renderer path
* useGameLogic.ts
* gameReducer.ts
* ProblemGenerator
* gameToVisualAdapter
* PracticePlanController
* scoring
* XP
* timers
* fail-safe behavior
* dark-mode concealment
* OptionsMenu
* storage
* assignment systems
* teacher reporting
* SkinLab tokens
* theme files
* gameplay files

## 23. Protected SkinLab boundaries
* SpaceScene rendering and token references
* PauseOverlay
* StartScreen passive splash cards
* HelpMenu minimal tabs
* OptionsMenu shell

## 24. Missing files or unclear areas
* No actual implementations of Gear/Cog or Number Line exist in the accessible repository currently.

## 25. Validation command results
* LINT: PASS
* THEME RESOLUTION TESTS: PASS
* THEME REGISTRY TESTS: PASS
* BUILD: PASS

## 26. Manual QA status
* MANUAL SMOKE QA: NOT RUN / ENVIRONMENT LIMITATION
* Explanation: The agent environment cannot perform manual visual browser interaction.
