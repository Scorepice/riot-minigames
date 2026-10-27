/**
 * ImpostorGame.jsx
 * Full game screen for "El Impostor".
 *
 * Internal phases:
 *   'discussion' – Role card shown + countdown timer running
 *   'voting'     – Voting grid, one vote per player
 *   'result'     – Winner banner, character reveal, vote tally
 *
 * All real-time state comes via the gameEvent prop (from useRoom).
 */
import { useState, useEffect, useCallback } from 'react'
import { useStreamer } from '../../context/StreamerContext'
import Timer from '../../components/game/Timer'

const TOTAL_SECONDS = 180

export default function ImpostorGame({
  gameEvent,
  room,
  myId,
  isHost,
  backToLobby,
  sendVote,
  forceVote,
}) {
  // ── Game state accumulated from socket events ──────────────────────────
  const [phase,     setPhase]     = useState('discussion')
  const [myRole,    setMyRole]    = useState(null)        // 'INNOCENT' | 'IMPOSTOR'
  const [character, setCharacter] = useState(null)        // { id, name, image } for innocents
  const [hint,      setHint]      = useState(null)        // string | null for impostor
  const [players,   setPlayers]   = useState([])
  const [remaining, setRemaining] = useState(TOTAL_SECONDS)
  const [hasVoted,  setHasVoted]  = useState(false)
  const [voteStatus,setVoteStatus]= useState({ votedCount: 0, totalPlayers: 0 })
  const [result,    setResult]    = useState(null)

  useEffect(() => {
    if (!gameEvent) return
    switch (gameEvent.type) {
      case 'impostor:start':
        setMyRole(gameEvent.role)
        setCharacter(gameEvent.character || null)
        setHint(gameEvent.hint || null)
        setPlayers(gameEvent.players || [])
        setRemaining(gameEvent.duration || TOTAL_SECONDS)
        setPhase('discussion')
        break
      case 'impostor:tick':
        setRemaining(gameEvent.remaining)
        break
      case 'impostor:votingOpen':
        setPhase('voting')
        if (gameEvent.players) setPlayers(gameEvent.players)
        break
      case 'impostor:voteUpdate':
        setVoteStatus({ votedCount: gameEvent.votedCount, totalPlayers: gameEvent.totalPlayers })
        break
      case 'impostor:result':
        setResult(gameEvent)
        setPhase('result')
        break
      default: break
    }
  }, [gameEvent])

  const handleVote = useCallback((suspectId) => {
    if (hasVoted || suspectId === myId) return
    setHasVoted(true)
    sendVote(room.code, suspectId)
  }, [hasVoted, myId, room, sendVote])

  // ── Render by phase ────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <ResultScreen
        result={result}
        myId={myId}
        isHost={isHost}
        onBackToLobby={() => backToLobby(room.code)}
      />
    )
  }

  if (phase === 'voting') {
    return (
      <VotingPhase
        players={players}
        myId={myId}
        hasVoted={hasVoted}
        voteStatus={voteStatus}
        onVote={handleVote}
      />
    )
  }

  // Default: discussion
  return (
    <DiscussionPhase
      myRole={myRole}
      character={character}
      hint={hint}
      remaining={remaining}
      players={players}
      isHost={isHost}
      onForceVote={() => forceVote(room.code)}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCUSSION PHASE
// ─────────────────────────────────────────────────────────────────────────────
function DiscussionPhase({ myRole, character, hint, remaining, players, isHost, onForceVote }) {
  const { streamerMode } = useStreamer()
  const isImpostor = myRole === 'IMPOSTOR'

  return (
    <div className="space-y-6 animate-slide-up pb-8">
      <div className="text-center">
        <h2 className="font-display text-2xl text-hx-gold">El Impostor</h2>
        <p className="text-hx-muted text-sm mt-1">Fase de debate — discute con los demás jugadores</p>
      </div>

      <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
        {/* ── Role card ──────────────────────────────────────────────── */}
        <div className={`
          relative rounded-2xl overflow-hidden border-2 shadow-card
          ${isImpostor ? 'border-hx-red shadow-red' : 'border-hx-gold shadow-gold'}
        `}>
          {isImpostor ? (
            /* IMPOSTOR card */
            <div className="bg-gradient-to-br from-[#1a0a0d] to-hx-card min-h-[260px] flex flex-col items-center justify-center gap-5 p-8">
              <div className="text-6xl select-none animate-pulse-slow">🎭</div>
              <div className="text-center space-y-2">
                <p className="text-hx-red font-display text-2xl tracking-wider">IMPOSTOR</p>
                <p className="text-hx-muted text-sm">
                  {hint
                    ? 'Tienes una pista sobre el personaje secreto:'
                    : 'No recibes pistas. ¡Blufea bien!'}
                </p>
              </div>
              {hint && (
                <div className={`
                  max-w-xs text-center px-4 py-3 bg-hx-red/10 border border-hx-red/40
                  rounded-xl text-hx-text text-sm leading-relaxed italic
                  ${streamerMode ? 'streamer-blur' : ''}
                `}
                  title={streamerMode ? 'Mantén para revelar' : undefined}
                >
                  "{hint}"
                </div>
              )}
              <p className="text-xs text-hx-muted text-center max-w-[240px]">
                Descubre el personaje sin que nadie lo sospeche.
              </p>
            </div>
          ) : (
            /* INNOCENT card */
            <div className="relative">
              {character && (
                <>
                  {/* Splash art */}
                  <div className={`relative ${streamerMode ? 'streamer-blur' : ''}`}
                       title={streamerMode ? 'Mantén para revelar' : undefined}>
                    <img
                      src={character.image}
                      alt={character.name}
                      className="w-full object-cover max-h-64 object-top"
                      onError={(e) => {
                        e.currentTarget.src = `https://placehold.co/400x220/0d1526/c89b3c?text=${encodeURIComponent(character.name)}`
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-hx-card via-transparent to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <p className="font-display text-xl text-hx-gold drop-shadow-lg">{character.name}</p>
                      <p className="text-xs text-hx-muted capitalize mt-0.5">
                        {character.universe === 'lol' ? '⚔️ League of Legends' : '🔫 Valorant'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-hx-card px-4 py-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-hx-gold/15 border border-hx-gold/40 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-hx-gold" />
                      <span className="text-hx-gold text-xs font-semibold">INOCENTE</span>
                    </div>
                    <p className="text-hx-muted text-xs mt-2">
                      Este es el personaje secreto. No lo reveles directamente.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel: timer + players ──────────────────────────── */}
        <div className="flex flex-col gap-4 min-w-[180px]">
          {/* Timer */}
          <div className="hex-card p-4 flex flex-col items-center">
            <Timer remaining={remaining} total={TOTAL_SECONDS} />
          </div>

          {/* Players */}
          <div className="hex-card p-4 space-y-2">
            <p className="text-xs uppercase tracking-widest text-hx-muted mb-2">Jugadores</p>
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${p.id === myId ? 'bg-hx-gold text-hx-bg' : 'bg-hx-border text-hx-text'}`}>
                  {p.nickname.charAt(0).toUpperCase()}
                </span>
                <span className={p.id === myId ? 'text-hx-gold' : 'text-hx-text'}>
                  {p.nickname}
                </span>
              </div>
            ))}
          </div>

          {/* Force vote (host only) */}
          {isHost && (
            <button
              onClick={onForceVote}
              className="btn-red text-sm px-4 py-2"
            >
              ⚡ Forzar Votación
            </button>
          )}
        </div>
      </div>

      {/* Instructions banner */}
      <div className="hex-card px-5 py-3 border-hx-gold/30">
        <p className="text-hx-muted text-sm text-center">
          💬 Debaten quién podría ser el Impostor. Al acabar el tiempo (o si el Host lo decide) se abre la votación.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VOTING PHASE
// ─────────────────────────────────────────────────────────────────────────────
function VotingPhase({ players, myId, hasVoted, voteStatus, onVote }) {
  return (
    <div className="space-y-6 animate-slide-up pb-8">
      <div className="text-center space-y-1">
        <h2 className="font-display text-2xl text-hx-red">Fase de Votación</h2>
        <p className="text-hx-muted text-sm">¿Quién crees que es el Impostor? Un solo voto.</p>
      </div>

      {/* Vote progress */}
      {voteStatus.totalPlayers > 0 && (
        <div className="hex-card p-4 space-y-2">
          <div className="flex justify-between text-xs text-hx-muted">
            <span>Votos recibidos</span>
            <span>{voteStatus.votedCount} / {voteStatus.totalPlayers}</span>
          </div>
          <div className="w-full h-2 bg-hx-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-hx-gold rounded-full transition-all duration-500"
              style={{ width: `${(voteStatus.votedCount / voteStatus.totalPlayers) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Waiting message */}
      {hasVoted && (
        <div className="flex items-center justify-center gap-3 p-4 bg-hx-gold/10 border border-hx-gold/40 rounded-xl">
          <span className="text-xl animate-pulse">⏳</span>
          <p className="text-hx-gold text-sm font-medium">Voto registrado. Esperando a los demás…</p>
        </div>
      )}

      {/* Player grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {players.map((player) => {
          const isMe      = player.id === myId
          const canVote   = !hasVoted && !isMe
          return (
            <button
              key={player.id}
              onClick={() => canVote && onVote(player.id)}
              disabled={!canVote}
              className={`
                hex-card p-4 flex flex-col items-center gap-2 transition-all duration-200
                ${canVote
                  ? 'hover:border-hx-red hover:shadow-red cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
                }
                ${isMe ? 'border-hx-border' : ''}
              `}
            >
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                ${isMe ? 'bg-hx-gold/20 border border-hx-gold text-hx-gold' : 'bg-hx-surface border border-hx-border text-hx-text'}
              `}>
                {player.nickname.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-hx-text text-center leading-tight">
                {player.nickname}
              </span>
              {isMe && (
                <span className="text-xs text-hx-muted">(tú — no puedes votarte)</span>
              )}
              {!isMe && !hasVoted && (
                <span className="text-xs text-hx-red opacity-70">Votar →</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function ResultScreen({ result, myId, isHost, onBackToLobby }) {
  const {
    winner, isTie, accusedNickname, impostorNickname,
    character, tally,
  } = result

  const innocentsWin = winner === 'innocents'

  return (
    <div className="space-y-6 animate-slide-up pb-8">
      {/* ── Winner banner ───────────────────────────────────────────── */}
      <div className={`
        rounded-2xl p-6 text-center border-2
        ${innocentsWin
          ? 'bg-hx-gold/10 border-hx-gold shadow-gold'
          : 'bg-hx-red/10 border-hx-red shadow-red'}
      `}>
        <div className="text-5xl mb-3 select-none">
          {innocentsWin ? '🏆' : '🎭'}
        </div>
        <h2 className={`font-display text-3xl ${innocentsWin ? 'text-hx-gold' : 'text-hx-red'}`}>
          {innocentsWin ? '¡Los Inocentes Ganan!' : '¡El Impostor Escapa!'}
        </h2>
        <p className="text-hx-muted text-sm mt-2">
          {isTie
            ? 'Hubo un empate en los votos — nadie fue eliminado.'
            : innocentsWin
              ? `El Impostor (${impostorNickname}) fue descubierto.`
              : accusedNickname
                ? `${accusedNickname} fue acusado injustamente.`
                : 'El Impostor pasó desapercibido.'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* ── Character reveal ─────────────────────────────────────── */}
        {character && (
          <div className="hex-card overflow-hidden">
            <div className="relative">
              <img
                src={character.image}
                alt={character.name}
                className="w-full max-h-52 object-cover object-top"
                onError={(e) => {
                  e.currentTarget.src = `https://placehold.co/400x220/0d1526/c89b3c?text=${encodeURIComponent(character.name)}`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-hx-card via-transparent to-transparent" />
              <div className="absolute bottom-0 p-3">
                <p className="text-xs uppercase tracking-widest text-hx-muted">Personaje secreto</p>
                <p className="font-display text-xl text-hx-gold">{character.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tally ────────────────────────────────────────────────── */}
        <div className="hex-card p-5 space-y-4">
          <p className="text-xs uppercase tracking-widest text-hx-muted">
            Resultados de la votación
          </p>
          <p className="text-sm text-hx-text">
            <span className="text-hx-red font-semibold">{impostorNickname}</span>
            {' '}era el Impostor.
          </p>
          <div className="space-y-2">
            {[...tally].sort((a, b) => b.votes - a.votes).map(({ id, nickname, votes }) => {
              const isImpostor = id === result.impostorId
              const maxVotes   = Math.max(...tally.map((t) => t.votes))
              const barPct     = maxVotes > 0 ? (votes / maxVotes) * 100 : 0
              return (
                <div key={id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={isImpostor ? 'text-hx-red font-semibold' : 'text-hx-text'}>
                      {nickname} {isImpostor && '🎭'}
                    </span>
                    <span className="text-hx-muted">{votes} voto{votes !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-1.5 bg-hx-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isImpostor ? 'bg-hx-red' : 'bg-hx-gold'}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

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
