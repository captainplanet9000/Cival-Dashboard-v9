/**
 * Main Dashboard Page
 * Enhanced trading dashboard with professional trading interface
 * Fixed navigation with real backend integration
 */

import EnhancedDashboard from '@/components/dashboard/EnhancedDashboard'
import ErrorBoundary from '@/components/ErrorBoundary'

// Disable static generation for this page since it requires browser APIs
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <ErrorBoundary componentName="Enhanced Dashboard">
      <EnhancedDashboard />
    </ErrorBoundary>
  )
}