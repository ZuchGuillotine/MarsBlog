/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mars: {
          50: '#fef7f0',
          100: '#fceee0',
          200: '#f8d9bf',
          300: '#f2bd94',
          400: '#ea9565',
          500: '#e47443',
          600: '#d65a34',
          700: '#b3442a',
          800: '#8f3826',
          900: '#743022',
          950: '#3e1811'
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        gwern: {
          paper: '#fffef7',
          ink: '#2d3748',
          muted: '#718096',
          accent: '#3182ce',
          border: '#e2e8f0'
        }
      },
      fontFamily: {
        'display': ['Inter', 'sans-serif'],
        'body': ['ET Book', 'Charter', 'Bitstream Charter', 'Sitka Text', 'Cambria', 'serif']
      },
      animation: {
        'spin-slow': 'spin 30s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'confetti': 'confetti 3s ease-out forwards'
      },
      keyframes: {
        confetti: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '0' }
        }
      }
    },
  },
  plugins: [],
}