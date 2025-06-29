const { handleContext } = require('./utils/contexthandler.js');

console.log('[CoreWeaver] Plugin initialized successfully.');

function onNewMessage(data) {
  try {
    const result = handleContext(data);
    return result;
  } catch (error) {
    console.error('[CoreWeaver] Error processing message:', error);
    return { memory_summary: '[CoreWeaver failed]' };
  }
}

module.exports = {
  onNewMessage,
};
