'use client';

/**
 * Axe Accessibility Checker - Development Only
 *
 * Runtime accessibility checker using axe-core that logs WCAG violations
 * to the browser console. Only active in development mode.
 *
 * @example
 * ```tsx
 * import { AxeAccessibilityChecker } from '@kairn/ui';
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

export interface AxeAccessibilityCheckerProps {
  /** Delay in ms before running axe checks (default: 1000) */
  delay?: number;
  /** Disable specific rules by id */
  disableRules?: string[];
}

/**
 * Development-only component that runs axe-core accessibility checks
 * and reports WCAG 2.1 AA violations in the browser console.
 */
export function AxeAccessibilityChecker({
  delay = 1000,
  disableRules = [],
}: AxeAccessibilityCheckerProps = {}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const loadAxe = async () => {
      try {
        const axe = await import('@axe-core/react');
        const React = await import('react');
        const ReactDOM = await import('react-dom');

        const defaultRules = [
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
        ];

        const rules = defaultRules.map(rule => ({
          ...rule,
          enabled: disableRules.includes(rule.id) ? false : rule.enabled,
        }));

        axe.default(React.default, ReactDOM.default, delay, { rules });

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
  }, [delay, disableRules]);

  return null;
}
