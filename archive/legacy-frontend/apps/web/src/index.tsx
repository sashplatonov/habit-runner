/** 
 * AGENT NOTE: Legacy React entrypoint.
 * Path: archive/legacy-frontend/apps/web/src/index.tsx
 * Purpose: Renders old `App` into `#root`. For route definitions see `App.tsx`.
 * Useful for agents: entrypoint, CSS imports, and observability init.
 * If you plan to restore files, follow restore steps in archive/legacy-frontend/AGENT_GUIDE.md.
 */
import { initFaro } from './lib/observability/faro';
void initFaro();

import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element was not found');
}

createRoot(rootElement).render(<App />);
