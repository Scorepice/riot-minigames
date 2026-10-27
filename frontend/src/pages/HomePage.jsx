/**
 * HomePage.jsx
 * Landing screen with two flows:
 *   1. Normal visit  → create room OR join with code
 *   2. Deep-link (?room=XXXX) → nickname input to join that specific room
 */
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function HomePage({ onCreateRoom, onJoinRoom, error, clearError }) {
  const [searchParams] = useSearchParams()
  const deepLinkCode   = searchParams.get('room')?.toUpperCase() || ''

  // Form state
  const [tab,      setTab]      = useState(deepLinkCode ? 'join' : 'create') // 'create' | 'join'
  const [nickname, setNickname] = useState('')
  const [code,     setCode]     = useState(deepLinkCode)

  // If deep-link code present, lock to join tab
  useEffect(() => {
    if (deepLinkCode) setTab('join')
  }, [deepLinkCode])

  function handleSubmit(e) {
    e.preventDefault()
    clearError()
    if (tab === 'create') {
      onCreateRoom(nickname.trim())
    } else {
      onJoinRoom(code.trim().toUpperCase(), nickname.trim())
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-10 animate-slide-up">

      {/* Hero */}
      <div className="text-center mb-10 space-y-3">
        <h1 className="font-display text-4xl sm:text-5xl text-hx-gold drop-shadow-lg tracking-wide">
          Riot<span className="text-white">Mini</span>
        </h1>
        <p className="text-hx-muted text-base max-w-sm mx-auto leading-relaxed">
          Juegos multijugador gratuitos con personajes de League of Legends y Valorant.
        </p>
        <div className="flex justify-center gap-3 pt-1 text-2xl select-none">
          <span title="League of Legends">⚔️</span>
          <span title="Valorant">🔫</span>
          <span title="Arcane">🌙</span>
        </div>
      </div>

      {/* Card */}
      <div className="hex-card w-full max-w-sm p-6 animate-slide-up">

        {/* Tab switcher — hidden if deep-link forces join */}
        {!deepLinkCode && (
          <div className="flex mb-6 rounded-lg overflow-hidden border border-hx-border">
            {[
              { id: 'create', label: 'Crear sala' },
              { id: 'join',   label: 'Unirse' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setTab(id); clearError() }}
                className={`
                  flex-1 py-2.5 text-sm font-semibold transition-colors duration-200
                  ${tab === id
                    ? 'bg-hx-gold text-hx-bg'
                    : 'bg-transparent text-hx-muted hover:text-hx-text'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Deep-link notice */}
        {deepLinkCode && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-hx-gold/10 border border-hx-gold/40 rounded-lg">
            <span className="text-hx-gold text-sm">🔗</span>
            <p className="text-hx-gold text-sm">
              Uniéndote a la sala <span className="font-bold tracking-widest">{deepLinkCode}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nickname */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-hx-muted mb-1.5">
              Tu apodo
            </label>
            <input
              type="text"
              maxLength={20}
              placeholder="Invocador#1234"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="hex-input"
              autoFocus
              required
            />
          </div>

          {/* Room code (join mode only) */}
          {tab === 'join' && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-hx-muted mb-1.5">
                Código de sala
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="ABCD"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="hex-input font-display tracking-[0.4em] text-center text-lg uppercase"
                readOnly={!!deepLinkCode}
                required
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-hx-red/10 border border-hx-red/50 rounded-lg text-hx-red text-sm animate-fade-in">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!nickname.trim() || (tab === 'join' && !code.trim())}
            className="btn-gold w-full mt-2"
          >
            {tab === 'create' ? '✦ Crear sala' : '→ Entrar a la sala'}
          </button>
        </form>
      </div>

      {/* Teaser cards */}
      <div className="grid grid-cols-2 gap-4 mt-10 w-full max-w-sm">
        <GameTeaser emoji="🎭" title="El Impostor" desc="3–10 jugadores" color="border-hx-red/40" />
        <GameTeaser emoji="🃏" title="Adivina Quién" desc="1 vs 1 clásico" color="border-hx-gold/40" />
      </div>
    </div>
  )
}

function GameTeaser({ emoji, title, desc, color }) {
  return (
    <div className={`hex-card border ${color} p-4 text-center space-y-1`}>
      <div className="text-3xl">{emoji}</div>
      <div className="font-semibold text-sm text-hx-text">{title}</div>
      <div className="text-xs text-hx-muted">{desc}</div>
    </div>
  )
}
