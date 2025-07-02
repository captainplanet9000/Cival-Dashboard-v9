/**
 * Cival Dashboard V9 - Enhanced with Redis & Supabase Integration
 * Features: Real-time data, live connections, enhanced UI
 */

'use client'

import React from 'react'
import ModernDashboardV9 from '@/components/dashboard/ModernDashboardV9'

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return <ModernDashboardV9 />
}