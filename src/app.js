import {
  newGame, roll, toggleHold, commit,
  legalCategories, previewScores, grandTotal, gameOver,
  CATEGORIES,
} from './game.js';

let state = newGame();
let selected = null;

function render() {
  document.getElementById('grand-total').textContent = String(grandTotal(state));

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

function doRoll() {
  if (state.rollsUsed >= 3 || gameOver(state)) return;
  state = roll(state);
  selected = null;
  render();
}

function doEnter() {
  const legal = legalCategories(state);
  if (selected === null || !legal.includes(selected)) return;
  state = commit(state, selected);
  selected = null;
  render();
}

function doToggleHold(index) {
  state = toggleHold(state, index);
  render();
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
  render();
}

document.querySelector('.roll-btn').addEventListener('click', doRoll);
document.querySelector('.enter-btn').addEventListener('click', doEnter);
document.querySelector('[data-action="prev"]').addEventListener('click', () => { moveSelection(-1); render(); });
document.querySelector('[data-action="next"]').addEventListener('click', () => { moveSelection(1); render(); });
document.querySelector('[data-action="newgame"]').addEventListener('click', doNewGame);

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
