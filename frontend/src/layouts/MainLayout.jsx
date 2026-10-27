/**
 * MainLayout.jsx
 * Master layout for the app.
 *
 * Desktop structure (≥1200px):
 * ┌──────────────────────────────────────────────────┐
 * │                   Navbar (full-width)             │
 * ├────────┬─────────────────────────────┬────────────┤
 * │ 160px  │     Main content area       │  160px     │
 * │ Left   │     (children)              │  Right     │
 * │ Sky-   │                             │  Sky-      │
 * │ scraper│                             │  scraper   │
 * ├────────┴─────────────────────────────┴────────────┤
 * │            Bottom 728×90 banner                   │
 * ├───────────────────────────────────────────────────┤
 * │        How to Play  |  FAQ  (below fold)          │
 * ├───────────────────────────────────────────────────┤
 * │                  Legal Footer                     │
 * └───────────────────────────────────────────────────┘
 */
import AdSlot from '../components/ads/AdSlot'
import StreamerToggle from '../components/common/StreamerToggle'

export default function MainLayout({ children }) {
  return (
    <div className="min-h-dvh flex flex-col bg-hx-bg">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="w-full border-b border-hx-border bg-hx-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-display text-hx-gold tracking-wide leading-none select-none">
              Riot<span className="text-white">Mini</span>
            </span>
            <span className="hidden sm:block text-hx-muted text-xs border-l border-hx-border pl-3 leading-tight">
              Juegos del universo Riot
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <StreamerToggle />
          </div>
        </div>
      </header>

      {/* ── Body: [left ad] + content + [right ad] ──────────────────────── */}
      <div className="flex-1 flex justify-center gap-4 px-4 pt-6 pb-4 max-w-[1440px] mx-auto w-full">

        {/* Left skyscraper — hidden below xl */}
        <aside className="hidden xl:flex flex-col items-center pt-2 shrink-0">
          <AdSlot size="skyscraper" />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 max-w-3xl animate-fade-in">
          {children}
        </main>

        {/* Right skyscraper — hidden below xl */}
        <aside className="hidden xl:flex flex-col items-center pt-2 shrink-0">
          <AdSlot size="skyscraper" />
        </aside>
      </div>

      {/* ── Bottom banner ───────────────────────────────────────────────── */}
      <div className="flex justify-center py-4 border-t border-hx-border">
        {/* Desktop banner */}
        <div className="hidden sm:block">
          <AdSlot size="banner" />
        </div>
        {/* Mobile banner */}
        <div className="sm:hidden">
          <AdSlot size="mobile" />
        </div>
      </div>

      {/* ── How to Play + FAQ (below fold — required for AdSense) ───────── */}
      <HowToPlaySection />

      {/* ── Legal Footer ────────────────────────────────────────────────── */}
      <LegalFooter />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// How to Play + FAQ (static, SEO-friendly content)
// ─────────────────────────────────────────────────────────────────────────────
function HowToPlaySection() {
  return (
    <section className="border-t border-hx-border bg-hx-card/40 py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* How to Play */}
        <div>
          <h2 className="text-hx-gold font-display text-xl mb-4">Cómo Jugar</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="hex-card p-5 space-y-2">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="text-hx-red">🎭</span> El Impostor
              </h3>
              <p className="text-hx-muted text-sm leading-relaxed">
                De 3 a 10 jugadores. El servidor elige un personaje secreto del universo Riot y
                lo muestra a todos <em>excepto</em> al Impostor. Tienen 3 minutos para debatir
                y luego votan quién creen que es el Impostor. Si lo adivinan, ¡ganan los inocentes!
              </p>
            </div>
            <div className="hex-card p-5 space-y-2">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="text-hx-gold">🃏</span> Adivina Quién
              </h3>
              <p className="text-hx-muted text-sm leading-relaxed">
                Exclusivo para 2 jugadores. Ambos reciben el mismo tablero de 24 personajes y
                eligen uno en secreto. Por turnos se hacen preguntas de sí/no y van eliminando
                cartas. El primero en adivinar el personaje secreto del rival gana.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-hx-gold font-display text-xl mb-4">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <details key={i} className="hex-card px-5 py-4 group">
                <summary className="cursor-pointer font-medium text-white list-none flex justify-between items-center">
                  {item.q}
                  <svg className="w-4 h-4 text-hx-muted transition-transform group-open:rotate-180 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-hx-muted text-sm leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const FAQ_ITEMS = [
  {
    q: '¿Es gratuito?',
    a: 'Sí, totalmente gratuito. El sitio se mantiene gracias a anuncios no intrusivos.',
  },
  {
    q: '¿Cuántos jugadores necesito?',
    a: 'El Impostor admite de 3 a 10 jugadores. Adivina Quién es exclusivamente para 2 jugadores.',
  },
  {
    q: '¿Cómo invito a mis amigos?',
    a: 'Una vez creada la sala verás un botón "Copiar enlace". Comparte esa URL y tus amigos entran directamente eligiendo solo su apodo.',
  },
  {
    q: '¿Qué es el Modo Streamer?',
    a: 'Al activarlo (ícono de cámara en la barra superior), el código de sala se oculta con asteriscos y tu carta/rol secreto se desenfoca. Puedes verlo pasando el cursor encima sin que tu audiencia lo vea.',
  },
  {
    q: '¿Los personajes son de qué juegos?',
    a: 'Puedes elegir personajes de League of Legends / Arcane, Valorant, o una mezcla de ambos. El Host configura esto en el lobby antes de iniciar.',
  },
  {
    q: '¿Necesito crear una cuenta?',
    a: 'No. Solo elige un apodo y a jugar. No almacenamos ningún dato personal.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Legal Footer — requerido por Riot Games Legal Jibber Jabber
// ─────────────────────────────────────────────────────────────────────────────
function LegalFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-hx-border bg-hx-card py-8 px-6">
      <div className="max-w-3xl mx-auto space-y-4 text-center">
        <div className="hex-divider" />
        <p className="text-hx-muted text-xs leading-relaxed">
          RiotMini no está respaldado por Riot Games y no refleja los puntos de vista u opiniones
          de Riot Games ni de ninguna persona oficialmente involucrada en la producción o gestión
          de los juegos de Riot Games. Riot Games y todos los activos relacionados, incluyendo
          League of Legends, Valorant, Legends of Runeterra, Teamfight Tactics, Arcane y Wild Rift,
          son marcas comerciales o marcas comerciales registradas de Riot Games, Inc.
        </p>
        <p className="text-hx-muted text-xs">
          League of Legends, Valorant © Riot Games, Inc. Todos los derechos reservados.
          Las imágenes de personajes son propiedad de Riot Games.
        </p>
        <p className="text-hx-muted text-xs">
          © {year} RiotMini — Proyecto de fans sin fines de lucro.
        </p>
        <div className="flex justify-center gap-6 text-xs">
          <a
            href="https://www.riotgames.com/en/legal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-hx-muted hover:text-hx-gold transition-colors"
          >
            Legal Jibber Jabber de Riot Games ↗
          </a>
          <a
            href="https://www.riotgames.com/en/privacy-notice"
            target="_blank"
            rel="noopener noreferrer"
            className="text-hx-muted hover:text-hx-gold transition-colors"
          >
            Política de privacidad ↗
          </a>
        </div>
      </div>
    </footer>
  )
}
