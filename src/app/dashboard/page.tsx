/**
 * Main Dashboard Page
 * Enhanced trading dashboard with professional trading interface
 * Fixed navigation with real backend integration
 */

'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'

// EMERGENCY: Replace with minimal dashboard to isolate error
const MinimalDashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Minimal Dashboard</h1>
    <p>This is a minimal dashboard to test if the error is in EnhancedDashboard itself.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="font-semibold">Portfolio Value</h3>
        <p className="text-2xl font-bold text-green-600">$10,000</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="font-semibold">Active Trades</h3>
        <p className="text-2xl font-bold text-blue-600">5</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="font-semibold">System Status</h3>
        <p className="text-2xl font-bold text-green-600">Online</p>
      </div>
    </div>
  </div>
)

// const EnhancedDashboard = dynamic(
//   () => import('@/components/dashboard/EnhancedDashboard'),
//   { 
//     ssr: false,
//     loading: () => (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
//       </div>
//     )
//   }
// )

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <ErrorBoundary componentName="Minimal Dashboard">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }>
        <MinimalDashboard />
      </Suspense>
    </ErrorBoundary>
  )
}