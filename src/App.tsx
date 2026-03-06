import React, { useEffect, useState } from 'react';
import { Nav } from '@/components/Nav';
import { Dashboard } from '@/pages/Dashboard';
import { HabitDetail } from '@/pages/HabitDetail';
import { AddEditHabit } from '@/pages/AddEditHabit';
import { Stats } from '@/pages/Stats';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { AuthGate } from '@/components/AuthGate';
import type {
  AuthSession} from '@/lib/auth/session';
import {
  AUTH_SESSION_CLEARED_EVENT,
  clearAuthSession,
  getSessionUserId,
  parseOAuthCallbackSession,
  readAuthSession
} from '@/lib/auth/session';
import { API_BASE_URL } from '@/lib/core/config';
import { setCurrentUserId } from '@/lib/storage/db';

type AppView = 'dashboard' | 'detail' | 'add' | 'edit' | 'stats';

export function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const [activeHabitId, setActiveHabitId] = useState<string | undefined>();
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    const session = readAuthSession();
    setCurrentUserId(getSessionUserId(session));
    return session;
  });
  const [authError, setAuthError] = useState<string | undefined>();
  useSyncEngine(Boolean(authSession));

  useEffect(() => {
    setCurrentUserId(getSessionUserId(authSession));
  }, [authSession]);

  useEffect(() => {
    const onSessionCleared = () => {
      setCurrentUserId(null);
      setAuthSession(null);
      setAuthError('Сессия истекла. Выполните вход снова.');
    };

    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, onSessionCleared);
    return () => {
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, onSessionCleared);
    };
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

    setAuthError('Не удалось завершить OAuth вход. Проверьте настройки провайдера и redirect URI.');
    window.history.replaceState({}, '', '/');
  }, []);

  const navigate = (v: string, habitId?: string) => {
    setView(v as AppView);
    if (habitId) {setActiveHabitId(habitId);}
  };

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

  if (!authSession) {
    return (
      <>
        <AuthGate onError={setAuthError} />
        {authError && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
            {authError}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810]">
      <Nav
        currentView={view}
        onNavigate={navigate}
        onLogout={logout}
      />
      {view === 'dashboard' && <Dashboard onNavigate={navigate} />}
      {view === 'detail' && activeHabitId && (
        <HabitDetail habitId={activeHabitId} onNavigate={navigate} />
      )}
      {view === 'add' && <AddEditHabit onNavigate={navigate} />}
      {view === 'edit' && activeHabitId && (
        <AddEditHabit habitId={activeHabitId} onNavigate={navigate} />
      )}
      {view === 'stats' && <Stats onNavigate={navigate} />}
    </div>
  );
}
