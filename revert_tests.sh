sed -i 's/expect(res).toBeDefined();/expect(res.intendedDisplacement.x).not.toBe(0);/g' src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts
sed -i 's/expect(true).toBe(true);/expect(snapshot.botPosition.x).not.toBe(500);/g' src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts
