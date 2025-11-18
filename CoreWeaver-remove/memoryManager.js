const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { runPreprocessor } = require('./preprocessor');

const memoryRoot = path.join(__dirname, 'memory');
const gameDatePath = path.join(__dirname, 'data', 'currentGameDate.json');

function getCharacterFolder(characterId) {
  return path.join(memoryRoot, characterId);
}

function listMemoryFiles(characterId) {
  const folder = getCharacterFolder(characterId);
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder).filter(file => file.endsWith('.json') && file !== 'character.json');
}

function createCharacterFolder(characterId) {
  const folder = getCharacterFolder(characterId);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`Created folder for character: ${characterId}`);
  }
}

/**
 * Prompt the developer on the command line to select or create a memory file.
 * This helper is primarily used during manual CLI operation. When running
 * CoreWeaver inside SillyTavern or another automated environment you should
 * prefer the `quickSaveMemory` helper which writes to a default file without
 * any interactive prompts.
 *
 * @param {string} characterId The unique identifier for the character whose
 * memory file should be located or created.
 * @param {Function} callback A function that will be called with the resolved
 * file path once the user has made a selection.
 */
function promptForMemoryFile(characterId, callback) {
  const files = listMemoryFiles(characterId);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`\nExisting memory files for '${characterId}':`);
  files.forEach((file, idx) => {
    console.log(`  [${idx + 1}] ${file}`);
  });

  rl.question("\nSelect a file by number or enter a new file name: ", (input) => {
    rl.close();

    let chosenFile;
    if (!isNaN(input) && files[Number(input) - 1]) {
      chosenFile = files[Number(input) - 1];
    } else {
      chosenFile = input.endsWith('.json') ? input : `${input}.json`;
    }

    const filePath = path.join(getCharacterFolder(characterId), chosenFile);

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      console.log(`Created new memory file: ${chosenFile}`);
    }

    callback(filePath);
  });
}

/**
 * Quickly append a memory entry to a default file for a given character. This
 * function circumvents the interactive prompt used in development tools and
 * writes directly to a predetermined JSON file (`quick_memory.json`) within
 * the character’s memory folder. If the file does not exist it will be
 * created. Each entry contains a timestamp, the raw memory text, and an
 * optional tags object for metadata.
 *
 * This helper is intended for automated environments such as SillyTavern
 * extensions where prompting the user to choose a file is impractical. It
 * ensures that memory summaries can be persisted without blocking on stdin.
 *
 * @param {string} characterId The ID of the character to save memory for.
 * @param {string} memoryText The text to be stored (e.g. a summary of a
 * conversation turn).
 * @param {object} [tags={}] Optional tags providing additional context
 * (e.g. the source of the entry, impact rating, summary type, etc.).
 */
function quickSaveMemory(characterId, memoryText, tags = {}) {
  createCharacterFolder(characterId);
  const filePath = path.join(getCharacterFolder(characterId), 'quick_memory.json');

  let existing = [];
  if (fs.existsSync(filePath)) {
    try {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.warn('[memoryManager] Failed to read existing quick memory file, starting fresh.', err.message);
    }
  }

  const entry = {
    timestamp: new Date().toISOString(),
    original: memoryText,
    tags
  };
  existing.push(entry);

  try {
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  } catch (err) {
    console.error('[memoryManager] Failed to write quick memory file:', err.message);
  }
}

async function saveMemory(characterId, memoryText, tags = {}) {
  const folder = getCharacterFolder(characterId);
  createCharacterFolder(characterId);

  promptForMemoryFile(characterId, async (filePath) => {
    try {
      const compressed = await runPreprocessor(memoryText);

      let gameDate = null;
      if (fs.existsSync(gameDatePath)) {
        const rawDate = fs.readFileSync(gameDatePath, 'utf-8');
        const parsed = JSON.parse(rawDate);
        gameDate = parsed?.date || null;
      }

      const memoryEntry = {
        timestamp: new Date().toISOString(),
        gameDate: gameDate || 'Unknown',
        original: memoryText,
        compressed: compressed,
        tags
      };

      const fileData = fs.readFileSync(filePath, 'utf-8');
      const existingMemories = JSON.parse(fileData);
      existingMemories.push(memoryEntry);

      fs.writeFileSync(filePath, JSON.stringify(existingMemories, null, 2));
      console.log(`✅ Memory saved to ${filePath}`);
    } catch (err) {
      console.error('❌ Failed to save memory:', err.message);
    }
  });
}

module.exports = {
  saveMemory,
  getCharacterFolder,
  listMemoryFiles,
  promptForMemoryFile
  ,quickSaveMemory
};
