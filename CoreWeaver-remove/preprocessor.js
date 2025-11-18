// preprocessor.js

const fs = require('fs');
const path = require('path');

// Simulated compression using string operations for testing
function compressText(text) {
  return text
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .join('\n');
}

async function runPreprocessor(input, options = {}) {
  let rawInput = '';

  // 🔍 If input is a file path, load it
  if (typeof input === 'string' && fs.existsSync(input)) {
    console.log(`[Preprocessor] Reading from file: ${input}`);
    rawInput = fs.readFileSync(input, 'utf-8');
  } else if (typeof input === 'string') {
    console.log(`[Preprocessor] Using direct string input`);
    rawInput = input;
  } else {
    throw new Error('Input must be a string path or raw text');
  }

  // 🧠 Simulate compression
  const compressed = compressText(rawInput);
  return compressed;
}

module.exports = { runPreprocessor };
