const GAME_KEY = 'yacht:game';
const HIGH_KEY = 'yacht:highscore';

export function saveGame(state) {
  try { localStorage.setItem(GAME_KEY, JSON.stringify(state)); }
  catch {}
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearGame() {
  try { localStorage.removeItem(GAME_KEY); }
  catch {}
}

export function loadHighScore() {
  try {
    const raw = localStorage.getItem(HIGH_KEY);
    return raw ? Number(raw) : 0;
  } catch { return 0; }
}

export function saveHighScore(score) {
  try { localStorage.setItem(HIGH_KEY, String(score)); }
  catch {}
}
