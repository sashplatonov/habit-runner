import React from 'react';
import { DashboardView } from './components/DashboardView';
import { useDashboardModel } from '@/pages/hooks/useDashboardModel';

export function Dashboard() {
  const model = useDashboardModel();
  return <DashboardView {...model} />;
}
