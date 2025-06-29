/**
 * Cival Dashboard V7 - Original Shadcn Tabs Layout
 * Dashboard with tabs: Dashboard, Trading, Agents, Farms, Goals, Vault, etc.
 */

'use client'

import React from 'react'
import ModernDashboardV4 from '@/components/dashboard/_archived/ModernDashboardV4'

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return <ModernDashboardV4 />
}