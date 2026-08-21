# Yacht — a dice game inspired by the MB Electronic handheld

A static web page that recreates the ergonomics of the MB Electronic Yahtzee handheld with a modern, minimalist look. The app is called **Yacht** — the older, non-trademarked name for this family of dice games — so all user-facing copy avoids the "Yahtzee" trademark, though the ruleset we implement is the classic one that handheld played. Single `index.html` you can double-click to open — no build step, no server required.

## Design intent

- **Look:** fully modern minimalist. Clean typography, generous spacing, restrained palette. **Not** a skeuomorphic reproduction of the plastic shell.
- **Layout:** matches the handheld's physical layout, top to bottom. The photo of the device is the spec; "modern minimalist" governs styling, not placement. The order is:
  1. **LCD area:** header row shows the app name on the left and the **running grand total** on the right (always visible — not hidden behind SUB-TOTAL). Then the scorecard grid: upper section as a 6-column strip; lower section as an **8-column strip** — the seven categories (3-kind, 4-kind, full house, sm straight, lg straight, Yacht, chance) plus a dedicated **BONUS** cell at the end that tallies Yacht bonuses (100, 200, 300, …). The dice row sits at the **bottom** of the LCD so each die is directly above its HOLD button. A subtle "roll N/3" indicator appears near the dice while a turn is in progress; there is no visible "turn N/13" counter.
  2. **HOLD row:** 5 buttons, one directly under each die.
  3. **Aux row:** SUB-TOTAL · HIGH SCORE · NEW GAME.
  4. **Action row:** SELECT (wide rocker with ◀ ▶) · ENTER (small round, center) · ROLL (wide, right).
- **Responsive behavior:** the layout is a single vertical stack that always looks like the handheld. On wider screens it's centered and capped at a handheld-like max width (~360–400px) with more breathing room — never split into a two-column "web app" layout.
- **Scorecard navigation:** because the scorecard is a compact grid on a small LCD, SELECT ◀ ▶ moves a cursor through the score boxes and ENTER commits. Clicking/tapping a box does the same (highlight on first tap, commit on second).

## Input model

Every device button is present and functional. In addition, direct pointer interaction is allowed as a convenience:

- Click/tap a **die** = toggle its HOLD (equivalent to the HOLD button below it).
- Click/tap a **scorecard row** = move the SELECT cursor to it; a second click on the same row = ENTER (commit the score).
- The device buttons still work for keyboard/accessibility users and for the muscle memory of anyone who grew up with the handheld.

No keyboard shortcuts in v1 (may add later).

## Ruleset

The classic ruleset the MB handheld plays, with our category names substituted for the trademarked ones:

- **Upper section:** 1s through 6s. Bonus of **+35** if the upper total is ≥ 63.
- **Lower section:** 3-of-a-kind (sum of all dice), 4-of-a-kind (sum), Full House (25), Small Straight (30), Large Straight (40), **Yacht** — five of a kind (50), Chance (sum).
- **Yacht bonus:** each additional five-of-a-kind after the first, if the Yacht box was scored as 50, awards **+100** (accumulated in the dedicated BONUS cell of the lower grid) and follows joker rules (must use the matching upper box if unfilled; otherwise any lower box; otherwise zero an upper box). If the Yacht box was scored as 0, no bonus.
- **Bonus-Yacht UX:** when a bonus Yacht is rolled, the app auto-applies the joker rule when there is exactly one valid destination (matching upper box empty ⇒ fill it; only one lower box left ⇒ fill it) and credits +100 on ENTER. When the choice is genuinely open (matching upper filled, multiple lower boxes free), SELECT/ENTER lets the player pick where the score goes; +100 is credited either way.
- **Turn:** up to 3 rolls per turn; hold any subset of dice between rolls. Must score into exactly one box per turn (may zero any unfilled box).
- **Game length:** 13 turns per player.

## Two-player mode (optional)

- Shared device, alternating **full turns**: P1 turn 1 → P2 turn 1 → P1 turn 2 → …
- One scorecard visible with a column per player; the active player is clearly indicated.
- Single-player is the default and must work standalone; two-player is a toggle from NEW GAME.

## Persistence (localStorage)

- **Game in progress:** the full game state (dice, holds, roll count, scorecard, active player) survives refresh/reopen.
- **High score:** best single-game total (single-player). Shown when HIGH SCORE is pressed, as on the handheld.

## Sound

No sound. The game is silent — no audio effects, no SOUND toggle, no WebAudio.

## Tech stack

- **Vanilla JS + Web Components.** No framework, no bundler, no npm install to run it.
- ES modules loaded directly from `index.html` (`<script type="module">`).
- Custom elements for the reusable pieces (die, scorecard row, button). Plain modules for game logic.
- Game logic is a pure, framework-free module with no DOM dependency — it should be trivially unit-testable later.
- CSS: one stylesheet, custom properties for the palette, no preprocessor.

## Proposed file layout

```
index.html
styles.css
src/
  game.js          # pure rules engine: state, scoring, transitions
  storage.js       # localStorage load/save (game + high score)
  ui/
    app.js         # top-level custom element wiring game <-> UI
    die.js         # <yz-die value hold>
    scorecard.js   # <yz-scorecard> with selectable rows
    controls.js    # HOLD / SELECT / ENTER / ROLL / aux buttons
```

Nothing above is load-bearing yet — revisit once we start implementing.

## Out of scope (v1)

- Skeuomorphic art of the physical device.
- Keyboard shortcuts.
- Networked multiplayer, accounts, cloud sync.
- Alternate rule variants (Yatzy full-house-as-sum, Generala, etc.).
- Animations beyond what's needed to make a roll feel like a roll.

## Working style

- We plan first, then build. Don't jump to implementation without a plan step.
- Small, reviewable increments. Each increment should leave `index.html` in a runnable state.
- No dependencies without discussing them first.
