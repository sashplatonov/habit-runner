import React from 'react';
import { LayoutDashboardIcon, BarChart2Icon, PlusIcon } from 'lucide-react';
import { SyncEngineState, SyncStatus } from '@/hooks/useSyncEngine';
interface NavProps {
  currentView: string;
  onNavigate: (view: string, habitId?: string) => void;
  syncState: SyncEngineState;
  userEmail?: string;
  onLogout?: () => void;
}
const statusLabels: Record<SyncStatus, string> = {
  idle: 'Synced',
  syncing: 'Syncing',
  offline: 'Offline',
  error: 'Error'
};
const statusClasses: Record<SyncStatus, string> = {
  idle: 'text-emerald-300 border-emerald-300/40 bg-emerald-500/5',
  syncing: 'text-cyan-300 border-cyan-300/40 bg-cyan-500/5',
  offline: 'text-amber-300 border-amber-300/40 bg-amber-500/5',
  error: 'text-rose-300 border-rose-300/40 bg-rose-500/5'
};
export function Nav({ currentView, onNavigate, syncState, userEmail, onLogout }: NavProps) {
  const isActive = (view: string) =>
  currentView === view || view === 'dashboard' && currentView === 'detail';
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-[#1e1e2e] bg-[#080810]/95 backdrop-blur-sm flex items-center px-4 justify-between">
      {/* Logo */}
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2 group">

        <div className="w-7 h-7 rounded border border-[#00d4ff]/40 flex items-center justify-center bg-[#00d4ff]/5">
          <span className="text-[#00d4ff] text-xs font-mono font-bold">HT</span>
        </div>
        <span className="text-white font-semibold text-sm tracking-tight hidden sm:block">
          HabitTrack
        </span>
      </button>

      {/* Center nav */}
      <div className="flex items-center gap-1 bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-1">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${isActive('dashboard') ? 'bg-[#00d4ff]/10 text-[#00d4ff] shadow-[0_0_12px_rgba(0,212,255,0.15)]' : 'text-[#64748b] hover:text-white'}`}>

          <LayoutDashboardIcon size={13} />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => onNavigate('stats')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${isActive('stats') ? 'bg-[#00ff88]/10 text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.15)]' : 'text-[#64748b] hover:text-white'}`}>

          <BarChart2Icon size={13} />
          <span>Stats</span>
        </button>
      </div>

      <div
        className={`hidden sm:flex items-center gap-2 border rounded-full px-3 py-1 text-xs font-medium ${statusClasses[syncState.status]}`}
        title={
          syncState.lastError
            ? `Sync error: ${syncState.lastError}`
            : syncState.lastSyncedAt
            ? `Last synced at ${new Date(syncState.lastSyncedAt).toLocaleTimeString()}`
            : undefined
        }>
        <span className="h-2 w-2 rounded-full bg-current" />
        <span>{statusLabels[syncState.status]}</span>
        {syncState.pending > 0 && (
          <span className="text-white/70">({syncState.pending} pending)</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {userEmail && (
          <button
            onClick={onLogout}
            className="hidden sm:block text-xs text-[#94a3b8] hover:text-white transition-colors"
            title={userEmail}
          >
            Выйти
          </button>
        )}
        <button
          onClick={() => onNavigate('add')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-medium hover:bg-[#00d4ff]/20 hover:shadow-[0_0_16px_rgba(0,212,255,0.25)] transition-all duration-200">

          <PlusIcon size={13} />
          <span className="hidden sm:block">New Habit</span>
        </button>
      </div>
    </nav>);

}
