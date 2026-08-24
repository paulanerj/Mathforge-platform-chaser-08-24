# MATHFORGE SKINLAB — SKIN-4A AUDIT

## Phase: Gameplay Shell / Board-Frame Visual Responsibility Audit

### Objective
Identify safe gameplay-adjacent visual shell surfaces for future tokenization without touching protected gameplay behavior.

### Files Inspected
- `src/layouts/GameLayout.tsx`
- `src/components/Game/GameBoard.tsx`
- `src/components/Game/GameHeader.tsx`
- `src/components/Game/AnswerGrid.tsx`
- `src/components/Layout/SceneContainer.tsx`
- `src/components/UI/DifficultyIndicator.tsx`

### Current Gameplay Visual Architecture
Gameplay operates within `SceneContainer` which supplies early background theme tokens. The actual game boards are framed by `GameLayout`, which establishes header, center area, answer area, and footer bands using pure Tailwind classes. `GameBoard` acts as the coordinator, feeding components like the center renderer (`CircleRenderer` or `MinimalRenderer`) and the interactive `AnswerGrid`. `GameHeader` controls the top information bar and the `DifficultyIndicator` manages manual difficulty overrides and visual displays. Currently, these structural elements rely purely on inline styles and Tailwind utility classes without tapping into `theme.tokens`.

### Visual Responsibility Matrix
| Surface | File | Styling Owner | Risk Class | Safe to Tokenize | Notes |
|---------|------|---------------|------------|------------------|-------|
| Background / Sky | `SceneContainer.tsx` | `theme.tokens.shell.scenes` | A | YES | Already tokenized safely. |
| Board Framework | `GameLayout.tsx` | Tailwind CSS | A | YES | Uninteractive structure, perfect for outer shell tokens (`tokens.board`). |
| Top Bar / Timer | `GameHeader.tsx` | Tailwind / Tailwind Colors | B | CAREFUL | Can be safely tokenized but ensuring contrast and visibility of textual values is key. |
| Header Level Indicator | `DifficultyIndicator.tsx` | Hardcoded / Tailwind | B | CAREFUL | Currently tied tightly to `DifficultyColorMapper`, override dropdown needs token alignment. |
| Center Renderer Shell | `GameBoard.tsx` -> Renderers | Components | B | CAREFUL | Cosmetic circle and center text, but needs to align conceptually with tokens without obscuring prompt digits. |
| Grid Container | `AnswerGrid.tsx` | Tailwind CSS | C | DELAY | Container is toggled via `isDark` (Dark Mode concealment). Cannot be blindly overridden without confirming Dark Mode mechanics hold. |
| Answer Buttons | `AnswerGrid.tsx` | Tailwind CSS | D | FORBIDDEN YET | Ties directly to correct/incorrect feedback, pedagogical fail-safe state coloring, and dark mode mechanics. Explicitly forbidden currently. |

### Current Theme Touchpoints
- Theme touches only non-gameplay components:
  - `SceneContainer`
  - `PauseOverlay`
  - `OptionsMenu`
  - `HelpMenu`
  - `StartScreen`
- No `theme.tokens` are currently accessed inside any `<Game...>` components or the answer grid. Thus, the gameplay boundary remains completely sealed from the custom experimental proof themes.

### Protected Behavior Boundaries
- **Answer Selection (`AnswerGrid.tsx`)**: Click-handling loops via `actions.handleAnswer` and locking during `isPaused` must remain 100% untouched.
- **Fail-Safe Logic (`AnswerGrid.tsx`)**: The visual differentiation enforcing a correct tap (`bg-green-100`, shadow highlights vs. grayscale siblings) under `state.failedCurrentStep` is absolutely critical to pedagogical integrity.
- **Dark Mode Concealment (`AnswerGrid.tsx`, `useGameLogic.tsx`)**: Dynamic application of `opacity-0 pointer-events-none` directly gates the Dark Mode mechanic.
- **Timing and Data Rendering (`GameHeader.tsx`)**: Target times and raw elapsed countdowns feed precisely off `timerDuration` and `state.elapsedTime`.
- **Difficulty Mapping (`DifficultyIndicator.tsx`)**: Direct mapping references to `DifficultyColorMapper` ensure continuous progression scaling and visual cues for the user.

### Safe First Candidate
**SKIN-4B — Gameplay Outer Shell Token Contract Only**
The next safe phase should purely establish the `tokens.board` data structures in `themeTypes.ts`, `defaultTheme.ts`, and `proofTheme.ts`. This contract step allows testing of the resolution logic for board shells (colors, outlines, gradients) WITHOUT wiring them up to the UI yet.

### Forbidden For Next Phase
- Do NOT tokenize `AnswerGrid` buttons or hitboxes.
- Do NOT touch `flashState` visuals or `failedCurrentStep` Fail-Safe components.
- Do NOT attempt to tokenize `isDark` (Dark Mode mechanics).
- Do NOT modify gameplay hooks or reducers.

### Build Result
- `npm run lint` (`tsc --noEmit`): PASS.
- `npm run build`: PASS.

### Recovery / Stability Status
The app remains entirely stable and functional natively without disruption from the recovery sequence.

### Ready For PM Review
YES.
