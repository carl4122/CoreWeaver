const fs = require('fs');
const path = require('path');

const datePath = path.join(__dirname, 'data', 'currentGameDate.json');

function getCurrentGameDate() {
  const raw = fs.readFileSync(datePath, 'utf-8');
  const { currentGameDate } = JSON.parse(raw);
  return currentGameDate;
}

function setCurrentGameDate(newDate) {
  const updated = { currentGameDate: newDate };
  fs.writeFileSync(datePath, JSON.stringify(updated, null, 2));
}

function advanceGameDate(days = 1) {
  const current = new Date(getCurrentGameDate());
  current.setDate(current.getDate() + days);
  const newDate = current.toISOString().split('T')[0];
  setCurrentGameDate(newDate);
  return newDate;
}

module.exports = {
  getCurrentGameDate,
  setCurrentGameDate,
  advanceGameDate
};