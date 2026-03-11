/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#eef2f6',
          panel: '#f7f9fc',
          card: '#ffffff',
          hover: '#e4e9f0',
          active: '#dce2eb',
          border: '#d8dee9',
          'border-light': '#e8ecf1',
        },
        accent: {
          primary: '#4f6df5',
          'primary-hover': '#3b5de0',
          secondary: '#6aa7ff',
          success: '#2fbf71',
          warning: '#ff6b6b',
          info: '#38bdf8',
        },
        text: {
          primary: '#1f2937',
          secondary: '#6b7280',
          tertiary: '#9ca3af',
          muted: '#b0b8c4',
        },
        protocol: {
          rip: '#22c55e',
          ospf: '#3b82f6',
          eigrp: '#f59e0b',
          bgp: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card': '0 2px 8px rgba(0,0,0,0.05)',
        'elevated': '0 4px 16px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
