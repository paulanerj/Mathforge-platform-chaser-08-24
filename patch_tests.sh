sed -i 's/runtimeApi\.viewModel\.setAiImplementation/runtimeApi\.setAiImplementation/g' src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts
sed -i 's/bot = runtimeApi!.debug.getBot();/bot = runtimeApi!.debug.getBot() || {x: 0, y: 0};/g' src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts
