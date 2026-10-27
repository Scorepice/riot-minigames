/**
 * useRoom.js
 * Central hook that manages all Socket.io room events.
 * Returns room state and action functions consumed by pages/components.
 */
import { useState, useEffect, useCallback } from 'react'
import { socket } from '../socket'

/**
 * @typedef {'home'|'lobby'|'playing'} AppPhase
 * @typedef {'impostor'|'guesswho'} GameMode
 */

export function useRoom() {
  // ── State ────────────────────────────────────────────────────────────────
  const [phase,     setPhase]     = useState('home')    // app navigation phase
  const [room,      setRoom]      = useState(null)       // public room object from server
  const [myId,      setMyId]      = useState(null)       // own socket id
  const [error,     setError]     = useState(null)       // last server error message
  const [gameEvent, setGameEvent] = useState(null)       // latest game-specific event payload

  // ── Connect socket on mount, disconnect on unmount ───────────────────────
  useEffect(() => {
    socket.connect()
    setMyId(socket.id)

    // Socket id is assigned after connect
    socket.on('connect', () => setMyId(socket.id))

    // ── Room events ──────────────────────────────────────────────────────
    socket.on('room:created', ({ room }) => {
      setRoom(room)
      setPhase('lobby')
      setError(null)
    })

    socket.on('room:joined', ({ room }) => {
      setRoom(room)
      setPhase('lobby')
      setError(null)
    })

    socket.on('room:updated', ({ room }) => {
      setRoom(room)
    })

    socket.on('player:left', () => {
      // room:updated already carries the new state; this event is for toasts etc.
    })

    socket.on('game:backToLobby', () => {
      setPhase('lobby')
      setGameEvent(null)
    })

    // ── El Impostor events ───────────────────────────────────────────────
    socket.on('impostor:start',       (payload) => { setPhase('playing'); setGameEvent({ type: 'impostor:start',       ...payload }) })
    socket.on('impostor:tick',        (payload) => { setGameEvent({ type: 'impostor:tick',        ...payload }) })
    socket.on('impostor:votingOpen',  (payload) => { setGameEvent({ type: 'impostor:votingOpen',  ...payload }) })
    socket.on('impostor:voteUpdate',  (payload) => { setGameEvent({ type: 'impostor:voteUpdate',  ...payload }) })
    socket.on('impostor:result',      (payload) => { setGameEvent({ type: 'impostor:result',      ...payload }) })

    // ── Adivina Quién events ─────────────────────────────────────────────
    socket.on('guesswho:start',           (payload) => { setPhase('playing'); setGameEvent({ type: 'guesswho:start',           ...payload }) })
    socket.on('guesswho:secretConfirmed', (payload) => { setGameEvent({ type: 'guesswho:secretConfirmed', ...payload }) })
    socket.on('guesswho:selectionUpdate', (payload) => { setGameEvent({ type: 'guesswho:selectionUpdate', ...payload }) })
    socket.on('guesswho:playing',         (payload) => { setGameEvent({ type: 'guesswho:playing',         ...payload }) })
    socket.on('guesswho:result',          (payload) => { setGameEvent({ type: 'guesswho:result',          ...payload }) })

    // ── Errors ──────────────────────────────────────────────────────────
    socket.on('error', ({ message }) => setError(message))

    return () => {
      socket.off('connect')
      socket.off('room:created')
      socket.off('room:joined')
      socket.off('room:updated')
      socket.off('player:left')
      socket.off('game:backToLobby')
      socket.off('impostor:start')
      socket.off('impostor:tick')
      socket.off('impostor:votingOpen')
      socket.off('impostor:voteUpdate')
      socket.off('impostor:result')
      socket.off('guesswho:start')
      socket.off('guesswho:secretConfirmed')
      socket.off('guesswho:selectionUpdate')
      socket.off('guesswho:playing')
      socket.off('guesswho:result')
      socket.off('error')
      socket.disconnect()
    }
  }, [])

  // ── Actions ──────────────────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), [])

  const createRoom = useCallback((nickname) => {
    setError(null)
    socket.emit('room:create', { nickname })
  }, [])

  const joinRoom = useCallback((code, nickname) => {
    setError(null)
    socket.emit('room:join', { code, nickname })
  }, [])

  const updateConfig = useCallback((code, config) => {
    socket.emit('room:config', { code, config })
  }, [])

  const startGame = useCallback((code) => {
    socket.emit('game:start', { code })
  }, [])

  const backToLobby = useCallback((code) => {
    socket.emit('room:backToLobby', { code })
  }, [])

  // El Impostor actions
  const sendVote = useCallback((code, suspectId) => {
    socket.emit('impostor:vote', { code, suspectId })
  }, [])

  const forceVote = useCallback((code) => {
    socket.emit('impostor:forceVote', { code })
  }, [])

  // Adivina Quién actions
  const selectSecret = useCallback((code, characterId) => {
    socket.emit('guesswho:selectSecret', { code, characterId })
  }, [])

  const sendGuess = useCallback((code, guessedCharacterId) => {
    socket.emit('guesswho:guess', { code, guessedCharacterId })
  }, [])

  // ── Derived helpers ──────────────────────────────────────────────────────
  const isHost = room?.hostId === myId

  const me = room?.players?.find((p) => p.id === myId) ?? null

  return {
    // State
    phase,
    room,
    myId,
    error,
    gameEvent,
    isHost,
    me,
    // Actions
    clearError,
    createRoom,
    joinRoom,
    updateConfig,
    startGame,
    backToLobby,
    sendVote,
    forceVote,
    selectSecret,
    sendGuess,
  }
}
