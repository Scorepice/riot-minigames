/**
 * App.jsx
 * Root component: reads URL params, manages phase transitions,
 * and renders the correct page inside MainLayout.
 *
 * Phases:
 *   'home'    → HomePage   (create / join)
 *   'lobby'   → LobbyPage  (waiting room)
 *   'playing' → ImpostorGame or GuessWhoGame (Phase 5)
 */
import { useSearchParams } from 'react-router-dom'
import { useRoom }         from './hooks/useRoom'
import MainLayout          from './layouts/MainLayout'
import HomePage            from './pages/HomePage'
import LobbyPage           from './pages/LobbyPage'

// Phase 5 placeholders — will be replaced with real game components
function GamePlaceholder({ gameEvent, room, myId, isHost, backToLobby }) {
  const mode = room?.config?.gameMode
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 animate-fade-in">
      <div className="hex-card p-8 text-center space-y-3 max-w-md w-full">
        <div className="text-4xl">{mode === 'impostor' ? '🎭' : '🃏'}</div>
        <h2 className="font-display text-xl text-hx-gold">
          {mode === 'impostor' ? 'El Impostor' : 'Adivina Quién'}
        </h2>
        <p className="text-hx-muted text-sm">
          ¡La partida ha comenzado! Los componentes del juego se añadirán en la Fase 5.
        </p>
        <pre className="text-left text-xs bg-hx-surface p-3 rounded-lg text-hx-muted overflow-auto max-h-40">
          {JSON.stringify(gameEvent, null, 2)}
        </pre>
        {isHost && (
          <button
            onClick={() => backToLobby(room.code)}
            className="btn-outline mt-2"
          >
            ← Volver al lobby
          </button>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const {
    phase, room, myId, error, gameEvent,
    isHost, clearError,
    createRoom, joinRoom, updateConfig, startGame, backToLobby,
    sendVote, forceVote, selectSecret, sendGuess,
  } = useRoom()

  return (
    <MainLayout>
      {phase === 'home' && (
        <HomePage
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          error={error}
          clearError={clearError}
        />
      )}

      {phase === 'lobby' && room && (
        <LobbyPage
          room={room}
          myId={myId}
          isHost={isHost}
          error={error}
          clearError={clearError}
          onUpdateConfig={updateConfig}
          onStartGame={startGame}
        />
      )}

      {phase === 'playing' && room && (
        <GamePlaceholder
          gameEvent={gameEvent}
          room={room}
          myId={myId}
          isHost={isHost}
          backToLobby={backToLobby}
          // Game-specific actions passed down for Phase 5
          sendVote={sendVote}
          forceVote={forceVote}
          selectSecret={selectSecret}
          sendGuess={sendGuess}
        />
      )}
    </MainLayout>
  )
}
