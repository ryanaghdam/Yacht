import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame, roll, toggleHold, commit,
  scoreFor, legalCategories, previewScores,
  upperSubtotal, upperBonus, grandTotal, gameOver,
  CATEGORIES, LOWER,
} from '../src/game.js';

test('scoreFor: upper section counts matching faces', () => {
  assert.equal(scoreFor([1,1,1,4,5], 'ones'), 3);
  assert.equal(scoreFor([6,6,6,6,6], 'sixes'), 30);
});

test('scoreFor: three/four of a kind sum all dice when valid', () => {
  assert.equal(scoreFor([2,2,2,3,4], 'threeKind'), 13);
  assert.equal(scoreFor([2,2,2,3,4], 'fourKind'), 0);
  assert.equal(scoreFor([5,5,5,5,2], 'fourKind'), 22);
});

test('scoreFor: full house is strict 3+2, not five-of-a-kind', () => {
  assert.equal(scoreFor([3,3,3,6,6], 'fullHouse'), 25);
  assert.equal(scoreFor([3,3,3,3,3], 'fullHouse'), 0);
});

test('scoreFor: straights', () => {
  assert.equal(scoreFor([1,2,3,4,6], 'smallStraight'), 30);
  assert.equal(scoreFor([2,3,4,5,6], 'smallStraight'), 30);
  assert.equal(scoreFor([1,2,3,4,5], 'largeStraight'), 40);
  assert.equal(scoreFor([2,3,4,5,6], 'largeStraight'), 40);
  assert.equal(scoreFor([1,2,3,4,6], 'largeStraight'), 0);
});

test('scoreFor: yahtzee and chance', () => {
  assert.equal(scoreFor([4,4,4,4,4], 'yahtzee'), 50);
  assert.equal(scoreFor([4,4,4,4,3], 'yahtzee'), 0);
  assert.equal(scoreFor([1,3,5,2,4], 'chance'), 15);
});

test('roll and hold flow: three rolls per turn, holds stick', () => {
  let seed = 1;
  const rng = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  let s = newGame();
  assert.equal(s.rollsUsed, 0);

  s = roll(s, rng);
  assert.equal(s.rollsUsed, 1);
  const afterFirst = [...s.dice];

  s = toggleHold(s, 0);
  s = toggleHold(s, 2);
  assert.deepEqual(s.held, [true, false, true, false, false]);

  s = roll(s, rng);
  assert.equal(s.rollsUsed, 2);
  assert.equal(s.dice[0], afterFirst[0], 'held die 0 unchanged');
  assert.equal(s.dice[2], afterFirst[2], 'held die 2 unchanged');

  s = roll(s, rng);
  assert.equal(s.rollsUsed, 3);
  assert.throws(() => roll(s, rng), /no rolls left/);
});

test('commit: advances turn and resets dice/holds/rolls', () => {
  let s = newGame();
  s = { ...s, dice: [1,2,3,4,5], rollsUsed: 3 };
  const before = s.turn;
  s = commit(s, 'chance');
  assert.equal(s.turn, before + 1);
  assert.equal(s.rollsUsed, 0);
  assert.ok(s.held.every(h => !h));
  assert.equal(s.scores.chance, 15);
});

test('upperBonus: exactly 63 triggers +35, less does not', () => {
  const g = newGame();
  g.scores = { ...g.scores, ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 };
  assert.equal(upperSubtotal(g), 63);
  assert.equal(upperBonus(g), 35);

  g.scores.sixes = 12;
  assert.equal(upperBonus(g), 0);
});

test('joker rule: matching upper unfilled is forced', () => {
  const j = newGame();
  j.dice = [4,4,4,4,4];
  j.rollsUsed = 1;
  j.scores.yahtzee = 50;
  assert.deepEqual(legalCategories(j), ['fours']);
});

test('joker rule: matching upper filled → any open lower box', () => {
  const j = newGame();
  j.dice = [4,4,4,4,4];
  j.rollsUsed = 1;
  j.scores.yahtzee = 50;
  j.scores.fours = 20;
  const legal = legalCategories(j);
  assert.ok(!legal.includes('yahtzee'), 'yahtzee already filled');
  assert.ok(legal.every(c => LOWER.includes(c) && c !== 'yahtzee'), 'only open lower boxes');
});

test('joker rule: full house scored as 25 when placed via joker', () => {
  const j = newGame();
  j.dice = [4,4,4,4,4];
  j.rollsUsed = 1;
  j.scores.yahtzee = 50;
  j.scores.fours = 20;
  assert.equal(previewScores(j).fullHouse, 25);
});

test('yahtzee bonus: +100 when the yahtzee box was originally scored 50', () => {
  let b = newGame();
  b.dice = [3,3,3,3,3];
  b.rollsUsed = 3;
  b.scores.yahtzee = 50;
  b.scores.threes = null;
  const after = commit(b, 'threes');
  assert.equal(after.bonus, 100);
  assert.equal(after.scores.threes, 15);
});

test('yahtzee bonus: no bonus when the yahtzee box was scored 0', () => {
  let b = newGame();
  b.dice = [3,3,3,3,3];
  b.rollsUsed = 3;
  b.scores.yahtzee = 0;
  b.scores.threes = null;
  const after = commit(b, 'threes');
  assert.equal(after.bonus, 0);
  assert.equal(after.scores.threes, 15, 'joker placement still applies');
});

test('gameOver: true only when every category is filled', () => {
  const done = newGame();
  for (const c of CATEGORIES) done.scores[c] = 0;
  assert.equal(gameOver(done), true);
  done.scores.ones = null;
  assert.equal(gameOver(done), false);
});

test('grandTotal: upper + upper bonus + lower + yahtzee bonus', () => {
  const full = newGame();
  full.scores = {
    ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18,
    threeKind: 20, fourKind: 24, fullHouse: 25, smallStraight: 30,
    largeStraight: 40, yahtzee: 50, chance: 22,
  };
  full.bonus = 200;
  assert.equal(grandTotal(full), 63 + 35 + 211 + 200);
});
