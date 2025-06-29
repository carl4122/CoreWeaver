const coreweaver = require('./coreweaver.js');

module.exports = {
  id: 'coreweaver-memory',
  name: 'CoreWeaver Memory Engine',
  version: '0.1.0',
  description: 'A memory engine that filters and summarizes context in SillyTavern.',
  plugin: async (api) => {
    api.onEvent('message:sent', coreweaver.onNewMessage);
    api.onEvent('message:received', coreweaver.onNewMessage);
    console.log('[CoreWeaver] Extension initialized.');
  }
};

module.exports.pluginInfo = {
  id: 'coreweaver-memory',
  name: 'CoreWeaver Memory Engine',
  description: 'A memory engine that filters and summarizes context in SillyTavern.',
  version: '0.1.0'
};
