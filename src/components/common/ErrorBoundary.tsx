import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#ffffff',
          color: '#000000',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details style={{ 
                marginBottom: '1.5rem', 
                textAlign: 'left',
                background: '#f9fafb',
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                border: '1px solid #e5e7eb'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                  Error Details
                </summary>
                <pre style={{ 
                  color: '#dc2626', 
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button 
              onClick={() => window.location.reload()}
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 