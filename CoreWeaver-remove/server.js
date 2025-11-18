
// server.js
import express from 'express';
import runMemorySummary from './summarizeMemory.js';
import runPersonalityModulator from './personalityModulator.js';
import evolveGoalsAndValues from './evolveGoalsAndValues.js';

const app = express();
const port = 3333;

app.use(express.json());

// 🎯 Run summarizeMemory
app.get('/run-summary', async (req, res) => {
  try {
    await runMemorySummary();
    res.sendStatus(200);
  } catch (err) {
    console.error('Summary error:', err);
    res.sendStatus(500);
  }
});

// 🎭 Run personalityModulator
app.get('/run-modulator', async (req, res) => {
  try {
    await runPersonalityModulator();
    res.sendStatus(200);
  } catch (err) {
    console.error('Modulator error:', err);
    res.sendStatus(500);
  }
});

// 🌱 Evolve goals/values
app.get('/run-evolution', async (req, res) => {
  try {
    await evolveGoalsAndValues();
    res.sendStatus(200);
  } catch (err) {
    console.error('Evolution error:', err);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`🧠 CoreWeaver server listening at http://localhost:${port}`);
});
