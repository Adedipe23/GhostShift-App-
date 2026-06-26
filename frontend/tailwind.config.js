/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        dark: {
          bg:      '#0f0f1a',
          surface: '#1a1a2e',
          card:    '#16213e',
          border:  '#2d2d44',
          muted:   '#3d3d5c',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          light:   '#22d3ee',
          dark:    '#0891b2',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error:   '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
        'gradient-dark':  'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
        'gradient-card':  'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      },
      boxShadow: {
        'glow':        '0 0 20px rgba(99,102,241,0.35)',
        'glow-lg':     '0 0 40px rgba(99,102,241,0.25)',
        'card':        '0 4px 24px rgba(0,0,0,0.25)',
        'card-hover':  '0 8px 40px rgba(0,0,0,0.35)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',      opacity: '1' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
