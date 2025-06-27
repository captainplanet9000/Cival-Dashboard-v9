/**
 * Main Dashboard Page
 * Testing with dynamic imports restored
 */

'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Test the EnhancedDashboard that originally caused module 98189 error
const EnhancedDashboard = dynamic(
  () => import('@/components/dashboard/EnhancedDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }
)

// Keep MinimalDashboard for fallback testing
const MinimalDashboard = dynamic(
  () => import('@/components/dashboard/MinimalDashboard'),
  { 
    ssr: false,
    loading: () => <div>Loading minimal dashboard...</div>
  }
)

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Trading Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">✅ Online</div>
            <p className="text-sm text-muted-foreground">
              Dashboard loading successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-sm text-muted-foreground">
              No active positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">
              No agents running
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Component Restoration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Testing incremental restoration of components to identify module 98189 error source.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✅ ThemeProvider restored - No errors</li>
            <li>✅ ErrorBoundary restored - No errors</li>
            <li>✅ Shadcn/UI Card components restored - No errors</li>
            <li>✅ Dynamic imports restored - No errors</li>
            <li>✅ MinimalDashboard component - Passed</li>
            <li>❌ EnhancedDashboard (full) - CAUSES CIRCULAR DEPENDENCY ERROR</li>
            <li>🧪 EnhancedDashboard (dependency-free) - Testing now</li>
            <li>🔍 Error Source: Likely shadcn/ui or lucide-react imports</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔬 DEPENDENCY-FREE TEST</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-600 mb-4">
            <strong>TESTING:</strong> EnhancedDashboard with zero external dependencies to isolate circular dependency source.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Previous error: "Cannot access 'l' before initialization" in module 43686
          </p>
          <p className="text-sm text-blue-600 mb-4">
            🧪 Current test: Pure React + Tailwind CSS (no shadcn/ui, no lucide-react icons)
          </p>
          <Suspense fallback={<div>Loading Dependency-Free EnhancedDashboard...</div>}>
            <EnhancedDashboard />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}