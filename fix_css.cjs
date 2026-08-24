const fs = require('fs');
const path = 'src/games/circuit-climb/styles/circuit-climb.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/radial-gradient\(circle at 50% 30%, rgba\(27, 98, 138, 0\.18\), transparent 42%\),\n    rgba\(3, 6, 13, 0\.9\)/, 
  'radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.4), transparent 42%),\n    rgba(240, 246, 252, 0.9)');

css = css.replace(/border: 1px solid rgba\(91, 154, 199, 0\.32\);/, 'border: 1px solid rgba(59, 130, 246, 0.2);');
css = css.replace(/background: linear-gradient\(180deg, rgba\(10, 21, 39, 0\.98\), rgba\(5, 10, 21, 0\.98\)\);/, 
  'background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));');
css = css.replace(/inset 0 1px 0 rgba\(255, 255, 255, 0\.06\),\n    0 30px 80px rgba\(0, 0, 0, 0\.5\)/, 
  'inset 0 1px 0 rgba(255, 255, 255, 0.6),\n    0 30px 80px rgba(15, 23, 42, 0.15)');

css = css.replace(/color: var\(--cyan\);/g, 'color: #3b82f6;');
css = css.replace(/color: var\(--lime\);/g, 'color: #2563eb;');
css = css.replace(/text-shadow: 0 0 24px rgba\(173, 255, 56, 0\.34\);/, 'text-shadow: 0 0 24px rgba(37, 99, 235, 0.2);');
css = css.replace(/color: #9bb1c5;/, 'color: #475569;');

css = css.replace(/border: 1px solid rgba\(95, 145, 184, 0\.18\);/, 'border: 1px solid rgba(59, 130, 246, 0.15);');
css = css.replace(/background: rgba\(4, 10, 20, 0\.58\);/, 'background: rgba(255, 255, 255, 0.8);');
css = css.replace(/color: #b2c8da;/, 'color: #334155;');
css = css.replace(/background: rgba\(66, 217, 255, 0\.1\);/, 'background: rgba(37, 99, 235, 0.1);');

css = css.replace(/border: 1px solid rgba\(173, 255, 56, 0\.62\);/, 'border: 1px solid rgba(37, 99, 235, 0.4);');
css = css.replace(/background: linear-gradient\(180deg, #b9ff4e, #8fe326\);/, 'background: linear-gradient(180deg, #3b82f6, #2563eb);');
css = css.replace(/color: #0b1603;/, 'color: #ffffff;');
css = css.replace(/box-shadow: 0 10px 28px rgba\(119, 222, 33, 0\.19\);/, 'box-shadow: 0 10px 28px rgba(37, 99, 235, 0.25);');

css = css.replace(/color: #5e7890;/, 'color: #64748b;');
css = css.replace(/color: #ff6b89;/, 'color: #ef4444;');
css = css.replace(/text-shadow: 0 0 26px rgba\(255, 69, 106, 0\.38\);/, 'text-shadow: 0 0 26px rgba(239, 68, 68, 0.2);');
css = css.replace(/color: var\(--cyan-soft\);/g, 'color: #64748b;');

css = css.replace(/background: rgba\(3, 6, 13, 0\.72\);/, 'background: rgba(240, 246, 252, 0.72);');

fs.writeFileSync(path, css);
