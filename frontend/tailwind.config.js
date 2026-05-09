/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          950: '#00000a',
          900: '#05040f',
          800: '#0d0b1e',
          700: '#16132d',
          600: '#211d3f',
        },
        neon: {
          violet:  '#7c3aed',
          purple:  '#9d4edd',
          pink:    '#e040fb',
          cyan:    '#00e5ff',
          green:   '#00e676',
          yellow:  '#ffea00',
          orange:  '#ff6d00',
        },
        surface: {
          base:    '#00000a',
          card:    '#05040f',
          panel:   '#0d0b1e',
          hover:   '#16132d',
          border:  'rgba(124,58,237,0.25)',
          'border-light': 'rgba(124,58,237,0.15)',
        },
        text: {
          primary:   '#e2d9f3',
          secondary: '#9d8ec4',
          tertiary:  '#4a3f6b',
          muted:     '#211d3f',
        },
        ink: {
          DEFAULT: '#e2d9f3',
          dim:     '#9d8ec4',
          faint:   '#4a3f6b',
          ghost:   '#211d3f',
        },
        proto: {
          rip:   '#00e676',
          ospf:  '#00e5ff',
          eigrp: '#ffea00',
          bgp:   '#e040fb',
        },
      },
      fontFamily: {
        sans:    ['Outfit', 'system-ui', 'sans-serif'],
        mono:    ['Space Mono', 'monospace'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow-v':   '0 0 20px rgba(124,58,237,0.4)',
        'glow-p':   '0 0 20px rgba(224,64,251,0.4)',
        'glow-c':   '0 0 20px rgba(0,229,255,0.4)',
        'glow-g':   '0 0 20px rgba(0,230,118,0.4)',
        'inner-v':  'inset 0 0 30px rgba(124,58,237,0.15)',
      },
    },
  },
  plugins: [],
};
