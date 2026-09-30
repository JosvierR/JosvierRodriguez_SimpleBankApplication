import { Component, type ErrorInfo, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    void error;
    void info; /* Error reporting can be connected here. */
  }
  render() {
    if (this.state.failed)
      return (
        <main className="fatal-state">
          <div>
            <p className="brand-mark">SB</p>
            <h1>Something went wrong</h1>
            <p>The application encountered an unexpected error.</p>
            <button className="button" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </main>
      );
    return this.props.children;
  }
}
