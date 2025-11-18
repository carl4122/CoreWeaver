// generateBackstoryMemories.js

const fs = require('fs');
const path = require('path');
const { runPreprocessor } = require('./preprocessor');

const lorebookPath = path.join(__dirname, 'data', 'lorebook.json');
const outputPath = path.join(__dirname, 'data', 'backstory_candidates.json');

async function generateBackstoryMemories(memoryCount = 5) {
  const lore = fs.existsSync(lorebookPath)
    ? fs.readFileSync(lorebookPath, 'utf-8')
    : null;

  if (!lore) {
    console.error("❌ Lorebook not found.");
    return;
  }

  const prompt = `
You are an AI tasked with analyzing the following character lorebook and extracting implied backstory memories.

Format each memory like this:
{
  "summary": "A short description of the event.",
  "emotion": "Dominant emotion tied to it",
  "tags": ["relevant", "topics", "values"]
}

Keep each memory realistic, consistent with the lore, and emotionally relevant.

Lorebook:
${lore}

Generate ${memoryCount} backstory memories.
`;

  try {
    const compressed = await runPreprocessor(prompt, {
      temperature: 0.7
    });

    const parsed = JSON.parse(compressed);
    fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
    console.log(`✅ Backstory memories generated and saved to ${outputPath}`);
  } catch (err) {
    console.error('❌ Failed to generate backstory memories:', err.message);
  }
}

module.exports = {
  generateBackstoryMemories
};
