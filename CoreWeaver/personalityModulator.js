
import fs from 'fs';
import path from 'path';

const modulationPath = path.join(path.resolve(), 'data', 'modulation.json');
const summaryPath = path.join(path.resolve(), 'data', 'summary_log.json');

async function runPersonalityModulator() {
  if (!fs.existsSync(summaryPath)) {
    console.error('❌ No summary_log.json found.');
    return;
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  const modulation = {
    emotionalFatigue: summary.includes('fatigue') ? 3 : 0,
    confidence: summary.includes('confidence') ? -2 : 0,
    empathy: summary.includes('empathy') ? 2 : 0,
    passivity: summary.includes('passivity') ? 2 : 0
  };

  fs.writeFileSync(modulationPath, JSON.stringify(modulation, null, 2));
  console.log('🧠 Personality modulation result saved to modulation.json');
}

export default runPersonalityModulator;
