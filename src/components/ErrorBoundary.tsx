import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error details
    this.setState({
      error,
      errorInfo,
      eventId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🔴 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // reportError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary if resetKeys have changed
    if (hasError && resetKeys && prevProps.resetKeys !== resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        prevProps.resetKeys?.[index] !== key
      );
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset error boundary if resetOnPropsChange is true and props have changed
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      const { error } = this.state;

      if (Fallback && error) {
        return <Fallback error={error} retry={this.handleRetry} />;
      }

      return <DefaultErrorFallback error={error} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

// Default error fallback component with Mars theme
const DefaultErrorFallback: React.FC<{ error: Error | null; retry: () => void }> = ({ 
  error, 
  retry 
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="min-h-64 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-mars-red opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-display font-bold text-mars-red dark:text-mars-orange mb-4">
          Houston, We Have a Problem
        </h2>
        
        <p className="text-gwern-muted mb-6 leading-relaxed">
          Something went wrong while exploring Mars. Our mission control team has been notified and is working on a solution.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={retry}
            className="btn-mars px-6 py-3"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="btn-mars-outline px-6 py-3"
          >
            Reload Page
          </button>
        </div>

        {error && (
          <div className="text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gwern-muted hover:text-mars-red transition-colors duration-200 flex items-center mx-auto"
            >
              <svg
                className={`w-4 h-4 mr-2 transition-transform duration-200 ${showDetails ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </button>

            {showDetails && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-mars-brown bg-opacity-50 rounded-lg text-left">
                <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                  <strong>Error:</strong> {error.name}
                </p>
                <p className="text-sm font-mono text-gwern-muted break-all">
                  {error.message}
                </p>
                {process.env.NODE_ENV === 'development' && error.stack && (
                  <details className="mt-3">
                    <summary className="text-sm font-medium text-gwern-muted cursor-pointer hover:text-mars-red">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-gwern-muted mt-2 overflow-x-auto whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gwern-border dark:border-mars-brown">
          <p className="text-xs text-gwern-muted">
            If this problem persists, please{' '}
            <a 
              href="/support" 
              className="text-mars-red hover:text-mars-rust underline"
            >
              contact our support team
            </a>
            {' '}or{' '}
            <a 
              href="https://github.com/stacktracker/mars-explorer/issues" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-mars-red hover:text-mars-rust underline"
            >
              report it on GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

// Specialized error boundaries for different components
export const GlobeErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={({ error, retry }) => (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-mars-dark rounded-lg">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto text-mars-red opacity-60 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
            />
          </svg>
          <h3 className="text-lg font-display font-semibold text-mars-red mb-2">
            Globe Loading Failed
          </h3>
          <p className="text-sm text-gwern-muted mb-4">
            Unable to load the 3D Mars globe. This might be due to WebGL compatibility issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button onClick={retry} className="btn-mars text-sm px-4 py-2">
              Retry Loading
            </button>
            <a href="/locations" className="btn-mars-outline text-sm px-4 py-2">
              View 2D Map
            </a>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

export const ArticleErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={({ error, retry }) => (
      <div className="p-6 text-center border border-gwern-border dark:border-mars-brown rounded-lg">
        <h3 className="text-lg font-display font-semibold text-mars-red mb-2">
          Article Load Error
        </h3>
        <p className="text-sm text-gwern-muted mb-4">
          We couldn't load this article. Please try again.
        </p>
        <button onClick={retry} className="btn-mars text-sm px-4 py-2">
          Reload Article
        </button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;