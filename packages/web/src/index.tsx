import './index.css';
import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from '@/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element was not found');
}

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, <App />);
} else {
  createRoot(rootElement).render(<App />);
}
