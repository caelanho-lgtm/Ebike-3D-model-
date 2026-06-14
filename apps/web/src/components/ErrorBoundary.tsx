import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Isolates rendering failures (e.g. a browser without WebGL for the 3D viewer)
 * so they degrade gracefully instead of taking down the whole page.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.warn('ErrorBoundary caught:', error);
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="loading">3D preview unavailable in this browser.</div>
        )
      );
    }
    return this.props.children;
  }
}
