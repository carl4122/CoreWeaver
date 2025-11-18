// === choiceEngine.js ===
const fs = require('fs');
const path = require('path');
const { saveMemory } = require('./memoryManager');

const pressurePath = path.join(__dirname, 'data', 'pressure.json');
const goalsPath = path.join(__dirname, 'data', 'goals.json');
const memoryLogPath = path.join(__dirname, 'data', 'memory_log.json');
const conflictPath = path.join(__dirname, 'data', 'conflict.json');
const journalPath = path.join(__dirname, 'data', 'reflection_journal.json');

function loadJSON(filename) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', filename), 'utf-8'));
}

function saveGoals(goals) {
  fs.writeFileSync(goalsPath, JSON.stringify(goals, null, 2));
}

// === Value Scoring Engine ===
function scoreDecisionAgainstValues(decision, characterValues) {
  let score = 0;
  for (const tag of decision.tags) {
    if (characterValues[tag]) {
      score += characterValues[tag];
    }
  }
  return score;
}

// === Decision Execution ===
function reflectOnDecision(decision, outcome, characterId = 'default') {
  const pressure = loadJSON('pressure.json');
  const goals = loadJSON('goals.json');

  // Penalty on negative outcome
  if (outcome === 'negative') {
    for (const tag of decision.tags) {
      if (tag === 'emotional_fatigue') pressure.emotional_fatigue += 1;
      if (tag === 'guilt') pressure.guilt += 1;
      if (tag === 'fear') pressure.fear += 1;
      if (tag === 'resentment') pressure.resentment += 1;
      if (tag === 'stagnation') pressure.stagnation += 1;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      decision: decision.name,
      tags: decision.tags,
      outcome,
      notes: "Felt emotional strain after this decision."
    };

    let journal = [];
    if (fs.existsSync(journalPath)) journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
    journal.push(entry);
    fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2));

    // ✅ New: save to memoryManager
    saveMemory(characterId, entry.notes, {
      source: 'choiceEngine',
      decision: decision.name,
      outcome: outcome,
      tags: decision.tags
    });
  }

  // === Healing Actions ===
  for (const tag of decision.tags) {
    if (tag === 'comfort_seeking') pressure.emotional_fatigue = Math.max(pressure.emotional_fatigue - 1, 0);
    if (tag === 'emotional_resilience') {
      pressure.guilt = Math.max(pressure.guilt - 1, 0);
      pressure.fear = Math.max(pressure.fear - 1, 0);
    }
    if (tag === 'honesty') pressure.resentment = Math.max(pressure.resentment - 1, 0);
    if (tag === 'risk_taking') pressure.stagnation = Math.max(pressure.stagnation - 1, 0);
  }

  if (checkEmergentGoals(pressure, goals)) saveGoals(goals);
  fs.writeFileSync(pressurePath, JSON.stringify(pressure, null, 2));
  logMemory(decision, { ...pressure });
  logConflict(decision, pressure);
}

// === Memory Logging ===
function logMemory(decision, pressureSnapshot) {
  const entry = {
    timestamp: new Date().toISOString(),
    decision: decision.name,
    tags: decision.tags,
    pressure_at_time: pressureSnapshot
  };

  let log = [];
  if (fs.existsSync(memoryLogPath)) log = JSON.parse(fs.readFileSync(memoryLogPath, 'utf-8'));
  log.push(entry);
  fs.writeFileSync(memoryLogPath, JSON.stringify(log, null, 2));
}

function logConflict(decision, pressure) {
  const entry = {
    timestamp: new Date().toISOString(),
    conflict: decision.tags.includes('conflict'),
    tags: decision.tags,
    pressure_at_time: pressure
  };

  let log = [];
  if (fs.existsSync(conflictPath)) log = JSON.parse(fs.readFileSync(conflictPath, 'utf-8'));
  log.push(entry);
  fs.writeFileSync(conflictPath, JSON.stringify(log, null, 2));
}

// === Emergent Behavior ===
function checkEmergentGoals(pressure, goals) {
  let changed = false;

  if (pressure.guilt >= 5 && !goals.includes('seek_forgiveness')) {
    goals.push('seek_forgiveness');
    changed = true;
  }

  if (pressure.stagnation >= 5 && !goals.includes('find_purpose')) {
    goals.push('find_purpose');
    changed = true;
  }

  return changed;
}

module.exports = {
  reflectOnDecision,
  scoreDecisionAgainstValues
};

