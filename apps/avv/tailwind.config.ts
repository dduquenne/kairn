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
      // Couleurs spécifiques AVV avec variantes accessibles WCAG AA
      colors: {
        // Couleurs de base — palette mauve/violet inspirée du logo
        mauve: {
          DEFAULT: '#8B7093',
          accessible: '#C9B5D0', // Ratio ~8.5:1 sur deep-purple - pour texte
          hover: '#DFD0E5', // Ratio ~10:1 sur deep-purple - pour hover
          light: '#C4A6B0',
          dark: '#5C4A66',
          50: '#FAF7FB',
          100: '#F0E8F3',
          200: '#E0D0E6',
          300: '#C9B5D0',
          400: '#A88FB5',
          500: '#8B7093',
          600: '#73597B',
          700: '#5C4A66',
          800: '#463850',
          900: '#31273A',
        },
        lavender: {
          DEFAULT: '#F5F0F5',
          accessible: '#C4B8C8', // Ratio ~8:1 sur deep-purple
          light: '#FDFCFD',
          dark: '#E8E0E8',
        },
        'deep-purple': {
          DEFAULT: '#1C1526',
          light: '#2A2038',
          dark: '#110D18',
        },
        // Couleurs accessibles pour utilisation directe
        'mauve-text': '#C9B5D0',
        'mauve-accent': '#8B7093',
        'mauve-hover': '#DFD0E5',
        'lavender-text': '#F5F0F5',
        'lavender-muted': '#C4B8C8',
        // Aliases pour compatibilité avec les composants partagés @kairn/ui
        gold: {
          DEFAULT: '#8B7093',
          accessible: '#C9B5D0',
          hover: '#DFD0E5',
          light: '#C4A6B0',
          dark: '#5C4A66',
          50: '#FAF7FB',
          100: '#F0E8F3',
          200: '#E0D0E6',
          300: '#C9B5D0',
          400: '#A88FB5',
          500: '#8B7093',
          600: '#73597B',
          700: '#5C4A66',
          800: '#463850',
          900: '#31273A',
        },
        ivory: {
          DEFAULT: '#F5F0F5',
          accessible: '#C4B8C8',
          light: '#FDFCFD',
          dark: '#E8E0E8',
        },
        night: {
          DEFAULT: '#1C1526',
          light: '#2A2038',
          dark: '#110D18',
        },
        'gold-text': '#C9B5D0',
        'gold-accent': '#8B7093',
        'gold-hover': '#DFD0E5',
        'ivory-text': '#F5F0F5',
        'ivory-muted': '#C4B8C8',
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
      boxShadow: {
        aurora: '0 25px 50px -12px rgba(28, 21, 38, 0.7)',
      },
      backgroundImage: {
        'mystic-gradient':
          'linear-gradient(135deg, rgba(28,21,38,0.95), rgba(139,112,147,0.25), rgba(28,21,38,0.95))',
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
