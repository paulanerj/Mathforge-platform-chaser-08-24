# MATHFORGE SKINLAB — SKIN-3P READINESS PLAN

## Current Contract State
The theme architecture successfully supports a clean foundation structure containing standard color and dimension tokens renamed logically to `MathForgeThemeTokens`. Explicit semantic groups exist for four scenes (`MathForgeSkySceneTokens`, `MathForgeSunsetSceneTokens`, `MathForgeNightSceneTokens`, `MathForgeSpaceSceneTokens`) and the Start Screen (`MathForgeStartScreenTokens`). No live rendering bugs exist. Visuals are cleanly decoupled between CSS ownership and early theme-managed passive components.

## Remaining Scaffold-Only Groups
The following groups are still defined as generic `Record<string, string>` and explicitly isolated via documentation comments to prevent un-audited usage:
- `panels`
- `typography`
- `controls`
- `board`
- `progressStatus`
- `modePresentation`
- `effects`

## Recommended Next Semantic Surface
### Safest Option: Start Screen Passive Tokens Continuation
We should resume defining passive generic Start Screen components, such as defining tokens for the splash-card border radius or the main title gradient (if safe and straightforward).

### Alternative: NightScene/SpaceScene Decorations
Alternatively, addressing the NightScene star fill array (`--sa-scene-night-star1`, `--sa-scene-night-star2`) offers a highly localized, completely passive visual migration similar to what was achieved with the Sunset and Sky scenes.

## Recommendation
**Start Screen Passive Tokens / Safe Container Shells Continuation.**
Since we have achieved robust success mapping passive scene-level properties and early Start Screen bounding dimensions (textShadow, boxShadow), expanding to the non-gameplay structural frames (Start Screen or non-gameplay Help/Menu shell containers) minimizes the risk profile.

## Why This Is Safe
The Start Screen and its bounding structural panels do not overlap with or risk disruption of intense gameplay state machinery (such AnswerGrid or ParticleSystems). A migration here serves as an ideal intermediate step proving the theme contract is capable of managing broader UI structural layout rules (borders, padding, basic shapes) without jeopardizing the game core. 

## Files Likely Needed
- `src/theme/themeTypes.ts`
- `src/theme/defaultTheme.ts`
- `src/theme/resolveTheme.ts`
- `src/components/UI/StartScreen.tsx` 
- `src/index.css` (for baseline value extraction, without editing)

## Explicit Non-Goals
SKIN-3P should not yet:
- migrate live components (gameplay surfaces, answering grids)
- add theme switcher
- add alternate theme
- add assets
- change CSS
- touch gameplay logic
