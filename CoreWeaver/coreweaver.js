const { handleContext } = require('./utils/contexthandler.js');
const { quickSaveMemory, loadQuickMemory, setMemoryRoot } = require('./memoryManager.js');
const { loadCharacterCard } = require('./utils/cardLoader.js');
const { DEFAULT_BASELINE } = require('./utils/baselineGenerator.js');

// Additional modules used for configuration management.  We persist
// CoreWeaver settings to a JSON file so that users can adjust
// behaviour via slash commands without editing code.  See below for
// the default values and structure of the settings object.
const fs = require('fs');
const path = require('path');

// Path to the settings file.  It lives alongside this module.  If
// settings.json does not exist or cannot be parsed, default values
// will be used and written out when updated.
const settingsPath = path.join(__dirname, 'settings.json');

// Default settings.  These values are merged with any existing
// settings loaded from disk.  secondary_model defines which model
// should be used for background emotional analysis.  auto_switch
// controls whether CoreWeaver should fall back to the current chat
// model if the configured secondary model fails.  emotion_update_frequency
// determines how often (in user turns) a full emotional analysis
// occurs.  openai_api_key is kept here for convenience but is not
// modified by the slash commands.
let settings = {
  secondary_model: 'gpt-3.5',
  auto_switch: true,
  emotion_update_frequency: 2,
  openai_api_key: '',
  // A list of models that CoreWeaver can target for its secondary
  // processing.  This list should reflect the models available
  // through SillyTavern's API configuration.  Users can choose
  // between these using the `/coreweaver set model <name>` command.
  available_models: [
    'gpt-3.5',
    'gpt-4',
    'claude',
    'mistral',
    'other'
  ]
};

// Load settings from disk.  If the file exists and is valid JSON,
// merge its properties into the defaults.  Errors are caught so
// missing or malformed files will not crash the plugin; a warning is
// emitted instead.
try {
  if (fs.existsSync(settingsPath)) {
    const rawSettings = fs.readFileSync(settingsPath, 'utf-8');
    const parsedSettings = JSON.parse(rawSettings);
    settings = Object.assign({}, settings, parsedSettings);
  }
} catch (err) {
  console.warn('[CoreWeaver] Failed to load settings.json:', err.message);
}
const characterTurnCounters = {};

/**
 * Persist the current in-memory settings back to disk.  This helper
 * writes the `settings` object to `settings.json`.  Any errors
 * encountered during writing are logged but do not interrupt
 * execution.  This function is invoked whenever a user updates a
 * setting via slash commands.
 */
function saveSettings() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('[CoreWeaver] Failed to save settings.json:', err.message);
  }
}

// Character identifier and baseline loaded from card.  Default to
// "default" and neutral baseline until the actual card is loaded.
let characterId = 'default';
let emotionalBaseline = { ...DEFAULT_BASELINE };

// Attempt to load the character card specified by the environment
// variable CHARACTER_FILE_PATH.  This is asynchronous because the
// baseline generator may call the OpenAI API.  The returned
// character ID and baseline are stored for later use.  Errors are
// logged but do not halt execution.
if (process.env.CHARACTER_FILE_PATH) {
  loadCharacterCard(process.env.CHARACTER_FILE_PATH)
    .then(({ characterId: cid, baseline }) => {
      characterId = cid;
      emotionalBaseline = baseline;
      console.log(`[CoreWeaver] Loaded character card for '${characterId}'.`);
    })
    .catch((err) => {
      console.warn(`[CoreWeaver] Failed to load character card '${process.env.CHARACTER_FILE_PATH}':`, err.message);
    });
}

console.log('[CoreWeaver] Plugin initialized successfully.');

function onNewMessage(data, { sendMessage }) {
  try {
    // Preserve the raw message text for command parsing and a
    // lowercased copy for context handling.  Using both avoids
    // accidental modification of user input.
    const rawText = data.text || '';
    const lowerText = rawText.toLowerCase();

    // -----------------------------------------------------------------
    // Test trigger for development.  This prefix can be used to
    // verify that the extension is loaded and responding without
    // conflicting with slash commands.  It simply echoes back the
    // remainder of the input.
    if (lowerText.startsWith('coreweaver test:')) {
      const input = rawText.split(':').slice(1).join(':').trim() || 'No input';
      sendMessage(`✅ CoreWeaver is active. You said: "${input}"`);
      return;
    }

    // -----------------------------------------------------------------
    // Slash command handling
    //
    // Commands beginning with '/' are intercepted here.  Supported
    // commands:
    //   /status
    //       Show the current emotional baseline values.
    //   /coreweaver get <model|autoswitch|frequency>
    //       Query the configured secondary model, auto-switch flag, or
    //       emotion update frequency.
    //   /coreweaver set <model|autoswitch|frequency> <value>
    //       Update one of the settings.  See comments for allowed
    //       values.
    if (rawText.trim().startsWith('/')) {
      const parts = rawText.trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();

      // /status
      if (cmd === '/status') {
        const summary = Object.entries(emotionalBaseline)
          .map(([key, val]) => `${key}: ${(val * 100).toFixed(0)}%`)
          .join(', ');
        sendMessage(`🧠 Current emotional baseline for '${characterId}': ${summary}`);
        return;
      }

      // /coreweaver
      if (cmd === '/coreweaver') {
        const sub = (parts[1] || '').toLowerCase();
        const option = (parts[2] || '').toLowerCase();
        const value = parts[3];

        if (sub === 'get') {
          switch (option) {
            case 'model':
              sendMessage(`🧠 CoreWeaver secondary model: ${settings.secondary_model}`);
              break;
            case 'autoswitch':
              sendMessage(`🧠 CoreWeaver auto-switch: ${settings.auto_switch}`);
              break;
            case 'frequency':
              sendMessage(`🧠 CoreWeaver emotion update frequency: ${settings.emotion_update_frequency}`);
              break;
            default:
              sendMessage('❓ Unknown get option. Use `/coreweaver get model|autoswitch|frequency` or `/coreweaver list models`');
              break;
          }
          return;
        }

        // /coreweaver list models
        //   Show the configured list of available models.  This list
        //   comes from the settings file and can be customised by
        //   editing settings.json.  Use this command to discover
        //   valid values for `/coreweaver set model <name>`.
        if (sub === 'list') {
          if (option === 'models') {
            const modelsList = settings.available_models && Array.isArray(settings.available_models)
              ? settings.available_models.join(', ')
              : 'No models configured';
            sendMessage(`📜 Available CoreWeaver secondary models: ${modelsList}`);
            return;
          }
        }

        if (sub === 'set') {
          switch (option) {
            case 'model':
              if (value) {
                settings.secondary_model = value;
                saveSettings();
                sendMessage(`✅ CoreWeaver secondary model set to: ${value}`);
              } else {
                sendMessage('❗ Usage: /coreweaver set model <model_name>');
              }
              return;
            case 'autoswitch':
              if (value && ['true', 'false'].includes(value.toLowerCase())) {
                settings.auto_switch = value.toLowerCase() === 'true';
                saveSettings();
                sendMessage(`✅ CoreWeaver auto-switch set to: ${settings.auto_switch}`);
              } else {
                sendMessage('❗ Usage: /coreweaver set autoswitch true|false');
              }
              return;
            case 'frequency':
              if (value && !isNaN(parseInt(value, 10)) && parseInt(value, 10) >= 1) {
                settings.emotion_update_frequency = parseInt(value, 10);
                saveSettings();
                sendMessage(`✅ CoreWeaver emotion update frequency set to: ${settings.emotion_update_frequency}`);
              } else {
                sendMessage('❗ Usage: /coreweaver set frequency <integer>=1');
              }
              return;
            default:
              sendMessage('❓ Unknown set option. Use `/coreweaver set model|autoswitch|frequency <value>`');
              return;
          }
        }

        if (sub === 'memories') {
        const mem = loadQuickMemory(characterId);
        if (!mem || !Array.isArray(mem) || mem.length === 0) {
          sendMessage('🧠 No CoreWeaver quick memories saved yet for this character.');
        } else {
          const recent = mem.slice(-5);
          const lines = recent.map((entry, idx) => {
            const ts = entry.timestamp || '';
            const tags = entry.tags && entry.tags.length ? ` [${entry.tags.join(', ')}]` : '';
            let text = entry.original || '';
            if (text.length > 260) text = text.slice(0, 260) + '…';
            return `${idx + 1}. ${ts}${tags} — ${text}`;
          });
          sendMessage('📂 Recent CoreWeaver quick memories:\n' + lines.join('\n'));
        }
        return;
      }

      // Unknown subcommand
      sendMessage('❗ Unknown CoreWeaver command. Use `/coreweaver get` or `/coreweaver set` or `/coreweaver memories`');
      return;
    }

    // -----------------------------------------------------------------
    // Normal memory logic.  If the message was not a slash command,
    // pass it through the context handler to classify it, then save
    // the resulting summary.  The summary is only saved if one was
    // generated.  If saving fails for any reason, the error is
    // logged but processing continues.
    //
    // To avoid overloading the secondary model, we only run the
    // context handler every N turns per character, where N is
    // `settings.emotion_update_frequency`.  A value of 1 means
    // "every turn".  A value <= 0 disables automatic saves.
    const freq = Number.isFinite(settings.emotion_update_frequency)
      ? settings.emotion_update_frequency
      : 1;
    const updateEvery = Math.max(1, freq || 1);

    characterTurnCounters[characterId] =
      (characterTurnCounters[characterId] || 0) + 1;

    if (!settings.enabled || updateEvery < 1) {
      return;
    }

    if (characterTurnCounters[characterId] % updateEvery !== 0) {
      return;
    }

    const result = handleContext(data);
    try {
      if (result && result.memory_summary) {
        quickSaveMemory(characterId, result.memory_summary, {
          type: result.type,
          impact: result.impact,
          tags: result.tags,
          game_date: result.game_date
        });
      }
    } catch (err) {
      console.warn('[CoreWeaver] Failed to persist memory summary:', err.message);
    }
    return result;

  } catch (error) {
    console.error('[CoreWeaver] Error processing message:', error);
    return { memory_summary: '[CoreWeaver failed]' };
  }
}

module.exports = {
  onNewMessage,
};