/*
 * baselineGenerator.js
 *
 * This module is responsible for creating an emotional baseline for a character
 * card when one is not embedded directly in the card definition.  It
 * leverages OpenAI's API to infer baseline values from the character's
 * description, personality traits and other textual fields.  If the API
 * cannot be contacted or fails, a neutral baseline is returned as a
 * fallback.  You can configure the OpenAI API key via the environment
 * variable OPENAI_API_KEY.  See README for further details.
 */

// Use the global fetch API available in modern Node.js versions.  We
// intentionally avoid requiring the 'node-fetch' package here to
// reduce external dependencies.  If running in an environment
// without a global fetch (e.g. Node.js prior to v18), users should
// polyfill or install node-fetch themselves.
const fetch = global.fetch || require('node-fetch');

// A default neutral baseline used when no emotional core is present and
// an API call cannot be made.  Values are centred at 0.5 to represent
// neutrality.
const DEFAULT_BASELINE = {
  joy: 0.5,
  sadness: 0.5,
  fear: 0.5,
  anger: 0.5,
  disgust: 0.5,
  surprise: 0.5,
  loneliness: 0.5,
  hope: 0.5,
  anxiety: 0.5,
  contentment: 0.5,
  curiosity: 0.5,
  shame: 0.5,
  confidence: 0.5,
  desire: 0.5,
  trust_user: 0.5
};

/**
 * Attempt to generate an emotional baseline from plain text using the
 * OpenAI API.  You must set the `OPENAI_API_KEY` environment variable for
 * this function to function properly.  It sends the given text to the
 * OpenAI completions endpoint with a prompt instructing the model to
 * produce a JSON object with numeric fields matching those in
 * `DEFAULT_BASELINE`.  If the call fails for any reason, the default
 * baseline is returned.
 *
 * @param {string} text The concatenated personality and description text to
 *                      analyse.
 * @returns {Promise<object>} A promise that resolves to an object mapping
 * emotional labels to baseline values between 0.0 and 1.0.
 */
async function generateBaselineFromText(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  // If no API key is configured, immediately return a neutral baseline
  if (!apiKey) {
    console.warn('[baselineGenerator] OPENAI_API_KEY not set; using default baseline.');
    return { ...DEFAULT_BASELINE };
  }

  try {
    const prompt =
      `You are an expert assistant for a game engine that needs to infer a character's emotional baseline from their description.\n` +
      `Analyse the following character description and return a JSON object containing numeric values between 0.0 and 1.0 for each of the following emotions: ${Object.keys(DEFAULT_BASELINE).join(', ')}.\n` +
      `Only return valid JSON with these keys and numeric values.\n\n` +
      `Description:\n${text}\n\n`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content?.trim() || '';
    // Try to parse the JSON from the model response
    const parsed = JSON.parse(content);
    // Ensure all keys exist; if any are missing, supplement with default
    const baseline = { ...DEFAULT_BASELINE };
    for (const key of Object.keys(DEFAULT_BASELINE)) {
      const value = parseFloat(parsed[key]);
      baseline[key] = isNaN(value) ? DEFAULT_BASELINE[key] : value;
    }
    return baseline;
  } catch (err) {
    console.warn('[baselineGenerator] Failed to generate baseline from text:', err.message);
    return { ...DEFAULT_BASELINE };
  }
}

module.exports = {
  generateBaselineFromText,
  DEFAULT_BASELINE
};