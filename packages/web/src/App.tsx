import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from '@/lib/router';
import { Nav } from '@/components/Nav';
import { Dashboard } from '@/pages/Dashboard';
import { HabitDetail } from '@/pages/HabitDetail';
import { AddEditHabit } from '@/pages/AddEditHabit';
import { Stats } from '@/pages/Stats';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { AuthGate } from '@/components/AuthGate';
import type {
  AuthSession
} from '@/lib/auth/session';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  AUTH_SESSION_CLEARED_EVENT,
  clearAuthSession,
  getSessionUserId,
  parseOAuthCallbackSession,
  readAuthSession
} from '@/lib/auth/session';
import { API_BASE_URL } from '@/lib/core/config';
import { setCurrentUserId } from '@/lib/storage/db';
import { useTheme } from '@/hooks/useTheme';
import { UndoProvider } from '@/lib/undo';
import { installGlobalClientLogging } from '@/lib/logging/clientLogger';

type AuthCallbackPageProps = {
  message?: string;
};

function AuthCallbackPage({ message }: AuthCallbackPageProps) {
  return (
    <div className="min-h-screen pt-14 bg-bg-primary flex items-center justify-center">
      <div className="text-sm font-mono text-muted">{message ?? 'Finishing login…'}</div>
    </div>
  );
}

function RouteFocusManager() {
  const location = useLocation();

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main) {
      main.focus();
    }
  }, [location.pathname]);

  return null;
}

export function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    const session = readAuthSession();
    setCurrentUserId(getSessionUserId(session));
    return session;
  });
  const { theme, setTheme } = useTheme(Boolean(authSession));
  const [authError, setAuthError] = useState<string | undefined>();
  useSyncEngine(Boolean(authSession));

  useEffect(() => {
    setCurrentUserId(getSessionUserId(authSession));
  }, [authSession]);

  useEffect(() => {
    const onSessionCleared = () => {
      setCurrentUserId(null);
      setAuthSession(null);
      setAuthError('Session expired. Please log in again.');
    };

    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, onSessionCleared);
    return () => {
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, onSessionCleared);
    };
  }, []);

  useEffect(() => {
    return installGlobalClientLogging();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname !== '/auth/callback') {
      return;
    }

    const session = parseOAuthCallbackSession(url);
    if (session) {
      setCurrentUserId(getSessionUserId(session));
      setAuthSession(session);
      window.history.replaceState({}, '', '/');
      return;
    }

    setAuthError('Failed to complete OAuth login. Check provider setup and redirect URI.');
    window.history.replaceState({}, '', '/');
  }, []);

  const logout = async () => {
    const refreshToken = authSession?.refreshToken;
    clearAuthSession();
    setCurrentUserId(null);
    setAuthSession(null);
    if (!refreshToken) {
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    } catch {
      // Logout endpoint failure should not block local session cleanup.
    }
  };

  return (
    <UndoProvider>
      <ErrorBoundary>
      {authSession ? (
        <BrowserRouter>
          <div className="min-h-screen bg-bg-primary">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:border focus:border-accent focus:bg-bg-card focus:px-3 focus:py-2 focus:text-xs focus:text-foreground"
            >
              Skip to main content
            </a>
            <Nav onLogout={logout} theme={theme} onThemeChange={setTheme} />
            <RouteFocusManager />
            <main id="main-content" tabIndex={-1} className="pt-14 focus:outline-none">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/habit/new" element={<AddEditHabit />} />
                <Route path="/habit/:id" element={<HabitDetail />} />
                <Route path="/habit/:id/edit" element={<AddEditHabit />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      ) : (
        <>
          <AuthGate onError={setAuthError} />
          {authError && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-accent-secondary/30 bg-accent-secondary/10 px-4 py-2 text-xs text-accent-secondary">
              {authError}
            </div>
          )}
        </>
        )}
      </ErrorBoundary>
    </UndoProvider>
  );
}
