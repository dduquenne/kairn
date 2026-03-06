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
    const { assertValidEnv, checkProductionReadiness, isProduction } = await import('@kairn/core');

    // Validate env schema (fails fast in production)
    assertValidEnv();

    // Additional production readiness checks
    if (isProduction()) {
      const readiness = checkProductionReadiness();

      if (!readiness.ready) {
        console.error(
          `\n❌ Production readiness check failed — missing variables: ${readiness.missing.join(', ')}\n`
        );
        process.exit(1);
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
