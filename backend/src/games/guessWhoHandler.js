/**
 * guessWhoHandler.js
 * Stub — full implementation in Phase 3.
 */

function startGame(io, room) {
  console.log('[GuessWho] startGame stub called for room', room.code);
}

function selectSecret(io, socket, payload) {}
function handleGuess(io, socket, payload) {}

module.exports = { startGame, selectSecret, handleGuess };
