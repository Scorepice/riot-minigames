/**
 * Timer.jsx
 * Circular SVG countdown ring, synchronized with the server via impostor:tick events.
 * Color shifts: gold (>60s) → amber (>30s) → red (≤30s)
 */
export default function Timer({ remaining, total = 180 }) {
  const R             = 42
  const circumference = 2 * Math.PI * R
  const ratio         = Math.max(0, remaining / total)
  const dashOffset    = circumference * (1 - ratio)

  const color =
    remaining > 60 ? '#c89b3c'
    : remaining > 30 ? '#f59e0b'
    : '#ff4655'

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const urgent = remaining <= 30

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="104" height="104" viewBox="0 0 104 104" aria-label={`${mins}:${String(secs).padStart(2,'0')} restantes`}>
        {/* Track */}
        <circle cx="52" cy="52" r={R} fill="none" stroke="#1e3a5f" strokeWidth="7" />
        {/* Progress arc */}
        <circle
          cx="52" cy="52" r={R}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 52 52)"
          style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.5s ease' }}
        />
        {/* Glow filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Time text */}
        <text
          x="52" y="52"
          textAnchor="middle"
          dominantBaseline="central"
          fill={urgent ? '#ff4655' : 'white'}
          fontSize="20"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
          filter={urgent ? 'url(#glow)' : undefined}
        >
          {mins}:{String(secs).padStart(2, '0')}
        </text>
      </svg>
      <p className={`text-xs font-medium ${urgent ? 'text-hx-red animate-pulse' : 'text-hx-muted'}`}>
        {urgent ? '¡Tiempo casi agotado!' : 'Tiempo restante'}
      </p>
    </div>
  )
}
