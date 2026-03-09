/**
 * Next.js Instrumentation — executed once at server startup.
 *
 * Validates critical environment variables early to fail fast
 * with clear error messages instead of cryptic runtime errors.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv, checkProductionReadiness, isProduction } = await import('@kairn/core');

    // Validate env schema — log errors but do NOT call process.exit()
    // On Vercel serverless, process.exit() kills every cold start and
    // causes 500 on all routes with no recovery path.
    const envResult = validateEnv();

    if (!envResult.success) {
      console.error('\n⚠️  Environment variable validation issues:');
      for (const [key, messages] of Object.entries(envResult.errors || {})) {
        console.error(`  ${key}:`);
        for (const message of messages) {
          console.error(`    - ${message}`);
        }
      }
      console.error('');
    }

    // Additional production readiness checks
    if (isProduction()) {
      const readiness = checkProductionReadiness();

      if (!readiness.ready) {
        console.error(
          `\n⚠️  Production readiness — missing variables: ${readiness.missing.join(', ')}`
        );
        console.error(
          'The application will start but features requiring these variables will fail.\n'
        );
      }

      if (readiness.warnings.length > 0) {
        console.warn('\n⚠️  Production readiness warnings:');
        for (const warning of readiness.warnings) {
          console.warn(`  - ${warning}`);
        }
        console.warn('');
      }
    }
  }
}
