/**
 * roomManager.js
 * In-memory room state management using a Map.
 * All game state lives here; no database required.
 */

/** @type {Map<string, Room>} */
const rooms = new Map();

// ---------------------------------------------------------------------------
// Types (JSDoc for IDE intellisense)
// ---------------------------------------------------------------------------
/**
 * @typedef {'lol'|'valorant'|'mix'} UniverseFilter
 * @typedef {'impostor'|'guesswho'} GameMode
 *
 * @typedef {Object} Player
 * @property {string} id          - socket.id
 * @property {string} nickname
 * @property {boolean} isHost
 *
 * @typedef {Object} RoomConfig
 * @property {UniverseFilter} universe
 * @property {GameMode}       gameMode
 * @property {boolean}        impostorHint  - "El Impostor" hint option
 *
 * @typedef {Object} Room
 * @property {string}     code
 * @property {string}     hostId
 * @property {Player[]}   players
 * @property {RoomConfig} config
 * @property {'lobby'|'playing'|'voting'|'ended'} status
 * @property {object|null} gameState   - game-specific state (set by game modules)
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generates a random 4-char uppercase room code. */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

// ---------------------------------------------------------------------------
// Room CRUD
// ---------------------------------------------------------------------------

/**
 * Creates a new room and returns it.
 * @param {string} hostSocketId
 * @param {string} hostNickname
 * @returns {Room}
 */
function createRoom(hostSocketId, hostNickname) {
  const code = generateCode();

  /** @type {Room} */
  const room = {
    code,
    hostId: hostSocketId,
    players: [{ id: hostSocketId, nickname: hostNickname, isHost: true }],
    config: {
      universe: 'mix',
      gameMode: 'impostor',
      impostorHint: false,
    },
    status: 'lobby',
    gameState: null,
  };

  rooms.set(code, room);
  return room;
}

/**
 * Adds a player to a room. Returns the updated room or null if not found / full.
 * @param {string} code
 * @param {string} socketId
 * @param {string} nickname
 * @returns {Room|null}
 */
function joinRoom(code, socketId, nickname) {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.status !== 'lobby') return null;               // game already started
  if (room.players.length >= 10) return null;             // max 10 players
  if (room.players.some((p) => p.id === socketId)) return room; // already in room

  room.players.push({ id: socketId, nickname, isHost: false });
  return room;
}

/**
 * Handles a socket disconnect. Removes the player, reassigns host if needed.
 * Deletes the room if it becomes empty.
 * @param {string} socketId
 * @returns {{ room: Room|null, deleted: boolean }}
 */
function handleDisconnect(socketId) {
  for (const [code, room] of rooms.entries()) {
    const index = room.players.findIndex((p) => p.id === socketId);
    if (index === -1) continue;

    room.players.splice(index, 1);

    // Room is now empty → delete it
    if (room.players.length === 0) {
      rooms.delete(code);
      return { room: null, deleted: true };
    }

    // Host left → promote next player
    if (room.hostId === socketId) {
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }

    return { room, deleted: false };
  }

  return { room: null, deleted: false };
}

/**
 * Updates room configuration. Only callable by the host (validated in the event handler).
 * @param {string} code
 * @param {Partial<RoomConfig>} updates
 * @returns {Room|null}
 */
function updateRoomConfig(code, updates) {
  const room = rooms.get(code);
  if (!room) return null;
  Object.assign(room.config, updates);
  return room;
}

/**
 * Returns a room by code, or undefined.
 * @param {string} code
 * @returns {Room|undefined}
 */
function getRoom(code) {
  return rooms.get(code);
}

/**
 * Finds the room a socket is currently in.
 * @param {string} socketId
 * @returns {Room|undefined}
 */
function getRoomByPlayer(socketId) {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.id === socketId)) return room;
  }
  return undefined;
}

/**
 * Builds the safe public representation of a room (no internal game secrets).
 * @param {Room} room
 */
function publicRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    players: room.players.map(({ id, nickname, isHost }) => ({
      id,
      nickname,
      isHost,
    })),
    config: room.config,
    status: room.status,
  };
}

module.exports = {
  createRoom,
  joinRoom,
  handleDisconnect,
  updateRoomConfig,
  getRoom,
  getRoomByPlayer,
  publicRoom,
};
