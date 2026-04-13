import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { logClientError } from '../lib/logging/clientLogger';

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app-ui-error', {
          detail: {
            message: error.message,
            stack: error.stack,
            componentStack: info.componentStack
          }
        })
      );
    }
    logClientError('ui.error_boundary', 'Unhandled render error caught by ErrorBoundary', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-12">
        <div
            className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-bg-card/95 px-6 py-8 text-center shadow-glow-blue-sm backdrop-blur"
            role="alert"
          >
            <div className="text-lg font-semibold text-foreground">
              Something went wrong
            </div>
            <p className="text-sm text-muted">
              Refresh the page or come back in a moment.
            </p>
            {this.state.error?.message && (
              <p className="break-words text-xs text-foreground/80">
                {this.state.error.message}
              </p>
            )}
            <details className="rounded border border-border/50 bg-bg-primary/60 p-3 text-left text-xs text-muted" role="group">
              <summary className="font-semibold text-foreground/90">
                View debug info
              </summary>
              {this.state.error?.stack && (
                <pre className="mt-2 whitespace-pre-wrap text-[11px] text-foreground/70">
                  {this.state.error.stack}
                </pre>
              )}
              {this.state.info?.componentStack && (
                <pre className="mt-2 whitespace-pre-wrap text-[11px] text-foreground/60">
                  {this.state.info.componentStack}
                </pre>
              )}
            </details>
            <button
              className="w-full rounded-lg border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition duration-200 hover:border-accent hover:text-accent"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
            {this.props.fallback}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
