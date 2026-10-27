/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hx: {
          // Backgrounds
          bg:       '#060b17',
          card:     '#0d1526',
          surface:  '#111f35',
          border:   '#1e3a5f',
          // Accents
          gold:     '#c89b3c',
          'gold-l': '#f0c060',
          red:      '#ff4655',
          blue:     '#0bc4e3',
          // Text
          text:     '#f0e6d3',
          muted:    '#7c8fa6',
          // Valorant
          val:      '#ff4655',
          // LoL
          lol:      '#c89b3c',
        },
      },
      fontFamily: {
        display: ['"Cinzel Decorative"', '"Cinzel"', 'Georgia', 'serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out',
        'slide-up':  'slideUp 0.35s ease-out',
        'pulse-slow':'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      boxShadow: {
        'gold':    '0 0 20px rgba(200,155,60,0.35)',
        'red':     '0 0 20px rgba(255,70,85,0.35)',
        'blue':    '0 0 20px rgba(11,196,227,0.25)',
        'card':    '0 4px 32px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
