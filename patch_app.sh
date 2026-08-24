cat << 'INNER' > tmp_testapp.ts
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
      translate: () => {}, closePath: () => {}, stroke: () => {}, moveTo: () => {}, lineTo: () => {}
    } as any);
  }
  useEffect(() => {
    onMount(api);
  }, [api]);
  return null;
}
INNER
sed -i -e '/function TestApp({/,/^}/c\//tmp_testapp_marker' src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts
sed -i -e '/\/tmp_testapp_marker/r tmp_testapp.ts' -e '/\/tmp_testapp_marker/d' src/games/circuit-climb/bot-ai-v2/botAI.v2.test.ts
