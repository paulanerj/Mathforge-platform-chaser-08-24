const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/showViewSettings: boolean;/, "showViewSettings: boolean;\n  showSumToCue: boolean;");
content = content.replace(/const \[showViewSettings, setShowViewSettings\] = useState\(false\);/, "const [showViewSettings, setShowViewSettings] = useState(false);\n  const [showSumToCue, setShowSumToCue] = useState(true);");

content = content.replace(/showViewSettings,\n      showConfig/, "showViewSettings,\n      showSumToCue,\n      showConfig");

content = content.replace(/      debugGetResolveAt: \(\) => resolveAt,/, "      debugGetResolveAt: () => resolveAt,\n      setShowSumToCue: (v: boolean) => setShowSumToCue(v),");
content = content.replace(/exportViewConfig,\n    setShowConfig,/, "exportViewConfig,\n    setShowConfig,\n    setShowSumToCue: (v: boolean) => setShowSumToCue(v),");

fs.writeFileSync(path, content);
