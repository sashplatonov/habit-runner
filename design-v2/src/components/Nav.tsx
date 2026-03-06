import React from 'react';
import {
  LayoutDashboardIcon,
  BarChart2Icon,
  PlusIcon,
  LogOutIcon } from
'lucide-react';
interface NavProps {
  currentView: string;
  onNavigate: (view: string, habitId?: string) => void;
  onLogout?: () => void;
}
export function Nav({ currentView, onNavigate, onLogout }: NavProps) {
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

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Logout button */}
        {onLogout &&
        <button
          onClick={onLogout}
          className="p-1.5 rounded-lg border border-[#1e1e2e] text-[#64748b] hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10 transition-all duration-200"
          title="Clear all data">

            <LogOutIcon size={14} />
          </button>
        }

        {/* Add button */}
        <button
          onClick={() => onNavigate('add')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-medium hover:bg-[#00d4ff]/20 hover:shadow-[0_0_16px_rgba(0,212,255,0.25)] transition-all duration-200">

          <PlusIcon size={13} />
          <span className="hidden sm:block">New Habit</span>
        </button>
      </div>
    </nav>);

}