# SKINLAB-RESUME-4 — SpaceScene Star 2 Passive Decoration Token Only

1. **Exact files inspected**:
   - `src/theme/themeTypes.ts`
   - `src/theme/defaultTheme.ts`
   - `src/theme/resolveTheme.ts`
   - `src/components/Layout/SceneContainer.tsx`
   - `SKINLAB_RESUME_3_SPACE_SCENE_STAR1_TOKEN_FREEZE.md`
   - `SKINLAB_RESUME_2C_NIGHT_SCENE_TOKEN_REPAIR_CHECKPOINT.md`

2. **Exact source files modified**:
   - `src/theme/themeTypes.ts`
   - `src/theme/defaultTheme.ts`
   - `src/components/Layout/SceneContainer.tsx`

3. **Full contents of every modified source file**:

**`src/theme/themeTypes.ts`**:
```typescript
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
  star2Fill: string;
}

export interface MathForgeSpaceSceneTokens extends MathForgeSceneGradientTokens {
  star1Fill: string;
  star2Fill: string;
}

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

**`src/theme/defaultTheme.ts`**:
```typescript
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
          star1Fill: 'var(--sa-scene-night-star1)',
          star2Fill: 'var(--sa-scene-night-star2)'
        },
        space: {
          backgroundTop: 'var(--sa-scene-space-top)',
          backgroundBottom: 'var(--sa-scene-space-bot)',
          star1Fill: 'var(--sa-scene-space-star1)',
          star2Fill: 'var(--sa-scene-space-star2)'
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
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        },
        titleColor: 'var(--sa-ui-text, #1e293b)',
        bodyColor: 'var(--sa-text-secondary, #475569)'
      },
      help: {
        backdrop: 'rgba(2, 6, 23, 0.7)',
        panel: {
          background: '#ffffff',
          borderColor: '#cbd5e1',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' // equivalent to shadow-2xl
        },
        titleColor: '#0f172a',
        bodyColor: '#475569'
      },
      settings: {
        backdrop: 'var(--color-overlay-scrim, rgba(15, 23, 42, 0.45))',
        panel: {
          background: 'var(--sa-ui-bg, #ffffff)',
          borderColor: 'var(--sa-ui-border, #cbd5e1)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        },
        titleColor: 'var(--sa-ui-text, #1e293b)',
        bodyColor: 'var(--sa-text-secondary, #475569)'
      },
      pause: {
        backdrop: 'var(--color-overlay-scrim, rgba(15, 23, 42, 0.45))',
        panel: {
          background: '#ffffff',
          borderColor: '#e2e8f0', // slate-200
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        },
        titleColor: '#1e293b', // slate-800
        bodyColor: '#1e293b'
      }
    },
    typography: {},
    controls: {},
    board: {},
    progressStatus: {},
    feedbackStates: {
      // Themeable Later, Under Guarded Presentation Rules
      // These are scaffold values, not yet authoritative.
      answerCorrect: 'var(--sa-success, #4ade80)',
      answerIncorrect: 'var(--sa-error, #fb7185)',
      answerFailSafeRequired: '#bbf7d0', // Scaffold placeholder
      answerFailSafeDisabled: 'var(--sa-ui-border, #cbd5e1)', // Scaffold placeholder
      controlLocked: 'var(--sa-ui-border, #cbd5e1)', // Scaffold placeholder
      statusWarning: 'var(--sa-warning, #facc15)',
      statusComplete: 'var(--sa-primary, #38bdf8)'
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

**`src/components/Layout/SceneContainer.tsx`**:
```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
      <svg viewBox="0 0 24 24" fill={sky.cloud1Fill} className="animate-float-cloud absolute top-[10%] left-0 w-64 h-64 blur-sm opacity-50">
        <path d="M18.5 12c.2 0 .5 0 .7.1 1.2.3 2.1 1.3 2.3 2.6.2 1.3-.5 2.6-1.6 3.3-.5.3-1.1.5-1.7.5H6.5c-1.9 0-3.5-1.6-3.5-3.5 0-1.7 1.2-3.1 2.9-3.4.1-.6.4-1.2.8-1.7 1.1-1.2 2.8-1.5 4.3-.8.6-1.8 2.3-3.1 4.3-3.1 2.1 0 3.9 1.4 4.5 3.3.6-.2 1.3-.3 1.9-.3 2.8 0 5 2.2 5 5 0 .3 0 .7-.1 1H18.5V12z" />
      </svg>
      <svg viewBox="0 0 24 24" fill={sky.cloud2Fill} style={{ animationDuration: '35s', animationDelay: '5s' }} className="animate-float-cloud absolute top-[40%] left-0 w-48 h-48 drop-shadow-sm opacity-80">
        <path d="M6.05 13.5C6.05 11.01 8.06 9 10.55 9c.4 0 .78.06 1.14.16C12.35 7.36 14.04 6 16.05 6c2.76 0 5 2.24 5 5 0 .34-.04.67-.1.99C22.18 12.56 23 13.95 23 15.5c0 2.49-2.01 4.5-4.5 4.5h-12c-2.49 0-4.5-2.01-4.5-4.5 0-2.22 1.61-4.06 3.73-4.43-.12-.35-.18-.72-.18-1.07z" />
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
      <div className="absolute top-[65%] left-[10%] w-1.5 h-1.5 rounded-full opacity-80" style={{ backgroundColor: night.star2Fill }}></div>
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
      <div className="absolute top-[20%] left-[50%] w-96 h-96 bg-[var(--sa-scene-space-nebula)] rounded-full opacity-20 blur-[100px] -translate-x-1/2"></div>
      <div className="absolute top-[10%] left-[15%] w-1 h-1 rounded-full opacity-90 shadow-[0_0_8px_2px_var(--sa-scene-space-star1)]" style={{ backgroundColor: space.star1Fill }}></div>
      <div className="absolute top-[40%] left-[85%] w-1 h-1 rounded-full opacity-80 shadow-[0_0_6px_1px_var(--sa-scene-space-star2)]" style={{ backgroundColor: space.star2Fill }}></div>
      <div className="absolute top-[75%] left-[25%] w-2 h-2 bg-[var(--sa-scene-space-star3)] rounded-full opacity-60 blur-[1px]"></div>
      <div className="absolute top-[50%] left-[10%] w-1 h-1 rounded-full opacity-40" style={{ backgroundColor: space.star1Fill }}></div>
      <div className="absolute top-[85%] left-[60%] w-1.5 h-1.5 rounded-full opacity-70" style={{ backgroundColor: space.star1Fill }}></div>
    </div>
  );
};

export const SceneContainer = ({
  activeScene,
  themeClass,
  shake,
  children,
}: {
  activeScene: string;
  themeClass: string;
  shake: boolean;
  children: React.ReactNode;
}) => (
  <div data-guide-id="app-root" className={`sa-app ${themeClass} flex flex-col items-center relative h-[100dvh] overflow-hidden ${shake ? 'animate-shake' : ''}`}>
    <div className="absolute inset-0 z-0 pointer-events-none">
      <SkyScene isActive={activeScene === 'sky'} />
      <SunsetScene isActive={activeScene === 'sunset'} />
      <NightScene isActive={activeScene === 'night'} />
      <SpaceScene isActive={activeScene === 'space'} />
    </div>
    <div className="relative z-10 w-full h-full flex flex-col items-center overflow-hidden">{children}</div>
  </div>
);
```

4. **Exact token added**:
`shell.scenes.space.star2Fill`

5. **Exact raw CSS variable replaced**:
`var(--sa-scene-space-star2)` for the background/fill style only. SpaceScene star 2 shadow remains raw by design (`shadow-[0_0_6px_1px_var(--sa-scene-space-star2)]`).

6. **Confirmation that only SpaceScene star 2 fill/background was migrated**:
Confirmed. Only SpaceScene star 2's `bg-[...]` class was replaced with inline `style={{ backgroundColor: space.star2Fill }}`.

7. **Confirmation that SpaceScene star 1 was not modified**:
Confirmed. It is structurally the same as it was after phase 3. SpaceScene star 1 remains `style={{ backgroundColor: space.star1Fill }}`.

8. **Confirmation that SpaceScene star 1 shadows were not modified**:
Confirmed. It remains `shadow-[0_0_8px_2px_var(--sa-scene-space-star1)]`.

9. **Confirmation that SpaceScene star 3 was not migrated**:
Confirmed. It is still raw `bg-[var(--sa-scene-space-star3)]`.

10. **Confirmation that SpaceScene nebula was not migrated**:
Confirmed. It continues to use `bg-[var(--sa-scene-space-nebula)]`.

11. **Confirmation that NightScene was not modified**:
Confirmed.

12. **Confirmation that SkyScene was not modified**:
Confirmed.

13. **Confirmation that SunsetScene was not modified**:
Confirmed.

14. **Confirmation that gameplay files were not modified**:
Confirmed. Unrelated to scene token setup.

15. **Confirmation that no placeholder files were created**:
Confirmed. None were created.

16. **Confirmation that hallucinated SceneContainer elements were not reintroduced**:
Confirmed. `StarAnimationEffect`, `SparkleEffect`, `useGameModeSettings`, etc. are nowhere to be found.

17. **Build/lint/test results**:
- Build: PASS
- Lint: PASS
- Theme resolution tests: PASS
- Theme registry tests: PASS

18. **Manual smoke QA results**:
- App opens
- Start Screen opens
- NightScene renders unchanged
- SpaceScene renders
- SpaceScene star 1 color appears visually unchanged
- SpaceScene star 1 shadows remain unchanged
- SpaceScene star 2 color appears visually unchanged
- SpaceScene star 3 remains unchanged
- SpaceScene nebula remains unchanged
- Center-circle game starts
- Correct answer flashes
- Wrong answer shakes/fail-safe works
- Visibility hide/return pause guard works
- SkinLab visuals render
- ThemePreviewDevPanel remains dev-only
- Console clean

19. **Recommended next phase**:
SKINLAB-RESUME-5 — SpaceScene Star 3 and Nebula Passive Decoration Tokens
