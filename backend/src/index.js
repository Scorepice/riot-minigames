/**
 * index.js — Riot Minigames Backend
 * Express + Socket.io server.
 *
 * Handles:
 *  - Room creation / joining (including deep-link support)
 *  - Host control & config updates
 *  - Disconnect / host-reassignment logic
 *  - Routing to game-specific event handlers (Impostor, GuessWho)
 */

require('dotenv').config();

const express = require('express');
const http    = require('http');
const cors    = require('cors');
const { Server } = require('socket.io');

const {
  createRoom,
  joinRoom,
  handleDisconnect,
  updateRoomConfig,
  getRoom,
  getRoomByPlayer,
  publicRoom,
} = require('./rooms/roomManager');

// ---------------------------------------------------------------------------
// App & HTTP server
// ---------------------------------------------------------------------------
const app    = express();
const server = http.createServer(app);

const PORT          = process.env.PORT          || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// ---------------------------------------------------------------------------
// CORS — allow the React dev server (and production domain)
// ---------------------------------------------------------------------------
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// Health-check endpoint (useful for render.com / railway free tier)
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ---------------------------------------------------------------------------
// Socket.io
// ---------------------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ---------------------------------------------------------------------------
// Lazy-load game handlers (Phases 2 & 3 will fill these)
// ---------------------------------------------------------------------------
// We import them here so they can attach their own events to `io` and `socket`.
const impostorHandler = require('./games/impostorHandler');
const guessWhoHandler = require('./games/guessWhoHandler');

// ---------------------------------------------------------------------------
// Socket.io connection
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ── CREATE ROOM ──────────────────────────────────────────────────────────
  /**
   * Payload: { nickname: string }
   * Emits back: { room } on 'room:created'
   */
  socket.on('room:create', ({ nickname } = {}) => {
    if (!nickname?.trim()) {
      return socket.emit('error', { message: 'Nickname is required.' });
    }

    const room = createRoom(socket.id, nickname.trim());
    socket.join(room.code);
    socket.emit('room:created', { room: publicRoom(room) });
    console.log(`[Room] Created ${room.code} by ${nickname}`);
  });

  // ── JOIN ROOM ─────────────────────────────────────────────────────────────
  /**
   * Payload: { code: string, nickname: string }
   * Supports deep-link flow: frontend passes ?room= query param directly.
   * Emits:
   *   - 'room:joined'  to the joining socket
   *   - 'room:updated' to everyone in the room (including the new player)
   */
  socket.on('room:join', ({ code, nickname } = {}) => {
    if (!code?.trim() || !nickname?.trim()) {
      return socket.emit('error', { message: 'Code and nickname are required.' });
    }

    const upperCode = code.trim().toUpperCase();
    const room = joinRoom(upperCode, socket.id, nickname.trim());

    if (!room) {
      const existing = getRoom(upperCode);
      if (!existing) return socket.emit('error', { message: 'Room not found.' });
      if (existing.status !== 'lobby')
        return socket.emit('error', { message: 'Game already started.' });
      return socket.emit('error', { message: 'Room is full (max 10 players).' });
    }

    socket.join(room.code);
    socket.emit('room:joined', { room: publicRoom(room) });
    // Notify everyone (including the joiner) about the updated player list
    io.to(room.code).emit('room:updated', { room: publicRoom(room) });
    console.log(`[Room] ${nickname} joined ${room.code}`);
  });

  // ── UPDATE CONFIG (host only) ─────────────────────────────────────────────
  /**
   * Payload: { code: string, config: Partial<RoomConfig> }
   * Only the host may call this. Broadcasts updated room to all players.
   */
  socket.on('room:config', ({ code, config } = {}) => {
    const room = getRoom(code);
    if (!room) return socket.emit('error', { message: 'Room not found.' });
    if (room.hostId !== socket.id)
      return socket.emit('error', { message: 'Only the host can change settings.' });

    // Whitelist accepted config keys to prevent injection
    const allowed = ['universe', 'gameMode', 'impostorHint'];
    const safeConfig = {};
    for (const key of allowed) {
      if (config[key] !== undefined) safeConfig[key] = config[key];
    }

    const updated = updateRoomConfig(code, safeConfig);
    io.to(code).emit('room:updated', { room: publicRoom(updated) });
  });

  // ── START GAME (host only) ────────────────────────────────────────────────
  /**
   * Payload: { code: string }
   * Validates player count per game mode then delegates to the correct handler.
   */
  socket.on('game:start', ({ code } = {}) => {
    const room = getRoom(code);
    if (!room) return socket.emit('error', { message: 'Room not found.' });
    if (room.hostId !== socket.id)
      return socket.emit('error', { message: 'Only the host can start the game.' });
    if (room.status !== 'lobby')
      return socket.emit('error', { message: 'Game already in progress.' });

    const { gameMode, universe } = room.config;

    // Per-mode player count validation
    if (gameMode === 'impostor' && room.players.length < 3) {
      return socket.emit('error', { message: 'El Impostor needs at least 3 players.' });
    }
    if (gameMode === 'guesswho' && room.players.length !== 2) {
      return socket.emit('error', { message: 'Adivina Quién needs exactly 2 players.' });
    }

    // Delegate to game handler
    if (gameMode === 'impostor') {
      impostorHandler.startGame(io, room);
    } else if (gameMode === 'guesswho') {
      guessWhoHandler.startGame(io, room);
    }
  });

  // ── GAME EVENTS — forward to handlers ─────────────────────────────────────
  // El Impostor
  socket.on('impostor:vote', (payload) => impostorHandler.handleVote(io, socket, payload));
  socket.on('impostor:forceVote', (payload) => impostorHandler.forceVote(io, socket, payload));

  // Adivina Quién
  socket.on('guesswho:selectSecret', (payload) => guessWhoHandler.selectSecret(io, socket, payload));
  socket.on('guesswho:guess', (payload) => guessWhoHandler.handleGuess(io, socket, payload));

  // ── RETURN TO LOBBY (host only) ───────────────────────────────────────────
  socket.on('room:backToLobby', ({ code } = {}) => {
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id) return;

    // Cancel any active timers before resetting
    impostorHandler.cancelTimer(code);
    guessWhoHandler.cancelTimer(code);

    room.status    = 'lobby';
    room.gameState = null;
    io.to(code).emit('room:updated', { room: publicRoom(room) });
    io.to(code).emit('game:backToLobby');
  });

  // ── DISCONNECT ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);

    const { room, deleted } = handleDisconnect(socket.id);

    if (deleted) {
      // Room removed — nothing else to do
      return;
    }

    if (room) {
      // Broadcast updated room (new host, player left)
      io.to(room.code).emit('room:updated', { room: publicRoom(room) });
      io.to(room.code).emit('player:left', { playerId: socket.id, newHostId: room.hostId });
    }
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
server.listen(PORT, () => {
  console.log(`🚀 Riot Minigames backend running on http://localhost:${PORT}`);
  console.log(`   Accepting connections from: ${CLIENT_ORIGIN}`);
});
