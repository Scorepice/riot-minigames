/**
 * impostorHandler.js
 * Full implementation of the "El Impostor" game.
 *
 * Game flow:
 *   1. startGame()     → assigns roles, starts 3-min timer
 *   2. [timer ends or host calls forceVote()] → opens voting phase
 *   3. handleVote()    → collects votes, resolves winner when all voted
 */

const { pickOne } = require('../utils/characterUtils');
const { getRoom, publicRoom } = require('../rooms/roomManager');

// Active timers stored outside room state (Node.js Timeout references)
// key: roomCode, value: { interval: NodeJS.Timeout, remaining: number }
const activeTimers = new Map();

// Duration of the discussion phase in seconds
const DISCUSSION_SECONDS = 180;

// ---------------------------------------------------------------------------
// startGame
// ---------------------------------------------------------------------------

/**
 * Initialises an Impostor game for the given room.
 * Called by index.js when the host fires 'game:start'.
 *
 * @param {import('socket.io').Server} io
 * @param {import('../rooms/roomManager').Room} room
 */
function startGame(io, room) {
  try {
    const character = pickOne(room.config.universe);
    const playerIds = room.players.map((p) => p.id);

    // Pick a random impostor index
    const impostorIndex = Math.floor(Math.random() * playerIds.length);
    const impostorId    = playerIds[impostorIndex];

    // Build game state (stored on the room object for later reference)
    room.status    = 'playing';
    room.gameState = {
      type:       'impostor',
      character,              // full character object
      impostorId,
      votes:      {},         // { voterId: suspectId }
      phase:      'discussion',
    };

    // ── Send individual payloads ──────────────────────────────────────────
    for (const player of room.players) {
      const isImpostor = player.id === impostorId;

      /** @type {object} */
      const payload = {
        role:      isImpostor ? 'IMPOSTOR' : 'INNOCENT',
        duration:  DISCUSSION_SECONDS,
        players:   room.players.map(({ id, nickname }) => ({ id, nickname })),
      };

      if (isImpostor) {
        // Impostor only gets the hint (if enabled) — never the name or image
        if (room.config.impostorHint) {
          payload.hint = character.hint;
        }
      } else {
        // Innocents get full character info
        payload.character = {
          id:       character.id,
          name:     character.name,
          image:    character.image,
          universe: character.universe,
        };
      }

      io.to(player.id).emit('impostor:start', payload);
    }

    console.log(
      `[Impostor] Room ${room.code} started. Character: ${character.name}. Impostor: ${impostorId}`
    );

    // ── Start synchronized countdown ──────────────────────────────────────
    startTimer(io, room);

  } catch (err) {
    console.error('[Impostor] startGame error:', err.message);
    io.to(room.code).emit('error', { message: err.message });
  }
}

// ---------------------------------------------------------------------------
// Timer
// ---------------------------------------------------------------------------

/**
 * Starts a 1-second interval that broadcasts the remaining time to the room.
 * When time reaches 0 it automatically opens the voting phase.
 *
 * @param {import('socket.io').Server} io
 * @param {import('../rooms/roomManager').Room} room
 */
function startTimer(io, room) {
  // Clear any pre-existing timer for this room
  clearRoomTimer(room.code);

  let remaining = DISCUSSION_SECONDS;

  // Emit the first tick immediately so the UI shows the full timer at once
  io.to(room.code).emit('impostor:tick', { remaining });

  const interval = setInterval(() => {
    remaining -= 1;
    io.to(room.code).emit('impostor:tick', { remaining });

    if (remaining <= 0) {
      clearRoomTimer(room.code);
      openVoting(io, room);
    }
  }, 1000);

  activeTimers.set(room.code, { interval, remaining });
}

/** Clears the interval for a room if one exists. */
function clearRoomTimer(code) {
  const entry = activeTimers.get(code);
  if (entry) {
    clearInterval(entry.interval);
    activeTimers.delete(code);
  }
}

// ---------------------------------------------------------------------------
// Voting phase
// ---------------------------------------------------------------------------

/**
 * Transitions the room to the voting phase.
 * Called automatically when the timer expires, or manually by the host.
 *
 * @param {import('socket.io').Server} io
 * @param {import('../rooms/roomManager').Room} room
 */
function openVoting(io, room) {
  if (!room.gameState || room.gameState.phase !== 'discussion') return;

  room.status          = 'voting';
  room.gameState.phase = 'voting';

  const playerList = room.players.map(({ id, nickname }) => ({ id, nickname }));
  io.to(room.code).emit('impostor:votingOpen', { players: playerList });
  console.log(`[Impostor] Room ${room.code} → voting phase.`);
}

// ---------------------------------------------------------------------------
// handleVote — receives one vote per player
// ---------------------------------------------------------------------------

/**
 * Registers a player's vote.
 * Once every connected player has voted, resolves the round.
 *
 * Payload: { code: string, suspectId: string }
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {{ code: string, suspectId: string }} payload
 */
function handleVote(io, socket, payload) {
  const { code, suspectId } = payload || {};
  const room = getRoom(code);
  if (!room) return;
  if (room.gameState?.type !== 'impostor') return;
  if (room.gameState?.phase !== 'voting') {
    return socket.emit('error', { message: 'Voting is not open yet.' });
  }

  // Validate that the suspect is a valid player
  const isValidSuspect = room.players.some((p) => p.id === suspectId);
  if (!isValidSuspect) {
    return socket.emit('error', { message: 'Invalid suspect.' });
  }

  // Prevent double-voting
  if (room.gameState.votes[socket.id] !== undefined) {
    return socket.emit('error', { message: 'You already voted.' });
  }

  room.gameState.votes[socket.id] = suspectId;

  // Acknowledge the vote to the room (without revealing who voted for whom)
  const votedCount = Object.keys(room.gameState.votes).length;
  io.to(room.code).emit('impostor:voteUpdate', {
    votedCount,
    totalPlayers: room.players.length,
  });

  console.log(`[Impostor] Room ${room.code}: ${votedCount}/${room.players.length} votes in.`);

  // Check if everyone has voted
  if (votedCount >= room.players.length) {
    resolveVoting(io, room);
  }
}

// ---------------------------------------------------------------------------
// forceVote — host skips the timer
// ---------------------------------------------------------------------------

/**
 * Host manually ends the discussion phase and opens voting early.
 *
 * Payload: { code: string }
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {{ code: string }} payload
 */
function forceVote(io, socket, payload) {
  const { code } = payload || {};
  const room = getRoom(code);
  if (!room) return;
  if (room.hostId !== socket.id) {
    return socket.emit('error', { message: 'Only the host can force voting.' });
  }
  if (room.gameState?.phase !== 'discussion') return;

  clearRoomTimer(code);
  openVoting(io, room);
}

// ---------------------------------------------------------------------------
// resolveVoting — tally votes and emit the result
// ---------------------------------------------------------------------------

/**
 * Counts votes, determines the most-voted player, and resolves who won.
 *
 * Rules:
 *  - Most votes → accused.
 *  - If the accused IS the impostor → Innocents win.
 *  - If the accused is NOT the impostor → Impostor wins.
 *  - Ties → no elimination (Impostor wins by default).
 *
 * @param {import('socket.io').Server} io
 * @param {import('../rooms/roomManager').Room} room
 */
function resolveVoting(io, room) {
  const { votes, character, impostorId } = room.gameState;

  // Tally
  /** @type {Record<string, number>} */
  const tally = {};
  for (const suspectId of Object.values(votes)) {
    tally[suspectId] = (tally[suspectId] || 0) + 1;
  }

  // Find max votes
  const maxVotes = Math.max(...Object.values(tally));

  // Detect tie (multiple players with the same highest count)
  const topCandidates = Object.entries(tally).filter(([, v]) => v === maxVotes);
  const isTie = topCandidates.length > 1;

  // Accused = single highest voted player (or null on tie)
  const accusedId = isTie ? null : topCandidates[0][0];

  // Determine winner
  const impostorCaught = !isTie && accusedId === impostorId;
  const winner         = impostorCaught ? 'innocents' : 'impostor';

  // Find impostor nickname
  const impostorPlayer = room.players.find((p) => p.id === impostorId);
  const accusedPlayer  = accusedId ? room.players.find((p) => p.id === accusedId) : null;

  // Build full tally with nicknames for the results screen
  const tallyWithNames = Object.entries(tally).map(([id, count]) => ({
    id,
    nickname: room.players.find((p) => p.id === id)?.nickname ?? 'Unknown',
    votes: count,
  }));

  // Mark room as ended
  room.status          = 'ended';
  room.gameState.phase = 'ended';

  const result = {
    winner,
    isTie,
    accusedId,
    accusedNickname:  accusedPlayer?.nickname  ?? null,
    impostorId,
    impostorNickname: impostorPlayer?.nickname ?? 'Unknown',
    character: {
      id:       character.id,
      name:     character.name,
      image:    character.image,
      universe: character.universe,
    },
    tally: tallyWithNames,
  };

  io.to(room.code).emit('impostor:result', result);
  console.log(
    `[Impostor] Room ${room.code} → winner: ${winner}. Impostor: ${impostorPlayer?.nickname}.`
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Public cancel — used by index.js when host goes back to lobby.
 * @param {string} code
 */
function cancelTimer(code) {
  clearRoomTimer(code);
}

module.exports = { startGame, handleVote, forceVote, cancelTimer };
