/**
 * @kairn/tailwind-preset
 *
 * Preset Tailwind partagé pour tous les sites Kairn.
 * Les couleurs spécifiques sont injectées via la configuration du site.
 */

/** @type {import('tailwindcss').Config} */
const preset = {
  theme: {
    extend: {
      // Couleurs de base (surchargées par chaque site)
      colors: {
        // Couleurs sémantiques mappées aux CSS variables
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          50: 'var(--color-secondary-50)',
          100: 'var(--color-secondary-100)',
          200: 'var(--color-secondary-200)',
          300: 'var(--color-secondary-300)',
          400: 'var(--color-secondary-400)',
          500: 'var(--color-secondary-500)',
          600: 'var(--color-secondary-600)',
          700: 'var(--color-secondary-700)',
          800: 'var(--color-secondary-800)',
          900: 'var(--color-secondary-900)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
        },
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        // États
        success: {
          DEFAULT: 'var(--color-success, #10b981)',
          light: 'var(--color-success-light, #d1fae5)',
        },
        warning: {
          DEFAULT: 'var(--color-warning, #f59e0b)',
          light: 'var(--color-warning-light, #fef3c7)',
        },
        error: {
          DEFAULT: 'var(--color-error, #ef4444)',
          light: 'var(--color-error-light, #fee2e2)',
        },
      },

      // Typographie
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        sans: ['var(--font-body)', 'sans-serif'],
        serif: ['var(--font-display)', 'serif'],
      },

      // Espacements cohérents
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
      },

      // Border radius
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },

      // Animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },

      // Typographie responsive
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-md': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-sm': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
      },

      // Ombres
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -15px rgba(0, 0, 0, 0.1)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },

      // Backdrop blur
      backdropBlur: {
        xs: '2px',
      },

      // Aspect ratios
      aspectRatio: {
        'portrait': '3 / 4',
        'landscape': '4 / 3',
        'ultrawide': '21 / 9',
      },
    },
  },

  plugins: [],
};

module.exports = preset;
