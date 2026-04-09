import React from 'react';
import { startOAuthLogin } from '@/lib/auth/oauth';

interface AuthGateProps {
  onError: (message: string) => void;
}

export function AuthGate({ onError }: AuthGateProps) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-border rounded-2xl bg-bg-secondary p-6 text-foreground">
        <h1 className="text-xl font-semibold mb-2">Sign in to Habbit Runner</h1>
        <p className="text-sm text-muted mb-6">
          Sign in with Google to enable sync across your devices.
        </p>

        <div className="space-y-3">
          <button
            className="w-full rounded-lg border border-border-hover bg-bg-card px-4 py-2.5 text-sm font-medium hover:border-accent/40 hover:bg-accent/10 transition-colors"
            onClick={startOAuthLogin}
          >
            Continue with Google
          </button>
        </div>

        <button
          className="mt-4 text-xs text-muted hover:text-foreground"
          onClick={() =>
            onError('OAuth is not configured. Export backend Google OAuth env vars (or set them in root .env for Docker) and restart the API.')
          }
        >
          Sign-in not working?
        </button>
      </div>
    </div>
  );
}
