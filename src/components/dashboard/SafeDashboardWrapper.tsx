'use client'

/**
 * Safe Dashboard Wrapper - Prevents initialization errors
 */

import React, { Suspense, lazy } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Error Boundary Component
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Dashboard Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                The dashboard encountered an initialization error. This is usually temporary.
              </p>
              <div className="bg-gray-100 p-3 rounded text-sm text-gray-700">
                {this.state.error?.message || 'Unknown error occurred'}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Reload Application
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                >
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Loading Component
function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="font-semibold mb-2">Loading Dashboard</h3>
          <p className="text-gray-600 text-sm">
            Initializing trading systems and AI agents...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Lazy load the main dashboard to prevent initialization issues
const ModernDashboard = lazy(() => 
  import('./ModernDashboard').catch(error => {
    console.error('Failed to load ModernDashboard:', error)
    // Return a fallback component
    return {
      default: () => (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-center">Dashboard Loading Issue</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                The main dashboard is temporarily unavailable. You can still access basic features.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => window.location.href = '/trading'}>
                  Trading
                </Button>
                <Button onClick={() => window.location.href = '/portfolio'}>
                  Portfolio
                </Button>
                <Button onClick={() => window.location.href = '/analytics'}>
                  Analytics
                </Button>
                <Button onClick={() => window.location.href = '/api-docs'}>
                  API Docs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  })
)

export default function SafeDashboardWrapper() {
  return (
    <DashboardErrorBoundary>
      <Suspense fallback={<DashboardLoading />}>
        <ModernDashboard />
      </Suspense>
    </DashboardErrorBoundary>
  )
}