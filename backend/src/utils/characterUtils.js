/**
 * characterUtils.js
 * Helpers for loading and filtering the characters dataset.
 */

const path       = require('path');
const characters = require(path.join(__dirname, '../../data/characters.json'));

/**
 * Returns characters filtered by the room's universe setting.
 * @param {'lol'|'valorant'|'mix'} universe
 * @returns {object[]}
 */
function getCharactersByUniverse(universe) {
  if (universe === 'mix') return [...characters];
  return characters.filter((c) => c.universe === universe);
}

/**
 * Picks `count` unique random characters from the filtered pool.
 * Throws if the pool is smaller than requested.
 * @param {'lol'|'valorant'|'mix'} universe
 * @param {number} count
 * @returns {object[]}
 */
function pickRandom(universe, count) {
  const pool = getCharactersByUniverse(universe);
  if (pool.length < count) {
    throw new Error(
      `Not enough characters in universe "${universe}": need ${count}, have ${pool.length}`
    );
  }
  // Fisher-Yates shuffle then slice
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/**
 * Picks exactly 1 random character from the filtered pool.
 * @param {'lol'|'valorant'|'mix'} universe
 * @returns {object}
 */
function pickOne(universe) {
  return pickRandom(universe, 1)[0];
}

module.exports = { getCharactersByUniverse, pickRandom, pickOne };
