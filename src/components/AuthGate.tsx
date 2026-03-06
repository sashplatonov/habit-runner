import React from 'react';
import { API_BASE_URL } from '@/lib/core/config';

interface AuthGateProps {
  onError: (message: string) => void;
}

function startOAuth() {
  const returnTo = window.location.origin;
  const url = new URL(`${API_BASE_URL}/auth/google/start`);
  url.searchParams.set('returnTo', returnTo);
  window.location.assign(url.toString());
}

export function AuthGate({ onError }: AuthGateProps) {
  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-[#1e1e2e] rounded-2xl bg-[#0f0f1a] p-6 text-white">
        <h1 className="text-xl font-semibold mb-2">Вход в Habbit Runner</h1>
        <p className="text-sm text-[#94a3b8] mb-6">
          Авторизуйтесь через Google, чтобы включить синхронизацию между устройствами.
        </p>

        <div className="space-y-3">
          <button
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
            onClick={startOAuth}
          >
            Продолжить с Google
          </button>
        </div>

        <button
          className="mt-4 text-xs text-[#94a3b8] hover:text-white"
          onClick={() => onError('OAuth не настроен. Заполните переменные в server/.env и перезапустите API.')}
        >
          Не работает вход?
        </button>
      </div>
    </div>
  );
}
