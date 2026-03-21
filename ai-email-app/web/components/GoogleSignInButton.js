'use client';

import { GoogleLogin } from '@react-oauth/google';

export default function GoogleSignInButton({ onSuccess, onError, disabled }) {
  const hasClientId = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  if (!hasClientId) {
    return (
      <p className="text-center text-xs text-ink-700">
        Google sign-in: add <code className="rounded bg-cream-200 px-1">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> and{' '}
        <code className="rounded bg-cream-200 px-1">GOOGLE_CLIENT_ID</code> on the API.
      </p>
    );
  }

  return (
    <div className="flex justify-center [&>div]:w-full">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        theme="outline"
        size="large"
        width="100%"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
}
