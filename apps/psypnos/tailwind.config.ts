import kairnPreset from '@kairn/tailwind-preset';
import type { Config } from 'tailwindcss';

const config: Config = {
  presets: [kairnPreset],
  darkMode: 'class', // Support mode clair/sombre via classe
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{js,ts,jsx,tsx,mdx}',
    // Include Kairn UI components
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Couleurs spécifiques PSYPNOS avec variantes accessibles WCAG AA
      colors: {
        // Couleurs de base
        gold: {
          DEFAULT: '#c7a962',
          accessible: '#E5C78E', // Ratio 8.5:1 sur night - pour texte
          hover: '#F0D9A3', // Ratio 10.2:1 sur night - pour hover
          light: '#f0d9a3',
          dark: '#8b7a3f',
          50: '#fdfbf5',
          100: '#f9f3e6',
          200: '#f0e0c4',
          300: '#e6cc9e',
          400: '#d4b57a',
          500: '#c7a962',
          600: '#b08f4a',
          700: '#8b7a3f',
          800: '#6b5e32',
          900: '#4d4324',
        },
        ivory: {
          DEFAULT: '#f5f1e6',
          accessible: '#d4c9b0', // Ratio 9.8:1 sur night
          light: '#fdfcf9',
          dark: '#e8e1d0',
        },
        night: {
          DEFAULT: '#0e1f2f',
          light: '#1a3347',
          dark: '#091520',
        },
        // Couleurs accessibles pour utilisation directe
        'gold-text': '#E5C78E',
        'gold-accent': '#c7a962',
        'gold-hover': '#F0D9A3',
        'ivory-text': '#f5f1e6',
        'ivory-muted': '#d4c9b0',
        feedback: {
          success: {
            DEFAULT: '#34d399',
            foreground: '#ecfdf5',
          },
          error: {
            DEFAULT: '#f87171',
            foreground: '#fee2e2',
          },
          info: {
            DEFAULT: '#38bdf8',
            foreground: '#e0f2fe',
          },
        },
      },
      // Typographie PSYPNOS
      fontFamily: {
        display: ["'Playfair Display'", 'serif'],
        sans: ["'Inter'", 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        aurora: '0 25px 50px -12px rgba(14, 31, 47, 0.7)',
      },
      backgroundImage: {
        'mystic-gradient':
          'linear-gradient(135deg, rgba(14,31,47,0.95), rgba(199,169,98,0.25), rgba(14,31,47,0.95))',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'marquee-left': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-right': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'marquee-left': 'marquee-left 30s linear infinite',
        'marquee-right': 'marquee-right 30s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
