'use client'

import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertTriangle, Home, Bug, Shield } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: any
  errorId: string
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Global Error Boundary caught an error:', error, errorInfo)
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }

    this.setState({
      error,
      errorInfo
    })
  }

  private logErrorToService = (error: Error, errorInfo: any) => {
    // In a real app, you would send this to your error tracking service
    // like Sentry, LogRocket, or Bugsnag
    try {
      const errorData = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        errorId: this.state.errorId
      }
      
      // Send to your error tracking service
      console.error('Error logged:', errorData)
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const isRenderError = this.state.error?.message?.includes('render') || 
                           this.state.error?.message?.includes('hydration') ||
                           this.state.error?.message?.includes('Cannot read properties')

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full border-red-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-700">
                Application Error
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Something went wrong with the Cival Trading Dashboard
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-red-200 bg-red-50">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  {isRenderError ? (
                    <>
                      <strong>Rendering Error:</strong> There was a problem displaying this page. 
                      This often happens due to data loading issues or component conflicts.
                    </>
                  ) : (
                    <>
                      <strong>Unexpected Error:</strong> {this.state.error?.message || 'An unknown error occurred'}
                    </>
                  )}
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Error ID: {this.state.errorId}</span>
                </div>
                <p className="text-sm text-blue-600">
                  Your data is safe. This error has been logged and will be investigated.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={this.handleReload}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Application
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                    Technical Details (Development Mode)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto">
                      <div className="text-red-600 font-bold mb-2">Error:</div>
                      <div>{this.state.error?.toString()}</div>
                    </div>
                    {this.state.errorInfo?.componentStack && (
                      <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto">
                        <div className="text-blue-600 font-bold mb-2">Component Stack:</div>
                        <div>{this.state.errorInfo.componentStack}</div>
                      </div>
                    )}
                    {this.state.error?.stack && (
                      <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-48">
                        <div className="text-purple-600 font-bold mb-2">Stack Trace:</div>
                        <div>{this.state.error.stack}</div>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="text-center text-sm text-gray-500">
                If this problem persists, please contact support with Error ID: {this.state.errorId}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default GlobalErrorBoundary