# SKINLAB-RESUME-2C — NightScene Token Repair Checkpoint

## 1. Accepted Current State
SKINLAB-RESUME-2R2 is accepted.
NightScene star1Fill is accepted.
NightScene star2Fill is accepted.
NightScene passive star colors are now routed through MathForgeThemeTokens.

## 2. Correct Current Token State
```ts
export interface MathForgeNightSceneTokens extends MathForgeSceneGradientTokens {
  star1Fill: string;
  star2Fill: string;
}
```

```ts
night: {
  backgroundTop: 'var(--sa-scene-night-top)',
  backgroundBottom: 'var(--sa-scene-night-bot)',
  star1Fill: 'var(--sa-scene-night-star1)',
  star2Fill: 'var(--sa-scene-night-star2)'
}
```

## 3. Correct SceneContainer Baseline
The true current baseline does **not** include:
- StarAnimationEffect
- SparkleEffect
- useGameModeSettings
- distractors prop/rendering inside SceneContainer

Future agents must not reintroduce those unless separately authorized by PM and proven from current repository source.

## 4. Rejected Attempts Summary
SKINLAB-RESUME-2 was rejected because SceneContainer.tsx drifted beyond authorized scope.
SKINLAB-RESUME-2R was rejected because placeholder files were created.
SKINLAB-RESUME-2R2 was accepted because it reconciled the baseline and restored the true repository structure.

## 5. Protected Boundary
Future SkinLab work must not touch:
- AnswerGrid
- GameBoard
- GameHeader
- useGameLogic
- gameReducer
- timing service
- sound hook
- Fail-Safe visuals
- Dark Mode concealment
- scoring / XP / lesson progression
- production theme switcher
- persistent theme selection
- MotionLab
- Play Surface Registry

## 6. Recommended Next Phase
SKINLAB-RESUME-3 — SpaceScene Star 1 Passive Decoration Token Only

Implementation is not authorized until this checkpoint is accepted.
