/**
 * ROUTE TEST: Testing if the issue is specific to /dashboard route
 * Using identical MinimalDashboard on different route
 */

'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// IDENTICAL import to dashboard page
const MinimalDashboard = dynamic(
  () => import('@/components/dashboard/MinimalDashboard'),
  { 
    ssr: false,
    loading: () => <div>Loading minimal dashboard...</div>
  }
)

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function TestRoutePage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Route Test - Same Component, Different Route</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Route Test Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">🧪 Testing</div>
            <p className="text-sm text-muted-foreground">
              Testing if module 43686 error is route-specific
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Component Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Same Component</div>
            <p className="text-sm text-muted-foreground">
              Identical MinimalDashboard import and usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">/test-route</div>
            <p className="text-sm text-muted-foreground">
              vs /dashboard route
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🔬 ROUTE-SPECIFIC TEST</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-purple-600 mb-4">
            <strong>THEORY:</strong> Module 43686 error may be specific to /dashboard route
          </p>
          <p className="text-sm text-blue-600 mb-4">
            🧪 If this route loads without error → /dashboard route is the problem
          </p>
          <p className="text-sm text-orange-600 mb-4">
            🧪 If this route also fails → Issue is component-agnostic
          </p>
          <Suspense fallback={<div>Loading minimal dashboard on different route...</div>}>
            <MinimalDashboard />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}