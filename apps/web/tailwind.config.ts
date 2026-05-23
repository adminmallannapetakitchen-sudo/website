import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        safe: 'env(safe-area-inset-bottom)',
      },
      colors: {
        brand: {
          red: '#B8332A',
          'red-dark': '#8C1F17',
          'red-light': '#D94F45',
          saffron: '#E8841F',
          'saffron-light': '#F0A050',
          gold: '#F4B847',
          'gold-light': '#F8D070',
          cream: '#FFFAF0',
          'cream-dark': '#F5EDD8',
          'warm-gray': '#6B5E52',
        },
        primary: { DEFAULT: '#B8332A', foreground: '#FFFAF0' },
        accent: { DEFAULT: '#E8841F', foreground: '#FFFAF0' },
        background: '#FFFAF0',
        foreground: '#1A1410',
        card: { DEFAULT: '#FFFFFF', foreground: '#1A1410' },
        muted: { DEFAULT: '#F5EDD8', foreground: '#6B5E52' },
        border: '#E8D8C0',
        input: '#E8D8C0',
        ring: '#B8332A',
        destructive: { DEFAULT: '#B8332A', foreground: '#FFFAF0' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        telugu: ['"Noto Serif Telugu"', 'serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.625rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'cart-bump': {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.3)' },
          '60%': { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 4s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 2.5s ease-in-out infinite',
        'cart-bump': 'cart-bump 0.4s cubic-bezier(0.36,0.07,0.19,0.97)',
        wiggle: 'wiggle 0.5s ease-in-out',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #B8332A 0%, #E8841F 50%, #F4B847 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #C4433A 0%, #F09535 100%)',
        'hero-gradient': 'linear-gradient(160deg, #FFF0D6 0%, #FFFAF0 60%, #FFF8EE 100%)',
        'card-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
        'bottom-nav-gradient': 'linear-gradient(180deg, transparent 0%, rgba(255,250,240,0.95) 30%)',
      },
      boxShadow: {
        'brand-sm': '0 2px 8px rgba(184,51,42,0.18)',
        brand: '0 4px 20px rgba(184,51,42,0.25)',
        'brand-lg': '0 8px 40px rgba(184,51,42,0.3)',
        'brand-xl': '0 16px 60px rgba(184,51,42,0.35)',
        warm: '0 4px 20px rgba(232,132,31,0.2)',
        'warm-lg': '0 8px 32px rgba(232,132,31,0.25)',
        card: '0 2px 16px rgba(26,20,16,0.07)',
        'card-hover': '0 8px 32px rgba(232,132,31,0.15)',
        'card-active': '0 2px 8px rgba(26,20,16,0.05)',
        nav: '0 -4px 24px rgba(26,20,16,0.08)',
        float: '0 20px 60px rgba(26,20,16,0.12), 0 8px 20px rgba(26,20,16,0.08)',
      },
    },
  },
  plugins: [],
}

export default config
