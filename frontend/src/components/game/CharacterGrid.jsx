/**
 * CharacterGrid.jsx
 * Reusable 24-card grid used in both phases of Adivina Quién:
 *   - 'selection' phase : click a card to mark it as your secret
 *   - 'playing'   phase : click a card to toggle it as eliminated (local state only)
 *
 * Props:
 *   cards        – array of { id, name, image }
 *   phase        – 'selection' | 'playing'
 *   selectedId   – (selection phase) id of the card the player tentatively selected
 *   eliminatedIds– (playing phase) Set of eliminated card ids
 *   onCardClick  – (id) => void  called on card click
 */
export default function CharacterGrid({
  cards = [],
  phase = 'playing',
  selectedId = null,
  eliminatedIds = new Set(),
  onCardClick,
}) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
      {cards.map((card) => {
        const isSelected  = phase === 'selection' && selectedId === card.id
        const isEliminated= phase === 'playing'   && eliminatedIds.has(card.id)

        return (
          <button
            key={card.id}
            onClick={() => onCardClick?.(card.id)}
            className={`
              relative rounded-lg overflow-hidden border-2 transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-hx-gold
              ${isSelected
                ? 'border-hx-gold shadow-gold scale-105'
                : isEliminated
                  ? 'border-hx-border opacity-40 grayscale'
                  : 'border-hx-border hover:border-hx-gold/60 hover:scale-[1.03]'
              }
            `}
            title={card.name}
          >
            {/* Character image */}
            <div className="aspect-[3/4] bg-hx-surface">
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover object-top"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = `https://placehold.co/120x160/0d1526/c89b3c?text=${encodeURIComponent(card.name)}`
                }}
              />
            </div>

            {/* Name label */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent px-1 pt-3 pb-1">
              <p className="text-white text-[10px] font-semibold text-center leading-tight truncate">
                {card.name}
              </p>
            </div>

            {/* Eliminated overlay */}
            {isEliminated && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-hx-red text-3xl font-black opacity-80 select-none">✕</span>
              </div>
            )}

            {/* Selected badge */}
            {isSelected && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-hx-gold rounded-full flex items-center justify-center">
                <span className="text-hx-bg text-xs font-bold">✓</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
