import type { Config } from 'tailwindcss';
import kairnPreset from '@kairn/tailwind-preset';

const config: Config = {
  presets: [kairnPreset],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{js,ts,jsx,tsx,mdx}',
    // Include Kairn UI components
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Couleurs spécifiques PSYPNOS (identiques au projet source)
      colors: {
        gold: '#c7a962',
        ivory: '#f5f1e6',
        night: '#0e1f2f',
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
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
