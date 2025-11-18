
import fs from 'fs';
import path from 'path';
import { runPreprocessor } from './preprocessor.js';

const memoryLogPath = path.join(path.resolve(), 'data', 'memory_log.json');
const summaryLogPath = path.join(path.resolve(), 'data', 'summary_log.json');
const compressedLogPath = path.join(path.resolve(), 'data', 'summary_log_compressed.json');

async function runMemorySummary() {
  if (!fs.existsSync(memoryLogPath)) {
    console.error('❌ No memory_log.json found.');
    return;
  }

  const log = JSON.parse(fs.readFileSync(memoryLogPath, 'utf-8'));
  const summaries = [];

  log.forEach(entry => {
    entry.tags.forEach(tag => {
      summaries.push(`Tag observed: ${tag}`);
    });
  });

  fs.writeFileSync(summaryLogPath, JSON.stringify(summaries, null, 2));
  console.log(`✅ Memory summary saved to summary_log.json (${summaries.length} insights)`);

  const joinedSummary = summaries.join('\n');
  const compressed = await runPreprocessor(joinedSummary, { temperature: 0.3 });
  fs.writeFileSync(compressedLogPath, JSON.stringify({ compressed }, null, 2));
  console.log(`🧠 Compressed summary saved to summary_log_compressed.json`);
}

export default runMemorySummary;
