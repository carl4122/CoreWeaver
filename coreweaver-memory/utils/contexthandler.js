const { summarizeMemory } = require('../memory-engine.js');

function handleContext(data) {
  const message = data.message;
  const character = data.character;
  const sender = data.sender;

  // Log what we intercepted from SillyTavern
  console.log(`[coreweaver] Message from ${sender}:`, message);

  // Generate mock memory summary
  const memoryData = summarizeMemory(message);
  console.log('[coreweaver] Memory Data:', memoryData);

  return memoryData; // <-- Needed for SillyTavern to process
}

module.exports = {
  handleContext,
};
