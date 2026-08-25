export const UPPER = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
export const LOWER = ['threeKind', 'fourKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance'];
export const CATEGORIES = [...UPPER, ...LOWER];

export function newGame() {
  const scores = {};
  for (const c of CATEGORIES) scores[c] = null;
  return {
    dice: [1, 1, 1, 1, 1],
    held: [false, false, false, false, false],
    rollsUsed: 0,
    turn: 1,
    scores,
    bonus: 0,
  };
}

export function roll(state, rng = Math.random) {
  if (state.rollsUsed >= 3) throw new Error('no rolls left this turn');
  const firstRoll = state.rollsUsed === 0;
  const dice = state.dice.map((d, i) => (firstRoll || !state.held[i] ? rollDie(rng) : d));
  return { ...state, dice, rollsUsed: state.rollsUsed + 1 };
}

export function toggleHold(state, index) {
  if (state.rollsUsed === 0 || state.rollsUsed >= 3) return state;
  const held = [...state.held];
  held[index] = !held[index];
  return { ...state, held };
}

export function commit(state, category) {
  const legal = legalCategories(state);
  if (!legal.includes(category)) throw new Error(`cannot commit ${category} now`);
  const value = scoreFor(state.dice, category);
  const scores = { ...state.scores, [category]: value };
  return endTurn({ ...state, scores });
}

export function isBonusYahtzee(state) {
  return state.rollsUsed > 0 && fiveKind(state.dice) && state.scores.yahtzee === 50;
}

export function applyBonusYahtzee(state) {
  if (!isBonusYahtzee(state)) return state;
  return endTurn({ ...state, bonus: state.bonus + 100 });
}

export function isFreshYahtzee(state) {
  return state.rollsUsed > 0 && fiveKind(state.dice) && state.scores.yahtzee === null;
}

export function legalCategories(state) {
  if (state.rollsUsed === 0) return [];
  if (isBonusYahtzee(state)) return [];
  return CATEGORIES.filter(c => state.scores[c] === null);
}

export function previewScores(state) {
  const preview = {};
  for (const cat of legalCategories(state)) {
    preview[cat] = scoreFor(state.dice, cat);
  }
  return preview;
}

export function scoreFor(dice, category) {
  const counts = countFaces(dice);
  const total = sumDice(dice);
  switch (category) {
    case 'ones': return counts[1] * 1;
    case 'twos': return counts[2] * 2;
    case 'threes': return counts[3] * 3;
    case 'fours': return counts[4] * 4;
    case 'fives': return counts[5] * 5;
    case 'sixes': return counts[6] * 6;
    case 'threeKind': return hasNOfKind(counts, 3) ? total : 0;
    case 'fourKind': return hasNOfKind(counts, 4) ? total : 0;
    case 'fullHouse': return isFullHouse(counts) ? 25 : 0;
    case 'smallStraight': return hasStraight(dice, 4) ? 30 : 0;
    case 'largeStraight': return hasStraight(dice, 5) ? 40 : 0;
    case 'yahtzee': return hasNOfKind(counts, 5) ? 50 : 0;
    case 'chance': return total;
  }
  throw new Error(`unknown category: ${category}`);
}

export function upperSubtotal(state) {
  return UPPER.reduce((s, c) => s + (state.scores[c] ?? 0), 0);
}

export function upperBonus(state) {
  return upperSubtotal(state) >= 63 ? 35 : 0;
}

export function lowerSubtotal(state) {
  return LOWER.reduce((s, c) => s + (state.scores[c] ?? 0), 0);
}

export function grandTotal(state) {
  return upperSubtotal(state) + upperBonus(state) + lowerSubtotal(state) + state.bonus;
}

export function gameOver(state) {
  return CATEGORIES.every(c => state.scores[c] !== null);
}

function endTurn(state) {
  return {
    ...state,
    dice: [1, 1, 1, 1, 1],
    held: [false, false, false, false, false],
    rollsUsed: 0,
    turn: state.turn + 1,
  };
}

function rollDie(rng) {
  return Math.floor(rng() * 6) + 1;
}

function countFaces(dice) {
  const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const d of dice) c[d]++;
  return c;
}

function sumDice(dice) {
  return dice.reduce((a, b) => a + b, 0);
}

function hasNOfKind(counts, n) {
  for (const face of [1, 2, 3, 4, 5, 6]) if (counts[face] >= n) return true;
  return false;
}

function isFullHouse(counts) {
  const values = Object.values(counts);
  return values.includes(3) && values.includes(2);
}

function hasStraight(dice, len) {
  const set = new Set(dice);
  let run = 0, best = 0;
  for (let i = 1; i <= 6; i++) {
    if (set.has(i)) { run++; if (run > best) best = run; }
    else { run = 0; }
  }
  return best >= len;
}

function fiveKind(dice) {
  return hasNOfKind(countFaces(dice), 5);
}
