// resetData.js

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

// Files to reset and their default content
const resets = {
  'pressure.json': {
    guilt: 0,
    fear: 0,
    stagnation: 0,
    frustration: 0,
    resentment: 0,
    emotional_fatigue: 0
  },
  'memory_log.json': [],
  'conflict.json': [],
  'summary_log.json': [],
  'abstract_memory.json': [],
  'goals.json': {
    core_stability: {
      description: "Maintain emotional balance through thoughtful choices.",
      decisions: [
        { name: "Reflect before reacting", tags: ["emotional_resilience"] },
        { name: "Confide in someone safe", tags: ["honesty", "comfort_seeking"] },
        { name: "Take a walk to decompress", tags: ["risk_taking", "independence"] }
      ]
    }
  }
};

for (const [file, content] of Object.entries(resets)) {
  const filePath = path.join(dataDir, file);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  console.log(`✅ Reset: ${file}`);
}
