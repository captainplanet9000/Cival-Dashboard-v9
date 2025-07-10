/**
 * Cival Dashboard - Original Enhanced with Autonomous Features
 * Features: Autonomous agent creation, memory, learning, farm coordination integrated into original dashboard
 */

'use client'

import React from 'react'
import SafeDashboardWrapper from '@/components/dashboard/SafeDashboardWrapper'

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return <SafeDashboardWrapper />
}