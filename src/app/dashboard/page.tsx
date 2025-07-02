/**
 * Cival Dashboard V10 - Complete Autonomous Agent System
 * Features: Full autonomous agent creation, memory, learning, farm coordination
 */

'use client'

import React from 'react'
import ModernDashboardV9 from '@/components/dashboard/ModernDashboardV9'

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return <ModernDashboardV9 />
}