/**
 * guessWhoHandler.js
 * Full implementation of the "Adivina Quién" (Guess Who) game.
 *
 * Game flow:
 *   1. startGame()        → server picks 24 chars and sends the same board to both players
 *   2. selectSecret()     → each player privately picks their secret character
 *                           (once both have chosen, the server starts the match)
 *   3. guesswho:guess     → a player guesses their opponent's secret character
 *                           correct → they win; wrong → they lose immediately
 *
 * Card-elimination (crossing out cards on the grid) is 100% local in React,
 * so no WebSocket event is needed for it — this keeps traffic minimal.
 */

const { pickRandom } = require('../utils/characterUtils');
const { getRoom }    = require('../rooms/roomManager');

// How many characters appear on the board
const BOARD_SIZE = 24;

// ---------------------------------------------------------------------------
// startGame
// ---------------------------------------------------------------------------

/**
 * Initialises a Guess Who game for the given room (exactly 2 players required).
 * Sends the same 24-character board to both players.
 *
 * @param {import('socket.io').Server} io
 * @param {import('../rooms/roomManager').Room} room
 */
function startGame(io, room) {
  try {
    if (room.players.length !== 2) {
      io.to(room.code).emit('error', {
        message: 'Adivina Quién requires exactly 2 players.',
      });
      return;
    }

    const board = pickRandom(room.config.universe, BOARD_SIZE);

    // Strip everything except what the client needs for the grid
    const boardPublic = board.map(({ id, name, image, universe }) => ({
      id,
      name,
      image,
      universe,
    }));

    // Initialise game state on the room
    room.status    = 'playing';
    room.gameState = {
      type:    'guesswho',
      board,                  // full objects kept server-side for validation
      phase:   'selection',   // 'selection' | 'playing' | 'ended'
      secrets: {},            // { socketId: characterId }  — private!
      readyPlayers: [],       // list of socketIds that have picked their secret
    };

    const [p1, p2] = room.players;

    // Send the board — same array to both players.
    // Each player also receives the opponent's id/nickname so the UI can label
    // "Your opponent: <nickname>".
    io.to(p1.id).emit('guesswho:start', {
      board:    boardPublic,
      opponent: { id: p2.id, nickname: p2.nickname },
      phase:    'selection',
    });

    io.to(p2.id).emit('guesswho:start', {
      board:    boardPublic,
      opponent: { id: p1.id, nickname: p1.nickname },
      phase:    'selection',
    });

    console.log(
      `[GuessWho] Room ${room.code} started. Board size: ${BOARD_SIZE}. ` +
      `Players: ${p1.nickname} vs ${p2.nickname}`
    );

  } catch (err) {
    console.error('[GuessWho] startGame error:', err.message);
    io.to(room.code).emit('error', { message: err.message });
  }
}

// ---------------------------------------------------------------------------
// selectSecret — Phase 1 (Selection)
// ---------------------------------------------------------------------------

/**
 * Registers a player's secret character choice.
 * Once both players have selected, transitions the room to the playing phase.
 *
 * Payload: { code: string, characterId: string }
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {{ code: string, characterId: string }} payload
 */
function selectSecret(io, socket, payload) {
  const { code, characterId } = payload || {};
  const room = getRoom(code);

  if (!room) return socket.emit('error', { message: 'Room not found.' });
  if (room.gameState?.type !== 'guesswho')
    return socket.emit('error', { message: 'No Guess Who game in progress.' });
  if (room.gameState?.phase !== 'selection')
    return socket.emit('error', { message: 'Selection phase is already over.' });

  const { gameState } = room;

  // Validate characterId is actually on the board
  const isOnBoard = gameState.board.some((c) => c.id === characterId);
  if (!isOnBoard) {
    return socket.emit('error', { message: 'Character not found on the board.' });
  }

  // Prevent re-selection
  if (gameState.secrets[socket.id]) {
    return socket.emit('error', { message: 'You already chose your secret character.' });
  }

  // Store privately
  gameState.secrets[socket.id] = characterId;
  gameState.readyPlayers.push(socket.id);

  // Acknowledge only to the selecting player
  socket.emit('guesswho:secretConfirmed', { characterId });

  console.log(
    `[GuessWho] Room ${room.code}: player ${socket.id} chose secret → ${characterId}`
  );

  // Notify the room how many players are ready (without revealing who chose what)
  io.to(room.code).emit('guesswho:selectionUpdate', {
    readyCount:   gameState.readyPlayers.length,
    totalPlayers: room.players.length,
  });

  // Both players ready → start the match
  if (gameState.readyPlayers.length === 2) {
    transitionToPlaying(io, room);
  }
}

// ---------------------------------------------------------------------------
// transitionToPlaying — internal
// ---------------------------------------------------------------------------

/**
 * Both players have chosen their secret → notify both that the game is live.
 *
 * @param {import('socket.io').Server} io
 * @param {import('../rooms/roomManager').Room} room
 */
function transitionToPlaying(io, room) {
  room.gameState.phase = 'playing';

  // Tell both players the match is now live.
  // Player order is used to decide who "goes first" for display purposes only
  // (the actual turn order is enforced verbally, since elimination is local).
  const [p1, p2] = room.players;

  io.to(room.code).emit('guesswho:playing', {
    firstTurn: p1.id,   // cosmetic — p1 is invited to ask first
    players: [
      { id: p1.id, nickname: p1.nickname },
      { id: p2.id, nickname: p2.nickname },
    ],
  });

  console.log(`[GuessWho] Room ${room.code} → playing phase.`);
}

// ---------------------------------------------------------------------------
// handleGuess — Final guess attempt
// ---------------------------------------------------------------------------

/**
 * A player attempts to guess their opponent's secret character.
 *
 *  - Correct  → guesser wins, round ends.
 *  - Wrong    → guesser loses immediately (opponent wins).
 *
 * Payload: { code: string, guessedCharacterId: string }
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {{ code: string, guessedCharacterId: string }} payload
 */
function handleGuess(io, socket, payload) {
  const { code, guessedCharacterId } = payload || {};
  const room = getRoom(code);

  if (!room) return socket.emit('error', { message: 'Room not found.' });
  if (room.gameState?.type !== 'guesswho')
    return socket.emit('error', { message: 'No Guess Who game in progress.' });
  if (room.gameState?.phase !== 'playing') {
    return socket.emit('error', {
      message: 'You can only guess during the playing phase.',
    });
  }

  const { gameState } = room;

  // Identify the guesser and the opponent
  const guesser  = room.players.find((p) => p.id === socket.id);
  const opponent = room.players.find((p) => p.id !== socket.id);

  if (!guesser || !opponent) {
    return socket.emit('error', { message: 'Player not found in this room.' });
  }

  // The correct answer is the opponent's secret
  const correctId = gameState.secrets[opponent.id];
  const isCorrect = guessedCharacterId === correctId;

  // Look up the full character objects for the result screen
  const guessedChar  = gameState.board.find((c) => c.id === guessedCharacterId);
  const correctChar  = gameState.board.find((c) => c.id === correctId);

  // Determine winner & loser
  const winnerId = isCorrect ? guesser.id  : opponent.id;
  const loserId  = isCorrect ? opponent.id : guesser.id;

  const winnerNickname = room.players.find((p) => p.id === winnerId)?.nickname ?? '';
  const loserNickname  = room.players.find((p) => p.id === loserId)?.nickname  ?? '';

  // Mark room as ended
  room.status          = 'ended';
  room.gameState.phase = 'ended';

  const result = {
    winnerId,
    winnerNickname,
    loserId,
    loserNickname,
    isCorrect,
    guesserId:       guesser.id,
    guesserNickname: guesser.nickname,
    guessedCharacter: guessedChar
      ? { id: guessedChar.id, name: guessedChar.name, image: guessedChar.image }
      : null,
    // Reveal both secrets at end of round
    secrets: {
      [guesser.id]:  buildSecretReveal(gameState, guesser.id,  gameState.board),
      [opponent.id]: buildSecretReveal(gameState, opponent.id, gameState.board),
    },
  };

  io.to(room.code).emit('guesswho:result', result);

  console.log(
    `[GuessWho] Room ${room.code}: ${guesser.nickname} guessed "${guessedChar?.name}". ` +
    `Correct: ${isCorrect}. Winner: ${winnerNickname}.`
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds the public secret reveal object for a player.
 * @param {object} gameState
 * @param {string} playerId
 * @param {object[]} board
 * @returns {{ id: string, name: string, image: string } | null}
 */
function buildSecretReveal(gameState, playerId, board) {
  const secretId = gameState.secrets[playerId];
  if (!secretId) return null;
  const char = board.find((c) => c.id === secretId);
  return char ? { id: char.id, name: char.name, image: char.image } : null;
}

// ---------------------------------------------------------------------------
// cancelTimer — no-op for GuessWho (no server timer), kept for API symmetry
// ---------------------------------------------------------------------------
function cancelTimer(_code) {
  // Guess Who has no server-side timer
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = { startGame, selectSecret, handleGuess, cancelTimer };
