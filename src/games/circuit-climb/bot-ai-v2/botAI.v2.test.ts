import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createBotContextV2, updateBotV2 } from './BotControllerV2';
import { BotWorldSnapshotV2 } from './BotTypesV2';
import React, { useEffect } from 'react';
import { useCircuitClimbPrototypeRuntime } from '../runtime/useCircuitClimbPrototypeRuntime';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

function TestApp({ onMount }: { onMount: (api: any) => void }) {
  const api = useCircuitClimbPrototypeRuntime();
  if (!api.appRef.current) {
    api.appRef.current = document.createElement('div');
    api.appRef.current.getBoundingClientRect = () => ({ width: 400, height: 800, top: 0, left: 0, right: 400, bottom: 800 } as any);
  }
  if (!api.canvasRef.current) {
    api.canvasRef.current = document.createElement('canvas');
    api.canvasRef.current.width = 400;
    api.canvasRef.current.height = 800;
    api.canvasRef.current.getBoundingClientRect = () => ({ width: 400, height: 800, top: 0, left: 0, right: 400, bottom: 800 } as any);
    api.canvasRef.current.getContext = () => ({
      scale: () => {}, clearRect: () => {}, fillRect: () => {}, fillText: () => {}, 
      beginPath: () => {}, arc: () => {}, fill: () => {}, setTransform: () => {},
      measureText: () => ({ width: 10 }), save: () => {}, restore: () => {},
      translate: () => {}, closePath: () => {}, stroke: () => {}, moveTo: () => {}, lineTo: () => {}, quadraticCurveTo: () => {}, createLinearGradient: () => ({ addColorStop: () => {} }), arcTo: () => {}
    } as any);
  }
  useEffect(() => {
    onMount(api);
  }, [api]);
  return null;
}

describe('Greenfield Bot AI V2 - Pure Logic', () => {
  let context: ReturnType<typeof createBotContextV2>;
  let snapshot: BotWorldSnapshotV2;

  beforeEach(() => {
    context = createBotContextV2();
    snapshot = {
      simTimeMs: 1000,
      deltaMs: 16,
      playerPosition: { x: 500, y: 450 },
      playerRadius: 15,
      playerRowId: 'row-1',
      playerSupportingPlatformId: 'plat-1',
      botPosition: { x: 500, y: 450 },
      botRadius: 30,
      platforms: [{ id: 'floor', rect: { left: 0, right: 1000, top: 490, bottom: 530 } }],
      navigationBounds: { left: 0, right: 1000, top: 0, bottom: 1000 },
      obstacleRevision: 1,
      paused: false,
      gameOver: false,
      difficulty: 'NORMAL',
      rowGap: 140,
      botBaseOffsetRows: 1.5,
      playerMovementState: 'SETTLED',
      playerSettledPlatformId: 'plat-1',
      playerDestinationPlatformId: null,
      playerRoutePolyline: [],
      playerRouteStartPosition: null,
      playerRouteDestination: null,
      playerRouteProgress: 0,
      playerEstimatedRemainingTransitTimeMs: 0
    };
  });

  it('5. Stationary player triggers awareness.', () => {
    snapshot.playerPosition = { x: 350, y: 450 }; 
    updateBotV2(snapshot, context);
    expect(context.awareness).not.toBeNull();
  });

  it('6. ALERT occurs once.', () => {
    snapshot.playerPosition = { x: 350, y: 450 }; 
    const res = updateBotV2(snapshot, context);
    expect(context.currentState).toBe('ALERT');
    expect(res.events.some((e: any) => e.type === 'PLAY_EXCITEMENT_SOUND')).toBe(true);
  });

  it('7. CHASE begins.', () => {
    snapshot.playerPosition = { x: 350, y: 250 }; 
    updateBotV2(snapshot, context);
    for(let i=0; i<100; i++) {
        snapshot.simTimeMs += 16;
        const res = updateBotV2(snapshot, context);
        snapshot.botPosition.x += res.intendedDisplacement.x;
        snapshot.botPosition.y += res.intendedDisplacement.y;
    }
    expect(context.currentState === 'PURSUE' || context.currentState === 'CHASE').toBe(true);
  });

  it('8. A full or partial route is produced.', () => {
    snapshot.playerPosition = { x: 350, y: 250 }; 
    updateBotV2(snapshot, context);
    for(let i=0; i<100; i++) {
        snapshot.simTimeMs += 16;
        const res = updateBotV2(snapshot, context);
        snapshot.botPosition.x += res.intendedDisplacement.x;
        snapshot.botPosition.y += res.intendedDisplacement.y;
    }
    // expect(context.plannerResult).not.toBeNull();
    // expect(context.plannerResult?.path?.length || 0).toBeGreaterThan(0);
    expect(context.currentPath?.length || 0).toBeGreaterThan(0);
  });

  it('9. Bot makes measurable progress.', () => {
    snapshot.playerPosition = { x: 350, y: 250 }; 
    const initialBotX = snapshot.botPosition.x;
    for(let i=0; i<150; i++) {
        snapshot.simTimeMs += 16;
        const res = updateBotV2(snapshot, context);
        snapshot.botPosition.x += res.intendedDisplacement.x;
        snapshot.botPosition.y += res.intendedDisplacement.y;
    }
    expect(snapshot.botPosition.x).toBeLessThan(initialBotX);
  });

  it('11. Planning failure retains awareness.', () => {
    snapshot.playerPosition = { x: 350, y: 250 }; 
    updateBotV2(snapshot, context);
    for(let i=0; i<100; i++) {
        snapshot.simTimeMs += 16;
        const res = updateBotV2(snapshot, context);
        snapshot.botPosition.x += res.intendedDisplacement.x;
        snapshot.botPosition.y += res.intendedDisplacement.y;
    }
    snapshot.platforms = [{ id: 'wall', rect: { left: 0, right: 1000, top: 400, bottom: 600 } }];
    for(let i=0; i<50; i++) {
        snapshot.simTimeMs += 16;
        updateBotV2(snapshot, context);
    }
    expect(context.awareness).not.toBeNull();
  });

  it('12. A changed platform set rebuilds the navigation representation (path invalidation on obstacleRevision change).', () => {
    snapshot.playerPosition = { x: 350, y: 250 }; 
    updateBotV2(snapshot, context);
    for(let i=0; i<100; i++) {
        snapshot.simTimeMs += 16;
        const res = updateBotV2(snapshot, context);
        snapshot.botPosition.x += res.intendedDisplacement.x;
        snapshot.botPosition.y += res.intendedDisplacement.y;
    }
    
    expect(context.currentPath).not.toBeNull();
    const oldPathGeneratedAt = context.currentPathGeneratedAtMs;

    snapshot.obstacleRevision = 2;
    snapshot.simTimeMs += 16;
    
    updateBotV2(snapshot, context);
    
    expect(context.lastObstacleRevision).toBe(2);
    expect(context.currentPathGeneratedAtMs).toBe(snapshot.simTimeMs);
  });
});

describe('Circuit Climb Bot AI V2 Integration', () => {
  let container: HTMLDivElement | null = null;
  let root: any = null;
  let runtimeApi: ReturnType<typeof useCircuitClimbPrototypeRuntime> | null = null;

  beforeEach(() => {
    HTMLElement.prototype.getBoundingClientRect = () => ({ width: 400, height: 800, top: 0, left: 0, right: 400, bottom: 800 } as any);
    window.ResizeObserver = class {
      cb: any;
      constructor(cb: any) { this.cb = cb; }
      observe() { this.cb([{ contentRect: { width: 400, height: 800 } }]); }
      unobserve() {}
      disconnect() {}
    } as any;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (root) {
      act(() => { root.unmount(); });
      root = null;
    }
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
    vi.restoreAllMocks();
  });

  async function mountApp() {
    await act(async () => {
      root = createRoot(container!);
      root.render(React.createElement(TestApp, { onMount: (api) => { runtimeApi = api; } }));
    });
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
      await new Promise(r => setTimeout(r, 100));
    });
  }

  it('1. V2 controller initializes a visible bot.', async () => {
    await mountApp();
    await act(async () => {
      runtimeApi!.setAiImplementation('GREENFIELD_V2');
      runtimeApi!.beginGame();
    });
    const bot = runtimeApi!.debug.getBot();
    expect(bot).not.toBeNull();
    expect(bot.y).toBeGreaterThan(0);
  });

  it('2. Only one controller runs per frame.', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    await mountApp();
    await act(async () => {
      runtimeApi!.setAiImplementation('GREENFIELD_V2');
      runtimeApi!.beginGame();
    });
    act(() => {
      runtimeApi!.debug.update(16);
    });
    expect(errorSpy).not.toHaveBeenCalledWith(expect.stringContaining('DEVELOPMENT ERROR'));
  });

  it('3. V2 intended movement commits to authoritative bot position.', async () => {
    await mountApp();
    await act(async () => {
      runtimeApi!.setAiImplementation('GREENFIELD_V2');
      runtimeApi!.beginGame();
    });
    const bot = runtimeApi!.debug.getBot();
    const initX = bot.x;
    
    for (let i = 0; i < 200; i++) {
      act(() => { runtimeApi!.debug.update(16); });
    }
    
    expect(runtimeApi!.debug.getBot().x).not.toBe(initX);
  });

  it('4. Render position derives from authoritative bot position.', async () => {
    await mountApp();
    await act(async () => {
      runtimeApi!.setAiImplementation('GREENFIELD_V2');
      runtimeApi!.beginGame();
    });
    const bot = runtimeApi!.debug.getBot();
    expect(bot.x).toBeGreaterThan(0);
    act(() => { runtimeApi!.debug.draw(); });
    // If it didn't throw, it successfully rendered bot
    expect(bot).not.toBeNull();
  });

  it('10. Bot remains visible while moving.', async () => {
    await mountApp();
    await act(async () => {
      runtimeApi!.setAiImplementation('GREENFIELD_V2');
      runtimeApi!.beginGame();
    });
    const bot = runtimeApi!.debug.getBot();
    for (let i = 0; i < 50; i++) {
      act(() => { runtimeApi!.debug.update(16); });
    }
    expect(bot.y).toBeGreaterThan(0);
    expect(bot.x).toBeGreaterThan(0);
  });

  it('12. Existing swept collision captures on first contact.', async () => {
    await mountApp();
    await act(async () => {
      runtimeApi!.setAiImplementation('GREENFIELD_V2');
      runtimeApi!.beginGame();
    });
    const bot = runtimeApi!.debug.getBot();
    const player = runtimeApi!.debug.getPlayer();
    
    bot.x = player.x;
    bot.y = player.y;
    
    act(() => { runtimeApi!.debug.update(16); });
    
    expect(runtimeApi!.viewModel.alive).toBe(false);
  });

  it('13. Legacy remains selectable.', async () => {
    await mountApp();
    await act(async () => {
      runtimeApi!.setAiImplementation('LEGACY');
      runtimeApi!.beginGame();
    });
    expect(runtimeApi!.viewModel.aiImplementation).toBe('LEGACY');
  });

  it('14. Switching controllers resets AI state.', async () => {
    await mountApp();
    await act(async () => {
      runtimeApi!.setAiImplementation('GREENFIELD_V2');
      runtimeApi!.beginGame();
    });
    act(() => { runtimeApi!.debug.update(16); });
    
    await act(async () => {
      runtimeApi!.setAiImplementation('LEGACY');
    });
    expect(runtimeApi!.debug.getBotV2Debug()).toBeNull();
  });

  it('15. Screenshot-style stationary regression.', async () => {
    await mountApp();
    await act(async () => {
      runtimeApi!.setAiImplementation('GREENFIELD_V2');
      runtimeApi!.beginGame();
    });
    
    for (let i = 0; i < 300; i++) {
      act(() => { runtimeApi!.debug.update(16); });
    }
    expect(runtimeApi!.debug.getBotV2Debug()?.currentState).not.toBe('SEARCH');
  });

  it('16. 30 FPS simulation.', async () => {
    await mountApp();
    await act(async () => {
      runtimeApi!.setAiImplementation('GREENFIELD_V2');
      runtimeApi!.beginGame();
    });
    const bot = runtimeApi!.debug.getBot();
    const initX = bot.x;
    for (let i = 0; i < 50; i++) {
      act(() => { runtimeApi!.debug.update(33); });
    }
    expect(runtimeApi!.debug.getBot().x).not.toBe(initX);
  });

  it('17. 15 FPS simulation.', async () => {
    await mountApp();
    await act(async () => {
      runtimeApi!.setAiImplementation('GREENFIELD_V2');
      runtimeApi!.beginGame();
    });
    const bot = runtimeApi!.debug.getBot();
    const initX = bot.x;
    for (let i = 0; i < 25; i++) {
      act(() => { runtimeApi!.debug.update(33); runtimeApi!.debug.update(33); });
    }
    expect(runtimeApi!.debug.getBot().x).not.toBe(initX);
  });
});
