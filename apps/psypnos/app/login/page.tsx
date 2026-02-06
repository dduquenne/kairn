/**
 * Login Page - Server Component
 *
 * This is a Server Component that forces dynamic rendering to ensure
 * the page is never prerendered/cached. The actual login form is a
 * Client Component imported separately.
 *
 * This separation is necessary because:
 * - dynamic/revalidate/fetchCache exports only work in Server Components
 * - "use client" makes a file a Client Component where these are ignored
 */

import { Suspense } from 'react';

import { GlobalHeader } from '../../components/GlobalHeader';

import { LoginForm, LoginFormFallback } from './LoginForm';

// Force dynamic rendering - ensures no prerendering/caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function LoginPage() {
  return (
    <>
      <GlobalHeader context="login" />
      <div className="bg-night text-ivory flex min-h-screen flex-col items-center justify-center">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </>
  );
}
