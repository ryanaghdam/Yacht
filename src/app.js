import {
  newGame, roll, toggleHold, commit,
  legalCategories, previewScores, grandTotal, gameOver,
  upperSubtotal, upperBonus, CATEGORIES,
} from './game.js';
import { saveGame, loadGame, clearGame, loadHighScore, saveHighScore } from './storage.js';

let state = loadGame() ?? newGame();
let selected = null;
let highScoreBanked = false;

function render() {
  document.getElementById('grand-total').textContent = String(grandTotal(state));

  const upperSub = upperSubtotal(state);
  const bonus = upperBonus(state);
  const upperEl = document.getElementById('upper-progress');
  if (bonus > 0) {
    upperEl.textContent = '+35 bonus';
    upperEl.classList.add('earned');
  } else {
    upperEl.textContent = `${upperSub} / 63`;
    upperEl.classList.remove('earned');
  }

  const rollInd = document.getElementById('roll-indicator');
  rollInd.textContent =
    gameOver(state) ? 'game over' :
    state.rollsUsed === 0 ? 'press ROLL to begin' :
    `roll ${state.rollsUsed} / 3`;

  const noRoll = state.rollsUsed === 0;
  for (let i = 0; i < 5; i++) {
    const die = document.querySelector(`.die[data-index="${i}"]`);
    die.dataset.value = String(state.dice[i]);
    die.classList.toggle('held', state.held[i]);
    die.classList.toggle('empty', noRoll);
    die.setAttribute('aria-label',
      noRoll ? `Die ${i + 1}, not rolled` :
      `Die ${i + 1} shows ${state.dice[i]}${state.held[i] ? ', held' : ''}`);

    const btn = document.querySelector(`.hold-btn[data-index="${i}"]`);
    btn.setAttribute('aria-pressed', state.held[i] ? 'true' : 'false');
  }

  const preview = previewScores(state);
  const legal = legalCategories(state);

  for (const cat of CATEGORIES) {
    const cell = document.querySelector(`.cell-val[data-cat="${cat}"]`);
    const value = state.scores[cat];
    const isSelected = cat === selected;
    if (value !== null) {
      cell.textContent = String(value);
      cell.classList.remove('empty', 'selected');
      cell.classList.add('filled');
    } else if (isSelected && preview[cat] !== undefined) {
      cell.textContent = String(preview[cat]);
      cell.classList.remove('empty', 'filled');
      cell.classList.add('selected');
    } else {
      cell.textContent = '—';
      cell.classList.add('empty');
      cell.classList.remove('filled');
      cell.classList.toggle('selected', isSelected);
    }
  }

  const bonusCell = document.querySelector('.cell-val[data-cat="bonus"]');
  if (state.bonus > 0) {
    bonusCell.textContent = String(state.bonus);
    bonusCell.classList.remove('empty');
    bonusCell.classList.add('filled');
  } else {
    bonusCell.textContent = '—';
    bonusCell.classList.add('empty');
    bonusCell.classList.remove('filled');
  }

  document.querySelector('.roll-btn').disabled = state.rollsUsed >= 3 || gameOver(state);
  document.querySelector('.enter-btn').disabled =
    selected === null || !legal.includes(selected);
}

function moveSelection(dir) {
  const legal = legalCategories(state);
  if (legal.length === 0) { selected = null; return; }
  if (selected === null || !legal.includes(selected)) {
    selected = dir > 0 ? legal[0] : legal[legal.length - 1];
    return;
  }
  const idx = legal.indexOf(selected);
  selected = legal[(idx + dir + legal.length) % legal.length];
}

function persistAndRender() {
  saveGame(state);
  if (gameOver(state) && !highScoreBanked) {
    const total = grandTotal(state);
    if (total > loadHighScore()) saveHighScore(total);
    highScoreBanked = true;
  }
  render();
}

function doRoll() {
  if (state.rollsUsed >= 3 || gameOver(state)) return;
  const wasFirstRoll = state.rollsUsed === 0;
  const heldBefore = [...state.held];
  state = roll(state);
  selected = null;
  animateShuffle(i => wasFirstRoll || !heldBefore[i], persistAndRender);
}

function doEnter() {
  const legal = legalCategories(state);
  if (selected === null || !legal.includes(selected)) return;
  const justFilled = selected;
  state = commit(state, selected);
  selected = null;
  persistAndRender();
  flashCell(justFilled);
}

function animateShuffle(isShuffling, done) {
  const dice = document.querySelectorAll('.die');
  for (let i = 0; i < 5; i++) {
    if (isShuffling(i)) {
      dice[i].classList.remove('empty');
      dice[i].classList.add('rolling');
    }
  }
  const start = performance.now();
  const duration = 420;
  const swapEvery = 65;
  let lastSwap = -swapEvery;
  const step = (now) => {
    const elapsed = now - start;
    if (elapsed - lastSwap >= swapEvery) {
      lastSwap = elapsed;
      for (let i = 0; i < 5; i++) {
        if (isShuffling(i)) dice[i].dataset.value = String(1 + Math.floor(Math.random() * 6));
      }
    }
    if (elapsed >= duration) {
      for (let i = 0; i < 5; i++) dice[i].classList.remove('rolling');
      done();
      return;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function flashCell(cat) {
  const cell = document.querySelector(`.cell-val[data-cat="${cat}"]`);
  if (!cell) return;
  cell.classList.remove('just-filled');
  void cell.offsetWidth;
  cell.classList.add('just-filled');
  setTimeout(() => cell.classList.remove('just-filled'), 700);
}

function doToggleHold(index) {
  state = toggleHold(state, index);
  persistAndRender();
}

function selectCategory(cat) {
  const legal = legalCategories(state);
  if (!legal.includes(cat)) return;
  if (selected === cat) {
    doEnter();
  } else {
    selected = cat;
    render();
  }
}

function doNewGame() {
  const inProgress = Object.values(state.scores).some(v => v !== null);
  if (inProgress && !gameOver(state) && !confirm('Start a new game? Current progress will be lost.')) return;
  state = newGame();
  selected = null;
  highScoreBanked = false;
  clearGame();
  render();
}

function doHighScore() {
  const hi = loadHighScore();
  const rollInd = document.getElementById('roll-indicator');
  rollInd.textContent = hi > 0 ? `high score: ${hi}` : 'no high score yet';
}

document.querySelector('.roll-btn').addEventListener('click', doRoll);
document.querySelector('.enter-btn').addEventListener('click', doEnter);
document.querySelector('[data-action="prev"]').addEventListener('click', () => { moveSelection(-1); render(); });
document.querySelector('[data-action="next"]').addEventListener('click', () => { moveSelection(1); render(); });
document.querySelector('[data-action="newgame"]').addEventListener('click', doNewGame);
document.querySelector('[data-action="highscore"]').addEventListener('click', doHighScore);

for (const btn of document.querySelectorAll('.hold-btn')) {
  btn.addEventListener('click', () => doToggleHold(Number(btn.dataset.index)));
}

for (const die of document.querySelectorAll('.die')) {
  die.addEventListener('click', () => doToggleHold(Number(die.dataset.index)));
}

for (const cell of document.querySelectorAll('.cell-val')) {
  const cat = cell.dataset.cat;
  if (cat === 'bonus') continue;
  cell.addEventListener('click', () => selectCategory(cat));
}

render();
