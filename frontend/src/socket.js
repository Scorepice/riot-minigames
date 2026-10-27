/**
 * socket.js
 * Singleton socket.io-client instance shared across the whole app.
 * The connection is established lazily when this module is first imported.
 */
import { io } from 'socket.io-client'

const URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export const socket = io(URL, {
  // Don't connect until the user explicitly creates/joins a room
  autoConnect: false,
  transports: ['websocket', 'polling'],
})
