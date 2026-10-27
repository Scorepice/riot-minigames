/**
 * StreamerToggle.jsx
 * A compact toggle button placed in the top navbar.
 * When active it sets streamerMode=true in StreamerContext,
 * which causes blurs throughout the app.
 */
import { useStreamer } from '../../context/StreamerContext'

export default function StreamerToggle() {
  const { streamerMode, toggle } = useStreamer()

  return (
    <button
      onClick={toggle}
      title={streamerMode ? 'Desactivar modo streamer' : 'Activar modo streamer'}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
        border transition-all duration-200 select-none
        ${streamerMode
          ? 'bg-hx-red/20 border-hx-red text-hx-red shadow-red'
          : 'bg-hx-surface border-hx-border text-hx-muted hover:border-hx-gold hover:text-hx-gold'
        }
      `}
    >
      {/* Camera icon */}
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
      <span className="hidden sm:inline">
        {streamerMode ? 'Streamer ON' : 'Streamer'}
      </span>
      {/* Indicator dot */}
      <span className={`w-1.5 h-1.5 rounded-full ${streamerMode ? 'bg-hx-red animate-pulse' : 'bg-hx-muted'}`} />
    </button>
  )
}
