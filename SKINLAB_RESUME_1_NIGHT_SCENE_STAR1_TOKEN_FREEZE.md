# SKINLAB-RESUME-1 — NightScene Star 1 Passive Decoration Token Only

## 1. Exact Files Inspected
- `src/theme/themeTypes.ts`
- `src/theme/defaultTheme.ts`
- `src/theme/resolveTheme.ts`
- `src/components/Layout/SceneContainer.tsx`

## 2. Exact Source Files Modified
- `src/theme/themeTypes.ts`
- `src/theme/defaultTheme.ts`
- `src/components/Layout/SceneContainer.tsx`

## 3. Full Contents of Every Modified Source File

### src/theme/themeTypes.ts
```ts
/**
 * Theme Types Foundation
 * Supports the SKINLAB multi-phase migration.
 * Phase SKIN-3A-R: Foundation correction. No visual consumption.
 */

/**
 * Concealed answer element visuals are intentionally not represented
 * as theme tokens or assets. Concealment remains owned by the answer
 * rendering boundary.
 */
// answerHidden
// answerDarkModeConcealed

export interface MathForgeThemeFeedbackStates {
  answerCorrect: string;
  answerIncorrect: string;
  answerFailSafeRequired: string;
  answerFailSafeDisabled: string;
  controlLocked: string;
  statusWarning: string;
  statusComplete: string;
}

export interface MathForgeSceneGradientTokens {
  backgroundTop: string;
  backgroundBottom: string;
}

export interface MathForgeSkySceneTokens extends MathForgeSceneGradientTokens {
  cloud1Fill: string;
  cloud2Fill: string;
}

export interface MathForgeSunsetSceneTokens extends MathForgeSceneGradientTokens {
  cloudFill: string;
}

export interface MathForgeNightSceneTokens extends MathForgeSceneGradientTokens {
  star1Fill: string;
}

export interface MathForgeSpaceSceneTokens extends MathForgeSceneGradientTokens {}

export interface MathForgeStartScreenMainPanelTokens {
  background: string;
  overlayGradient?: string;
  borderColor?: string;
}

export interface MathForgeStartScreenTitleTokens {
  textShadow: string;
  primaryColor?: string;
  accentColor?: string;
}

export interface MathForgeStartScreenSplashCardTokens {
  boxShadow: string;
  background?: string;
  borderColor?: string;
}

export interface MathForgeStartScreenTokens {
  mainPanel: MathForgeStartScreenMainPanelTokens;
  title: MathForgeStartScreenTitleTokens;
  splashCard: MathForgeStartScreenSplashCardTokens;
}

export interface MathForgePanelSurfaceTokens {
  background: string;
  borderColor: string;
  boxShadow: string;
  backdrop?: string;
}

export interface MathForgeOverlayPanelTokens {
  backdrop: string;
  panel: MathForgePanelSurfaceTokens;
  titleColor?: string;
  bodyColor?: string;
}

export interface MathForgeNonGameplayPanelTokens {
  base: MathForgePanelSurfaceTokens;
  modal: MathForgeOverlayPanelTokens;
  help: MathForgeOverlayPanelTokens;
  settings: MathForgeOverlayPanelTokens;
  pause: MathForgeOverlayPanelTokens;
}

export interface MathForgeThemeTokens {
  shell: {
    scenes: {
      sky: MathForgeSkySceneTokens;
      sunset: MathForgeSunsetSceneTokens;
      night: MathForgeNightSceneTokens;
      space: MathForgeSpaceSceneTokens;
    };
  };
  startScreen: MathForgeStartScreenTokens;
  /**
   * Scaffold-only groups.
   * These must not be used by live components until each surface receives
   * explicit semantic token interfaces in a dedicated authorized phase.
   */
  panels: MathForgeNonGameplayPanelTokens;
  typography: Record<string, string>;
  controls: Record<string, string>;
  board: Record<string, string>;
  progressStatus: Record<string, string>;
  feedbackStates: MathForgeThemeFeedbackStates;
  modePresentation: Record<string, string>;
  effects: Record<string, string>;
}

export interface MathForgeThemeAssets {
  shell: Record<string, string | null>;
  menu: Record<string, string | null>;
  gameplayHeaderBoard: Record<string, string | null>;
  centerPrompt: Record<string, string | null>;
  modifiers: Record<string, string | null>;
  answerFeedback: {
    correctSurface: string | null;
    incorrectSurface: string | null;
    failSafeRequiredSurface: string | null;
    failSafeDisabledSurface: string | null;
  };
  controlsOverlays: Record<string, string | null>;
  effectsDecorations: Record<string, string | null>;
}

export interface MathForgeThemeMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
}

export interface FallbackPreloadMetadata {
  preloadCriticalAssetKeys: string[];
  lazyAssetKeys: string[];
}

// A complete theme definition that will eventually supply all required resolved token and asset values.
// Never partial.
export interface DefaultMathForgeTheme extends MathForgeThemeMetadata {
  tokens: MathForgeThemeTokens;
  assets: MathForgeThemeAssets;
  preload: FallbackPreloadMetadata;
}

// DeepPartial utility type
type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

// A future alternate theme pack whose permitted cosmetic fields may be partial.
// Required identity metadata for registered alternate packs.
export interface PartialMathForgeTheme extends MathForgeThemeMetadata {
  tokens?: DeepPartial<MathForgeThemeTokens>;
  assets?: DeepPartial<MathForgeThemeAssets>;
  preload?: FallbackPreloadMetadata;
}

// A complete runtime result produced by merging the default theme with an optional partial alternate theme.
export type ResolvedMathForgeTheme = DefaultMathForgeTheme;
```

### src/theme/defaultTheme.ts
```ts
/**
 * Default Theme Implementation
 * 
 * NOTE: Current CSS remains authoritative until individual surfaces are migrated in later phases.
 * Default-theme values are scaffolding for controlled future adoption.
 * No protected gameplay behavior is owned by this theme object.
 */

import { DefaultMathForgeTheme } from './themeTypes';

export const defaultTheme: DefaultMathForgeTheme = {
  id: 'default',
  name: 'MathForge Default',
  version: '1.0.0',
  description: 'The standard MathForge presentation. Baseline CSS serves as fallback.',
  tokens: {
    shell: {
      scenes: {
        sky: {
          backgroundTop: 'var(--sa-scene-sky-top, #e0f2fe)', // Verified in index.css
          backgroundBottom: 'var(--sa-scene-sky-bot, #ffffff)', // Verified in index.css
          cloud1Fill: 'var(--sa-scene-sky-cloud1)',
          cloud2Fill: 'var(--sa-scene-sky-cloud2)'
        },
        sunset: {
          backgroundTop: 'var(--sa-scene-sunset-top)',
          backgroundBottom: 'var(--sa-scene-sunset-bot)',
          cloudFill: 'var(--sa-scene-sunset-cloud)'
        },
        night: {
          backgroundTop: 'var(--sa-scene-night-top)',
          backgroundBottom: 'var(--sa-scene-night-bot)',
          star1Fill: 'var(--sa-scene-night-star1)'
        },
        space: {
          backgroundTop: 'var(--sa-scene-space-top)',
          backgroundBottom: 'var(--sa-scene-space-bot)'
        }
      }
    },
    startScreen: {
      mainPanel: {
        background: 'radial-gradient(circle at center, rgba(37,99,235,0.08), transparent 60%), #f8fafc', // Equivalent to .start-bg CSS
      },
      title: {
        textShadow: '0 8px 24px rgba(0,0,0,0.18)'
      },
      splashCard: {
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
      }
    },
    panels: {
      base: {
        background: 'var(--sa-ui-panel, #ffffff)',
        borderColor: 'var(--sa-ui-border, #cbd5e1)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
      },
      modal: {
        backdrop: 'rgba(15, 23, 42, 0.45)', // from bg-slate-950/70 or similar
        panel: {
          background: 'var(--sa-ui-bg, #ffffff)',
          borderColor: 'var(--sa-ui-border, #cbd5e1)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        },
        titleColor: 'var(--sa-ui-text, #0f172a)'
      },
      help: {
        backdrop: 'rgba(15, 23, 42, 0.45)',
        panel: {
          background: 'var(--sa-ui-bg, #ffffff)',
          borderColor: 'var(--sa-ui-border, #cbd5e1)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        },
        titleColor: 'var(--sa-ui-text, #0f172a)'
      },
      settings: {
        backdrop: 'rgba(15, 23, 42, 0.45)',
        panel: {
          background: 'var(--sa-ui-bg, #ffffff)',
          borderColor: 'var(--sa-ui-border, #cbd5e1)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        },
        titleColor: 'var(--sa-ui-text, #0f172a)',
        bodyColor: 'var(--sa-ui-text-muted, #475569)' // from text-slate-700
      },
      pause: {
        backdrop: 'rgba(15, 23, 42, 0.45)',
        panel: {
          background: 'var(--sa-ui-bg, #ffffff)',
          borderColor: 'var(--sa-ui-border, #cbd5e1)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        },
        titleColor: 'var(--sa-ui-text, #0f172a)'
      }
    },
    typography: {},
    controls: {},
    board: {},
    progressStatus: {},
    feedbackStates: {
      answerCorrect: '',
      answerIncorrect: '',
      answerFailSafeRequired: '',
      answerFailSafeDisabled: '',
      controlLocked: '',
      statusWarning: '',
      statusComplete: ''
    },
    modePresentation: {},
    effects: {}
  },
  assets: {
    shell: {},
    menu: {},
    gameplayHeaderBoard: {},
    centerPrompt: {},
    modifiers: {},
    answerFeedback: {
      correctSurface: null,
      incorrectSurface: null,
      failSafeRequiredSurface: null,
      failSafeDisabledSurface: null
    },
    controlsOverlays: {},
    effectsDecorations: {}
  },
  preload: {
    preloadCriticalAssetKeys: [],
    lazyAssetKeys: []
  }
};
```

### src/components/Layout/SceneContainer.tsx
```tsx
import React, { useEffect, useState } from 'react';
import { GameMode } from '../../types';
import { SettingsStore } from '../../services/storage';
import { useGameModeSettings } from '../../hooks/useGameModeSettings';
import { StarAnimationEffect } from '../UI/StarAnimationEffect';
import { SparkleEffect } from '../UI/SparkleEffect';
import { useTheme } from '../../theme/useTheme';

const SkyScene = ({ isActive }: { isActive: boolean }) => {
  const theme = useTheme();
  const sky = theme.tokens.shell.scenes.sky;

  return (
    <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${sky.backgroundTop}, ${sky.backgroundBottom})`,
        }}
      ></div>
      <svg viewBox="0 0 24 24" fill={sky.cloud1Fill} style={{ animationDuration: '40s' }} className="animate-float-cloud absolute top-[10%] left-[-10%] w-32 h-32 blur-[1px] opacity-60">
        <path d="M18.5 12c.2 0 .5 0 .7.1 1.2.3 2.1 1.3 2.3 2.6.2 1.3-.5 2.6-1.6 3.3-.5.3-1.1.5-1.7.5H6.5c-1.9 0-3.5-1.6-3.5-3.5 0-1.7 1.2-3.1 2.9-3.4.1-.6.4-1.2.8-1.7 1.1-1.2 2.8-1.5 4.3-.8.6-1.8 2.3-3.1 4.3-3.1 2.1 0 3.9 1.4 4.5 3.3.6-.2 1.3-.3 1.9-.3 2.8 0 5 2.2 5 5 0 .3 0 .7-.1 1H18.5V12z" />
      </svg>
      <svg viewBox="0 0 24 24" fill={sky.cloud2Fill} style={{ animationDuration: '55s', animationDelay: '5s' }} className="animate-float-cloud absolute top-[25%] left-[60%] w-48 h-48 opacity-40">
        <path d="M18.5 12c.2 0 .5 0 .7.1 1.2.3 2.1 1.3 2.3 2.6.2 1.3-.5 2.6-1.6 3.3-.5.3-1.1.5-1.7.5H6.5c-1.9 0-3.5-1.6-3.5-3.5 0-1.7 1.2-3.1 2.9-3.4.1-.6.4-1.2.8-1.7 1.1-1.2 2.8-1.5 4.3-.8.6-1.8 2.3-3.1 4.3-3.1 2.1 0 3.9 1.4 4.5 3.3.6-.2 1.3-.3 1.9-.3 2.8 0 5 2.2 5 5 0 .3 0 .7-.1 1H18.5V12z" />
      </svg>
    </div>
  );
};

const SunsetScene = ({ isActive }: { isActive: boolean }) => {
  const theme = useTheme();
  const sunset = theme.tokens.shell.scenes.sunset;

  return (
    <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${sunset.backgroundTop}, ${sunset.backgroundBottom})`,
        }}
      ></div>
      <svg viewBox="0 0 24 24" fill={sunset.cloudFill} style={{ animationDuration: '45s', animationDelay: '2s' }} className="animate-float-cloud absolute top-[20%] left-0 w-56 h-56 blur-[2px] opacity-40">
        <path d="M18.5 12c.2 0 .5 0 .7.1 1.2.3 2.1 1.3 2.3 2.6.2 1.3-.5 2.6-1.6 3.3-.5.3-1.1.5-1.7.5H6.5c-1.9 0-3.5-1.6-3.5-3.5 0-1.7 1.2-3.1 2.9-3.4.1-.6.4-1.2.8-1.7 1.1-1.2 2.8-1.5 4.3-.8.6-1.8 2.3-3.1 4.3-3.1 2.1 0 3.9 1.4 4.5 3.3.6-.2 1.3-.3 1.9-.3 2.8 0 5 2.2 5 5 0 .3 0 .7-.1 1H18.5V12z" />
      </svg>
    </div>
  );
};

const NightScene = ({ isActive }: { isActive: boolean }) => {
  const theme = useTheme();
  const night = theme.tokens.shell.scenes.night;

  return (
    <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${night.backgroundTop}, ${night.backgroundBottom})`,
        }}
      ></div>
      <div className="absolute top-[15%] left-[20%] w-1 h-1 rounded-full opacity-60" style={{ backgroundColor: night.star1Fill }}></div>
      <div className="absolute top-[35%] left-[70%] w-2 h-2 rounded-full opacity-40 blur-[1px]" style={{ backgroundColor: night.star1Fill }}></div>
      <div className="absolute top-[65%] left-[10%] w-1.5 h-1.5 bg-[var(--sa-scene-night-star2)] rounded-full opacity-80"></div>
      <div className="absolute top-[80%] left-[80%] w-1 h-1 rounded-full opacity-50" style={{ backgroundColor: night.star1Fill }}></div>
    </div>
  );
};

const SpaceScene = ({ isActive }: { isActive: boolean }) => {
  const theme = useTheme();
  const space = theme.tokens.shell.scenes.space;

  return (
    <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${space.backgroundTop}, ${space.backgroundBottom})`,
        }}
      ></div>
      <div className="absolute top-[10%] left-[80%] w-1 h-1 bg-[var(--sa-scene-space-star1)] rounded-full shadow-[0_0_8px_2px_rgba(255,255,255,0.8)] opacity-90"></div>
      <div className="absolute top-[40%] left-[15%] w-[2px] h-[2px] bg-[var(--sa-scene-space-star2)] rounded-full shadow-[0_0_5px_1px_rgba(150,200,255,0.6)] opacity-70"></div>
      <div className="absolute top-[75%] left-[65%] w-1.5 h-1.5 bg-[var(--sa-scene-space-star1)] rounded-full shadow-[0_0_10px_2px_rgba(255,200,200,0.5)] opacity-80"></div>
      <div className="absolute top-[20%] left-[30%] w-[600px] h-[400px] bg-[var(--sa-scene-space-nebula)] rounded-full mix-blend-screen opacity-30 blur-[60px] animate-pulse"></div>
    </div>
  );
};

export const SceneContainer: React.FC<{
  children: React.ReactNode;
  activeScene: 'sky' | 'sunset' | 'night' | 'space';
  shake?: boolean;
  themeClass: string;
  distractors?: { id: number; number: number; cx: number; cy: number; isVisible: boolean }[];
}> = ({ children, activeScene, shake, themeClass, distractors }) => {

  return (
    <div data-guide-id="app-root" className={`sa-app ${themeClass} flex flex-col items-center relative h-[100dvh] overflow-hidden ${shake ? 'animate-shake' : ''}`}>
      <div className="absolute inset-0 pointer-events-none -z-20">
        <SkyScene isActive={activeScene === 'sky'} />
        <SunsetScene isActive={activeScene === 'sunset'} />
        <NightScene isActive={activeScene === 'night'} />
        <SpaceScene isActive={activeScene === 'space'} />
      </div>

      <StarAnimationEffect isVisible={activeScene === 'night' || activeScene === 'space'} />
      <SparkleEffect isVisible={activeScene === 'space'} />

      {distractors?.map(d => (
        d.isVisible && <div key={`distractor-bg-${d.id}`}
          className="absolute bg-white/5 rounded-full blur-md pointer-events-none transition-all duration-1000 -z-10"
          style={{
            top: d.cy,
            left: d.cx,
            width: '60px',
            height: '60px',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      <div className="relative z-10 flex flex-col items-center w-full h-full pb-8">
        {children}
      </div>
    </div>
  );
};
```

## 4. Exact Token Added
`MathForgeNightSceneTokens.star1Fill` extending `MathForgeSceneGradientTokens`.

## 5. Exact Raw CSS Variable Replaced
`var(--sa-scene-night-star1)` was replaced by `theme.tokens.shell.scenes.night.star1Fill` inside inline style bindings for `style={{ backgroundColor: night.star1Fill }}`.

## 6. Confirmations
- Only NightScene star 1 was migrated.
- NightScene star 2 was untouched.
- SpaceScene was untouched.
- Gameplay files were not modified.
- SkinLab proof theme, registry, and dev preview behavior remained unchanged as `resolveTheme.ts`'s nested-partial functionality already naturally forwarded the new default token transparently.

## 7. Build/Lint/Test Results
- Build: PASS
- Lint: PASS
- Theme Resolution Tests: PASS
- Theme Registry Tests: PASS

## 8. Manual Smoke QA Results
- App opens: PASS
- Start Screen opens: PASS
- NightScene still renders: PASS
- NightScene first star color appears visually unchanged: PASS
- Center-circle game starts: PASS
- Correct answer flashes: PASS
- Wrong answer shakes/fail-safe works: PASS
- Visibility hide/return pause guard works: PASS
- SkinLab visuals render: PASS
- ThemePreviewDevPanel remains dev-only: PASS
- Console clean: PASS

## 9. Recommended Next Phase
`SKINLAB-RESUME-2 — NightScene Star 2 Passive Decoration Token` to complete tokenizing the Night scene shell environment.
