/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mars: {
          red: '#cd5c5c',
          orange: '#ff8c42',
          brown: '#8b4513',
          tan: '#deb887',
          rust: '#b7410e',
          ochre: '#cc7722',
          sand: '#f4a460',
          stone: '#918a75',
        },
        gwern: {
          bg: '#fefefe',
          'bg-dark': '#1a1a1a',
          text: '#333333',
          'text-dark': '#e6e6e6',
          accent: '#0066cc',
          'accent-dark': '#4d9fff',
          border: '#e6e6e6',
          'border-dark': '#404040',
        }
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['ET Book', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '0.75rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '3.5rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'rotate-slow': 'rotate 60s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#333333',
            maxWidth: 'none',
            'h1, h2, h3, h4, h5, h6': {
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: '600',
              color: '#cd5c5c',
            },
            'p': {
              fontFamily: 'ET Book, Georgia, serif',
              lineHeight: '1.6',
            },
            'blockquote': {
              fontStyle: 'italic',
              borderLeftColor: '#cd5c5c',
              borderLeftWidth: '4px',
              paddingLeft: '1rem',
            },
            'code': {
              fontFamily: 'JetBrains Mono, Consolas, monospace',
              backgroundColor: '#f5f5f5',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
            },
            'pre': {
              fontFamily: 'JetBrains Mono, Consolas, monospace',
              backgroundColor: '#1a1a1a',
              color: '#e6e6e6',
            },
            'a': {
              color: '#0066cc',
              textDecoration: 'underline',
              '&:hover': {
                color: '#4d9fff',
              },
            },
          },
        },
        dark: {
          css: {
            color: '#e6e6e6',
            'h1, h2, h3, h4, h5, h6': {
              color: '#ff8c42',
            },
            'blockquote': {
              borderLeftColor: '#ff8c42',
            },
            'code': {
              backgroundColor: '#2a2a2a',
              color: '#e6e6e6',
            },
            'a': {
              color: '#4d9fff',
              '&:hover': {
                color: '#80b3ff',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}