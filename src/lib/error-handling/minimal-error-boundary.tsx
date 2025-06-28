/**
 * MINIMAL Error Boundary with ZERO dependencies
 * Testing if complex UI imports in ErrorBoundary cause the circular dependency
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class MinimalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error })
    console.error('Minimal Error Boundary caught an error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ 
            maxWidth: '600px', 
            padding: '24px', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#dc2626',
                margin: '0 0 8px 0'
              }}>
                ⚠️ Something went wrong
              </h1>
              <p style={{ color: '#6b7280', margin: 0 }}>
                An unexpected error occurred in the trading platform
              </p>
            </div>

            <div style={{ 
              padding: '16px', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca',
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={this.handleRetry}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button 
                onClick={this.handleReload}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>

            <p style={{ 
              fontSize: '12px', 
              color: '#9ca3af', 
              textAlign: 'center',
              marginTop: '16px'
            }}>
              🔬 Minimal Error Boundary - Zero UI dependencies to test circular dependency fix
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export { MinimalErrorBoundary }
export default MinimalErrorBoundary