/**
 * Main Dashboard Page
 * Enhanced trading dashboard with professional trading interface
 * Fixed navigation with real backend integration
 */

'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'

// STEP 1: Re-enable EnhancedDashboard structure (components still disabled inside)
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

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <ErrorBoundary componentName="Enhanced Dashboard - Step 1">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }>
        <EnhancedDashboard />
      </Suspense>
    </ErrorBoundary>
  )
}