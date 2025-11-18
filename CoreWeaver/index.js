const coreweaver = require('./coreweaver.js');

module.exports = {
  id: 'coreweaver-memory',
  name: 'CoreWeaver Memory Engine',
  version: '0.1.0',
  description: 'A memory engine that filters and summarizes context in SillyTavern.',
  plugin: async (api) => {
    // Wire CoreWeaver into the Extras event bus
    api.onEvent('message:sent', coreweaver.onNewMessage);
    api.onEvent('message:received', coreweaver.onNewMessage);

    // Hello World-style diagnostics so you can sanity check that the plugin actually loaded.
    // You should see this line in the SillyTavern-Extras console when the server starts.
    console.log('[CoreWeaver] Hello World – CoreWeaver Memory Engine is initialized and listening for messages.');
  }
};

module.exports.pluginInfo = {
  id: 'coreweaver-memory',
  name: 'CoreWeaver Memory Engine',
  description: 'A memory engine that filters and summarizes context in SillyTavern.',
  version: '0.1.0'
};
