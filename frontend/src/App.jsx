/**
 * App.jsx
 * Root component: reads URL params, manages phase transitions,
 * and renders the correct page inside MainLayout.
 *
 * Phases:
 *   'home'    → HomePage   (create / join)
 *   'lobby'   → LobbyPage  (waiting room)
 *   'playing' → ImpostorGame | GuessWhoGame  (based on room.config.gameMode)
 */
import { useRoom }        from './hooks/useRoom'
import MainLayout         from './layouts/MainLayout'
import HomePage           from './pages/HomePage'
import LobbyPage          from './pages/LobbyPage'
import ImpostorGame       from './pages/games/ImpostorGame'
import GuessWhoGame       from './pages/games/GuessWhoGame'

export default function App() {
  const {
    phase, room, myId, error, gameEvent,
    isHost, clearError,
    createRoom, joinRoom, updateConfig, startGame, backToLobby,
    sendVote, forceVote, selectSecret, sendGuess,
  } = useRoom()

  return (
    <MainLayout>

      {/* ── Home ──────────────────────────────────────────────────────── */}
      {phase === 'home' && (
        <HomePage
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          error={error}
          clearError={clearError}
        />
      )}

      {/* ── Lobby ─────────────────────────────────────────────────────── */}
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

      {/* ── Playing — El Impostor ──────────────────────────────────────── */}
      {phase === 'playing' && room?.config?.gameMode === 'impostor' && (
        <ImpostorGame
          gameEvent={gameEvent}
          room={room}
          myId={myId}
          isHost={isHost}
          backToLobby={backToLobby}
          sendVote={sendVote}
          forceVote={forceVote}
        />
      )}

      {/* ── Playing — Adivina Quién ───────────────────────────────────── */}
      {phase === 'playing' && room?.config?.gameMode === 'guesswho' && (
        <GuessWhoGame
          gameEvent={gameEvent}
          room={room}
          myId={myId}
          isHost={isHost}
          backToLobby={backToLobby}
          selectSecret={selectSecret}
          sendGuess={sendGuess}
        />
      )}

    </MainLayout>
  )
}
