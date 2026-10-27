/**
 * AdSlot.jsx
 * Renders a properly-sized ad container slot.
 * In production, replace the inner div with your actual AdSense <ins> tag.
 *
 * sizes:
 *   'skyscraper'  → 160 × 600  (desktop side columns)
 *   'banner'      → 728 × 90   (bottom horizontal banner)
 *   'mobile'      → 320 × 50   (mobile banner)
 */
export default function AdSlot({ size = 'skyscraper', className = '' }) {
  const dims = {
    skyscraper: { width: 160, height: 600, label: 'Anuncio\n160×600' },
    banner:     { width: 728, height: 90,  label: 'Anuncio 728×90' },
    mobile:     { width: 320, height: 50,  label: 'Anuncio 320×50' },
  }[size]

  return (
    <div
      className={`ad-placeholder shrink-0 ${className}`}
      style={{ width: dims.width, height: dims.height, minWidth: dims.width }}
      aria-hidden="true"
    >
      <span className="whitespace-pre-line leading-relaxed">{dims.label}</span>
    </div>
  )
}
