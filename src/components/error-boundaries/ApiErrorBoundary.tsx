'use client'

import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  showRetry?: boolean
  retryText?: string
  errorTitle?: string
  componentName?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: any
  retryCount: number
}

export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      retryCount: 0
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ApiErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isNetworkError = this.state.error?.message?.includes('fetch') || 
                            this.state.error?.message?.includes('network') ||
                            this.state.error?.message?.includes('CORS')

      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              {isNetworkError ? <WifiOff className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              {this.props.errorTitle || (isNetworkError ? 'Connection Error' : 'Component Error')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {isNetworkError ? (
                  'Unable to connect to external services. The application is working in offline mode with cached data.'
                ) : (
                  `There was an error loading ${this.props.componentName || 'this component'}. Please try refreshing the page.`
                )}
              </AlertDescription>
            </Alert>
            
            {this.state.retryCount < 3 && (this.props.showRetry !== false) && (
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {this.props.retryText || 'Try Again'}
              </Button>
            )}

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-red-600">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// HOC for easy wrapping of components
export function withApiErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ApiErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ApiErrorBoundary>
    )
  }
}

// Hook for handling async errors in functional components
export function useAsyncError() {
  const [error, setError] = React.useState<Error | null>(null)

  const throwError = React.useCallback((error: Error) => {
    setError(error)
    throw error
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  if (error) {
    throw error
  }

  return { throwError, clearError }
}

// Specific error boundary for API calls
export function ApiCallErrorBoundary({ 
  children, 
  apiName,
  fallbackData 
}: { 
  children: ReactNode
  apiName?: string
  fallbackData?: any 
}) {
  return (
    <ApiErrorBoundary
      componentName={apiName ? `${apiName} API` : 'API'}
      errorTitle={`${apiName || 'API'} Service Error`}
      fallback={
        fallbackData ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700 mb-2">
              <Wifi className="h-4 w-4" />
              <span className="font-medium">Using Cached Data</span>
            </div>
            <p className="text-sm text-yellow-600">
              Live data unavailable, showing last known values.
            </p>
          </div>
        ) : undefined
      }
    >
      {children}
    </ApiErrorBoundary>
  )
}

export default ApiErrorBoundary