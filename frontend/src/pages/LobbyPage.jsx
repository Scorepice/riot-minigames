/**
 * LobbyPage.jsx
 * Full lobby screen:
 *   - Room code + invite link (streamer-aware)
 *   - Live player list
 *   - Host config panel (game mode, universe, hint)
 *   - Start game button (host only)
 */
import ShareLink  from '../components/lobby/ShareLink'
import PlayerList from '../components/lobby/PlayerList'
import RoomConfig from '../components/lobby/RoomConfig'

export default function LobbyPage({
  room,
  myId,
  isHost,
  error,
  clearError,
  onUpdateConfig,
  onStartGame,
}) {
  const { code, players, config, hostId } = room

  // Validation: can the host start?
  const canStart = (() => {
    if (config.gameMode === 'impostor') return players.length >= 3
    if (config.gameMode === 'guesswho') return players.length === 2
    return false
  })()

  const startHint = (() => {
    if (config.gameMode === 'impostor' && players.length < 3)
      return `Necesitas al menos 3 jugadores (ahora: ${players.length})`
    if (config.gameMode === 'guesswho' && players.length !== 2)
      return `Adivina Quién necesita exactamente 2 jugadores (ahora: ${players.length})`
    return ''
  })()

  return (
    <div className="space-y-6 animate-slide-up pb-10">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="hex-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-xl text-hx-gold mb-1">Sala de espera</h2>
            <ShareLink code={code} />
          </div>
          <div className="flex items-center gap-2 text-sm text-hx-muted bg-hx-surface border border-hx-border rounded-lg px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
            {players.length} / {config.gameMode === 'guesswho' ? 2 : 10} jugadores
          </div>
        </div>
      </div>

      {/* ── Error toast ───────────────────────────────────────────────── */}
      {error && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 bg-hx-red/10 border border-hx-red/50 rounded-lg text-hx-red text-sm animate-fade-in"
        >
          <span>⚠️ {error}</span>
          <button onClick={clearError} className="text-hx-red hover:opacity-70 text-lg leading-none">✕</button>
        </div>
      )}

      {/* ── Main grid ─────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Players */}
        <section className="hex-card p-5 space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-hx-muted">
            Jugadores en la sala
          </h3>
          <PlayerList players={players} myId={myId} hostId={hostId} />

          {players.length < 2 && (
            <p className="text-center text-hx-muted text-sm pt-2">
              Comparte el enlace para invitar amigos →
            </p>
          )}
        </section>

        {/* Config */}
        <section className="hex-card p-5 space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-hx-muted">
            {isHost ? 'Configuración (Host)' : 'Configuración de la sala'}
          </h3>

          {isHost ? (
            <RoomConfig
              config={config}
              onUpdate={(delta) => onUpdateConfig(code, delta)}
              disabled={false}
            />
          ) : (
            /* Read-only view for non-host */
            <div className="space-y-3 text-sm">
              <ConfigRow label="Modo"     value={config.gameMode === 'impostor' ? '🎭 El Impostor' : '🃏 Adivina Quién'} />
              <ConfigRow label="Universo" value={
                config.universe === 'lol'      ? '⚔️  Solo LoL' :
                config.universe === 'valorant' ? '🔫 Solo Valorant' : '✨ Mix (Ambos)'
              } />
              {config.gameMode === 'impostor' && (
                <ConfigRow label="Pista al Impostor" value={config.impostorHint ? '✅ Activada' : '❌ Desactivada'} />
              )}
              <p className="text-hx-muted text-xs pt-2">Solo el Host puede cambiar la configuración.</p>
            </div>
          )}
        </section>
      </div>

      {/* ── Start game button ──────────────────────────────────────────── */}
      {isHost && (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => onStartGame(code)}
            disabled={!canStart}
            className="btn-gold px-10 py-3 text-base w-full max-w-xs"
          >
            ⚡ Iniciar Partida
          </button>
          {!canStart && (
            <p className="text-hx-muted text-xs text-center">{startHint}</p>
          )}
        </div>
      )}

      {!isHost && (
        <div className="text-center text-hx-muted text-sm py-4">
          Esperando que el Host inicie la partida…
          <span className="ml-2 inline-block animate-pulse">⏳</span>
        </div>
      )}
    </div>
  )
}

function ConfigRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-hx-border pb-2">
      <span className="text-hx-muted">{label}</span>
      <span className="text-hx-text font-medium">{value}</span>
    </div>
  )
}
