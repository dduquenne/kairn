import type { Config } from 'tailwindcss';
import kairnPreset from '@kairn/tailwind-preset';
import { tailwindExtend } from './config/theme.config';

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
      colors: tailwindExtend.colors,
      // Typographie UNANIMA
      fontFamily: tailwindExtend.fontFamily,
    },
  },
  plugins: [],
};

export default config;
