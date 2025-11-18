/*
 * cardLoader.js
 *
 * This module provides helper functions to ingest a character card
 * definition from a JSON file, detect if it embeds an emotional core
 * baseline, and return a standard baseline object.  If the card does
 * not include an explicit emotional baseline the generator in
 * baselineGenerator.js will be invoked to infer values from the
 * character's description and personality text.  The returned
 * baseline always includes all required keys from DEFAULT_BASELINE.
 */

const fs = require('fs');
const path = require('path');
const { generateBaselineFromText, DEFAULT_BASELINE } = require('./baselineGenerator');

/**
 * Convert an arbitrary string (e.g. character name) into a safe
 * identifier for use in file paths.  Non-alphanumeric characters are
 * replaced with underscores and the result is lowercased.
 *
 * @param {string} text The string to slugify.
 * @returns {string} A filesystem-safe identifier.
 */
function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Attempt to parse baseline values from arbitrary text.  This helper
 * will scan for a section containing the word "baseline" (case
 * insensitive) and then extract pairs of emotion labels and numbers
 * on subsequent lines.  It returns a partial baseline object.  Any
 * keys not found will be left undefined, to be filled later.
 *
 * @param {string} text Arbitrary text to scan for baseline values.
 * @returns {object} A partial baseline mapping of emotion→value.
 */
function extractBaselineFromText(text) {
  const result = {};
  const lower = text.toLowerCase();
  const idx = lower.indexOf('baseline');
  if (idx === -1) return result;

  // Examine up to 800 characters after the baseline heading to
  // capture the values section.  This length is arbitrary but
  // sufficient for typical cards.
  const slice = text.slice(idx, idx + 800);
  const lines = slice.split(/\r?\n/);
  for (const line of lines) {
    // match patterns like "joy 0.30" or "trust_user 0.15"; allow
    // underscores and hyphens in the key.  Any fractional value is
    // captured.
    const m = line.match(/([a-zA-Z_\-]+)\s+([0-9]*\.?[0-9]+)/);
    if (m) {
      const key = m[1].trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const val = parseFloat(m[2]);
      if (!isNaN(val)) {
        result[key] = val;
      }
    }
  }
  return result;
}

/**
 * Load a character card from the given file path, detect or infer
 * emotional baseline values, and return an object containing the
 * character's identifier and baseline.  If the card contains an
 * explicit baseline in a recognised structure (e.g. an
 * `emotional_core.baseline` property), that baseline will be used.
 * Otherwise the function will attempt to parse the baseline from any
 * text fields containing the word "baseline".  If that also fails
 * the baseline will be generated using the OpenAI-powered generator.
 *
 * @param {string} filePath Path to the character card JSON file.
 * @returns {Promise<{ characterId: string, baseline: object }>} A
 * promise resolving to the character identifier and complete
 * baseline.
 */
async function loadCharacterCard(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let card;
  try {
    card = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse JSON from card at ${filePath}: ${err.message}`);
  }
  // Determine a reasonable character identifier.  Prefer the name
  // field within data if present; otherwise fall back to the file
  // name without extension.
  const name = (card.data && card.data.name) || path.basename(filePath, path.extname(filePath));
  const characterId = slugify(name);

  let baseline = null;

  // 1. Check for an explicit emotional_core baseline
  if (card.data && card.data.emotional_core && card.data.emotional_core.baseline) {
    baseline = { ...DEFAULT_BASELINE, ...card.data.emotional_core.baseline };
  }

  // 2. Look for baseline values embedded in string fields.  We
  // search several likely candidates.  If we find a baseline, we
  // merge it with the default to fill missing keys.
  if (!baseline) {
    const candidates = [];
    if (card.data && typeof card.data.system_prompt === 'string') {
      candidates.push(card.data.system_prompt);
    }
    if (card.data && card.data.extensions && card.data.extensions.depth_prompt && typeof card.data.extensions.depth_prompt.prompt === 'string') {
      candidates.push(card.data.extensions.depth_prompt.prompt);
    }
    if (card.data && typeof card.data.description === 'string') {
      candidates.push(card.data.description);
    }
    let partial = {};
    for (const text of candidates) {
      partial = extractBaselineFromText(text);
      if (Object.keys(partial).length > 0) break;
    }
    if (Object.keys(partial).length > 0) {
      baseline = { ...DEFAULT_BASELINE, ...partial };
    }
  }

  // 3. If still no baseline, construct one from description and
  // personality text using the baseline generator.  We concatenate
  // descriptive fields to provide context for the model.
  if (!baseline) {
    let concat = '';
    if (card.data) {
      concat += (card.data.description || '') + '\n';
      concat += (card.data.personality || '') + '\n';
      concat += (card.data.first_mes || '') + '\n';
    }
    baseline = await generateBaselineFromText(concat);
  }

  // Ensure all keys are present and extraneous keys are removed.  If
  // any key is missing from the resulting baseline, fill it with
  // the default value.  Convert all values to numbers.
  const normalized = {};
  for (const key of Object.keys(DEFAULT_BASELINE)) {
    const val = baseline && baseline[key];
    const num = parseFloat(val);
    normalized[key] = !isNaN(num) ? num : DEFAULT_BASELINE[key];
  }
  return { characterId, baseline: normalized };
}

module.exports = {
  loadCharacterCard,
  slugify
};