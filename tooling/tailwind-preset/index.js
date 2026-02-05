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
        18: '4.5rem',
        112: '28rem',
        128: '32rem',
      },

      // Border radius
      borderRadius: {
        xl: '1rem',
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
        // Marquee animations for testimonials and carousels
        'marquee-left': 'marqueeLeft 30s linear infinite',
        'marquee-right': 'marqueeRight 30s linear infinite',
        'marquee-left-slow': 'marqueeLeft 45s linear infinite',
        'marquee-right-slow': 'marqueeRight 45s linear infinite',
        'marquee-left-fast': 'marqueeLeft 20s linear infinite',
        'marquee-right-fast': 'marqueeRight 20s linear infinite',
        // Shimmer effect for skeletons
        shimmer: 'shimmer 2s infinite',
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
        // Marquee animations - scroll content horizontally
        marqueeLeft: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        marqueeRight: {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        // Shimmer effect for loading states
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
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
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -15px rgba(0, 0, 0, 0.1)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },

      // Backdrop blur
      backdropBlur: {
        xs: '2px',
      },

      // Aspect ratios
      aspectRatio: {
        portrait: '3 / 4',
        landscape: '4 / 3',
        ultrawide: '21 / 9',
      },

      // Ring offset colors for accessibility
      ringOffsetColor: {
        night: 'var(--color-background, #1a1a2e)',
      },
    },
  },

  plugins: [
    /**
     * Accessibility Plugin - WCAG 2.1 AA Compliant Focus Styles
     *
     * Provides consistent, accessible focus indicators for all interactive elements.
     * Uses focus-visible to only show focus rings for keyboard navigation.
     */
    function accessibilityPlugin({ addComponents, addUtilities }) {
      // Base focus-visible utilities
      const focusUtilities = {
        // Primary focus ring (gold/primary color) - high visibility
        '.focus-ring': {
          '&:focus-visible': {
            outline: 'none',
            boxShadow: `0 0 0 2px var(--color-background, #1a1a2e), 0 0 0 4px var(--color-primary, #d4af37)`,
          },
        },

        // Focus ring with offset for dark backgrounds
        '.focus-ring-offset': {
          '&:focus-visible': {
            outline: 'none',
            ringWidth: '2px',
            ringColor: 'var(--color-primary, #d4af37)',
            ringOffsetWidth: '2px',
            ringOffsetColor: 'var(--color-background, #1a1a2e)',
            boxShadow: `0 0 0 2px var(--color-background, #1a1a2e), 0 0 0 4px var(--color-primary, #d4af37)`,
          },
        },

        // Focus ring for light backgrounds
        '.focus-ring-light': {
          '&:focus-visible': {
            outline: 'none',
            boxShadow: `0 0 0 2px #ffffff, 0 0 0 4px var(--color-primary, #d4af37)`,
          },
        },

        // Focus ring with custom color via CSS variable
        '.focus-ring-custom': {
          '&:focus-visible': {
            outline: 'none',
            boxShadow: `0 0 0 2px var(--focus-offset-color, var(--color-background, #1a1a2e)), 0 0 0 4px var(--focus-ring-color, var(--color-primary, #d4af37))`,
          },
        },

        // Inset focus ring for inputs/form elements
        '.focus-ring-inset': {
          '&:focus-visible': {
            outline: 'none',
            boxShadow: `inset 0 0 0 2px var(--color-primary, #d4af37)`,
            borderColor: 'var(--color-primary, #d4af37)',
          },
        },

        // High contrast focus for maximum visibility
        '.focus-ring-high-contrast': {
          '&:focus-visible': {
            outline: '3px solid var(--color-primary, #d4af37)',
            outlineOffset: '2px',
          },
        },

        // Remove default focus styles when using custom ones
        '.focus-none': {
          '&:focus': {
            outline: 'none',
          },
          '&:focus-visible': {
            outline: 'none',
          },
        },
      };

      // Accessible skip link component
      const skipLinkComponent = {
        '.skip-link': {
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          zIndex: '9999',

          '&:focus, &:focus-visible': {
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            width: 'auto',
            height: 'auto',
            overflow: 'visible',
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--color-primary, #d4af37)',
            color: 'var(--color-background, #1a1a2e)',
            fontWeight: '600',
            fontSize: '0.875rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            outline: '2px solid transparent',
            outlineOffset: '2px',
          },
        },
      };

      // Screen reader only utility (enhanced)
      const srOnlyUtility = {
        '.sr-only-focusable': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',

          '&:focus, &:focus-visible': {
            position: 'static',
            width: 'auto',
            height: 'auto',
            padding: 'inherit',
            margin: '0',
            overflow: 'visible',
            clip: 'auto',
            whiteSpace: 'normal',
          },
        },
      };

      addUtilities(focusUtilities);
      addComponents(skipLinkComponent);
      addUtilities(srOnlyUtility);
    },
  ],
};

// eslint-disable-next-line no-undef
module.exports = preset;
