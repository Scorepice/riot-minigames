/**
 * RoomConfig.jsx
 * Host-only configuration panel in the lobby.
 * Lets the host choose: game mode, universe filter, and hint option.
 */
export default function RoomConfig({ config, onUpdate, disabled }) {
  function set(key, value) {
    onUpdate({ [key]: value })
  }

  return (
    <div className="space-y-5">

      {/* ── Game mode ─────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-hx-muted mb-2">
          Modo de juego
        </label>
        <div className="grid grid-cols-2 gap-3">
          <ModeCard
            active={config.gameMode === 'impostor'}
            onClick={() => set('gameMode', 'impostor')}
            disabled={disabled}
            emoji="🎭"
            title="El Impostor"
            sub="3–10 jugadores"
          />
          <ModeCard
            active={config.gameMode === 'guesswho'}
            onClick={() => set('gameMode', 'guesswho')}
            disabled={disabled}
            emoji="🃏"
            title="Adivina Quién"
            sub="Exactamente 2"
          />
        </div>
      </div>

      {/* ── Universe filter ───────────────────────────────────────── */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-hx-muted mb-2">
          Universo de personajes
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'lol',      label: '⚔️  Solo LoL',       color: 'hx-lol'  },
            { value: 'valorant', label: '🔫  Solo Valorant',  color: 'hx-val'  },
            { value: 'mix',      label: '✨  Mix (Ambos)',     color: 'hx-blue' },
          ].map(({ value, label }) => (
            <button
              key={value}
              disabled={disabled}
              onClick={() => set('universe', value)}
              className={`
                flex-1 min-w-[100px] px-3 py-2 rounded-lg border text-sm font-medium
                transition-all duration-200
                ${config.universe === value
                  ? 'border-hx-gold bg-hx-gold/20 text-hx-gold'
                  : 'border-hx-border bg-hx-surface text-hx-muted hover:border-hx-gold/50 hover:text-hx-text'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Impostor hint (only shown for impostor mode) ──────────── */}
      {config.gameMode === 'impostor' && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-hx-border bg-hx-surface">
          <input
            id="impostorHint"
            type="checkbox"
            disabled={disabled}
            checked={config.impostorHint}
            onChange={(e) => set('impostorHint', e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-yellow-500 cursor-pointer"
          />
          <label htmlFor="impostorHint" className={`cursor-pointer select-none ${disabled ? 'opacity-40' : ''}`}>
            <span className="block text-sm font-medium text-hx-text">
              Dar pista vaga al Impostor
            </span>
            <span className="block text-xs text-hx-muted mt-0.5">
              El Impostor recibe una descripción breve del personaje sin revelar su nombre ni imagen.
            </span>
          </label>
        </div>
      )}
    </div>
  )
}

function ModeCard({ active, onClick, disabled, emoji, title, sub }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-4 rounded-xl border text-left transition-all duration-200
        ${active
          ? 'border-hx-gold bg-hx-gold/15 shadow-gold'
          : 'border-hx-border bg-hx-surface hover:border-hx-gold/50'
        }
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="font-semibold text-sm text-hx-text">{title}</div>
      <div className="text-xs text-hx-muted">{sub}</div>
      {active && (
        <div className="mt-2 text-hx-gold text-xs flex items-center gap-1">
          <span>●</span> Seleccionado
        </div>
      )}
    </button>
  )
}
