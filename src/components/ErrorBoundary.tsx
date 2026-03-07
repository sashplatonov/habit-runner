import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  info?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error('Uncaught error in UI', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 text-center">
          <div className="text-lg font-semibold text-white">Что-то пошло не так</div>
          <p className="mt-2 text-sm text-muted">
            Попробуйте обновить страницу или зайти позже.
          </p>
          <button
            className="mt-4 rounded-lg border border-white/40 px-4 py-2 text-xs uppercase tracking-wide text-white"
            onClick={() => window.location.reload()}
          >
            Обновить
          </button>
          {this.props.fallback}
        </div>
      );
    }

    return this.props.children;
  }
}
