# SKINLAB-RESUME-6C — SpaceScene Passive Token Completion Checkpoint

## Current SpaceScene Passive Token State

The accepted current SpaceScene passive token state is:

```ts
export interface MathForgeSpaceSceneTokens extends MathForgeSceneGradientTokens {
  star1Fill: string;
  star2Fill: string;
  star3Fill: string;
  nebulaFill: string;
}
```

and:

```ts
space: {
  backgroundTop: 'var(--sa-scene-space-top)',
  backgroundBottom: 'var(--sa-scene-space-bot)',
  star1Fill: 'var(--sa-scene-space-star1)',
  star2Fill: 'var(--sa-scene-space-star2)',
  star3Fill: 'var(--sa-scene-space-star3)',
  nebulaFill: 'var(--sa-scene-space-nebula)'
}
```

`SceneContainer.tsx` consumes these four values for passive fill/background only:
- `space.star1Fill`
- `space.star2Fill`
- `space.star3Fill`
- `space.nebulaFill`

## Explicitly Documented As Not Migrated

These remain intentionally unmigrated:
- SpaceScene star 1 shadow
- SpaceScene star 2 shadow
- animation behavior
- layout / position / size / opacity / blur / transform
- MotionLab
- production theme switcher
- persistent theme selection

## Protected Boundary

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

## Hallucinated Baseline Guard

Future agents must not reintroduce:
- StarAnimationEffect
- SparkleEffect
- useGameModeSettings
- distractors prop/rendering inside SceneContainer

unless separately authorized by PM and proven from current repository source.

## Recommended Next Phase Options

- Option A: SKINLAB-RESUME-7 — SpaceScene Shadow Token Read-Only Audit
- Option B: SKINLAB-RESUME-7 — Next UI Surface Read-Only Audit

Implementation is not authorized until PM chooses one.
