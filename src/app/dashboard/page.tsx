/**
 * Cival Dashboard V4 - Enhanced with Redis & Supabase Integration
 * Features: Original working dashboard + real-time data connections
 */

'use client'

import React from 'react'
import ModernDashboardV4 from '@/components/dashboard/_archived/ModernDashboardV4'

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return <ModernDashboardV4 />
}