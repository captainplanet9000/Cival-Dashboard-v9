/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  componentName?: string
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="w-full max-w-lg mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Component Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              {this.props.componentName ? (
                <>The <strong>{this.props.componentName}</strong> component encountered an error.</>
              ) : (
                'A component encountered an error and could not render.'
              )}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <summary className="cursor-pointer font-medium mb-1">Error Details</summary>
                <pre className="whitespace-pre-wrap">{this.state.error.message}</pre>
              </details>
            )}
            
            <Button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Simple fallback component for failed renders
 */
export function ComponentFallback({ componentName }: { componentName: string }) {
  return (
    <Card className="w-full">
      <CardContent className="p-6 text-center">
        <div className="text-gray-500">
          <div className="text-sm">Component temporarily unavailable</div>
          <div className="text-xs mt-1">{componentName}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ErrorBoundary