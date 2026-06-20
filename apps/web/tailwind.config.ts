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
        // Evolved warm-editorial palette: deeper claret + warm ivory + a single
        // antique gold. Token NAMES are unchanged so the new look cascades across
        // every existing `brand-*` / bg-background / text-foreground reference.
        brand: {
          red: '#A12A22',          // claret — the one accent
          'red-dark': '#7C1C16',
          'red-light': '#BF463B',
          saffron: '#C2611C',      // muted ember (secondary warm)
          'saffron-light': '#D67E33',
          gold: '#C49A48',         // antique gold — metallic detail only, used sparingly
          'gold-light': '#D9B86A',
          cream: '#F6F0E6',
          'cream-dark': '#EAE0CE',
          'warm-gray': '#7C6A58',
        },
        primary: { DEFAULT: '#A12A22', foreground: '#F8F2E8' },
        accent: { DEFAULT: '#C2611C', foreground: '#F8F2E8' },
        background: '#F6F0E6',      // warm ivory paper
        foreground: '#2B1B13',      // deep roast brown (warm near-black)
        card: { DEFAULT: '#FFFCF7', foreground: '#2B1B13' }, // warm white
        muted: { DEFAULT: '#EDE4D4', foreground: '#7C6A58' },
        border: '#E6D9C2',
        input: '#E6D9C2',
        ring: '#A12A22',
        destructive: { DEFAULT: '#A12A22', foreground: '#F8F2E8' },
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        telugu: ['"Noto Serif Telugu"', 'serif'],
        display: ['"Bricolage Grotesque"', '"Hanken Grotesk"', 'sans-serif'],
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
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
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
        marquee: 'marquee 32s linear infinite',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #A12A22 0%, #C2611C 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #B23A2E 0%, #C2611C 100%)',
        'hero-gradient': 'linear-gradient(180deg, #FBF6EC 0%, #F6F0E6 100%)',
        'card-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
        'bottom-nav-gradient': 'linear-gradient(180deg, transparent 0%, rgba(246,240,230,0.96) 32%)',
      },
      boxShadow: {
        // Warm-tinted, soft, large-blur shadows — the premium "expensive" feel.
        'brand-sm': '0 1px 2px rgba(124,28,22,0.10), 0 4px 14px -4px rgba(124,28,22,0.22)',
        brand: '0 2px 6px rgba(124,28,22,0.12), 0 14px 30px -10px rgba(124,28,22,0.30)',
        'brand-lg': '0 4px 10px rgba(124,28,22,0.14), 0 26px 50px -16px rgba(124,28,22,0.38)',
        'brand-xl': '0 8px 18px rgba(124,28,22,0.16), 0 40px 70px -22px rgba(124,28,22,0.42)',
        warm: '0 2px 8px rgba(194,97,28,0.16), 0 14px 30px -12px rgba(194,97,28,0.26)',
        'warm-lg': '0 4px 12px rgba(194,97,28,0.18), 0 24px 44px -16px rgba(194,97,28,0.3)',
        card: '0 1px 2px rgba(43,27,19,0.04), 0 12px 30px -14px rgba(43,27,19,0.14)',
        'card-hover': '0 2px 4px rgba(43,27,19,0.05), 0 26px 52px -18px rgba(43,27,19,0.22)',
        'card-active': '0 1px 3px rgba(43,27,19,0.06)',
        nav: '0 -4px 30px -8px rgba(43,27,19,0.12)',
        float: '0 30px 70px -24px rgba(43,27,19,0.28), 0 10px 24px -12px rgba(43,27,19,0.14)',
      },
    },
  },
  plugins: [],
}

export default config
