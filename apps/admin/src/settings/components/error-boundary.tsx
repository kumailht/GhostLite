import React, { type ErrorInfo, type ReactNode } from 'react';
import { Banner } from '@tryghost/shade/components';

export interface ErrorBoundaryProps {
  children: ReactNode;
  name: ReactNode;
  /** Rendered in place of the default banner once a child has thrown. */
  fallback?: ReactNode;
  /** Called once a child has thrown; the console lines stay. */
  onError?: (error: unknown, info: ErrorInfo) => void;
}

/**
 * Catches errors in child components and displays a banner. Useful to prevent errors in one
 * section from crashing the entire page
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state = { hasError: false };

  constructor(props: { children: ReactNode; name: ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    this.props.onError?.(error, info);
    // eslint-disable-next-line no-console
    console.error(error);
    // eslint-disable-next-line no-console
    console.error('In component:', info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }
      return (
        <Banner className="text-destructive" role="alert" size="sm" variant="destructive">
          An error occurred loading {this.props.name}. Please refresh and try again.
        </Banner>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
