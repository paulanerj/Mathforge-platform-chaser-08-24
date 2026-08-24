const fs = require('fs');
const path = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts';
let content = fs.readFileSync(path, 'utf8');

// First, revert ALL `});` back to `};` so we have a clean slate (except for things we know are right, actually let's revert all first, except where we know it's a callback)
content = content.replace(/\}\);/g, '};');

let fixed = '';
const stack = []; // 'P' for paren, 'B' for brace

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  
  if (char === '(') {
    stack.push('P');
    fixed += char;
  } else if (char === '{') {
    stack.push('B');
    fixed += char;
  } else if (char === ')') {
    if (stack[stack.length - 1] === 'P') {
      stack.pop();
    }
    fixed += char;
  } else if (char === '}') {
    if (stack[stack.length - 1] === 'B') {
      stack.pop();
    }
    fixed += char;
    
    // Look ahead to see if there's a ';' or ')' or something
    // If the top of the stack is now 'P', it means this brace was closing a function passed as an argument!
    // So we should expect a ')' next.
    // If the next chars are just ';' or newline, we should probably insert ')'!
    if (stack[stack.length - 1] === 'P') {
       // Peek ahead
       let nextIsParen = false;
       for (let j = i + 1; j < content.length; j++) {
         if (content[j] === ' ' || content[j] === '\n' || content[j] === '\r') continue;
         if (content[j] === ')') nextIsParen = true;
         break;
       }
       if (!nextIsParen) {
          // It needs a paren!
          // BUT wait, what if the next char is ';' ?
          // We can insert ')' right after '}'
          fixed += ')';
          stack.pop(); // pop the 'P'
       }
    }
  } else {
    fixed += char;
  }
}

fs.writeFileSync(path, fixed);
console.log('Done fixing');
