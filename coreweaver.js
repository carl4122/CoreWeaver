const { handleContext } = require('./utils/contexthandler.js');

console.log('[CoreWeaver] Plugin initialized successfully.');

function onNewMessage(data, { sendMessage }) {
  try {
    const text = data.text?.toLowerCase() || '';

    // ✅ Use safe non-slash trigger instead
    if (text.startsWith('coreweaver test:')) {
      const input = data.text.split(':').slice(1).join(':').trim() || 'No input';
      sendMessage(`✅ CoreWeaver is active. You said: "${input}"`);
      return;
    }

    // Normal memory logic
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
