import kairnPreset from '@kairn/tailwind-preset';
import type { Config } from 'tailwindcss';

// Inlined theme configuration for Turbopack compatibility
const brandColors = {
  indigo: {
    DEFAULT: '#6366f1',
    light: '#a5b4fc',
    dark: '#4338ca',
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  slate: {
    DEFAULT: '#1e293b',
    light: '#334155',
    dark: '#0f172a',
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
  },
  cream: {
    DEFAULT: '#f8fafc',
    light: '#ffffff',
    dark: '#f1f5f9',
    50: '#ffffff',
    100: '#f8fafc',
    200: '#f1f5f9',
    300: '#e2e8f0',
    400: '#cbd5e1',
    500: '#94a3b8',
    600: '#64748b',
    700: '#475569',
    800: '#334155',
    900: '#1e293b',
  },
} as const;

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
      // Couleurs spécifiques UNANIMA
      colors: {
        indigo: brandColors.indigo,
        slate: brandColors.slate,
        cream: brandColors.cream,
      },
      // Typographie UNANIMA
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
