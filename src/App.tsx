import React, { useState } from 'react';
import { Nav } from './components/Nav';
import { Dashboard } from './pages/Dashboard';
import { HabitDetail } from './pages/HabitDetail';
import { AddEditHabit } from './pages/AddEditHabit';
import { Stats } from './pages/Stats';
type AppView = 'dashboard' | 'detail' | 'add' | 'edit' | 'stats';
export function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const [activeHabitId, setActiveHabitId] = useState<string | undefined>();
  const navigate = (v: string, habitId?: string) => {
    setView(v as AppView);
    if (habitId) setActiveHabitId(habitId);
  };
  return (
    <div className="min-h-screen bg-[#080810]">
      <Nav currentView={view} onNavigate={navigate} />
      {view === 'dashboard' && <Dashboard onNavigate={navigate} />}
      {view === 'detail' && activeHabitId &&
      <HabitDetail habitId={activeHabitId} onNavigate={navigate} />
      }
      {view === 'add' && <AddEditHabit onNavigate={navigate} />}
      {view === 'edit' && activeHabitId &&
      <AddEditHabit habitId={activeHabitId} onNavigate={navigate} />
      }
      {view === 'stats' && <Stats onNavigate={navigate} />}
    </div>);

}