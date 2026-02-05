'use client';

/**
 * Axe Accessibility Checker - Development Only
 *
 * This component runs axe-core accessibility checks in development mode
 * and logs any violations to the browser console.
 *
 * Usage: Add to your layout.tsx in development:
 * ```tsx
 * import { AxeAccessibilityChecker } from '@/components/AxeAccessibilityChecker';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <AxeAccessibilityChecker />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */

import { useEffect } from 'react';

export function AxeAccessibilityChecker() {
  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Dynamically import axe-core to avoid bundling in production
    const loadAxe = async () => {
      try {
        const axe = await import('@axe-core/react');
        const React = await import('react');
        const ReactDOM = await import('react-dom');

        // Configure axe with WCAG 2.1 AA rules
        axe.default(React.default, ReactDOM.default, 1000, {
          rules: [
            // Ensure all WCAG 2.1 AA rules are enabled
            { id: 'color-contrast', enabled: true },
            { id: 'image-alt', enabled: true },
            { id: 'label', enabled: true },
            { id: 'link-name', enabled: true },
            { id: 'button-name', enabled: true },
            { id: 'input-button-name', enabled: true },
            { id: 'input-image-alt', enabled: true },
            { id: 'html-has-lang', enabled: true },
            { id: 'valid-lang', enabled: true },
            { id: 'bypass', enabled: true },
            { id: 'page-has-heading-one', enabled: true },
            { id: 'region', enabled: true },
            { id: 'skip-link', enabled: true },
            { id: 'tabindex', enabled: true },
            { id: 'focus-order-semantics', enabled: true },
            { id: 'landmark-one-main', enabled: true },
            { id: 'landmark-no-duplicate-banner', enabled: true },
            { id: 'landmark-no-duplicate-contentinfo', enabled: true },
          ],
        });

        // eslint-disable-next-line no-console
        console.log(
          '%c[Axe] Accessibility checker loaded - WCAG 2.1 AA rules enabled',
          'color: #00bcd4; font-weight: bold;'
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[Axe] Could not load accessibility checker:', error);
      }
    };

    loadAxe();
  }, []);

  // This component doesn't render anything
  return null;
}

export default AxeAccessibilityChecker;
