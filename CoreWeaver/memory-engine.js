function summarizeMemory(message) {
  const lower = message.toLowerCase();

  // 🧠 Determine memory type
  let type = 'background';
  if (lower.includes('i love you') || lower.includes('first time')) type = 'milestone';
  else if (lower.includes('every morning') || lower.includes('routine')) type = 'routine';
  else if (lower.includes('important') || lower.includes('core')) type = 'core';

  // 💬 Emotional Tagging (basic)
  let emotion = 'neutral';
  if (lower.includes('thank you') || lower.includes('grateful')) emotion = 'gratitude';
  else if (lower.includes('scared') || lower.includes('afraid')) emotion = 'fear';
  else if (lower.includes('happy') || lower.includes('love')) emotion = 'love';
  else if (lower.includes('angry') || lower.includes('pissed')) emotion = 'anger';
  else if (lower.includes('cry') || lower.includes('sad')) emotion = 'sadness';

  // 📊 Impact scoring
  let impact = 1;
  if (type === 'milestone') impact = 5;
  else if (type === 'core') impact = 4;
  else if (emotion === 'love' || emotion === 'fear') impact = 3;
  else if (type === 'routine') impact = 2;

  // 📝 Summary output
  return {
    memory_summary: `(${type.toUpperCase()}, ${emotion}, Impact ${impact}) "${message.slice(0, 60)}..."`,
    type,
    emotion,
    impact,
    raw: message
  };
}

module.exports = {
  summarizeMemory
};
