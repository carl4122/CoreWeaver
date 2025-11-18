
import fs from 'fs';
import path from 'path';

const valuesPath = path.join(path.resolve(), 'data', 'values.json');
const goalsPath = path.join(path.resolve(), 'data', 'goals.json');
const modulationPath = path.join(path.resolve(), 'data', 'modulation.json');

async function evolveGoalsAndValues() {
  if (!fs.existsSync(modulationPath)) {
    console.error('❌ No modulation.json found.');
    return;
  }

  const modulation = JSON.parse(fs.readFileSync(modulationPath, 'utf-8'));
  const values = JSON.parse(fs.readFileSync(valuesPath, 'utf-8'));
  const goals = JSON.parse(fs.readFileSync(goalsPath, 'utf-8'));

  if (modulation.emotionalFatigue >= 3) values.rest = (values.rest || 0) + 1;
  if (modulation.confidence <= -2 && !goals.includes('seek validation')) goals.push('seek validation');

  fs.writeFileSync(valuesPath, JSON.stringify(values, null, 2));
  fs.writeFileSync(goalsPath, JSON.stringify(goals, null, 2));

  console.log('🌱 values.json and goals.json updated based on recent emotional state.');
}

export default evolveGoalsAndValues;
