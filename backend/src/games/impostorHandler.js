/**
 * impostorHandler.js
 * Stub — full implementation in Phase 2.
 */

function startGame(io, room) {
  console.log('[Impostor] startGame stub called for room', room.code);
}

function handleVote(io, socket, payload) {}
function forceVote(io, socket, payload) {}

module.exports = { startGame, handleVote, forceVote };
