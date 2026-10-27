/**
 * GuessWhoGame.jsx
 * Full game screen for "Adivina Quién" (1v1 Guess Who).
 *
 * Internal phases:
 *   'selection' – Each player clicks a card to choose their secret character
 *   'playing'   – Grid with local elimination + "¡Adivinar!" button
 *   'result'    – Winner/loser reveal with both secrets shown
 *
 * Card elimination is 100% local (React state) — no WebSocket traffic.
 */
import { useState, useEffect, useCallback } from 'react'
import CharacterGrid from '../../components/game/CharacterGrid'

export default function GuessWhoGame({
  gameEvent,
  room,
  myId,
  isHost,
  backToLobby,
  selectSecret,
  sendGuess,
}) {
  // ── Accumulated game state ─────────────────────────────────────────────
  const [phase,           setPhase]           = useState('selection')
  const [board,           setBoard]           = useState([])
  const [opponent,        setOpponent]        = useState(null)
  const [tentativeId,     setTentativeId]     = useState(null)   // hovered/clicked in selection
  const [mySecretId,      setMySecretId]      = useState(null)   // confirmed secret
  const [secretConfirmed, setSecretConfirmed] = useState(false)
  const [readyCount,      setReadyCount]      = useState(0)
  const [eliminated,      setEliminated]      = useState(new Set())
  const [showGuessModal,  setShowGuessModal]  = useState(false)
  const [result,          setResult]          = useState(null)

  useEffect(() => {
    if (!gameEvent) return
    switch (gameEvent.type) {
      case 'guesswho:start':
        setBoard(gameEvent.board || [])
        setOpponent(gameEvent.opponent)
        setPhase('selection')
        setTentativeId(null)
        setMySecretId(null)
        setSecretConfirmed(false)
        setReadyCount(0)
        setEliminated(new Set())
        setResult(null)
        break
      case 'guesswho:secretConfirmed':
        setMySecretId(gameEvent.characterId)
        setSecretConfirmed(true)
        break
      case 'guesswho:selectionUpdate':
        setReadyCount(gameEvent.readyCount)
        break
      case 'guesswho:playing':
        setPhase('playing')
        break
      case 'guesswho:result':
        setResult(gameEvent)
        setPhase('result')
        break
      default: break
    }
  }, [gameEvent])

  // ── Card click handlers ────────────────────────────────────────────────
  const handleSelectionClick = useCallback((id) => {
    if (secretConfirmed) return
    setTentativeId((prev) => (prev === id ? null : id))
  }, [secretConfirmed])

  const handleConfirmSecret = useCallback(() => {
    if (!tentativeId) return
    selectSecret(room.code, tentativeId)
  }, [tentativeId, room, selectSecret])

  const handleEliminationClick = useCallback((id) => {
    // Never eliminate the card that is your confirmed secret
    if (id === mySecretId) return
    setEliminated((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [mySecretId])

  const handleGuess = useCallback((guessedId) => {
    setShowGuessModal(false)
    sendGuess(room.code, guessedId)
  }, [room, sendGuess])

  // ── Result screen ──────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <GuessWhoResult
        result={result}
        myId={myId}
        isHost={isHost}
        board={board}
        onBackToLobby={() => backToLobby(room.code)}
      />
    )
  }

  // ── Playing phase ──────────────────────────────────────────────────────
  if (phase === 'playing') {
    return (
      <div className="space-y-4 animate-slide-up pb-24">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-xl text-hx-gold">Adivina Quién</h2>
            <p className="text-hx-muted text-sm">
              vs <span className="text-hx-text font-medium">{opponent?.nickname}</span>
              {' '}— Tachá cartas y adivina su personaje secreto
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-hx-muted hex-card px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
            {board.length - eliminated.size} / {board.length} cartas activas
          </div>
        </div>

        {/* Instructions */}
        <div className="hex-card px-4 py-3 border-hx-border/60 text-xs text-hx-muted text-center">
          💡 <strong className="text-hx-text">Haz clic</strong> en una carta para tacharla (descartarla).
          Cuando estés seguro, usa el botón <strong className="text-hx-gold">¡Adivinar!</strong>
        </div>

        {/* Grid */}
        <CharacterGrid
          cards={board}
          phase="playing"
          eliminatedIds={eliminated}
          onCardClick={handleEliminationClick}
        />

        {/* Sticky Guess button */}
        <div className="fixed bottom-0 inset-x-0 flex justify-center px-4 py-4 bg-hx-bg/90 backdrop-blur-sm border-t border-hx-border z-40">
          <button
            onClick={() => setShowGuessModal(true)}
            className="btn-red px-10 py-3 text-base"
          >
            🎯 ¡Adivinar Personaje!
          </button>
        </div>

        {/* Guess modal */}
        {showGuessModal && (
          <GuessModal
            board={board}
            opponentNickname={opponent?.nickname}
            onGuess={handleGuess}
            onClose={() => setShowGuessModal(false)}
          />
        )}
      </div>
    )
  }

  // ── Selection phase ────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-slide-up pb-8">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="font-display text-2xl text-hx-gold">Elige tu Personaje Secreto</h2>
        <p className="text-hx-muted text-sm">
          vs <span className="text-hx-text font-medium">{opponent?.nickname}</span>
        </p>
      </div>

      {/* Ready status */}
      <div className="flex justify-center gap-4">
        <StatusPill
          label="Tú"
          ready={secretConfirmed}
        />
        <StatusPill
          label={opponent?.nickname ?? 'Rival'}
          ready={readyCount >= (secretConfirmed ? 1 : 0) + (readyCount > (secretConfirmed ? 0 : -1) ? 1 : 0)
            /* simpler: opponent is ready when readyCount > own readiness */
            || readyCount === 2
          }
        />
      </div>

      {/* Confirmed waiting state */}
      {secretConfirmed ? (
        <div className="hex-card p-5 text-center space-y-3">
          <p className="text-2xl">✅</p>
          <p className="text-hx-gold font-semibold">¡Personaje secreto confirmado!</p>
          {board.find((c) => c.id === mySecretId) && (
            <div className="flex justify-center">
              <div className="w-24 rounded-lg overflow-hidden border-2 border-hx-gold shadow-gold">
                <img
                  src={board.find((c) => c.id === mySecretId)?.image}
                  alt="Tu secreto"
                  className="w-full aspect-[3/4] object-cover object-top"
                />
              </div>
            </div>
          )}
          <p className="text-hx-muted text-sm animate-pulse">
            Esperando a {opponent?.nickname}…
          </p>
        </div>
      ) : (
        <>
          {/* Instructions */}
          <div className="hex-card px-4 py-3 text-center text-sm text-hx-muted">
            👇 Haz clic en un personaje para seleccionarlo como tu secreto, luego confirma.
          </div>

          {/* Grid */}
          <CharacterGrid
            cards={board}
            phase="selection"
            selectedId={tentativeId}
            onCardClick={handleSelectionClick}
          />

          {/* Confirm bar */}
          {tentativeId && (
            <div className="fixed bottom-0 inset-x-0 flex items-center justify-between gap-3 px-5 py-4 bg-hx-card/95 backdrop-blur-sm border-t border-hx-gold/40 z-40 animate-slide-up">
              <div className="flex items-center gap-3">
                <img
                  src={board.find((c) => c.id === tentativeId)?.image}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover object-top border border-hx-gold"
                />
                <div>
                  <p className="text-xs text-hx-muted">Personaje seleccionado</p>
                  <p className="text-hx-gold font-semibold text-sm">
                    {board.find((c) => c.id === tentativeId)?.name}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setTentativeId(null)} className="btn-outline px-4 py-2 text-sm">
                  Cancelar
                </button>
                <button onClick={handleConfirmSecret} className="btn-gold px-4 py-2 text-sm">
                  ✓ Confirmar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GUESS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function GuessModal({ board, opponentNickname, onGuess, onClose }) {
  const [pendingId, setPendingId] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  function handleCardClick(id) {
    if (confirmed) return
    setPendingId((prev) => (prev === id ? null : id))
  }

  function handleConfirm() {
    if (!pendingId) return
    setConfirmed(true)
    setTimeout(() => onGuess(pendingId), 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="w-full max-w-2xl animate-slide-up">
        {/* Header */}
        <div className="hex-card p-5 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-xl text-hx-gold">¿Cuál es el personaje secreto?</h3>
              <p className="text-hx-muted text-sm mt-1">
                de <span className="text-hx-text font-medium">{opponentNickname}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-hx-muted hover:text-hx-red text-2xl leading-none mt-0.5">✕</button>
          </div>
          {/* Warning */}
          <div className="mt-4 flex items-center gap-2 px-3 py-2.5 bg-hx-red/10 border border-hx-red/40 rounded-lg">
            <span>⚠️</span>
            <p className="text-hx-red text-xs leading-snug">
              <strong>¡Cuidado!</strong> Si fallas, <strong>perderás automáticamente</strong> la partida.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="hex-card p-4 mb-4">
          <CharacterGrid
            cards={board}
            phase="selection"
            selectedId={pendingId}
            onCardClick={handleCardClick}
          />
        </div>

        {/* Confirm button */}
        {pendingId && (
          <div className="hex-card p-4 flex items-center justify-between gap-3 animate-slide-up">
            <div className="flex items-center gap-3">
              <img
                src={board.find((c) => c.id === pendingId)?.image}
                alt=""
                className="w-10 h-10 rounded-lg object-cover border border-hx-red"
              />
              <div>
                <p className="text-xs text-hx-muted">Tu adivinanza</p>
                <p className="text-white font-semibold text-sm">
                  {board.find((c) => c.id === pendingId)?.name}
                </p>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              disabled={confirmed}
              className="btn-red px-6 py-2 text-sm"
            >
              {confirmed ? '…' : '🎯 ¡Adivinar!'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function GuessWhoResult({ result, myId, isHost, board, onBackToLobby }) {
  const {
    winnerId, winnerNickname, loserNickname,
    isCorrect, guesserNickname, guessedCharacter, secrets,
  } = result

  const iWon = winnerId === myId

  return (
    <div className="space-y-6 animate-slide-up pb-8">
      {/* Banner */}
      <div className={`
        rounded-2xl p-6 text-center border-2
        ${iWon ? 'bg-hx-gold/10 border-hx-gold shadow-gold' : 'bg-hx-red/10 border-hx-red shadow-red'}
      `}>
        <div className="text-5xl mb-3 select-none">{iWon ? '🏆' : '💀'}</div>
        <h2 className={`font-display text-3xl ${iWon ? 'text-hx-gold' : 'text-hx-red'}`}>
          {iWon ? '¡Ganaste!' : '¡Perdiste!'}
        </h2>
        <p className="text-hx-muted text-sm mt-2">
          {isCorrect
            ? `${guesserNickname} adivinó el personaje secreto de ${loserNickname}.`
            : `${guesserNickname} falló la adivinanza — ${loserNickname} gana automáticamente.`}
        </p>
      </div>

      {/* Secret reveals */}
      <div className="grid sm:grid-cols-2 gap-4">
        {Object.entries(secrets).map(([pid, char]) => {
          if (!char) return null
          const isMySecret = pid === myId
          return (
            <div key={pid} className="hex-card overflow-hidden">
              <div className="relative">
                <img
                  src={char.image}
                  alt={char.name}
                  className="w-full max-h-44 object-cover object-top"
                  onError={(e) => {
                    e.currentTarget.src = `https://placehold.co/300x180/0d1526/c89b3c?text=${encodeURIComponent(char.name)}`
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-hx-card via-transparent to-transparent" />
                <div className="absolute bottom-0 p-3">
                  <p className="text-xs uppercase tracking-widest text-hx-muted">
                    {isMySecret ? 'Tu personaje secreto' : `Secreto de ${result.loserNickname === (isMySecret ? result.winnerNickname : result.loserNickname) ? result.loserNickname : result.winnerNickname}`}
                  </p>
                  <p className="font-display text-lg text-hx-gold">{char.name}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Guessed card */}
      {guessedCharacter && (
        <div className="hex-card p-4 flex items-center gap-4">
          <img
            src={guessedCharacter.image}
            alt={guessedCharacter.name}
            className="w-14 h-14 rounded-lg object-cover object-top border border-hx-border"
          />
          <div>
            <p className="text-xs text-hx-muted">
              {guesserNickname} adivinó…
            </p>
            <p className="text-hx-text font-semibold">{guessedCharacter.name}</p>
            <p className={`text-sm font-bold ${isCorrect ? 'text-green-400' : 'text-hx-red'}`}>
              {isCorrect ? '✓ ¡Correcto!' : '✕ Incorrecto'}
            </p>
          </div>
        </div>
      )}

      {/* Back to lobby */}
      {isHost ? (
        <div className="flex justify-center">
          <button onClick={onBackToLobby} className="btn-gold px-8">
            ← Volver al Lobby
          </button>
        </div>
      ) : (
        <p className="text-center text-hx-muted text-sm">
          Esperando que el Host vuelva al lobby…
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusPill helper
// ─────────────────────────────────────────────────────────────────────────────
function StatusPill({ label, ready }) {
  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm
      ${ready
        ? 'border-green-500 bg-green-500/10 text-green-400'
        : 'border-hx-border bg-hx-surface text-hx-muted'
      }
    `}>
      <span className={`w-2 h-2 rounded-full ${ready ? 'bg-green-400' : 'bg-hx-muted animate-pulse'}`} />
      <span className="font-medium">{label}</span>
      <span className="text-xs">{ready ? '✓ Listo' : 'Eligiendo…'}</span>
    </div>
  )
}
