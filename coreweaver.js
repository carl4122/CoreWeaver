const { handleContext } = require('./utils/contexthandler.js');

console.log('[CoreWeaver] Plugin initialized successfully.');

function onNewMessage(data, { sendMessage }) {
  try {
    // ✅ Simple test command
    if (data.text?.toLowerCase().startsWith("/coreweaver_test")) {
      const input = data.text.split(" ").slice(1).join(" ") || "No input";
      sendMessage(`✅ CoreWeaver is active. You said: "${input}"`);
      return;
    }

    // Normal memory handling logic
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
