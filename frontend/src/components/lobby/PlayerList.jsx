/**
 * PlayerList.jsx
 * Displays the list of players currently in the lobby.
 * Highlights the local player and the host.
 */
export default function PlayerList({ players = [], myId, hostId }) {
  return (
    <div className="space-y-2">
      {players.map((player) => {
        const isMe   = player.id === myId
        const isHost = player.id === hostId
        return (
          <div
            key={player.id}
            className={`
              flex items-center justify-between px-4 py-2.5 rounded-lg border
              transition-all duration-200
              ${isMe
                ? 'border-hx-gold bg-hx-gold/10'
                : 'border-hx-border bg-hx-surface'
              }
            `}
          >
            <div className="flex items-center gap-3">
              {/* Avatar initial */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                ${isMe ? 'bg-hx-gold text-hx-bg' : 'bg-hx-border text-hx-text'}
              `}>
                {player.nickname.charAt(0).toUpperCase()}
              </div>
              <span className={`font-medium ${isMe ? 'text-hx-gold' : 'text-hx-text'}`}>
                {player.nickname}
                {isMe && <span className="ml-1.5 text-xs text-hx-muted">(tú)</span>}
              </span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 text-xs">
              {isHost && (
                <span className="px-2 py-0.5 bg-hx-gold/20 text-hx-gold border border-hx-gold/40 rounded-full">
                  Host
                </span>
              )}
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" title="En línea" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
