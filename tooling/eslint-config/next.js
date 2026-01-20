/**
 * @kairn/eslint-config/next
 * Configuration ESLint pour les applications Next.js
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./react.js', 'next/core-web-vitals'],
  rules: {
    // Next.js specific
    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-img-element': 'error',

    // Allow Next.js patterns
    'import/no-default-export': 'off', // Pages need default exports

    // Performance
    '@next/next/no-sync-scripts': 'error',
  },
  overrides: [
    {
      // Allow default exports in pages and app directory
      files: [
        'app/**/*.tsx',
        'pages/**/*.tsx',
        'src/app/**/*.tsx',
        'src/pages/**/*.tsx',
        '*.config.ts',
        '*.config.js',
      ],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
};
