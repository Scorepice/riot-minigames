/**
 * ShareLink.jsx
 * Shows the room code and a 1-click copy-invite-link button.
 * Respects Streamer Mode (blurs the code).
 */
import { useState } from 'react'
import { useStreamer } from '../../context/StreamerContext'

export default function ShareLink({ code }) {
  const { streamerMode } = useStreamer()
  const [copied, setCopied]   = useState(false)

  const inviteUrl = `${window.location.origin}/?room=${code}`

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Room code badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-hx-muted uppercase tracking-widest">Código:</span>
        <span
          className={`
            font-display text-2xl text-hx-gold tracking-[0.3em] select-all px-2
            ${streamerMode ? 'streamer-blur' : ''}
          `}
          title={streamerMode ? 'Mantén para revelar' : code}
        >
          {streamerMode ? '****' : code}
        </span>
      </div>

      {/* Copy link button */}
      <button
        onClick={handleCopy}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium
          transition-all duration-200
          ${copied
            ? 'border-green-500 bg-green-500/20 text-green-400'
            : 'border-hx-border bg-hx-surface text-hx-muted hover:border-hx-gold hover:text-hx-gold'
          }
        `}
      >
        {copied ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            ¡Enlace copiado!
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar enlace de invitación
          </>
        )}
      </button>
    </div>
  )
}
