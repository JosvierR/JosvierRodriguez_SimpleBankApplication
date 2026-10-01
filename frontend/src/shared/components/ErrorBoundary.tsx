import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '@/shared/i18n/i18n';

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
            <h1>{i18n.t('banking:unexpectedTitle')}</h1>
            <p>{i18n.t('banking:unexpectedBody')}</p>
            <button className="button" onClick={() => window.location.reload()}>
              {i18n.t('common:retry')}
            </button>
          </div>
        </main>
      );
    return this.props.children;
  }
}
