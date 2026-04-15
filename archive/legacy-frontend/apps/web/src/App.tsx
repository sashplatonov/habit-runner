import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from '@/lib/router';
import { AppLayout } from '@/components/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { HabitDetail } from '@/pages/HabitDetail';
import { AddEditHabit } from '@/pages/AddEditHabit';
import { Stats } from '@/pages/Stats';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { PublicLanding } from '@/components/PublicLanding';
import { PublicSeoPage } from '@/components/PublicSeoPage';
import type {
  AuthSession
} from '@/lib/auth/session';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  AUTH_SESSION_CLEARED_EVENT,
  authenticatedFetch,
  clearAuthSession,
  ensureAuthSession,
  getSessionUserId,
  readAuthSession
} from '@/lib/auth/session';
import { setCurrentUserId } from '@/lib/storage/db';
import { useTheme } from '@/hooks/useTheme';
import { UndoProvider } from '@/lib/undo';
import { installGlobalClientLogging } from '@/lib/logging/clientLogger';
import { PullToRefresh } from '@/components/PullToRefresh';
import { subscribeToPush, isPushNotificationSupported } from '@/lib/pwa/pushSubscription';
import { clearCurrentUserTimeZone } from '@/lib/time/userTimezone';

type AuthCallbackPageProps = {
  message?: string;
};

function AuthCallbackPage({ message }: AuthCallbackPageProps) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
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

function PublicRouter({ authError, onHelpClick }: { authError?: string; onHelpClick: (message: string) => void }) {
  const path = typeof window === 'undefined' ? '/' : window.location.pathname;

  if (path === '/habit-tracker') {
    return <PublicSeoPage intent="habit-tracker" />;
  }
  if (path === '/streak-tracker') {
    return <PublicSeoPage intent="streak-tracker" />;
  }
  if (path === '/daily-routine-planner') {
    return <PublicSeoPage intent="daily-routine-planner" />;
  }

  return <PublicLanding authError={authError} onHelpClick={onHelpClick} />;
}

function useAuthSessionBootstrap(
  setAuthSession: React.Dispatch<React.SetStateAction<AuthSession | null>>,
  setAuthError: React.Dispatch<React.SetStateAction<string | undefined>>
) {
  useEffect(() => {
    let cancelled = false;

    const syncSession = async () => {
      const isCallbackPath = window.location.pathname === '/auth/callback';
      try {
        const session = await ensureAuthSession();
        if (cancelled) {
          return;
        }
        setCurrentUserId(getSessionUserId(session));
        setAuthSession(session);
        if (isCallbackPath) {
          if (!session) {
            setAuthError('Failed to complete OAuth login. Check provider setup and redirect URI.');
          }
          window.history.replaceState({}, '', '/');
        }
      } catch {
        if (!cancelled && isCallbackPath) {
          setAuthError('Failed to complete OAuth login. Check provider setup and redirect URI.');
          window.history.replaceState({}, '', '/');
        }
      }
    };

    void syncSession();
    return () => {
      cancelled = true;
    };
  }, [setAuthError, setAuthSession]);
}

export function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    const session = readAuthSession();
    setCurrentUserId(getSessionUserId(session));
    return session;
  });
  const { theme, setTheme } = useTheme(Boolean(authSession));
  const [authError, setAuthError] = useState<string | undefined>();
  const syncState = useSyncEngine(Boolean(authSession));

  useEffect(() => {
    setCurrentUserId(getSessionUserId(authSession));
  }, [authSession]);

  useEffect(() => {
    const onSessionCleared = () => {
      setCurrentUserId(null);
      clearCurrentUserTimeZone();
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

  // Auto-subscribe to push if permission already granted and user is logged in
  useEffect(() => {
    if (!authSession || !isPushNotificationSupported()) {return;}
    if (Notification.permission !== 'granted') {return;}
    subscribeToPush().catch(() => {/* silent — push is best-effort */});
  }, [authSession]);

  useAuthSessionBootstrap(setAuthSession, setAuthError);

  const logout = async () => {
    clearAuthSession();
    setCurrentUserId(null);
    clearCurrentUserTimeZone();
    setAuthSession(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }

    try {
      await authenticatedFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Logout endpoint failure should not block local session cleanup.
    }
  };

  const isAuthCallbackPath =
    typeof window !== 'undefined' && window.location.pathname === '/auth/callback';

  return (
    <UndoProvider>
      <ErrorBoundary>
      {authSession ? (
        <BrowserRouter>
          <PullToRefresh
            enabled={Boolean(authSession)}
            isRefreshing={syncState.status === 'syncing' && syncState.isActive}
            onRefresh={syncState.syncNow}
          >
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:border focus:border-accent focus:bg-bg-card focus:px-3 focus:py-2 focus:text-xs focus:text-foreground"
            >
              Skip to main content
            </a>
            <AppLayout theme={theme} onThemeChange={setTheme} onLogout={logout} syncState={syncState}>
              <RouteFocusManager />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/habit/new" element={<AddEditHabit />} />
                <Route path="/habit/:id" element={<HabitDetail />} />
                <Route path="/habit/:id/edit" element={<AddEditHabit />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </PullToRefresh>
        </BrowserRouter>
      ) : (
        <>
          {isAuthCallbackPath ? (
            <AuthCallbackPage />
          ) : (
            <PublicRouter authError={authError} onHelpClick={setAuthError} />
          )}
        </>
        )}
      </ErrorBoundary>
    </UndoProvider>
  );
}
